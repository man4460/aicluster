import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import {
  applyKitchenDepartmentStatusAdvance,
  applyServeLineStatusAdvance,
  filterOrderItemsForKitchenDepartment,
  kitchenBoardStatusForOrder,
  orderUsesLineKitchenTracking,
  projectOrdersForServeBoard,
  resolveOrderStatusFromLineProgress,
  type KitchenLineStatus,
} from "@/systems/building-pos/lib/kitchen-department";
import { BUILDING_POS_STATION_BOARD_STATUSES } from "@/systems/building-pos/lib/station-role";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";
import type { PosOrderItem } from "@/systems/building-pos/building-pos-service";

const patchSchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  orderId: z.number().int().positive(),
  status: z.enum(BUILDING_POS_STATION_BOARD_STATUSES),
  departmentId: z.number().int().positive().optional().nullable(),
  /** คอลัมน์ปัจจุบันบนกระดานเสิร์ฟ — อัปเดตเฉพาะรายการในคอลัมน์นั้น */
  fromServeStatus: z.enum(["SERVED", "SERVING", "DELIVERED"]).optional().nullable(),
  t: z.string().trim().max(36).optional().nullable(),
});

async function assertStationOwner(ownerId: string) {
  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) return { ok: false as const, res: NextResponse.json({ error: "ร้านปิดชั่วคราว" }, { status: 403 }) };
  return { ok: true as const };
}

function resolveTrial(ownerId: string, trialParam: string | null | undefined) {
  return getBuildingPosDataScope(ownerId).then((scope) => {
    const t = trialParam?.trim();
    return t && t.length > 0 ? t : scope.trialSessionId;
  });
}

function parseDepartmentId(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function projectOrderForDepartment(
  mapped: ReturnType<typeof mapBuildingPosOrderRow>,
  departmentId: number | null,
) {
  if (departmentId == null) return mapped;
  const items = filterOrderItemsForKitchenDepartment(mapped.items, departmentId);
  if (items.length === 0) return null;
  const boardStatus = kitchenBoardStatusForOrder(mapped.items, departmentId, mapped.status);
  return {
    ...mapped,
    items,
    status: boardStatus as typeof mapped.status,
    kitchen_board_status: boardStatus,
    board_key: `${mapped.id}-k${departmentId}-${boardStatus}`,
  };
}

/** sync สถานะครัวทั้งออเดอร์ (ลิงก์ครัวรวม / ไม่มีแผนก) */
function applyWholeKitchenStatus(items: PosOrderItem[], nextStatus: KitchenLineStatus): PosOrderItem[] {
  return items.map((it) => {
    const base: PosOrderItem = {
      ...it,
      kitchen_status: nextStatus,
    };
    if (nextStatus === "SERVED") {
      const prev = it.serve_status;
      return {
        ...base,
        serve_status: prev === "SERVING" || prev === "DELIVERED" ? prev : "READY",
      };
    }
    if (nextStatus === "NEW" || nextStatus === "PREPARING") {
      const { serve_status: _drop, ...rest } = base;
      return rest;
    }
    return base;
  });
}

/** แผนกครัว / จัดส่ง — ดึงออเดอร์ที่ยังไม่ชำระ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
    if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

    const gate = await assertStationOwner(ownerId);
    if (!gate.ok) return gate.res;

    const trialSessionId = await resolveTrial(ownerId, url.searchParams.get("t"));
    const departmentId = parseDepartmentId(url.searchParams.get("departmentId"));
    const stationRole = url.searchParams.get("stationRole")?.trim() || null;

    if (departmentId != null) {
      const dept = await prisma.buildingPosKitchenDepartment.findFirst({
        where: { id: departmentId, ownerUserId: ownerId, trialSessionId, isActive: true },
        select: { id: true, name: true },
      });
      if (!dept) return NextResponse.json({ error: "ไม่พบแผนกครัว" }, { status: 404 });
    }

    const branding = await prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: {
          ownerUserId: ownerId,
          trialSessionId,
          moduleSlug: "building-pos",
        },
      },
      select: { displayName: true },
    });

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    });
    const policy = await getPlanFeaturePolicy();

    const rows = await prisma.buildingPosOrder.findMany({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        status: { in: [...BUILDING_POS_STATION_BOARD_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    const mapped = rows.map(mapBuildingPosOrderRow);

    let orders;
    if (stationRole === "serve") {
      // รวมออเดอร์ที่ยังครัวทำอยู่ แต่มีรายการพร้อมเสิร์ฟแล้ว
      const openForServe = mapped.filter(
        (o) =>
          o.status !== "PAID" &&
          (["SERVED", "SERVING", "DELIVERED", "PREPARING", "NEW"] as string[]).includes(o.status),
      );
      orders = projectOrdersForServeBoard(openForServe);
    } else {
      orders = mapped
        .map((o) => projectOrderForDepartment(o, departmentId))
        .filter((o): o is NonNullable<typeof o> => o != null);
    }

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      shopName: branding?.displayName?.trim() || "POS ร้านอาหาร",
      departmentId,
      orders,
      features: owner
        ? planFeaturesApiPayload(owner, policy)
        : planFeaturesApiPayload(
            { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
            policy,
          ),
    });
  } catch (e) {
    console.error("[building-pos/public/station/orders GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

/** แผนกครัว / จัดส่ง — เปลี่ยนสถานะ */
export async function PATCH(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const gate = await assertStationOwner(parsed.data.ownerId);
    if (!gate.ok) return gate.res;

    const trialSessionId = await resolveTrial(parsed.data.ownerId, parsed.data.t);
    const departmentId =
      parsed.data.departmentId != null && parsed.data.departmentId > 0
        ? parsed.data.departmentId
        : null;

    const existing = await prisma.buildingPosOrder.findFirst({
      where: {
        id: parsed.data.orderId,
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
      },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

    const items = Array.isArray(existing.itemsJson)
      ? (existing.itemsJson as PosOrderItem[])
      : [];
    const usesLine = orderUsesLineKitchenTracking(items);

    // แผนกครัวย่อย
    if (
      departmentId != null &&
      (parsed.data.status === "NEW" ||
        parsed.data.status === "PREPARING" ||
        parsed.data.status === "SERVED")
    ) {
      const dept = await prisma.buildingPosKitchenDepartment.findFirst({
        where: {
          id: departmentId,
          ownerUserId: parsed.data.ownerId,
          trialSessionId,
        },
        select: { id: true },
      });
      if (!dept) return NextResponse.json({ error: "ไม่พบแผนกครัว" }, { status: 404 });

      const { items: nextItems } = applyKitchenDepartmentStatusAdvance(
        items,
        departmentId,
        parsed.data.status as KitchenLineStatus,
      );
      const nextOrderStatus = resolveOrderStatusFromLineProgress(nextItems, existing.status);
      const updated = await prisma.buildingPosOrder.update({
        where: { id: existing.id },
        data: {
          status: nextOrderStatus,
          itemsJson: nextItems,
        },
      });
      const mapped = mapBuildingPosOrderRow(updated);
      const projected = projectOrderForDepartment(mapped, departmentId);
      notifyBuildingPosOrderBoard(parsed.data.ownerId);
      return NextResponse.json({ order: projected ?? mapped });
    }

    // แผนกเสิร์ฟ — อัปเดตรายการที่พร้อมเสิร์ฟทีละชุด (ไม่รอเมนูครัวอื่น)
    if (
      usesLine &&
      departmentId == null &&
      (parsed.data.status === "SERVED" ||
        parsed.data.status === "SERVING" ||
        parsed.data.status === "DELIVERED")
    ) {
      let nextItems = items;
      const fromCol = parsed.data.fromServeStatus ?? null;
      if (fromCol === "SERVED" || fromCol === "SERVING" || fromCol === "DELIVERED") {
        // อัปเดตเฉพาะรายการที่อยู่คอลัมน์ที่กด
        nextItems = items.map((it) => {
          const serve =
            it.kitchen_status === "SERVED"
              ? it.serve_status === "SERVING" || it.serve_status === "DELIVERED"
                ? it.serve_status
                : "READY"
              : null;
          if (serve !== (fromCol === "SERVED" ? "READY" : fromCol)) return it;
          if (parsed.data.status === "SERVING") return { ...it, serve_status: "SERVING" as const };
          if (parsed.data.status === "DELIVERED") return { ...it, serve_status: "DELIVERED" as const };
          if (parsed.data.status === "SERVED") return { ...it, serve_status: "READY" as const };
          return it;
        });
      } else {
        nextItems = applyServeLineStatusAdvance(items, parsed.data.status);
      }
      const nextOrderStatus = resolveOrderStatusFromLineProgress(nextItems, existing.status);
      const updated = await prisma.buildingPosOrder.update({
        where: { id: existing.id },
        data: {
          status: nextOrderStatus,
          itemsJson: nextItems,
        },
      });
      notifyBuildingPosOrderBoard(parsed.data.ownerId);
      return NextResponse.json({ order: mapBuildingPosOrderRow(updated), reloadBoard: true });
    }

    // ครัวรวม / ไม่มี line tracking — sync รายการถ้ามี kitchen_status
    if (
      usesLine &&
      departmentId == null &&
      (parsed.data.status === "NEW" ||
        parsed.data.status === "PREPARING" ||
        parsed.data.status === "SERVED")
    ) {
      const nextItems = applyWholeKitchenStatus(items, parsed.data.status as KitchenLineStatus);
      const nextOrderStatus = resolveOrderStatusFromLineProgress(nextItems, existing.status);
      const updated = await prisma.buildingPosOrder.update({
        where: { id: existing.id },
        data: {
          status: nextOrderStatus,
          itemsJson: nextItems,
        },
      });
      notifyBuildingPosOrderBoard(parsed.data.ownerId);
      return NextResponse.json({ order: mapBuildingPosOrderRow(updated) });
    }

    const updated = await prisma.buildingPosOrder.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });

    notifyBuildingPosOrderBoard(parsed.data.ownerId);
    return NextResponse.json({ order: mapBuildingPosOrderRow(updated) });
  } catch (e) {
    console.error("[building-pos/public/station/orders PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

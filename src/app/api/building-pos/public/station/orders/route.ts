import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BUILDING_POS_STATION_BOARD_STATUSES } from "@/systems/building-pos/lib/station-role";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";

const patchSchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  orderId: z.number().int().positive(),
  status: z.enum(BUILDING_POS_STATION_BOARD_STATUSES),
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

/** แผนกครัว / จัดส่ง — ดึงออเดอร์ที่ยังไม่ชำระ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
    if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

    const gate = await assertStationOwner(ownerId);
    if (!gate.ok) return gate.res;

    const trialSessionId = await resolveTrial(ownerId, url.searchParams.get("t"));
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

    const rows = await prisma.buildingPosOrder.findMany({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        status: { in: [...BUILDING_POS_STATION_BOARD_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      shopName: branding?.displayName?.trim() || "POS ร้านอาหาร",
      orders: rows.map(mapBuildingPosOrderRow),
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
    const existing = await prisma.buildingPosOrder.findFirst({
      where: {
        id: parsed.data.orderId,
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
      },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

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

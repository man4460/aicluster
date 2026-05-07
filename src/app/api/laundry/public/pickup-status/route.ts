import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeForModule } from "@/lib/trial/scope";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrderStatus,
} from "@/systems/laundry/laundry-order-status";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  owner_id: z.string().min(10).max(191),
  token: z.string().uuid(),
});

function statusLabelForRaw(raw: string): string {
  return (LAUNDRY_ORDER_STATUSES as readonly string[]).includes(raw) ?
      laundryOrderStatusLabelTh(raw as LaundryOrderStatus)
    : raw;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      owner_id: url.searchParams.get("owner_id")?.trim() ?? "",
      token: url.searchParams.get("token")?.trim() ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const ownerId = parsed.data.owner_id;
    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) return NextResponse.json({ error: "ไม่พบเซอร์วิสหรือปิดการใช้งาน" }, { status: 403 });

    const mod = await prisma.appModule.findFirst({
      where: { slug: LAUNDRY_MODULE_SLUG, isActive: true },
      select: { id: true },
    });
    if (!mod) return NextResponse.json({ error: "ระบบซักผ้ายังไม่พร้อม" }, { status: 503 });

    const scope = await resolveDataScopeForModule(ownerId, mod.id);

    const row = await prisma.laundryOrder.findFirst({
      where: {
        pickupPublicToken: parsed.data.token,
        ownerUserId: ownerId,
        trialSessionId: scope.trialSessionId,
      },
      select: {
        id: true,
        orderAt: true,
        updatedAt: true,
        status: true,
        serviceType: true,
        packageName: true,
        finalPrice: true,
      },
    });

    if (!row) {
      return NextResponse.json({ error: "ไม่พบคำขอหรือลิงก์ไม่ถูกต้อง" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      order_id: row.id,
      order_at: row.orderAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
      status: row.status,
      status_label_th: statusLabelForRaw(row.status),
      service_type: row.serviceType,
      package_name: row.packageName,
      final_price: row.finalPrice,
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/pickup-status GET");
  }
}

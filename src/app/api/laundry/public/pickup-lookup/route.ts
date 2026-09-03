import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/car-wash/http";
import { prisma } from "@/lib/prisma";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { resolvePublicLaundryTrialSessionId } from "@/lib/laundry/public-trial-scope";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrderStatus,
} from "@/systems/laundry/laundry-order-status";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  owner_id: z.string().min(10).max(191),
  phone: z.string().min(9).max(32),
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
      phone: normalizePhone(url.searchParams.get("phone") ?? ""),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "กรุณากรอกเบอร์โทรให้ครบ" }, { status: 400 });
    }

    const phone = parsed.data.phone;
    if (phone.length < 9) {
      return NextResponse.json({ error: "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก" }, { status: 400 });
    }

    const ownerId = parsed.data.owner_id;
    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) return NextResponse.json({ error: "ไม่พบเซอร์วิสหรือปิดการใช้งาน" }, { status: 403 });

    const { trialSessionId } = await resolvePublicLaundryTrialSessionId(
      ownerId,
      url.searchParams.get("t"),
    );

    const rows = await prisma.laundryOrder.findMany({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        customerPhone: phone,
        pickupPublicToken: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        orderAt: true,
        updatedAt: true,
        status: true,
        serviceType: true,
        packageName: true,
        finalPrice: true,
        pickupPublicToken: true,
        customerName: true,
      },
    });

    return NextResponse.json({
      ok: true,
      orders: rows.map((row) => ({
        order_id: row.id,
        customer_name: row.customerName,
        order_at: row.orderAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
        status: row.status,
        status_label_th: statusLabelForRaw(row.status),
        service_type: row.serviceType,
        package_name: row.packageName,
        final_price: row.finalPrice,
        tracking_token: row.pickupPublicToken,
      })),
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/pickup-lookup GET");
  }
}

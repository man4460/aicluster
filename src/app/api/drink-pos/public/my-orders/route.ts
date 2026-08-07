import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

const uuidSchema = z.string().uuid();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดรับออเดอร์ชั่วคราว" }, { status: 403 });

  const scope = await getDrinkPosDataScope(ownerId);
  const trialParam = searchParams.get("t")?.trim() || "";
  const trialSessionId = trialParam || scope.trialSessionId;
  void trialSessionId;

  const sessionRaw = searchParams.get("customer_session_id")?.trim() ?? "";
  const phoneRaw = searchParams.get("phone")?.trim() ?? "";
  const sessionOk = sessionRaw && uuidSchema.safeParse(sessionRaw).success;
  const phone = normalizeMemberPhone(phoneRaw);

  if (!sessionOk && phone.length < 9) {
    return NextResponse.json({ orders: [] });
  }

  const since = new Date(Date.now() - 48 * 3600_000);
  const rows = await prisma.drinkPosSale.findMany({
    where: {
      ownerUserId: ownerId,
      createdAt: { gte: since },
      /** ส่งมอบแล้ว (SERVED) ไม่โชว์บนลิงก์ลูกค้า — ดูได้ที่ประวัติขาย */
      fulfillmentStatus: { in: ["RECEIVED", "MAKING", "DONE"] },
      OR: [
        ...(sessionOk ? [{ customerSessionId: sessionRaw }] : []),
        ...(phone.length >= 9 ? [{ memberPhone: phone }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          sizeLabel: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  return NextResponse.json({
    orders: rows.map((s) => ({
      id: s.id,
      note: s.note,
      totalBaht: s.totalBaht,
      fulfillmentStatus: s.fulfillmentStatus,
      statusUpdatedAt: s.statusUpdatedAt.toISOString(),
      isRewardRedemption: s.isRewardRedemption,
      memberPhone: s.memberPhone,
      createdAt: s.createdAt.toISOString(),
      lines: s.lines,
    })),
  });
}

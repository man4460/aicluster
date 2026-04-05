import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  bundleId: z.number().int().positive(),
  trialSessionId: z.string().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`carwash-pub-checkin:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const ownerId = parsed.data.ownerId;
  const portalOk = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });
  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, parsed.data.trialSessionId);

  try {
    const out = await prisma.$transaction(async (tx) => {
      const b = await tx.carWashBundle.findFirst({
        where: {
          id: parsed.data.bundleId,
          ownerUserId: ownerId,
          trialSessionId,
        },
      });
      if (!b) throw new Error("NOT_FOUND");
      if (!b.isActive || b.usedUses >= b.totalUses) throw new Error("NO_REMAIN");

      const consumed = await tx.carWashBundle.update({
        where: { id: b.id },
        data: { usedUses: b.usedUses + 1 },
      });
      await tx.carWashVisit.create({
        data: {
          ownerUserId: ownerId,
          trialSessionId,
          customerName: consumed.customerName,
          customerPhone: consumed.customerPhone,
          plateNumber: consumed.plateNumber,
          packageId: consumed.packageId,
          packageName: `เหมาจ่าย: ${consumed.packageName}`,
          listedPrice: 0,
          finalPrice: 0,
          note: "ลูกค้าเช็กอินผ่าน QR",
          recordedByName: "ลูกค้า (QR)",
          serviceStatus: "COMPLETED",
        },
      });
      return consumed;
    });
    return NextResponse.json({
      ok: true,
      bundle: {
        id: out.id,
        customer_name: out.customerName,
        customer_phone: out.customerPhone,
        plate_number: out.plateNumber,
        package_id: out.packageId,
        package_name: out.packageName,
        paid_amount: out.paidAmount,
        total_uses: out.totalUses,
        used_uses: out.usedUses,
        is_active: out.isActive,
        slip_photo_url: (out as { slipPhotoUrl?: string }).slipPhotoUrl ?? "",
        created_at: out.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "ไม่พบแพ็กเกจนี้" }, { status: 404 });
    if (msg === "NO_REMAIN") return NextResponse.json({ error: "แพ็กเกจนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน" }, { status: 400 });
    console.error("[car-wash/public/check-in]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

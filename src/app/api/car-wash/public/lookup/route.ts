import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/car-wash/http";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  query: z.string().min(1).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
});

function normalizePlate(v: string): string {
  return v.trim().toLowerCase().replace(/[^0-9a-zA-Zก-๙]/g, "");
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`carwash-pub-lookup:${ip}`, 60, 10 * 60 * 1000);
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
  const raw = parsed.data.query.trim();
  const digits = normalizePhone(raw);
  const plate = normalizePlate(raw);

  const whereBase = { ownerUserId: ownerId, trialSessionId, isActive: true };
  const byPhone =
    digits.length >= 9
      ? await prisma.carWashBundle.findMany({
          where: { ...whereBase, customerPhone: digits },
          orderBy: { createdAt: "desc" },
        })
      : [];
  const byPlate =
    plate.length >= 2
      ? await prisma.carWashBundle.findMany({
          where: { ...whereBase },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const rows =
    byPhone.length > 0
      ? byPhone
      : byPlate.filter((x) => {
          const p = normalizePlate(x.plateNumber);
          return p === plate || p.includes(plate) || plate.includes(p);
        });

  return NextResponse.json({
    bundles: rows.map((r) => ({
      id: r.id,
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
      plate_number: r.plateNumber,
      package_id: r.packageId,
      package_name: r.packageName,
      paid_amount: r.paidAmount,
      total_uses: r.totalUses,
      used_uses: r.usedUses,
      is_active: r.isActive,
      created_at: r.createdAt.toISOString(),
    })),
  });
}

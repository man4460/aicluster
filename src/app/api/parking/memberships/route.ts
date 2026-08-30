import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

const postSchema = z.object({
  customer_name: z.string().min(1).max(160),
  customer_phone: z.string().max(32),
  license_plate: z.string().min(1).max(24),
  package_id: z.number().int().positive(),
  package_name: z.string().min(1).max(160),
  paid_amount: z.number().int().min(0).max(9_999_999),
  total_uses: z.number().int().min(1).max(9999),
  is_active: z.boolean(),
  slip_photo_url: z.string().max(512).optional().nullable(),
});

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  const rows = await prisma.parkingMembership.findMany({
    where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    memberships: rows.map((r) => ({
      id: r.id,
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
      license_plate: r.licensePlate,
      package_id: r.packageId,
      package_name: r.packageName,
      paid_amount: r.paidAmount,
      total_uses: r.totalUses,
      used_uses: r.usedUses,
      is_active: r.isActive,
      slip_photo_url: r.slipPhotoUrl,
      created_at: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const phone = normalizePhone(parsed.data.customer_phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "สมัครสมาชิกต้องใส่เบอร์โทรอย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const pkg = await prisma.parkingPackage.findFirst({
    where: {
      id: parsed.data.package_id,
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
    },
  });
  if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  const row = await prisma.parkingMembership.create({
    data: {
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      customerName: parsed.data.customer_name.trim(),
      customerPhone: phone,
      licensePlate: parsed.data.license_plate.trim().replace(/\s+/g, ""),
      packageId: parsed.data.package_id,
      packageName: parsed.data.package_name.trim() || pkg.name,
      paidAmount: parsed.data.paid_amount,
      totalUses: parsed.data.total_uses,
      usedUses: 0,
      isActive: parsed.data.is_active,
      slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "",
    },
  });

  return NextResponse.json(
    {
      membership: {
        id: row.id,
        customer_name: row.customerName,
        customer_phone: row.customerPhone,
        license_plate: row.licensePlate,
        package_id: row.packageId,
        package_name: row.packageName,
        paid_amount: row.paidAmount,
        total_uses: row.totalUses,
        used_uses: row.usedUses,
        is_active: row.isActive,
        slip_photo_url: row.slipPhotoUrl,
        created_at: row.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

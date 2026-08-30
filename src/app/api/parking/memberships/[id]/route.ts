import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  customer_name: z.string().min(1).max(160).optional(),
  customer_phone: z.string().max(32).optional(),
  license_plate: z.string().min(1).max(24).optional(),
  is_active: z.boolean().optional(),
  paid_amount: z.number().int().min(0).max(9_999_999).optional(),
  total_uses: z.number().int().min(1).max(9999).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

  const existing = await prisma.parkingMembership.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const phone =
    parsed.data.customer_phone != null
      ? parsed.data.customer_phone.replace(/\D/g, "")
      : undefined;

  const row = await prisma.parkingMembership.update({
    where: { id },
    data: {
      ...(parsed.data.customer_name != null ? { customerName: parsed.data.customer_name.trim() } : {}),
      ...(phone != null ? { customerPhone: phone } : {}),
      ...(parsed.data.license_plate != null
        ? { licensePlate: parsed.data.license_plate.trim().replace(/\s+/g, "") }
        : {}),
      ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
      ...(parsed.data.paid_amount != null ? { paidAmount: parsed.data.paid_amount } : {}),
      ...(parsed.data.total_uses != null ? { totalUses: parsed.data.total_uses } : {}),
    },
  });

  return NextResponse.json({
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
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

  const existing = await prisma.parkingMembership.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

  await prisma.parkingMembership.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

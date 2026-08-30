import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  price: z.number().int().min(0).max(9_999_999).optional(),
  stay_mode: z.enum(["HOURLY", "DAILY", "MONTHLY"]).optional(),
  stay_units: z.number().int().min(1).max(366).optional(),
  total_uses: z.number().int().min(1).max(500).optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  const existing = await prisma.parkingPackage.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.parkingPackage.update({
    where: { id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.price != null ? { price: parsed.data.price } : {}),
      ...(parsed.data.stay_mode != null ? { stayMode: parsed.data.stay_mode } : {}),
      ...(parsed.data.stay_units != null ? { stayUnits: parsed.data.stay_units } : {}),
      ...(parsed.data.total_uses != null ? { totalUses: parsed.data.total_uses } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description?.trim() ?? "" }
        : {}),
      ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
    },
  });

  return NextResponse.json({
    package: {
      id: row.id,
      name: row.name,
      price: row.price,
      stay_mode: row.stayMode,
      stay_units: row.stayUnits,
      total_uses: row.totalUses,
      description: row.description,
      is_active: row.isActive,
    },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  const existing = await prisma.parkingPackage.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  await prisma.parkingPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

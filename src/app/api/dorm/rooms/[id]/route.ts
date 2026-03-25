import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import type { RoomStatus } from "@/generated/prisma/enums";

const patchSchema = z.object({
  roomNumber: z.string().min(1).max(10).optional(),
  floor: z.number().int().min(0).max(200).optional(),
  roomType: z.string().min(1).max(50).optional(),
  basePrice: z.number().finite().min(0).max(99_999_999).optional(),
  maxOccupants: z.number().int().min(1).max(50).optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseRoomId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub },
    include: {
      tenants: { orderBy: { id: "asc" } },
      utilityBills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        include: { payments: { orderBy: { id: "desc" }, take: 80 } },
      },
    },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  return NextResponse.json({
    room: {
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      maxOccupants: room.maxOccupants,
      basePrice: Number(room.basePrice),
      status: room.status,
      tenants: room.tenants.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        idCard: t.idCard,
        status: t.status,
        checkInDate: t.checkInDate.toISOString().slice(0, 10),
        checkOutDate: t.checkOutDate?.toISOString().slice(0, 10) ?? null,
      })),
      utilityBills: room.utilityBills.map((b) => ({
        id: b.id,
        billingMonth: b.billingMonth,
        billingYear: b.billingYear,
        periodMonth: `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`,
        waterMeterPrev: b.waterMeterPrev,
        waterMeterCurr: b.waterMeterCurr,
        electricMeterPrev: b.electricMeterPrev,
        electricMeterCurr: b.electricMeterCurr,
        waterPrice: Number(b.waterPrice),
        electricPrice: Number(b.electricPrice),
        fixedFees: b.fixedFees,
        totalRoomAmount: Number(b.totalRoomAmount),
        payments: b.payments.map((p) => ({
          id: p.id,
          tenantId: p.tenantId,
          amountToPay: Number(p.amountToPay),
          paymentStatus: p.paymentStatus,
          paidAt: p.paidAt?.toISOString() ?? null,
          note: p.note,
        })),
      })),
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const d = parsed.data;
  try {
    const room = await prisma.room.update({
      where: { id: rid },
      data: {
        ...(d.roomNumber !== undefined && { roomNumber: d.roomNumber.trim() }),
        ...(d.floor !== undefined && { floor: d.floor }),
        ...(d.roomType !== undefined && { roomType: d.roomType.trim() }),
        ...(d.basePrice !== undefined && { basePrice: d.basePrice }),
        ...(d.maxOccupants !== undefined && { maxOccupants: d.maxOccupants }),
        ...(d.status !== undefined && { status: d.status as RoomStatus }),
      },
    });
    return NextResponse.json({ room: { ...room, basePrice: Number(room.basePrice) } });
  } catch {
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const existing = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  await prisma.room.delete({ where: { id: rid } });
  return NextResponse.json({ ok: true });
}

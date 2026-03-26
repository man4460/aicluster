import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import type { RoomStatus } from "@/generated/prisma/enums";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  roomNumber: z.string().min(1).max(10),
  floor: z.number().int().min(0).max(200),
  roomType: z.string().min(1).max(50),
  basePrice: z.number().finite().min(0).max(99_999_999),
  maxOccupants: z.number().int().min(1).max(50),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
});

function serializeBill(
  b: {
    id: number;
    billingMonth: number;
    billingYear: number;
    waterMeterPrev: number;
    waterMeterCurr: number;
    electricMeterPrev: number;
    electricMeterCurr: number;
    waterPrice: unknown;
    electricPrice: unknown;
    fixedFees: unknown;
    totalRoomAmount: unknown;
    payments: Array<{
      id: number;
      tenantId: number;
      amountToPay: unknown;
      paymentStatus: string;
      paidAt: Date | null;
    }>;
  },
) {
  return {
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
    })),
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const rooms = await prisma.room.findMany({
    where: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
    orderBy: [{ roomNumber: "asc" }],
    include: {
      tenants: { orderBy: { id: "asc" } },
      utilityBills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 6,
        include: { payments: { orderBy: { id: "desc" }, take: 30 } },
      },
    },
  });

  return NextResponse.json({
    rooms: rooms.map((r) => ({
      id: r.id,
      ownerUserId: r.ownerUserId,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      maxOccupants: r.maxOccupants,
      basePrice: Number(r.basePrice),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      tenants: r.tenants.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        idCard: t.idCard,
        status: t.status,
        checkInDate: t.checkInDate.toISOString().slice(0, 10),
        checkOutDate: t.checkOutDate?.toISOString().slice(0, 10) ?? null,
      })),
      utilityBills: r.utilityBills.map((b) => serializeBill(b)),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getDormitoryDataScope(auth.session.sub);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { roomNumber, floor, roomType, basePrice, maxOccupants, status } = parsed.data;

  try {
    const room = await prisma.room.create({
      data: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
        roomNumber: roomNumber.trim(),
        floor,
        roomType: roomType.trim(),
        basePrice,
        maxOccupants,
        status: (status ?? "AVAILABLE") as RoomStatus,
      },
    });
    return NextResponse.json({
      room: { ...room, basePrice: Number(room.basePrice) },
    });
  } catch {
    return NextResponse.json({ error: "เลขห้องซ้ำหรือบันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

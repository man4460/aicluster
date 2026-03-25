import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["ARRIVED", "NO_SHOW", "CANCELLED"]),
});

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

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

  const existing = await prisma.barberBooking.findFirst({
    where: { id, ownerUserId: own.ownerId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  if (existing.status !== "SCHEDULED") {
    return NextResponse.json({ error: "อัปเดตได้เฉพาะคิวที่ยังรอเข้าใช้" }, { status: 400 });
  }

  const row = await prisma.barberBooking.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({
    booking: {
      id: row.id,
      phone: row.phone,
      customerName: row.customerName,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      barberCustomerId: row.barberCustomerId,
    },
  });
}

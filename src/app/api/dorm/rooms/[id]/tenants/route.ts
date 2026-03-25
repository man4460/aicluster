import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const postSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  idCard: z.string().min(1).max(13),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseRoomId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub },
    include: { tenants: { where: { status: "ACTIVE" } } },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  if (room.tenants.length >= room.maxOccupants) {
    return NextResponse.json({ error: "ห้องเต็มตามจำนวนสูงสุด" }, { status: 400 });
  }

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

  const checkIn = parsed.data.checkInDate
    ? new Date(`${parsed.data.checkInDate}T12:00:00+07:00`)
    : new Date();

  const tenant = await prisma.tenant.create({
    data: {
      roomId: rid,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      idCard: parsed.data.idCard.trim(),
      checkInDate: checkIn,
    },
  });

  return NextResponse.json({ tenant });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";

const postSchema = z.object({
  name: z.string().min(1).max(191),
  price: z.number().finite().min(0).max(99_999_999),
  totalSessions: z.number().int().min(1).max(9999),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const rows = await prisma.barberPackage.findMany({
    where: { ownerUserId: own.ownerId },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({
    packages: rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

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

  const p = await prisma.barberPackage.create({
    data: {
      ownerUserId: own.ownerId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      totalSessions: parsed.data.totalSessions,
    },
  });

  return NextResponse.json({
    package: {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
    },
  });
}

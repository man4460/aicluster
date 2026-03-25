import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import {
  isPrismaSchemaMismatch,
  THAI_PRISMA_SCHEMA_MISMATCH,
} from "@/lib/prisma-schema-mismatch";

const postSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional().nullable(),
});

function normalizePhone(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === "") return null;
  const d = raw.replace(/\D/g, "").slice(0, 20);
  return d.length > 0 ? d : null;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  try {
    const rows = await prisma.barberStylist.findMany({
      where: {
        ownerUserId: own.ownerId,
        ...(all ? {} : { isActive: true }),
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      stylists: rows.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[barber/stylists GET]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
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

  const phone = normalizePhone(parsed.data.phone ?? null);

  const s = await prisma.barberStylist.create({
    data: {
      ownerUserId: own.ownerId,
      name: parsed.data.name.trim(),
      phone,
      isActive: true,
    },
  });

  return NextResponse.json({
    stylist: {
      id: s.id,
      name: s.name,
      phone: s.phone,
      isActive: s.isActive,
    },
  });
}

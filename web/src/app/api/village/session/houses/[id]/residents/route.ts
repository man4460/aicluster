import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const postSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
  is_primary: z.boolean().optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const houseId = parseId((await ctx.params).id);
  if (!houseId) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const house = await prisma.villageHouse.findFirst({
    where: { id: houseId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!house) return NextResponse.json({ error: "ไม่พบบ้าน" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.villageResident.create({
    data: {
      houseId,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() || null,
      note: parsed.data.note?.trim() || null,
      isPrimary: parsed.data.is_primary ?? false,
      isActive: true,
    },
  });

  return NextResponse.json({
    resident: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      note: row.note,
      is_primary: row.isPrimary,
      is_active: row.isActive,
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  house_no: z.string().min(1).max(40).optional(),
  plot_label: z.string().max(80).optional().nullable(),
  owner_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  monthly_fee_override: z.number().int().min(0).max(9_999_999).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(999_999).optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.villageHouse.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  try {
    const row = await prisma.villageHouse.update({
      where: { id },
      data: {
        ...(parsed.data.house_no !== undefined ? { houseNo: parsed.data.house_no.trim() } : {}),
        ...(parsed.data.plot_label !== undefined ? { plotLabel: parsed.data.plot_label?.trim() || null } : {}),
        ...(parsed.data.owner_name !== undefined ? { ownerName: parsed.data.owner_name?.trim() || null } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
        ...(parsed.data.monthly_fee_override !== undefined
          ? { monthlyFeeOverride: parsed.data.monthly_fee_override }
          : {}),
        ...(parsed.data.is_active !== undefined ? { isActive: parsed.data.is_active } : {}),
        ...(parsed.data.sort_order !== undefined ? { sortOrder: parsed.data.sort_order } : {}),
      },
    });
    return NextResponse.json({
      house: {
        id: row.id,
        house_no: row.houseNo,
        plot_label: row.plotLabel,
        owner_name: row.ownerName,
        phone: row.phone,
        monthly_fee_override: row.monthlyFeeOverride,
        is_active: row.isActive,
        sort_order: row.sortOrder,
      },
    });
  } catch {
    return NextResponse.json({ error: "เลขบ้านซ้ำ" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.villageHouse.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.villageHouse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

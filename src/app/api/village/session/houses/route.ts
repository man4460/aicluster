import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  house_no: z.string().min(1).max(40),
  plot_label: z.string().max(80).optional().nullable(),
  owner_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  monthly_fee_override: z.number().int().min(0).max(9_999_999).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(999_999).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const rows = await prisma.villageHouse.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      residents: { where: { isActive: true }, orderBy: { id: "asc" } },
    },
  });

  return NextResponse.json({
    houses: rows.map((h) => ({
      id: h.id,
      house_no: h.houseNo,
      plot_label: h.plotLabel,
      owner_name: h.ownerName,
      phone: h.phone,
      monthly_fee_override: h.monthlyFeeOverride,
      is_active: h.isActive,
      sort_order: h.sortOrder,
      residents: h.residents.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        note: r.note,
        is_primary: r.isPrimary,
        is_active: r.isActive,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.villageHouse.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        houseNo: parsed.data.house_no.trim(),
        plotLabel: parsed.data.plot_label?.trim() || null,
        ownerName: parsed.data.owner_name?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        monthlyFeeOverride: parsed.data.monthly_fee_override ?? null,
        isActive: parsed.data.is_active ?? true,
        sortOrder: parsed.data.sort_order ?? 0,
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
        residents: [],
      },
    });
  } catch {
    return NextResponse.json({ error: "เลขบ้านซ้ำในโครงการ" }, { status: 409 });
  }
}

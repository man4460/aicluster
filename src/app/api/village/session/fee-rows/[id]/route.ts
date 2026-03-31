import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  amount_due: z.number().int().min(0).max(9_999_999).optional(),
  amount_paid: z.number().int().min(0).max(9_999_999).optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "WAIVED"]).optional(),
  note: z.string().max(500).optional().nullable(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function deriveStatus(due: number, paid: number): "PENDING" | "PARTIAL" | "PAID" | "WAIVED" {
  if (due <= 0 && paid <= 0) return "WAIVED";
  if (paid <= 0) return "PENDING";
  if (paid >= due) return "PAID";
  return "PARTIAL";
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

  const existing = await prisma.villageCommonFeeRow.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const amountDue = parsed.data.amount_due ?? existing.amountDue;
  const amountPaid = parsed.data.amount_paid ?? existing.amountPaid;
  const derived = deriveStatus(amountDue, amountPaid);
  const status = parsed.data.status ?? derived;
  let paidAt = existing.paidAt;
  if (status === "PAID" && amountDue > 0) paidAt = paidAt ?? new Date();
  if (amountPaid === 0 && parsed.data.amount_paid !== undefined) paidAt = null;

  const row = await prisma.villageCommonFeeRow.update({
    where: { id },
    data: {
      amountDue,
      amountPaid,
      status,
      note: parsed.data.note !== undefined ? parsed.data.note?.trim() || null : undefined,
      paidAt,
    },
  });

  return NextResponse.json({
    fee_row: {
      id: row.id,
      house_id: row.houseId,
      year_month: row.yearMonth,
      amount_due: row.amountDue,
      amount_paid: row.amountPaid,
      status: row.status,
      note: row.note,
      paid_at: row.paidAt?.toISOString() ?? null,
    },
  });
}

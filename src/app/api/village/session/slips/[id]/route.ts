import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const ymRegex = /^\d{4}-\d{2}$/;

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewer_note: z.string().max(500).optional().nullable(),
});
const editSchema = z.object({
  house_id: z.number().int().positive(),
  year_month: z.string().regex(ymRegex),
  amount: z.number().int().min(1).max(9_999_999),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function deriveFeeStatus(due: number, paid: number): "PENDING" | "PARTIAL" | "PAID" | "WAIVED" {
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
  const slip = await prisma.villageSlipSubmission.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!slip) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const reviewParsed = reviewSchema.safeParse(json);
  if (reviewParsed.success) {
    if (slip.status !== "PENDING") {
      return NextResponse.json({ error: "สลิปนี้ตรวจแล้ว" }, { status: 400 });
    }
    const now = new Date();
    const note = reviewParsed.data.reviewer_note?.trim() || null;
    if (reviewParsed.data.status === "REJECTED") {
      const updated = await prisma.villageSlipSubmission.update({
        where: { id },
        data: { status: "REJECTED", reviewerNote: note, reviewedAt: now },
      });
      return NextResponse.json({
        slip: {
          id: updated.id,
          status: updated.status,
          reviewer_note: updated.reviewerNote,
          reviewed_at: updated.reviewedAt?.toISOString() ?? null,
        },
      });
    }

    const profile = await prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
    });
    const house = await prisma.villageHouse.findFirst({
      where: { id: slip.houseId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!house) return NextResponse.json({ error: "ไม่พบบ้าน" }, { status: 400 });

    const defaultFee = profile?.defaultMonthlyFee ?? 0;
    const amountDueBase = house.monthlyFeeOverride ?? defaultFee;

    const out = await prisma.$transaction(async (tx) => {
      let feeRow = await tx.villageCommonFeeRow.findUnique({
        where: {
          ownerUserId_trialSessionId_houseId_yearMonth: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            houseId: slip.houseId,
            yearMonth: slip.yearMonth,
          },
        },
      });

      if (!feeRow) {
        feeRow = await tx.villageCommonFeeRow.create({
          data: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            houseId: slip.houseId,
            yearMonth: slip.yearMonth,
            amountDue: amountDueBase,
            amountPaid: 0,
            status: amountDueBase <= 0 ? "WAIVED" : "PENDING",
          },
        });
      }

      const add = Math.max(0, slip.amount);
      const newPaid = Math.min(feeRow.amountDue, feeRow.amountPaid + add);
      const st = deriveFeeStatus(feeRow.amountDue, newPaid);

      const updatedFee = await tx.villageCommonFeeRow.update({
        where: { id: feeRow.id },
        data: {
          amountPaid: newPaid,
          status: st,
          paidAt: st === "PAID" && feeRow.amountDue > 0 ? (feeRow.paidAt ?? now) : feeRow.paidAt,
        },
      });

      const updatedSlip = await tx.villageSlipSubmission.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewerNote: note,
          reviewedAt: now,
          feeRowId: updatedFee.id,
        },
      });

      return { slip: updatedSlip, fee_row: updatedFee };
    });

    return NextResponse.json({
      slip: {
        id: out.slip.id,
        status: out.slip.status,
        reviewer_note: out.slip.reviewerNote,
        reviewed_at: out.slip.reviewedAt?.toISOString() ?? null,
        fee_row_id: out.slip.feeRowId,
      },
      fee_row: {
        id: out.fee_row.id,
        amount_due: out.fee_row.amountDue,
        amount_paid: out.fee_row.amountPaid,
        status: out.fee_row.status,
      },
    });
  }

  const editParsed = editSchema.safeParse(json);
  if (!editParsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  if (slip.status !== "PENDING") {
    return NextResponse.json({ error: "แก้ไขได้เฉพาะสลิปรอตรวจ" }, { status: 400 });
  }
  const house = await prisma.villageHouse.findFirst({
    where: {
      id: editParsed.data.house_id,
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
    },
    select: { id: true },
  });
  if (!house) return NextResponse.json({ error: "ไม่พบบ้าน" }, { status: 400 });
  const updated = await prisma.villageSlipSubmission.update({
    where: { id },
    data: {
      houseId: editParsed.data.house_id,
      yearMonth: editParsed.data.year_month,
      amount: editParsed.data.amount,
    },
    include: { house: { select: { houseNo: true, ownerName: true } } },
  });
  return NextResponse.json({
    slip: {
      id: updated.id,
      house_id: updated.houseId,
      house_no: updated.house.houseNo,
      owner_name: updated.house.ownerName,
      year_month: updated.yearMonth,
      amount: updated.amount,
      slip_image_url: updated.slipImageUrl,
      status: updated.status,
      reviewer_note: updated.reviewerNote,
      submitted_at: updated.submittedAt.toISOString(),
      reviewed_at: updated.reviewedAt?.toISOString() ?? null,
      fee_row_id: updated.feeRowId,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const slip = await prisma.villageSlipSubmission.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true, status: true },
  });
  if (!slip) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  if (slip.status === "APPROVED") {
    return NextResponse.json({ error: "สลิปอนุมัติแล้วลบไม่ได้" }, { status: 400 });
  }

  await prisma.villageSlipSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

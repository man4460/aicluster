import { SchoolBankLedgerType } from "@/generated/prisma/enums";
import { NextResponse } from "next/server";
import { parseBahtToSatang } from "@/lib/format/money-th";
import { prisma } from "@/lib/prisma";
import {
  assertSchoolBankAccountOwned,
  getSchoolBankOwnerContext,
} from "@/systems/school-bank/lib/school-bank-api-auth";

export async function POST(req: Request) {
  const ctx = await getSchoolBankOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { accountId?: string; kind?: string; amountBaht?: string; note?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const accountId = body.accountId ?? "";
  const kind = body.kind ?? "";
  const amountSatang = body.amountBaht != null ? parseBahtToSatang(String(body.amountBaht)) : null;
  if (!accountId || amountSatang == null || amountSatang <= 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  let type: SchoolBankLedgerType;
  if (kind === "deposit") type = SchoolBankLedgerType.DEPOSIT;
  else if (kind === "withdraw") type = SchoolBankLedgerType.WITHDRAW;
  else return NextResponse.json({ error: "invalid_kind" }, { status: 400 });

  const owned = await assertSchoolBankAccountOwned(accountId, ctx.userId, ctx.scope.trialSessionId);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const note = body.note?.trim() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const acc = await tx.schoolBankAccount.findUnique({ where: { id: accountId } });
      if (!acc) return { ok: false as const, code: "not_found" as const };
      const delta = type === SchoolBankLedgerType.DEPOSIT ? amountSatang : -amountSatang;
      const newBal = acc.balanceSatang + delta;
      if (newBal < 0) return { ok: false as const, code: "insufficient" as const };
      await tx.schoolBankLedgerEntry.create({
        data: {
          accountId,
          type,
          amountSatang,
          balanceAfterSatang: newBal,
          note,
        },
      });
      await tx.schoolBankAccount.update({
        where: { id: accountId },
        data: { balanceSatang: newBal },
      });
      return { ok: true as const, balanceSatang: newBal };
    });

    if (!result.ok) {
      if (result.code === "insufficient") {
        return NextResponse.json({ error: "insufficient" }, { status: 400 });
      }
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, balanceSatang: result.balanceSatang });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSchoolBankOwnerContext } from "@/systems/school-bank/lib/school-bank-api-auth";

export async function GET(req: Request) {
  const ctx = await getSchoolBankOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const rows = await prisma.schoolBankAccount.findMany({
    where: {
      ownerUserId: ctx.userId,
      trialSessionId: ctx.scope.trialSessionId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { memberCode: { contains: q } },
              { memberName: { contains: q } },
              { classroomLabel: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ classroomLabel: "asc" }, { memberCode: "asc" }],
    select: {
      id: true,
      memberCode: true,
      memberName: true,
      classroomLabel: true,
      balanceSatang: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ accounts: rows });
}

export async function POST(req: Request) {
  const ctx = await getSchoolBankOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { memberCode?: string; memberName?: string; classroomLabel?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const memberCode = (body.memberCode ?? "").trim();
  const memberName = (body.memberName ?? "").trim();
  if (!memberCode || !memberName) {
    return NextResponse.json({ error: "member_required" }, { status: 400 });
  }

  const classroomLabel = body.classroomLabel?.trim() || null;

  try {
    const acc = await prisma.schoolBankAccount.create({
      data: {
        ownerUserId: ctx.userId,
        trialSessionId: ctx.scope.trialSessionId,
        settingsId: ctx.settings.id,
        memberCode,
        memberName,
        classroomLabel,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: acc.id });
  } catch {
    return NextResponse.json({ error: "duplicate_code" }, { status: 409 });
  }
}

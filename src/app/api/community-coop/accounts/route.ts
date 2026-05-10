import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommunityCoopOwnerContext } from "@/systems/community-coop/lib/community-coop-api-auth";

export async function GET(req: Request) {
  const ctx = await getCommunityCoopOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const rows = await prisma.communityCoopAccount.findMany({
    where: {
      ownerUserId: ctx.userId,
      trialSessionId: ctx.scope.trialSessionId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { memberCode: { contains: q } },
              { memberName: { contains: q } },
              { groupLabel: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ groupLabel: "asc" }, { memberCode: "asc" }],
    select: {
      id: true,
      memberCode: true,
      memberName: true,
      groupLabel: true,
      shareUnits: true,
      balanceSatang: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ accounts: rows });
}

export async function POST(req: Request) {
  const ctx = await getCommunityCoopOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    memberCode?: string;
    memberName?: string;
    groupLabel?: string | null;
    shareUnits?: number;
  };
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

  const groupLabel = body.groupLabel?.trim() || null;
  const shareUnits = Math.max(0, Math.floor(Number(body.shareUnits ?? 0)));

  try {
    const acc = await prisma.communityCoopAccount.create({
      data: {
        ownerUserId: ctx.userId,
        trialSessionId: ctx.scope.trialSessionId,
        settingsId: ctx.settings.id,
        memberCode,
        memberName,
        groupLabel,
        shareUnits,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: acc.id });
  } catch {
    return NextResponse.json({ error: "duplicate_code" }, { status: 409 });
  }
}

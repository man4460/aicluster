import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addStampToMember } from "@/lib/loyalty-stamp/member-service";
import { getLoyaltyStampOwnerContext } from "@/systems/loyalty-stamp/lib/api-auth";

const schema = z.object({ memberId: z.number().int().positive() });

export async function POST(req: Request) {
  const owner = await getLoyaltyStampOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const result = await addStampToMember(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    parsed.data.memberId,
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, member: result.member });
}

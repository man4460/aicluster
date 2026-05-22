import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { findDrinkPosMemberByPhoneQuery } from "@/systems/drink-pos/lib/member-service";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

const schema = z.object({
  ownerId: z.string().min(1),
  phone: z.string().min(4).max(20),
  trialSessionId: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const { ownerId, phone } = parsed.data;
  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะ" }, { status: 403 });

  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId =
    parsed.data.trialSessionId && parsed.data.trialSessionId.length > 0
      ? parsed.data.trialSessionId
      : scope.trialSessionId;

  const result = await findDrinkPosMemberByPhoneQuery(prisma, ownerId, trialSessionId, phone);
  if ("error" in result) {
    const status = result.error.includes("ไม่พบ") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ member: result });
}

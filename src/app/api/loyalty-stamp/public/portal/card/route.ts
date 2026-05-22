import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { isLoyaltyStampPortalOpenForOwner } from "@/lib/loyalty-stamp/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import {
  findLoyaltyMemberByPhoneQuery,
  findOrCreateLoyaltyMember,
} from "@/lib/loyalty-stamp/member-service";
import { parseLoyaltyPhoneQuery } from "@/lib/loyalty-stamp/member-qr";

const schema = z.object({
  ownerId: z.string().min(1),
  phone: z.string().min(4).max(20),
  customerName: z.string().max(120).optional().nullable(),
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

  const { ownerId, phone, customerName } = parsed.data;
  const open = await isLoyaltyStampPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะ" }, { status: 403 });

  const scope = await resolveDataScopeBySlug(ownerId, LOYALTY_STAMP_MODULE_SLUG);
  const trialSessionId =
    parsed.data.trialSessionId && parsed.data.trialSessionId.length > 0
      ? parsed.data.trialSessionId
      : scope.trialSessionId;
  const profile = await prisma.loyaltyStampShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
  });
  if (!profile || !profile.publicCardEnabled) {
    return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะ" }, { status: 403 });
  }

  const phoneQuery = parseLoyaltyPhoneQuery(phone);
  if ("error" in phoneQuery) {
    return NextResponse.json({ error: phoneQuery.error }, { status: 400 });
  }

  const result =
    phoneQuery.kind === "suffix4"
      ? await findLoyaltyMemberByPhoneQuery(
          prisma,
          ownerId,
          trialSessionId,
          profile.id,
          phone,
        )
      : await findOrCreateLoyaltyMember(
          prisma,
          ownerId,
          trialSessionId,
          profile.id,
          phone,
          customerName,
        );
  if ("error" in result) {
    const status = result.error.includes("ไม่พบ") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ member: result });
}

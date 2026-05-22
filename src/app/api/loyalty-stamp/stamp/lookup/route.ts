import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  normalizeLoyaltyQrPaste,
  parseLoyaltyMemberQrPayload,
} from "@/lib/loyalty-stamp/member-qr";
import {
  findOrCreateLoyaltyMemberByPhoneQuery,
  mapMemberDto,
} from "@/lib/loyalty-stamp/member-service";
import { getLoyaltyStampOwnerContext } from "@/systems/loyalty-stamp/lib/api-auth";

const schema = z.object({
  phone: z.string().optional(),
  qrPayload: z.string().optional(),
  customerName: z.string().max(120).optional().nullable(),
});

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
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const { phone, qrPayload, customerName } = parsed.data;

  const qrRaw = qrPayload ? normalizeLoyaltyQrPaste(qrPayload) : "";
  if (qrRaw) {
    const qr = parseLoyaltyMemberQrPayload(qrRaw);
    if (!qr) {
      return NextResponse.json(
        { error: "รหัส QR ไม่ถูกต้อง — ใช้ QR บนการ์ดลูกค้า (รูปแบบ LS:รหัส:โทเคน)" },
        { status: 400 },
      );
    }
    const member = await prisma.loyaltyStampMember.findFirst({
      where: {
        id: qr.memberId,
        qrToken: qr.qrToken,
        ownerUserId: owner.userId,
        trialSessionId: owner.scope.trialSessionId,
      },
      include: { profile: true },
    });
    if (!member) return NextResponse.json({ error: "ไม่พบสมาชิกจาก QR" }, { status: 404 });
    return NextResponse.json({ member: mapMemberDto(member, member.profile) });
  }

  if (!phone?.trim()) {
    return NextResponse.json({ error: "กรอกเบอร์หรือสแกน QR" }, { status: 400 });
  }

  const result = await findOrCreateLoyaltyMemberByPhoneQuery(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    owner.profile.id,
    phone,
    customerName,
  );
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ member: result });
}

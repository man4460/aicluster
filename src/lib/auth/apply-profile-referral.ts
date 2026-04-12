import type { PrismaClient } from "@/generated/prisma/client";
import { resolveReferrerUserId } from "@/lib/auth/resolve-referrer-user-id";
import { thaiPhoneCoreDigits } from "@/lib/auth/referrer-phone";
import { REFERRAL_BONUS_TOKENS } from "@/lib/tokens/signup-bonus";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/**
 * บันทึกผู้แนะนำจากเบอร์ (ครั้งเดียวต่อ user) — เรียกภายใน transaction หลังเช็ค referredByUserId ว่าง
 */
export async function applyReferrerFromProfileInTx(
  tx: Tx,
  userId: string,
  refereePhone: string | null | undefined,
  referrerPhoneRaw: string,
): Promise<void> {
  const existing = await tx.user.findUnique({
    where: { id: userId },
    select: { referredByUserId: true },
  });
  if (existing?.referredByUserId) {
    throw new Error("REFERRER_ALREADY_SET");
  }

  const refId = await resolveReferrerUserId(tx, referrerPhoneRaw);
  if (!refId) {
    throw new Error("REFERRER_NOT_FOUND");
  }
  if (refId === userId) {
    throw new Error("REFERRER_SELF");
  }
  const ref = await tx.user.findUnique({
    where: { id: refId },
    select: { phone: true },
  });
  const selfCore = refereePhone ? thaiPhoneCoreDigits(refereePhone) : null;
  const refCore = ref?.phone ? thaiPhoneCoreDigits(ref.phone) : null;
  if (selfCore && refCore && selfCore === refCore) {
    throw new Error("REFERRER_SAME_PHONE");
  }

  await tx.user.update({
    where: { id: userId },
    data: { referredByUserId: refId },
  });
  await tx.user.update({
    where: { id: refId },
    data: { tokens: { increment: REFERRAL_BONUS_TOKENS } },
  });
}

export function referralProfileErrorMessage(code: string): string {
  switch (code) {
    case "REFERRER_ALREADY_SET":
      return "บันทึกเบอร์ผู้แนะนำได้ครั้งเดียว";
    case "REFERRER_NOT_FOUND":
      return "ไม่พบผู้แนะนำจากเบอร์นี้ — ต้องตรงเบอร์ในโปรไฟล์ผู้แนะนำในระบบ";
    case "REFERRER_SELF":
      return "ไม่สามารถใส่เบอร์ของบัญชีตัวเองเป็นผู้แนะนำ";
    case "REFERRER_SAME_PHONE":
      return "เบอร์ผู้แนะนำตรงกับเบอร์โปรไฟล์ของคุณ — ไม่สามารถใช้ได้";
    default:
      return "บันทึกผู้แนะนำไม่สำเร็จ";
  }
}

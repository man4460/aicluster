import type { PrismaClient } from "@/generated/prisma/client";
import type { GoogleUserInfo } from "@/lib/auth/google-oauth";
import {
  canonicalAuthEmailForStorage,
  findUserByAuthEmail,
  normalizeAuthEmail,
} from "@/lib/auth/user-email";
import { SIGNUP_BONUS_TOKENS } from "@/lib/tokens/signup-bonus";

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  let s = local.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  s = s.replace(/^\.+|\.+$/g, "").slice(0, 50);
  if (s.length < 2) s = `user_${s || "g"}`;
  return s;
}

export type GoogleUserResolveResult =
  | { ok: true; userId: string }
  | { ok: false; code: "email_unverified" | "account_conflict" | "create_failed" };

/**
 * ค้นหาหรือสร้างผู้ใช้จากโปรไฟล์ Google — อีเมลเดียวกับบัญชีเดิม (สมัครเอง) ใช้บัญชีเดิมและผูก googleSub
 */
export async function findOrCreateUserFromGoogle(
  prisma: PrismaClient,
  info: GoogleUserInfo,
): Promise<GoogleUserResolveResult> {
  if (!info.email_verified) {
    return { ok: false, code: "email_unverified" };
  }

  const emailStored = canonicalAuthEmailForStorage(info.email);
  const picture = info.picture ? info.picture.slice(0, 512) : null;

  const bySub = await prisma.user.findUnique({
    where: { googleSub: info.sub },
    select: { id: true, fullName: true },
  });
  if (bySub) {
    await prisma.user.update({
      where: { id: bySub.id },
      data: {
        ...(!bySub.fullName?.trim() && info.name ? { fullName: info.name } : {}),
        ...(picture ? { avatarUrl: picture } : {}),
        email: emailStored,
      },
    });
    return { ok: true, userId: bySub.id };
  }

  const byEmail = await findUserByAuthEmail(prisma, info.email);

  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== info.sub) {
      return { ok: false, code: "account_conflict" };
    }
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleSub: info.sub,
        email: emailStored,
        ...(!byEmail.fullName?.trim() && info.name ? { fullName: info.name } : {}),
        ...(picture ? { avatarUrl: picture } : {}),
      },
    });
    return { ok: true, userId: byEmail.id };
  }

  let base = usernameFromEmail(emailStored);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      const created = await prisma.user.create({
        data: {
          email: emailStored,
          username: candidate.slice(0, 64),
          passwordHash: null,
          googleSub: info.sub,
          role: "USER",
          tokens: SIGNUP_BONUS_TOKENS,
          lastDeductionDate: null,
          subscriptionType: "DAILY",
          subscriptionTier: "NONE",
          fullName: info.name ?? null,
          avatarUrl: picture,
        },
        select: { id: true },
      });
      return { ok: true, userId: created.id };
    } catch {
      /* username ชน — ลองชื่อใหม่ */
    }
  }

  return { ok: false, code: "create_failed" };
}

/** @deprecated ใช้ normalizeAuthEmail จาก user-email.ts */
export function normalizeEmail(email: string): string {
  return normalizeAuthEmail(email);
}

import type { PrismaClient } from "@/generated/prisma/client";
import type { GoogleUserInfo } from "@/lib/auth/google-oauth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
 * ค้นหาหรือสร้างผู้ใช้จากโปรไฟล์ Google — อีเมลเดียวกับบัญชีเดิมจะผูก googleSub อัตโนมัติ
 */
export async function findOrCreateUserFromGoogle(
  prisma: PrismaClient,
  info: GoogleUserInfo,
): Promise<GoogleUserResolveResult> {
  if (!info.email_verified) {
    return { ok: false, code: "email_unverified" };
  }

  const emailNorm = normalizeEmail(info.email);
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
      },
    });
    return { ok: true, userId: bySub.id };
  }

  const byEmail = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailNorm }, { email: info.email.trim() }],
    },
    select: { id: true, googleSub: true, fullName: true },
  });

  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== info.sub) {
      return { ok: false, code: "account_conflict" };
    }
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleSub: info.sub,
        email: emailNorm,
        ...(!byEmail.fullName?.trim() && info.name ? { fullName: info.name } : {}),
        ...(picture ? { avatarUrl: picture } : {}),
      },
    });
    return { ok: true, userId: byEmail.id };
  }

  let base = usernameFromEmail(emailNorm);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      const created = await prisma.user.create({
        data: {
          email: emailNorm,
          username: candidate.slice(0, 64),
          passwordHash: null,
          googleSub: info.sub,
          role: "USER",
          tokens: 7,
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

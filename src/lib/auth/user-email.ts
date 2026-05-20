import type { PrismaClient } from "@/generated/prisma/client";

/** อีเมลมาตรฐานสำหรับเปรียบเทียบ/เก็บ — trim + lowercase */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Gmail / Googlemail — ตัดจุดใน local part ให้ตรงกับที่ Google ถือว่าเป็นบัญชีเดียวกัน */
export function canonicalAuthEmailForStorage(email: string): string {
  const norm = normalizeAuthEmail(email);
  const at = norm.lastIndexOf("@");
  if (at <= 0) return norm;
  const local = norm.slice(0, at);
  const domain = norm.slice(at + 1);
  if (domain !== "gmail.com" && domain !== "googlemail.com") return norm;
  const canonLocal = local.replace(/\./g, "");
  return `${canonLocal}@gmail.com`;
}

export type UserEmailLookupRow = {
  id: string;
  email: string;
  googleSub: string | null;
  fullName: string | null;
  passwordHash: string | null;
};

/**
 * หาผู้ใช้จากอีเมล — ไม่แยกตัวพิมพ์ และรองรับ Gmail ที่ต่างแค่จุดใน local part
 */
export async function findUserByAuthEmail(
  prisma: PrismaClient,
  rawEmail: string,
): Promise<UserEmailLookupRow | null> {
  const norm = normalizeAuthEmail(rawEmail);
  const stored = canonicalAuthEmailForStorage(norm);

  const exact = await prisma.user.findFirst({
    where: { OR: [{ email: norm }, { email: stored }] },
    select: {
      id: true,
      email: true,
      googleSub: true,
      fullName: true,
      passwordHash: true,
    },
  });
  if (exact) return exact;

  const at = stored.lastIndexOf("@");
  if (at <= 0) return null;
  const domain = stored.slice(at + 1);
  if (domain !== "gmail.com") return null;

  const gmailLocal = stored.slice(0, at).replace(/\./g, "");
  const rows = await prisma.$queryRaw<UserEmailLookupRow[]>`
    SELECT
      id,
      email,
      google_sub AS googleSub,
      full_name AS fullName,
      password_hash AS passwordHash
    FROM \`User\`
    WHERE
      LOWER(SUBSTRING_INDEX(email, '@', -1)) IN ('gmail.com', 'googlemail.com')
      AND LOWER(REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', '')) = ${gmailLocal}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

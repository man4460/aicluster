import type { PrismaClient } from "@/generated/prisma/client";
import { thaiPhoneCoreDigits, thaiPhoneSearchVariants } from "@/lib/auth/referrer-phone";

/** หา user id ผู้แนะนำจากเบอร์ (ตรงกับฟิลด์ phone ในฐานข้อมูล) */
export async function resolveReferrerUserId(
  prisma: Pick<PrismaClient, "user">,
  referrerPhoneRaw: string | null | undefined,
): Promise<string | null> {
  const refRaw = referrerPhoneRaw?.trim();
  if (!refRaw) return null;
  const core = thaiPhoneCoreDigits(refRaw);
  if (!core) return null;
  const variants = thaiPhoneSearchVariants(core);
  const ref = await prisma.user.findFirst({
    where: { OR: variants.map((phone) => ({ phone })) },
    select: { id: true },
  });
  return ref?.id ?? null;
}

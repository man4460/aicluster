import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export type BusinessProfile = {
  name: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** ข้อมูลบริษัท/ร้านแบบศูนย์กลาง (owner-level) — `barberTrialSessionId` แยกโปรไฟล์ร้านตัดผมระหว่าง prod / ทดลอง */
export async function getBusinessProfile(
  ownerUserId: string,
  opts?: { barberTrialSessionId?: string },
): Promise<BusinessProfile | null> {
  const barberScope = opts?.barberTrialSessionId ?? TRIAL_PROD_SCOPE;
  const [user, barber] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerUserId },
      select: {
        fullName: true,
        avatarUrl: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
      },
    }),
    prisma.barberShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId, trialSessionId: barberScope },
      },
      select: { taxId: true },
    }),
  ]);

  if (!user) return null;
  return {
    name: user.fullName,
    logoUrl: user.avatarUrl,
    taxId: barber?.taxId ?? null,
    address: user.address,
    contactPhone: user.phone,
    latitude: user.latitude,
    longitude: user.longitude,
  };
}

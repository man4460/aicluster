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
  opts?: { barberTrialSessionId?: string; massageTrialSessionId?: string },
): Promise<BusinessProfile | null> {
  const barberScope = opts?.barberTrialSessionId ?? TRIAL_PROD_SCOPE;
  const massageScope = opts?.massageTrialSessionId ?? TRIAL_PROD_SCOPE;
  const [user, barber, massage] = await Promise.all([
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
    opts?.barberTrialSessionId != null || opts?.massageTrialSessionId == null
      ? prisma.barberShopProfile.findUnique({
          where: {
            ownerUserId_trialSessionId: { ownerUserId, trialSessionId: barberScope },
          },
          select: { taxId: true, displayName: true, logoUrl: true, address: true, contactPhone: true },
        })
      : Promise.resolve(null),
    opts?.massageTrialSessionId != null
      ? prisma.massageShopProfile.findUnique({
          where: {
            ownerUserId_trialSessionId: { ownerUserId, trialSessionId: massageScope },
          },
          select: { taxId: true, displayName: true, logoUrl: true, address: true, contactPhone: true },
        })
      : Promise.resolve(null),
  ]);

  if (!user) return null;
  const shop = massage ?? barber;
  return {
    name: shop?.displayName?.trim() || user.fullName,
    logoUrl: shop?.logoUrl?.trim() || user.avatarUrl,
    taxId: shop?.taxId ?? barber?.taxId ?? null,
    address: shop?.address?.trim() || user.address,
    contactPhone: shop?.contactPhone?.trim() || user.phone,
    latitude: user.latitude,
    longitude: user.longitude,
  };
}

import { prisma } from "@/lib/prisma";

export type BusinessProfile = {
  name: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** ข้อมูลบริษัท/ร้านแบบศูนย์กลาง (owner-level) */
export async function getBusinessProfile(ownerUserId: string): Promise<BusinessProfile | null> {
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
      where: { ownerUserId },
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

import { prisma } from "@/lib/prisma";

export async function ensureAppointmentQueueProfile(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.appointmentQueueShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  const profile = await prisma.appointmentQueueShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "ร้านของฉัน",
      tagline: "จองเวลาล่วงหน้า — ไม่ต้องทักแชทถามคิว",
      publicBookingEnabled: true,
    },
  });

  await prisma.appointmentQueueService.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "บริการมาตรฐาน",
      durationMinutes: 60,
      priceBaht: 300,
      sortOrder: 0,
    },
  });

  return profile;
}

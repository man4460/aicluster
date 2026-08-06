import { prisma } from "@/lib/prisma";

function defaultVenueSettings() {
  return {
    venueName: "สนามฟุตบอล MAWELL",
    venueSubtitle: "สนามหญ้าเทียม",
    promptpayNumber: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    venueAddress: "",
    taxId: "",
    contactPhone: "0812345678",
    contactLine: "",
    note: "",
  };
}

export async function ensureFootballTurfProfile(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.footballTurfShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  const defaults = defaultVenueSettings();
  const profile = await prisma.footballTurfShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      ...defaults,
    },
  });

  await prisma.footballTurfCourt.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        name: "สนาม A",
        openTime: "16:00",
        closeTime: "23:00",
        slotMinutes: 60,
        weekdayPrice: 900,
        weekendPrice: 1200,
        isActive: true,
        sortOrder: 0,
      },
      {
        ownerUserId,
        trialSessionId,
        name: "สนาม B",
        openTime: "16:00",
        closeTime: "23:00",
        slotMinutes: 90,
        weekdayPrice: 1200,
        weekendPrice: 1500,
        isActive: true,
        sortOrder: 1,
      },
    ],
  });

  await prisma.footballTurfPromotion.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        name: "โปร 10 รอบ",
        kind: "COUNT",
        totalUses: 10,
        durationMinutes: 60,
        price: 8000,
        isActive: true,
        note: "เหมาะกับทีมประจำ",
      },
      {
        ownerUserId,
        trialSessionId,
        name: "โปร 5 รอบ 90 นาที",
        kind: "HOUR",
        totalUses: 5,
        durationMinutes: 90,
        price: 5500,
        isActive: true,
        note: "ใช้สนามใหญ่",
      },
    ],
  });

  await prisma.footballTurfCostCategory.createMany({
    data: [
      { ownerUserId, trialSessionId, name: "ค่าน้ำค่าไฟ" },
      { ownerUserId, trialSessionId, name: "ค่าดูแลสนาม" },
    ],
  });

  return profile;
}

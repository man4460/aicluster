import type { PrismaClient } from "@/generated/prisma/client";
import {
  DRINK_POS_CATEGORY_IMAGES,
  DRINK_POS_PRODUCT_IMAGES,
} from "@/lib/drink-pos/drink-stock-images";

const CATEGORY_DEFS = [
  { name: "กาแฟ", sortOrder: 0 },
  { name: "ชา & นม", sortOrder: 1 },
  { name: "ท็อปปิ้ง", sortOrder: 2 },
  { name: "สมูทตี้", sortOrder: 3 },
] as const;

const PRODUCT_DEFS: ReadonlyArray<{
  cat: 0 | 1 | 2 | 3;
  name: string;
  priceBaht: number;
  isFeatured: boolean;
  sortOrder: number;
}> = [
  { cat: 0, name: "ลาเต้เย็น", priceBaht: 55, isFeatured: true, sortOrder: 0 },
  { cat: 0, name: "อเมริกาโน่", priceBaht: 45, isFeatured: true, sortOrder: 1 },
  { cat: 0, name: "คาปูชิโน่", priceBaht: 50, isFeatured: false, sortOrder: 2 },
  { cat: 0, name: "มอคค่า", priceBaht: 60, isFeatured: false, sortOrder: 3 },
  { cat: 1, name: "ชาเขียวนม", priceBaht: 40, isFeatured: true, sortOrder: 0 },
  { cat: 1, name: "ชาไทย", priceBaht: 35, isFeatured: true, sortOrder: 1 },
  { cat: 1, name: "โกโก้", priceBaht: 38, isFeatured: false, sortOrder: 2 },
  { cat: 1, name: "นมสด", priceBaht: 30, isFeatured: false, sortOrder: 3 },
  { cat: 2, name: "ไข่มุก", priceBaht: 15, isFeatured: false, sortOrder: 0 },
  { cat: 2, name: "วิปครีม", priceBaht: 10, isFeatured: false, sortOrder: 1 },
  { cat: 2, name: "ช็อตเอสเปรสโซ่", priceBaht: 15, isFeatured: false, sortOrder: 2 },
  { cat: 3, name: "สมูทตี้มะม่วง", priceBaht: 65, isFeatured: true, sortOrder: 0 },
  { cat: 3, name: "สมูทตี้เบอร์รี", priceBaht: 70, isFeatured: false, sortOrder: 1 },
];

const SALE_BLUEPRINTS: ReadonlyArray<{
  daysAgo: number;
  note: string | null;
  memberPhone?: string;
  lines: ReadonlyArray<{ productIndex: number; qty: number }>;
}> = [
  { daysAgo: 0, note: "หน้าร้าน", memberPhone: "0812345678", lines: [{ productIndex: 0, qty: 2 }] },
  { daysAgo: 0, note: null, lines: [{ productIndex: 4, qty: 3 }, { productIndex: 8, qty: 3 }] },
  { daysAgo: 1, note: "Grab", lines: [{ productIndex: 1, qty: 4 }] },
  { daysAgo: 2, note: null, lines: [{ productIndex: 5, qty: 2 }, { productIndex: 9, qty: 2 }] },
  { daysAgo: 3, note: null, lines: [{ productIndex: 2, qty: 3 }] },
  { daysAgo: 4, note: "สมาชิก", memberPhone: "0898765432", lines: [{ productIndex: 0, qty: 1 }] },
  { daysAgo: 5, note: null, lines: [{ productIndex: 6, qty: 5 }] },
  { daysAgo: 6, note: "เช้า", lines: [{ productIndex: 3, qty: 2 }, { productIndex: 7, qty: 2 }] },
  { daysAgo: 0, note: "สมูทตี้", lines: [{ productIndex: 11, qty: 2 }] },
];

const COST_BLUEPRINTS = [
  { daysAgo: 1, label: "วัตถุดิบกาแฟ", amountBaht: 1200 },
  { daysAgo: 3, label: "นม & ชา", amountBaht: 850 },
  { daysAgo: 5, label: "ค่าเช่าพื้นที่ (รายสัปดาห์)", amountBaht: 3500 },
  { daysAgo: 2, label: "ผลไม้สมูทตี้", amountBaht: 600 },
];

async function wipeDrinkPosOwnerData(prisma: PrismaClient, ownerUserId: string, trialSessionId: string) {
  await prisma.drinkPosReservation.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosReview.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosLoyaltyLedger.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosLoyaltyReward.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosLoyaltySettings.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosStaffLink.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosSaleLine.deleteMany({ where: { sale: { ownerUserId } } });
  await prisma.drinkPosSale.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosCostEntry.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosMember.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosProduct.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosCategory.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

const DRINK_POS_PORTAL_SAMPLE_BANNER =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80";
const DRINK_POS_PORTAL_SAMPLE_GALLERY = [
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
];

/** ใส่ข้อมูลตัวอย่าง POS เครื่องดื่ม (ล้างแล้วใส่ใหม่) */
export async function seedDrinkPosProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const trialSessionId = "prod";

  await wipeDrinkPosOwnerData(prisma, ownerUserId, trialSessionId);

  await prisma.drinkPosShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "Café MAWELL Demo",
      tagline: "กาแฟสด · สมูทตี้ · สั่งออนไลน์",
      contactPhone: "021234567",
      address: "99 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
      contactLine: "@mawellcafe",
      facebookUrl: "https://facebook.com/",
      mapUrl: "https://maps.google.com/",
      portalBannerUrl: DRINK_POS_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: JSON.stringify(DRINK_POS_PORTAL_SAMPLE_GALLERY),
      openTime: "08:00",
      closeTime: "20:00",
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 50,
      depositPercent: 30,
      stampsPerReward: 10,
      rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
      promptPayPhone: "0812345678",
    },
  });

  await prisma.drinkPosLoyaltySettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      enabled: true,
      bahtPerPoint: 100,
      pointsPerUnit: 1,
    },
  });

  const categories = await Promise.all(
    CATEGORY_DEFS.map((c, i) =>
      prisma.drinkPosCategory.create({
        data: {
          ownerUserId,
          name: c.name,
          sortOrder: c.sortOrder,
          isActive: true,
          imageUrl: DRINK_POS_CATEGORY_IMAGES[i] ?? DRINK_POS_CATEGORY_IMAGES[0],
        },
      }),
    ),
  );
  const catIds = categories.map((c) => c.id);

  await prisma.drinkPosLoyaltyReward.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        title: "เครื่องดื่มฟรี 1 แก้ว",
        productId: null,
        pointsCost: 10,
        sortOrder: 100,
        isActive: true,
      },
      {
        ownerUserId,
        trialSessionId,
        title: "ท็อปปิ้งฟรี",
        productId: null,
        pointsCost: 5,
        sortOrder: 110,
        isActive: true,
      },
    ],
  });

  const productsOrdered: { id: string; name: string; priceBaht: number }[] = [];
  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const p = PRODUCT_DEFS[i]!;
    const row = await prisma.drinkPosProduct.create({
      data: {
        ownerUserId,
        categoryId: catIds[p.cat]!,
        name: p.name,
        priceBaht: p.priceBaht,
        imageUrl: DRINK_POS_PRODUCT_IMAGES[i] ?? DRINK_POS_PRODUCT_IMAGES[0],
        isFeatured: p.isFeatured,
        isActive: true,
        sortOrder: p.sortOrder,
      },
      select: { id: true, name: true, priceBaht: true },
    });
    productsOrdered.push(row);
  }

  const memberA = await prisma.drinkPosMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone: "0812345678",
      customerName: "คุณมิ้น",
      currentStamps: 7,
      pointsBalance: 12,
      totalEarned: 12,
      totalRedeemed: 0,
    },
  });
  const memberB = await prisma.drinkPosMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone: "0898765432",
      customerName: "คุณบี",
      currentStamps: 9,
      pointsBalance: 5,
      totalEarned: 15,
      totalRedeemed: 10,
    },
  });

  const now = Date.now();
  const phoneToMember = new Map<string, string>([
    ["0812345678", memberA.id],
    ["0898765432", memberB.id],
  ]);

  for (const bill of SALE_BLUEPRINTS) {
    const lines = bill.lines.map(({ productIndex, qty }) => {
      const p = productsOrdered[productIndex];
      if (!p) throw new Error(`seed drink-pos: missing product index ${productIndex}`);
      return {
        productId: p.id,
        productName: p.name,
        unitPriceBaht: p.priceBaht,
        quantity: qty,
        lineTotalBaht: p.priceBaht * qty,
      };
    });
    const totalBaht = lines.reduce((s, l) => s + l.lineTotalBaht, 0);
    const createdAt = new Date(now - bill.daysAgo * 86400000);
    createdAt.setHours(11, 0, 0, 0);
    const memberId = bill.memberPhone ? phoneToMember.get(bill.memberPhone) ?? null : null;
    const pointsEarned =
      memberId && totalBaht >= 100 ? Math.floor(totalBaht / 100) : 0;

    await prisma.drinkPosSale.create({
      data: {
        ownerUserId,
        memberId,
        memberPhone: bill.memberPhone ?? null,
        note: bill.note,
        totalBaht,
        pointsEarned,
        createdAt,
        lines: { create: lines },
      },
    });
  }

  for (const c of COST_BLUEPRINTS) {
    const spentAt = new Date(now - c.daysAgo * 86400000);
    spentAt.setHours(9, 0, 0, 0);
    await prisma.drinkPosCostEntry.create({
      data: {
        ownerUserId,
        label: c.label,
        amountBaht: c.amountBaht,
        spentAt,
      },
    });
  }

  const featured = productsOrdered[0];
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  if (featured) {
    await prisma.drinkPosReservation.create({
      data: {
        ownerUserId,
        trialSessionId,
        customerName: "คุณมุก",
        phone: "0812345678",
        partySize: 2,
        visitDateKey: todayKey,
        visitTimeHm: "15:00",
        itemsJson: [
          {
            productId: featured.id,
            name: featured.name,
            unitPrice: featured.priceBaht,
            qty: 2,
          },
        ],
        itemsTotalBaht: featured.priceBaht * 2,
        paymentMode: "DEPOSIT",
        payDueBaht: 50,
        amountPaidBaht: 50,
        paymentMethod: "PROMPTPAY",
        status: "SCHEDULED",
        note: "ใกล้หน้าต่าง",
      },
    });
  }

  await prisma.drinkPosReview.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        guestName: "น้องบีม",
        rating: 5,
        comment: "ลาเต้หอมมาก สั่งสะดวก",
        photoUrlsJson: "[]",
        isPublished: true,
      },
      {
        ownerUserId,
        trialSessionId,
        guestName: "คุณฝน",
        rating: 4,
        comment: "สมูทตี้สดดี บรรยากาศร้านน่านั่ง",
        photoUrlsJson: "[]",
        isPublished: true,
      },
    ],
  });
}

/** ใส่ข้อมูลตัวอย่างถ้ายังไม่มีหมวด (ไม่ล้างของเดิม) */
export async function ensureDrinkPosDemoDataForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { force?: boolean },
): Promise<{ seeded: boolean }> {
  const force = opts?.force === true;
  if (!force) {
    const count = await prisma.drinkPosCategory.count({ where: { ownerUserId } });
    if (count > 0) return { seeded: false };
  }
  await seedDrinkPosProdDemoForOwner(prisma, ownerUserId);
  return { seeded: true };
}

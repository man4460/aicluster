import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** รูปตัวอย่างสำหรับ sandbox เท่านั้น — โหลดจาก CDN สาธารณะ */
function trialPhoto(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

/**
 * ข้อมูลตัวอย่างร้านตัดผม (~5 แถวต่อเมนูหลัก + รูป)
 * เรียกเมื่อเริ่ม trial เท่านั้น — ผูกกับ trialSessionId
 */
export async function seedBarberTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.barberShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "MAWELL Barber Studio (ทดลอง)",
      logoUrl: trialPhoto("barber-trial-logo", 160, 160),
      contactPhone: "0890001122",
      address: "123 ถ.ตัวอย่าง แขวงทดลอง เขตสาธิต กทม. 10110",
      taxId: "0123456789012",
    },
  });

  const packageDefs = [
    { name: "ตัดผม 10 ครั้ง", price: 1200, totalSessions: 10 },
    { name: "ตัด + สระ 8 ครั้ง", price: 2400, totalSessions: 8 },
    { name: "ทำสี Short 5 ครั้ง", price: 5500, totalSessions: 5 },
    { name: "ตัดนักเรียน 12 ครั้ง", price: 900, totalSessions: 12 },
    { name: "แพ็กพรีเมียม 6 ครั้ง", price: 4200, totalSessions: 6 },
  ];

  const packages = await Promise.all(
    packageDefs.map((p) =>
      tx.barberPackage.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: p.name,
          price: p.price,
          totalSessions: p.totalSessions,
        },
      }),
    ),
  );

  const stylistDefs = [
    { name: "พี่หมู หัวหน้าช่าง", phone: "0811110001" },
    { name: "พี่ดำ สไตล์สุภาพ", phone: "0811110002" },
    { name: "น้องมิ้นท์ ช่างสระ", phone: "0811110003" },
    { name: "พี่เบิร์ด ทำสี", phone: "0811110004" },
    { name: "น้องเฟิร์น ตัดเด็ก", phone: "0811110005" },
  ];

  const stylists = await Promise.all(
    stylistDefs.map((s, i) =>
      tx.barberStylist.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: s.name,
          phone: s.phone,
          photoUrl: trialPhoto(`barber-trial-stylist-${i}`, 280, 280),
          isActive: true,
        },
      }),
    ),
  );

  const customerDefs = [
    { phone: "0898881001", name: "คุณแป้ง" },
    { phone: "0898881002", name: "คุณบัว" },
    { phone: "0898881003", name: "คุณชาติ" },
    { phone: "0898881004", name: "คุณดาว" },
    { phone: "0898881005", name: "คุณเอ็ม" },
  ];

  const customers = await Promise.all(
    customerDefs.map((c) =>
      tx.barberCustomer.create({
        data: {
          ownerUserId,
          trialSessionId,
          phone: c.phone,
          name: c.name,
        },
      }),
    ),
  );

  const subStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "EXHAUSTED", "CANCELLED"] as const;

  const subscriptions = await Promise.all(
    customers.map((customer, i) => {
      const pkg = packages[i]!;
      const stylist = stylists[i % stylists.length]!;
      const st = subStatuses[i]!;
      const remaining =
        st === "ACTIVE" ? Math.max(1, pkg.totalSessions - i - 2) : st === "EXHAUSTED" ? 0 : 3;
      const withSlip = i % 2 === 0;
      return tx.barberCustomerSubscription.create({
        data: {
          ownerUserId,
          trialSessionId,
          barberCustomerId: customer.id,
          packageId: pkg.id,
          soldByStylistId: stylist.id,
          remainingSessions: remaining,
          status: st,
          saleReceiptImageUrl: withSlip ? trialPhoto(`barber-trial-sale-slip-${i}`, 480, 640) : null,
        },
      });
    }),
  );

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  await Promise.all(
    [0, 1, 2, 3, 4].map((i) => {
      const sub = subscriptions[i];
      const customer = customers[i]!;
      const stylist = stylists[i % stylists.length]!;
      if (i < 3 && sub?.status === "ACTIVE") {
        return tx.barberServiceLog.create({
          data: {
            ownerUserId,
            trialSessionId,
            subscriptionId: sub.id,
            barberCustomerId: customer.id,
            visitType: "PACKAGE_USE",
            stylistId: stylist.id,
            note: "หักแพ็ก — ทดลอง",
            createdAt: new Date(now - (i + 1) * day),
          },
        });
      }
      return tx.barberServiceLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          subscriptionId: null,
          barberCustomerId: customer.id,
          visitType: "CASH_WALK_IN",
          stylistId: stylist.id,
          amountBaht: 180 + i * 20,
          receiptImageUrl: trialPhoto(`barber-trial-cash-slip-${i}`, 480, 640),
          note: i === 3 ? "Walk-in ไม่ระบุแพ็ก" : null,
          createdAt: new Date(now - (i + 2) * day),
        },
      });
    }),
  );

  const bookingStatuses = ["SCHEDULED", "SCHEDULED", "ARRIVED", "NO_SHOW", "CANCELLED"] as const;

  await Promise.all(
    [0, 1, 2, 3, 4].map((i) => {
      const customer = customers[i]!;
      return tx.barberBooking.create({
        data: {
          ownerUserId,
          trialSessionId,
          barberCustomerId: customer.id,
          phone: customer.phone,
          customerName: customer.name,
          scheduledAt: new Date(now + (i + 1) * day + i * 3600_000),
          status: bookingStatuses[i]!,
        },
      });
    }),
  );

  const catDefs = ["วัสดุสิ้นเปลือง", "ค่าสาธารณูปโภค", "การตลาด"];
  const categories = await Promise.all(
    catDefs.map((name) =>
      tx.barberCostCategory.create({
        data: { ownerUserId, trialSessionId, name },
      }),
    ),
  );

  const costLabels = [
    "แชมพูแกลลอน",
    "มีดโกนใบมีด",
    "ค่าไฟเดือนนี้",
    "โปรโมทเฟซบุ๊ก",
    "อุปกรณ์ไดร์เป่าผม",
  ];

  await Promise.all(
    costLabels.map((itemLabel, i) => {
      const cat = categories[i % categories.length]!;
      return tx.barberCostEntry.create({
        data: {
          ownerUserId,
          trialSessionId,
          categoryId: cat.id,
          spentAt: new Date(now - (i + 3) * day),
          amount: 450 + i * 120,
          itemLabel,
          note: "รายการตัวอย่างโหมดทดลอง",
          slipPhotoUrl: trialPhoto(`barber-trial-cost-slip-${i}`, 480, 640),
        },
      });
    }),
  );
}

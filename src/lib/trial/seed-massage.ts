import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** รูปตัวอย่างสำหรับ sandbox เท่านั้น — โหลดจาก CDN สาธารณะ */
function trialPhoto(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

/**
 * ข้อมูลตัวอย่างร้านนวด (~5 แถวต่อเมนูหลัก + รูป)
 * เรียกเมื่อเริ่ม trial เท่านั้น — ผูกกับ trialSessionId
 */
export async function seedMassageTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.massageShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "MAWELL Massage Studio (ทดลอง)",
      logoUrl: trialPhoto("massage-trial-logo", 160, 160),
      contactPhone: "0890001122",
      address: "123 ถ.ตัวอย่าง แขวงทดลอง เขตสาธิต กทม. 10110",
      taxId: "0123456789012",
    },
  });

  const packageDefs = [
    { name: "นวด 10 ครั้ง", price: 1200, totalSessions: 10 },
    { name: "ตัด + สระ 8 ครั้ง", price: 2400, totalSessions: 8 },
    { name: "ทำสี Short 5 ครั้ง", price: 5500, totalSessions: 5 },
    { name: "ตัดนักเรียน 12 ครั้ง", price: 900, totalSessions: 12 },
    { name: "แพ็กพรีเมียม 6 ครั้ง", price: 4200, totalSessions: 6 },
  ];

  const packages = await Promise.all(
    packageDefs.map((p) =>
      tx.massagePackage.create({
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
    { name: "พี่หมู หัวหน้าหมอนวด", phone: "0811110001" },
    { name: "พี่ดำ สไตล์สุภาพ", phone: "0811110002" },
    { name: "น้องมิ้นท์ หมอนวดสระ", phone: "0811110003" },
    { name: "พี่เบิร์ด ทำสี", phone: "0811110004" },
    { name: "น้องเฟิร์น ตัดเด็ก", phone: "0811110005" },
  ];

  const stylists = await Promise.all(
    stylistDefs.map((s, i) =>
      tx.massageTherapist.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: s.name,
          phone: s.phone,
          photoUrl: trialPhoto(`massage-trial-stylist-${i}`, 280, 280),
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
      tx.massageCustomer.create({
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
      return tx.massageCustomerSubscription.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: customer.id,
          packageId: pkg.id,
          soldByTherapistId: stylist.id,
          remainingSessions: remaining,
          status: st,
          saleReceiptImageUrl: withSlip ? trialPhoto(`massage-trial-sale-slip-${i}`, 480, 640) : null,
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
        return tx.massageServiceLog.create({
          data: {
            ownerUserId,
            trialSessionId,
            subscriptionId: sub.id,
            massageCustomerId: customer.id,
            visitType: "PACKAGE_USE",
            therapistId: stylist.id,
            note: "หักแพ็ก — ทดลอง",
            createdAt: new Date(now - (i + 1) * day),
          },
        });
      }
      return tx.massageServiceLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          subscriptionId: null,
          massageCustomerId: customer.id,
          visitType: "CASH_WALK_IN",
          therapistId: stylist.id,
          amountBaht: 180 + i * 20,
          receiptImageUrl: trialPhoto(`massage-trial-cash-slip-${i}`, 480, 640),
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
      return tx.massageBooking.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: customer.id,
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
      tx.massageCostCategory.create({
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
      return tx.massageCostEntry.create({
        data: {
          ownerUserId,
          trialSessionId,
          categoryId: cat.id,
          spentAt: new Date(now - (i + 3) * day),
          amount: 450 + i * 120,
          itemLabel,
          note: "รายการตัวอย่างโหมดทดลอง",
          slipPhotoUrl: trialPhoto(`massage-trial-cost-slip-${i}`, 480, 640),
        },
      });
    }),
  );
}

/** ลบชุดข้อมูลร้านนวดใน scope — ใช้ก่อน seed prod ใหม่เมื่อมีโปรไฟล์เปล่า */
async function deleteMassageScopeRows(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.massageServiceLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageBooking.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCustomerSubscription.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massagePortalStaffPing.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCustomer.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massagePackage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageTherapist.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCostEntry.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCostCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageDaySchedule.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

/**
 * ข้อมูลตัวอย่าง prod — ดูจากแพ็กเกจ (ไม่ใช้แค่โปรไฟล์ เพราะโปรไฟล์เปล่าจะทำให้ข้าม seed ผิด)
 */
export async function seedMassageProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const pkgCount = await db.massagePackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (pkgCount > 0) return;

  await db.$transaction(async (tx) => {
    await deleteMassageScopeRows(tx, ownerUserId, TRIAL_PROD_SCOPE);
    await seedMassageTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE);
  });
}

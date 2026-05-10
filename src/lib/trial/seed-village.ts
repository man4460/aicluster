import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export async function seedVillageTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.villageProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "หมู่บ้านตัวอย่าง (ทดลอง)",
      address: "ถนนตัวอย่าง — ชุดทดลอง",
      contactPhone: "021234567",
      promptPayPhone: "0812345678",
      defaultMonthlyFee: 950,
      dueDayOfMonth: 7,
      paymentChannelsNote: "โอนผ่านธนาคาร/พร้อมเพย์ แล้วแนบสลิปในระบบ",
    },
  });

  const h1 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "12/34",
      plotLabel: "A",
      ownerName: "นายสมชาย ใจดี",
      phone: "0811112222",
      monthlyFeeOverride: 900,
      sortOrder: 0,
      isActive: true,
    },
  });

  const h2 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "56/78",
      plotLabel: "B",
      ownerName: "นางสาวสมหญิง รักสงบ",
      phone: "0893334444",
      monthlyFeeOverride: 1000,
      sortOrder: 1,
      isActive: true,
    },
  });

  const h3 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "88/12",
      plotLabel: "C",
      ownerName: "ครอบครัวศรีสุข",
      phone: "0865557777",
      feeCycle: "SEMI_ANNUAL",
      sortOrder: 2,
      isActive: true,
    },
  });

  const h4 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "99/3",
      plotLabel: "D",
      ownerName: "นายประสิทธิ์ มั่นคง",
      phone: "0801010101",
      feeCycle: "ANNUAL",
      sortOrder: 3,
      isActive: true,
    },
  });

  await tx.villageResident.createMany({
    data: [
      { houseId: h1.id, name: "นายสมชาย ใจดี", phone: "0811112222", isPrimary: true, isActive: true },
      { houseId: h1.id, name: "เด็กตัวอย่าง", note: "ลูก", isPrimary: false, isActive: true },
      { houseId: h2.id, name: "นางสาวสมหญิง รักสงบ", phone: "0893334444", isPrimary: true, isActive: true },
      { houseId: h2.id, name: "นายวิชัย รักสงบ", note: "ผู้พักอาศัย", isPrimary: false, isActive: true },
      { houseId: h3.id, name: "นางสาวสุรีย์ ศรีสุข", phone: "0865557777", isPrimary: true, isActive: true },
      { houseId: h4.id, name: "นายประสิทธิ์ มั่นคง", phone: "0801010101", isPrimary: true, isActive: true },
    ],
  });

  const ym = bangkokMonthKey();
  const d = new Date(`${ym}-01T00:00:00+07:00`);
  const prevMonth = new Date(d.getTime());
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevYm = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

  await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h1.id,
      yearMonth: prevYm,
      amountDue: 900,
      amountPaid: 900,
      status: "PAID",
      note: "ชำระตรงเวลา",
      paidAt: new Date(`${prevYm}-05T19:00:00+07:00`),
    },
  });
  const feePrevH2 = await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h2.id,
      yearMonth: prevYm,
      amountDue: 1000,
      amountPaid: 500,
      status: "PARTIAL",
      note: "ทยอยจ่าย",
      paidAt: new Date(`${prevYm}-08T20:10:00+07:00`),
    },
  });

  const feeNowH1 = await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h1.id,
      yearMonth: ym,
      amountDue: 900,
      amountPaid: 900,
      status: "PAID",
      note: "โอนพร้อมเพย์",
      paidAt: new Date(`${ym}-03T20:30:00+07:00`),
    },
  });
  const feeNowH2 = await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h2.id,
      yearMonth: ym,
      amountDue: 1000,
      amountPaid: 0,
      status: "PENDING",
    },
  });
  await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h3.id,
      yearMonth: ym,
      amountDue: 5700,
      amountPaid: 5700,
      status: "PAID",
      note: "งวดครึ่งปี",
      paidAt: new Date(`${ym}-02T09:00:00+07:00`),
    },
  });
  await tx.villageCommonFeeRow.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseId: h4.id,
      yearMonth: ym,
      amountDue: 11400,
      amountPaid: 0,
      status: "PENDING",
    },
  });

  await tx.villageSlipSubmission.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        houseId: h1.id,
        feeRowId: feeNowH1.id,
        yearMonth: ym,
        amount: 900,
        slipImageUrl: "/uploads/mock/village-slip-paid-h1.jpg",
        status: "APPROVED",
        reviewerNote: "ยอดตรงบิล",
        submittedAt: new Date(`${ym}-03T20:05:00+07:00`),
        reviewedAt: new Date(`${ym}-03T20:35:00+07:00`),
      },
      {
        ownerUserId,
        trialSessionId,
        houseId: h2.id,
        feeRowId: feeNowH2.id,
        yearMonth: ym,
        amount: 500,
        slipImageUrl: "/uploads/mock/village-slip-pending-h2.jpg",
        status: "PENDING",
        submittedAt: new Date(`${ym}-05T18:20:00+07:00`),
      },
      {
        ownerUserId,
        trialSessionId,
        houseId: h2.id,
        feeRowId: feePrevH2.id,
        yearMonth: prevYm,
        amount: 500,
        slipImageUrl: "/uploads/mock/village-slip-prev-h2.jpg",
        status: "APPROVED",
        reviewerNote: "ปิดยอดเดือนก่อน",
        submittedAt: new Date(`${prevYm}-09T10:00:00+07:00`),
        reviewedAt: new Date(`${prevYm}-09T14:15:00+07:00`),
      },
    ],
  });

  const catSecurity = await tx.villageCostCategory.create({
    data: { ownerUserId, trialSessionId, name: "รปภ." },
  });
  const catUtility = await tx.villageCostCategory.create({
    data: { ownerUserId, trialSessionId, name: "สาธารณูปโภค" },
  });
  const catMaintain = await tx.villageCostCategory.create({
    data: { ownerUserId, trialSessionId, name: "ซ่อมบำรุง" },
  });

  await tx.villageCostEntry.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        categoryId: catSecurity.id,
        spentAt: new Date(`${ym}-01T09:00:00+07:00`),
        amount: 25000,
        itemLabel: "ค่าจ้าง รปภ.",
        note: "ค่าจ้างประจำเดือน",
      },
      {
        ownerUserId,
        trialSessionId,
        categoryId: catUtility.id,
        spentAt: new Date(`${ym}-04T13:00:00+07:00`),
        amount: 8200,
        itemLabel: "ค่าไฟพื้นที่ส่วนกลาง",
        note: "บิลไฟเดือนล่าสุด",
      },
      {
        ownerUserId,
        trialSessionId,
        categoryId: catMaintain.id,
        spentAt: new Date(`${ym}-06T15:20:00+07:00`),
        amount: 5600,
        itemLabel: "ซ่อมปั๊มน้ำ",
        note: "ซ่อมฉุกเฉิน",
      },
      {
        ownerUserId,
        trialSessionId,
        categoryId: catUtility.id,
        spentAt: new Date(`${prevYm}-28T12:10:00+07:00`),
        amount: 4200,
        itemLabel: "ค่าน้ำส่วนกลาง",
        note: "รอบเดือนก่อนหน้า",
      },
    ],
  });
}

export async function seedVillageProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const existing = await db.villageProfile.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (existing) return;
  await db.$transaction((tx) => seedVillageTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE));
}

import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** ข้อมูลตัวอย่างหอพัก — ให้ UX ใกล้เคียงของจริง */
export async function seedDormitoryTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  await tx.dormitoryProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "หอพักตัวอย่าง (ทดลอง)",
      defaultPaperSize: "SLIP_58",
      promptPayPhone: null,
      paymentChannelsNote: "โอนธนาคาร — ชุดทดลอง",
    },
  });

  const roomA = await tx.room.create({
    data: {
      ownerUserId,
      trialSessionId,
      roomNumber: "101",
      floor: 1,
      roomType: "พัดลม",
      maxOccupants: 2,
      basePrice: 3500,
      status: "OCCUPIED",
    },
  });

  const roomB = await tx.room.create({
    data: {
      ownerUserId,
      trialSessionId,
      roomNumber: "102",
      floor: 1,
      roomType: "แอร์",
      maxOccupants: 1,
      basePrice: 4500,
      status: "AVAILABLE",
    },
  });

  const tenant = await tx.tenant.create({
    data: {
      roomId: roomA.id,
      name: "สมชาย ใจดี",
      phone: "0812345678",
      idCard: "1103700123456",
      status: "ACTIVE",
      checkInDate: new Date(y, m - 1, 1),
    },
  });

  const bill = await tx.utilityBill.create({
    data: {
      roomId: roomA.id,
      billingMonth: m,
      billingYear: y,
      waterMeterPrev: 100,
      waterMeterCurr: 108,
      electricMeterPrev: 1200,
      electricMeterCurr: 1350,
      waterPrice: 18,
      electricPrice: 8,
      fixedFees: [{ label: "ค่าส่วนกลาง", amount: 200 }],
      totalRoomAmount: 4200,
    },
  });

  await tx.splitBillPayment.create({
    data: {
      tenantId: tenant.id,
      billId: bill.id,
      amountToPay: 2100,
      paymentStatus: "PENDING",
    },
  });
}

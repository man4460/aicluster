import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** ข้อมูลตัวอย่างร้านตัดผม */
export async function seedBarberTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.barberShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "ร้านตัดผมตัวอย่าง (ทดลอง)",
      contactPhone: "0890000000",
    },
  });

  const pkg = await tx.barberPackage.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "ตัด 10 ครั้ง",
      price: 1200,
      totalSessions: 10,
    },
  });

  const stylist = await tx.barberStylist.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "ช่างตัวอย่าง",
      phone: "0821112222",
      isActive: true,
    },
  });

  const customer = await tx.barberCustomer.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone: "0898887777",
      name: "คุณลูกค้าตัวอย่าง",
    },
  });

  const sub = await tx.barberCustomerSubscription.create({
    data: {
      ownerUserId,
      trialSessionId,
      barberCustomerId: customer.id,
      packageId: pkg.id,
      soldByStylistId: stylist.id,
      remainingSessions: 7,
      status: "ACTIVE",
    },
  });

  await tx.barberServiceLog.create({
    data: {
      ownerUserId,
      trialSessionId,
      subscriptionId: sub.id,
      barberCustomerId: customer.id,
      visitType: "PACKAGE_USE",
      stylistId: stylist.id,
    },
  });

  await tx.barberBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      barberCustomerId: customer.id,
      phone: customer.phone,
      customerName: customer.name,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
    },
  });
}

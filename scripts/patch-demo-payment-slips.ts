/**
 * บังคับอัปเดต URL สลิปตัวอย่างใน DB ของ user demo ให้ชี้ DEMO_PAYMENT_SLIP_URL
 */
import { prisma } from "@/lib/prisma";
import { DEMO_PAYMENT_SLIP_URL } from "@/lib/trial/demo-module-settings";
import { seedVillageProdDemoForOwner } from "@/lib/trial/seed-village";
import { seedHomeFinanceProdDemoForOwner } from "@/lib/trial/seed-home-finance";
import { seedBarberProdDemoForOwner } from "@/lib/trial/seed-barber";
import { seedMassageProdDemoForOwner } from "@/lib/trial/seed-massage";
import { seedHotelResortProdDemoForOwner } from "@/lib/trial/seed-hotel-resort";
import { seedBuildingPosProdDemoForOwner } from "@/lib/trial/seed-building-pos";
import { seedEcommerceStoreProdDemoForOwner } from "@/lib/trial/seed-ecommerce-store";
import { seedFootballTurfProdDemoForOwner } from "@/lib/trial/seed-football-turf";
import { seedParkingProdDemoForOwner } from "@/lib/trial/seed-parking";
import { seedDrinkPosProdDemoForOwner } from "@/lib/trial/seed-drink-pos";
import { seedClubEventProdDemoForOwner } from "@/lib/trial/seed-club-event";
import { seedCarWashProdDemoForOwner } from "@/lib/trial/seed-car-wash";
import { seedLaundryProdDemoForOwner } from "@/lib/trial/seed-mqtt-laundry";
import { seedAppointmentQueueProdDemoForOwner } from "@/lib/trial/seed-appointment-queue";

const DEMO_EMAILS = ["user@mawell.local", "user@mawell.local.com"] as const;
const S = DEMO_PAYMENT_SLIP_URL;

async function patchAllSlips(ownerUserId: string) {
  const counts: Record<string, number> = {};

  const bump = (key: string, n: number) => {
    counts[key] = n;
  };

  bump(
    "homeFinance",
    (
      await prisma.homeFinanceEntry.updateMany({
        where: { ownerUserId, slipImageUrl: { not: null } },
        data: { slipImageUrl: S },
      })
    ).count,
  );
  bump(
    "village",
    (
      await prisma.villageSlipSubmission.updateMany({
        where: { ownerUserId },
        data: { slipImageUrl: S },
      })
    ).count,
  );
  bump(
    "barberSale",
    (
      await prisma.barberCustomerSubscription.updateMany({
        where: { ownerUserId, NOT: { saleReceiptImageUrl: null } },
        data: { saleReceiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "barberReceipt",
    (
      await prisma.barberServiceLog.updateMany({
        where: { ownerUserId, NOT: { receiptImageUrl: null } },
        data: { receiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "barberCost",
    (await prisma.barberCostEntry.updateMany({ where: { ownerUserId }, data: { slipPhotoUrl: S } })).count,
  );
  bump(
    "massageSale",
    (
      await prisma.massageCustomerSubscription.updateMany({
        where: { ownerUserId, NOT: { saleReceiptImageUrl: null } },
        data: { saleReceiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "massageReceipt",
    (
      await prisma.massageServiceLog.updateMany({
        where: { ownerUserId, NOT: { receiptImageUrl: null } },
        data: { receiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "massageCost",
    (await prisma.massageCostEntry.updateMany({ where: { ownerUserId }, data: { slipPhotoUrl: S } })).count,
  );
  bump(
    "hotel",
    (
      await prisma.hotelResortBooking.updateMany({
        where: {
          ownerUserId,
          paymentMethod: { in: ["PROMPTPAY", "TRANSFER"] },
        },
        data: { paymentSlipUrl: S, depositSlipUrl: S },
      })
    ).count,
  );
  bump(
    "footballBook",
    (
      await prisma.footballTurfBooking.updateMany({
        where: { ownerUserId, paymentMethod: "TRANSFER" },
        data: { paymentSlipDataUrl: S },
      })
    ).count,
  );
  bump(
    "footballPromo",
    (
      await prisma.footballTurfPromotionSale.updateMany({
        where: { ownerUserId, paymentMethod: "TRANSFER" },
        data: { paymentSlipDataUrl: S },
      })
    ).count,
  );
  bump(
    "buildingPo",
    (
      await prisma.buildingPosPurchaseOrder.updateMany({
        where: { ownerUserId },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "buildingOrder",
    (
      await prisma.buildingPosOrder.updateMany({
        where: { ownerUserId, status: "PAID" },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "buildingRsv",
    (
      await prisma.buildingPosReservation.updateMany({
        where: { ownerUserId, paymentMethod: { in: ["PROMPTPAY", "TRANSFER"] } },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "parkingCost",
    (
      await prisma.parkingCostEntry.updateMany({
        where: { ownerUserId },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "parkingBook",
    (
      await prisma.parkingBooking.updateMany({
        where: { ownerUserId, paymentMethod: "PROMPTPAY" },
        data: { paymentSlipUrl: S, depositSlipUrl: S },
      })
    ).count,
  );

  const sites = await prisma.parkingSite.findMany({
    where: { ownerUserId },
    select: { id: true },
  });
  let parkingSess = 0;
  for (const site of sites) {
    const spots = await prisma.parkingSpot.findMany({ where: { siteId: site.id }, select: { id: true } });
    if (spots.length === 0) continue;
    parkingSess += (
      await prisma.parkingSession.updateMany({
        where: { spotId: { in: spots.map((x) => x.id) }, paymentMethod: "PROMPTPAY" },
        data: { paymentSlipUrl: S },
      })
    ).count;
  }
  bump("parkingSess", parkingSess);

  bump(
    "drinkSale",
    (
      await prisma.drinkPosSale.updateMany({
        where: { ownerUserId, paymentMethod: "PROMPTPAY" },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "drinkCost",
    (
      await prisma.drinkPosCostEntry.updateMany({
        where: { ownerUserId },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "drinkRsv",
    (
      await prisma.drinkPosReservation.updateMany({
        where: { ownerUserId, paymentMethod: "PROMPTPAY" },
        data: { paymentSlipUrl: S },
      })
    ).count,
  );
  bump(
    "carWashCost",
    (await prisma.carWashCostEntry.updateMany({ where: { ownerUserId }, data: { slipPhotoUrl: S } })).count,
  );
  bump(
    "laundryCost",
    (await prisma.laundryCostEntry.updateMany({ where: { ownerUserId }, data: { slipPhotoUrl: S } })).count,
  );
  bump(
    "laundryOrder",
    (
      await prisma.laundryOrder.updateMany({
        where: { ownerUserId, paymentMethod: { in: ["PROMPTPAY", "TRANSFER"] } },
        data: { receiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "laundrySub",
    (
      await prisma.laundryCustomerSubscription.updateMany({
        where: { ownerUserId },
        data: { saleReceiptImageUrl: S },
      })
    ).count,
  );
  bump(
    "clubFinance",
    (
      await prisma.clubEventFinanceTransaction.updateMany({
        where: { ownerUserId, NOT: { slipUrl: null } },
        data: { slipUrl: S },
      })
    ).count,
  );
  bump(
    "clubSub",
    (
      await prisma.clubEventLinkSubmission.updateMany({
        where: { ownerUserId, NOT: { slipUrl: null } },
        data: { slipUrl: S },
      })
    ).count,
  );
  bump(
    "clubDues",
    (
      await prisma.clubEventDuesPayment.updateMany({
        where: { ownerUserId, NOT: { slipUrl: null } },
        data: { slipUrl: S },
      })
    ).count,
  );
  bump(
    "appt",
    (
      await prisma.appointmentQueueBooking.updateMany({
        where: { ownerUserId, NOT: { depositAmountBaht: null } },
        data: { depositSlipUrl: S },
      })
    ).count,
  );

  const stores = await prisma.ecommerceStore.findMany({
    where: { ownerUserId },
    select: { id: true },
  });
  let ecom = 0;
  for (const store of stores) {
    ecom += (
      await prisma.ecommerceOrder.updateMany({
        where: { storeId: store.id, NOT: { paymentSlipUrl: null } },
        data: { paymentSlipUrl: S },
      })
    ).count;
  }
  ecom += (
    await prisma.ecommerceCostEntry.updateMany({
      where: { ownerUserId, NOT: { paymentSlipUrl: null } },
      data: { paymentSlipUrl: S },
    })
  ).count;
  bump("ecom", ecom);

  return counts;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] } },
    select: { id: true, email: true },
  });

  for (const u of users) {
    console.log("— refresh demo", u.email);
    await seedHomeFinanceProdDemoForOwner(prisma, u.id);
    await seedBarberProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedMassageProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedHotelResortProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedBuildingPosProdDemoForOwner(prisma, u.id);
    await seedEcommerceStoreProdDemoForOwner(prisma, u.id);
    await seedFootballTurfProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedParkingProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedDrinkPosProdDemoForOwner(prisma, u.id);
    await seedClubEventProdDemoForOwner(prisma, u.id);
    await seedCarWashProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedLaundryProdDemoForOwner(prisma, u.id);
    await seedAppointmentQueueProdDemoForOwner(prisma, u.id, { refreshDaily: true });
    await seedVillageProdDemoForOwner(prisma, u.id);

    const patched = await patchAllSlips(u.id);
    const nonzero = Object.fromEntries(Object.entries(patched).filter(([, n]) => n > 0));
    console.log("patched", u.email, nonzero);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

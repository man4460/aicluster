/**
 * คัดลอกไฟล์สลิปตัวอย่างไปบัคเก็ตของแต่ละโมดูล + อัปเดต URL ใน DB ของ user demo
 * (home-finance ต้องใช้ /uploads/home-finance/… และอัปเดต attachmentUrls ด้วย)
 */
import { prisma } from "../src/lib/prisma";
import {
  DEMO_BARBER_SLIP_URL,
  DEMO_CLUB_EVENT_SLIP_URL,
  DEMO_ECOMMERCE_SLIP_URL,
  DEMO_HOME_FINANCE_SLIP_URL,
  DEMO_LAUNDRY_SLIP_URL,
  DEMO_MASSAGE_SLIP_URL,
  DEMO_PAYMENT_SLIP_URL,
  DEMO_VILLAGE_SLIP_URL,
} from "../src/lib/trial/demo-module-settings";
import { ensureDemoPaymentSlipFiles } from "../src/lib/trial/demo-payment-slip";

const DEMO_EMAILS = ["user@mawell.local", "user@mawell.local.com"] as const;
const S = DEMO_PAYMENT_SLIP_URL;
const HF = DEMO_HOME_FINANCE_SLIP_URL;
const VILLAGE = DEMO_VILLAGE_SLIP_URL;
const BARBER = DEMO_BARBER_SLIP_URL;
const MASSAGE = DEMO_MASSAGE_SLIP_URL;
const ECOM = DEMO_ECOMMERCE_SLIP_URL;
const LAUNDRY = DEMO_LAUNDRY_SLIP_URL;
const CLUB = DEMO_CLUB_EVENT_SLIP_URL;

async function patchAllSlips(ownerUserId: string) {
  const counts: Record<string, number> = {};
  const bump = (key: string, n: number) => {
    counts[key] = n;
  };

  const hfRows = await prisma.homeFinanceEntry.findMany({
    where: { ownerUserId, slipImageUrl: { not: null } },
    select: { id: true },
  });
  let hf = 0;
  for (const row of hfRows) {
    await prisma.homeFinanceEntry.update({
      where: { id: row.id },
      data: { slipImageUrl: HF, attachmentUrls: [HF] },
    });
    hf += 1;
  }
  bump("homeFinance", hf);

  bump(
    "homeFinanceDocs",
    (
      await prisma.homeFinancePersonalDocument.updateMany({
        where: { ownerUserId, fileUrl: { startsWith: "/uploads/" } },
        data: { fileUrl: HF },
      })
    ).count,
  );

  bump(
    "village",
    (
      await prisma.villageSlipSubmission.updateMany({
        where: { ownerUserId },
        data: { slipImageUrl: VILLAGE },
      })
    ).count,
  );
  bump(
    "barberSale",
    (
      await prisma.barberCustomerSubscription.updateMany({
        where: { ownerUserId, NOT: { saleReceiptImageUrl: null } },
        data: { saleReceiptImageUrl: BARBER },
      })
    ).count,
  );
  bump(
    "barberReceipt",
    (
      await prisma.barberServiceLog.updateMany({
        where: { ownerUserId, NOT: { receiptImageUrl: null } },
        data: { receiptImageUrl: BARBER },
      })
    ).count,
  );
  bump(
    "barberCost",
    (
      await prisma.barberCostEntry.updateMany({
        where: { ownerUserId },
        data: { slipPhotoUrl: BARBER },
      })
    ).count,
  );
  bump(
    "massageSale",
    (
      await prisma.massageCustomerSubscription.updateMany({
        where: { ownerUserId, NOT: { saleReceiptImageUrl: null } },
        data: { saleReceiptImageUrl: MASSAGE },
      })
    ).count,
  );
  bump(
    "massageReceipt",
    (
      await prisma.massageServiceLog.updateMany({
        where: { ownerUserId, NOT: { receiptImageUrl: null } },
        data: { receiptImageUrl: MASSAGE },
      })
    ).count,
  );
  bump(
    "massageCost",
    (
      await prisma.massageCostEntry.updateMany({
        where: { ownerUserId },
        data: { slipPhotoUrl: MASSAGE },
      })
    ).count,
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
    const spots = await prisma.parkingSpot.findMany({
      where: { siteId: site.id },
      select: { id: true },
    });
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
    (
      await prisma.carWashCostEntry.updateMany({
        where: { ownerUserId },
        data: { slipPhotoUrl: S },
      })
    ).count,
  );
  bump(
    "laundryCost",
    (
      await prisma.laundryCostEntry.updateMany({
        where: { ownerUserId },
        data: { slipPhotoUrl: LAUNDRY },
      })
    ).count,
  );
  bump(
    "laundryOrder",
    (
      await prisma.laundryOrder.updateMany({
        where: { ownerUserId, paymentMethod: { in: ["PROMPTPAY", "TRANSFER"] } },
        data: { receiptImageUrl: LAUNDRY },
      })
    ).count,
  );
  bump(
    "laundrySub",
    (
      await prisma.laundryCustomerSubscription.updateMany({
        where: { ownerUserId },
        data: { saleReceiptImageUrl: LAUNDRY },
      })
    ).count,
  );
  bump(
    "clubFinance",
    (
      await prisma.clubEventFinanceTransaction.updateMany({
        where: { ownerUserId, NOT: { slipUrl: null } },
        data: { slipUrl: CLUB },
      })
    ).count,
  );
  bump(
    "clubSub",
    (
      await prisma.clubEventLinkSubmission.updateMany({
        where: { ownerUserId, NOT: { slipUrl: null } },
        data: { slipUrl: CLUB },
      })
    ).count,
  );
  bump(
    "clubDues",
    (
      await prisma.clubEventDuesPayment.updateMany({
        where: { ownerUserId },
        data: { slipUrl: CLUB },
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
        data: { paymentSlipUrl: ECOM },
      })
    ).count;
  }
  ecom += (
    await prisma.ecommerceCostEntry.updateMany({
      where: { ownerUserId, NOT: { paymentSlipUrl: null } },
      data: { paymentSlipUrl: ECOM },
    })
  ).count;
  bump("ecom", ecom);

  return counts;
}

async function main() {
  await ensureDemoPaymentSlipFiles();
  console.log("demo slip files ready");

  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] } },
    select: { id: true, email: true },
  });

  for (const u of users) {
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

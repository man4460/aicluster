import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

type Row = {
  id: number;
  ownerUserId: string;
  trialSessionId: string;
  courtId: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  paymentStatus: string;
  amountPaidBaht: number;
  paymentSlipDataUrl: string | null;
  paymentReference: string;
  status: string;
  finalPrice: number;
};

function dateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const rows = (await prisma.footballTurfBooking.findMany({
    where: { status: { not: "CANCELLED" } },
    select: {
      id: true,
      ownerUserId: true,
      trialSessionId: true,
      courtId: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      paymentStatus: true,
      amountPaidBaht: true,
      paymentSlipDataUrl: true,
      paymentReference: true,
      status: true,
      finalPrice: true,
    },
    orderBy: { id: "asc" },
  })) as Row[];

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = [
      row.ownerUserId,
      row.trialSessionId,
      row.courtId,
      dateKey(row.bookingDate),
      row.startTime,
      row.endTime,
    ].join("|");
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const dupGroups = [...groups.entries()].filter(([, list]) => list.length > 1);
  if (dupGroups.length === 0) {
    console.log("ไม่พบการจองซ้ำแล้ว");
    return;
  }

  console.log(`พบกลุ่มซ้ำ ${dupGroups.length} กลุ่ม`);
  let deleted = 0;

  const payRank: Record<string, number> = { PAID: 4, PENDING_REVIEW: 3, PARTIAL: 2, UNPAID: 1 };
  const bookingRank: Record<string, number> = {
    PLAYING: 4,
    CHECKED_IN: 3,
    BOOKED: 2,
    COMPLETED: 1,
    CANCELLED: 0,
  };

  for (const [key, list] of dupGroups) {
    const keep = list[0]!;
    const removeIds = list.slice(1).map((r) => r.id);

    const bestPaid = list.reduce((max, r) => Math.max(max, r.amountPaidBaht ?? 0), 0);
    const bestSlip =
      list.find((r) => (r.paymentSlipDataUrl ?? "").trim())?.paymentSlipDataUrl ?? keep.paymentSlipDataUrl;
    const bestRef =
      list.find((r) => (r.paymentReference ?? "").trim())?.paymentReference ?? keep.paymentReference;
    const bestPayStatus = list.reduce((best, r) => {
      const a = payRank[best] ?? 0;
      const b = payRank[r.paymentStatus] ?? 0;
      return b > a ? r.paymentStatus : best;
    }, keep.paymentStatus);
    const bestBookingStatus = list.reduce((best, r) => {
      const a = bookingRank[best] ?? -1;
      const b = bookingRank[r.status] ?? -1;
      return b > a ? r.status : best;
    }, keep.status);

    await prisma.footballTurfBooking.update({
      where: { id: keep.id },
      data: {
        amountPaidBaht:
          bestPayStatus === "PAID" && bestPaid <= 0
            ? keep.finalPrice
            : Math.max(bestPaid, keep.amountPaidBaht ?? 0),
        paymentStatus: bestPayStatus,
        paymentSlipDataUrl: bestSlip,
        paymentReference: bestRef,
        status: bestBookingStatus,
      },
    });

    // ลบทีละชุดเพื่อกัน payload ใหญ่เกิน
    const chunkSize = 200;
    for (let i = 0; i < removeIds.length; i += chunkSize) {
      const chunk = removeIds.slice(i, i + chunkSize);
      const result = await prisma.footballTurfBooking.deleteMany({
        where: { id: { in: chunk } },
      });
      deleted += result.count;
    }

    console.log(
      `เก็บ id=${keep.id} ลบ ${removeIds.length} แถว · ${keep.startTime}-${keep.endTime} · court=${keep.courtId} · key=${key}`,
    );
  }

  console.log(`ลบซ้ำทั้งหมด ${deleted} แถว`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

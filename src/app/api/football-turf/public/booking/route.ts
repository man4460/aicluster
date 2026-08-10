import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { mapBooking } from "@/systems/football-turf/lib/mappers";
import { footballTurfBookingAmountPaidBaht } from "@/systems/football-turf/lib/portal-booking";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function phoneMatches(bookingPhoneRaw: string, phone: string): boolean {
  const bookingPhone = normalizePhone(bookingPhoneRaw);
  return (
    bookingPhone === phone ||
    bookingPhone.endsWith(phone) ||
    phone.endsWith(bookingPhone.slice(-9))
  );
}

function bookingLabels(booking: ReturnType<typeof mapBooking>) {
  const paid = footballTurfBookingAmountPaidBaht(booking);
  const remaining = Math.max(0, booking.finalPrice - paid);
  return {
    ...booking,
    amountPaidBaht: paid,
    remainingBaht: remaining,
    paymentStatusLabel:
      booking.paymentStatus === "PAID"
        ? "ชำระแล้ว"
        : booking.paymentStatus === "PARTIAL"
          ? "ชำระบางส่วน"
          : booking.paymentStatus === "PENDING_REVIEW"
            ? booking.depositAmountBaht != null &&
                booking.depositAmountBaht > 0 &&
                booking.depositAmountBaht < booking.finalPrice
              ? "รอตรวจมัดจำ"
              : "รอตรวจสลิป"
            : "ยังไม่ชำระ",
    paymentMethodLabel:
      booking.paymentMethod === "PROMPTPAY"
        ? "พร้อมเพย์"
        : booking.paymentMethod === "TRANSFER"
          ? "โอนเงิน"
          : booking.paymentMethod === "ONSITE"
            ? "ชำระหน้าสนาม"
            : "ยังไม่ระบุ",
    statusLabel:
      booking.status === "CHECKED_IN"
        ? "เช็กอินแล้ว"
        : booking.status === "PLAYING"
          ? "กำลังใช้งาน"
          : booking.status === "COMPLETED"
            ? "เสร็จสิ้น"
            : booking.status === "CANCELLED"
              ? "ยกเลิก"
              : "จองแล้ว",
  };
}

/** รายละเอียดการจองสาธารณะ — พิสูจน์ด้วยเบอร์ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const bookingIdRaw = url.searchParams.get("bookingId")?.trim() ?? "";
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  const bookingId = Number(bookingIdRaw);
  const idsParam = url.searchParams.get("ids")?.trim() ?? "";
  const extraIds = idsParam
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (ownerId.length < 10 || !Number.isFinite(bookingId) || bookingId < 1 || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const open = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  const wantIds = [...new Set([bookingId, ...extraIds])];
  const rows = await prisma.footballTurfBooking.findMany({
    where: {
      id: { in: wantIds },
      ownerUserId: ownerId,
      trialSessionId,
      status: { not: "CANCELLED" },
    },
    include: { court: { select: { name: true } } },
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
  });
  if (!rows.length) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const allowed = rows.filter((row) => phoneMatches(row.customerPhone, phone));
  if (!allowed.length) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }

  const profile = await prisma.footballTurfShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId },
    },
    select: {
      venueName: true,
      contactPhone: true,
      venueAddress: true,
      contactLine: true,
    },
  });

  const bookings = allowed.map((row) => bookingLabels(mapBooking(row, row.court.name)));
  const primary = bookings.find((b) => b.id === bookingId) ?? bookings[0];
  const totalFinal = bookings.reduce((sum, b) => sum + b.finalPrice, 0);
  const totalPaid = bookings.reduce((sum, b) => sum + b.amountPaidBaht, 0);

  return NextResponse.json({
    property: {
      venueName: profile?.venueName ?? "สนามฟุตบอล",
      contactPhone: profile?.contactPhone ?? null,
      venueAddress: profile?.venueAddress ?? null,
      contactLine: profile?.contactLine ?? null,
    },
    booking: primary,
    bookings,
    summary: {
      slotCount: bookings.length,
      totalFinalBaht: totalFinal,
      totalPaidBaht: totalPaid,
      remainingBaht: Math.max(0, totalFinal - totalPaid),
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { mapBooking } from "@/systems/football-turf/lib/mappers";
import { footballTurfBookingAmountPaidBaht } from "@/systems/football-turf/lib/portal-booking";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** รายละเอียดการจองสาธารณะ — พิสูจน์ด้วยเบอร์ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const bookingIdRaw = url.searchParams.get("bookingId")?.trim() ?? "";
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  const bookingId = Number(bookingIdRaw);

  if (ownerId.length < 10 || !Number.isFinite(bookingId) || bookingId < 1 || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const open = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  const row = await prisma.footballTurfBooking.findFirst({
    where: {
      id: bookingId,
      ownerUserId: ownerId,
      trialSessionId,
      status: { not: "CANCELLED" },
    },
    include: { court: { select: { name: true } } },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const bookingPhone = normalizePhone(row.customerPhone);
  const phoneOk =
    bookingPhone === phone ||
    bookingPhone.endsWith(phone) ||
    phone.endsWith(bookingPhone.slice(-9));
  if (!phoneOk) {
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

  const booking = mapBooking(row, row.court.name);
  const paid = footballTurfBookingAmountPaidBaht(booking);
  const remaining = Math.max(0, booking.finalPrice - paid);

  return NextResponse.json({
    property: {
      venueName: profile?.venueName ?? "สนามฟุตบอล",
      contactPhone: profile?.contactPhone ?? null,
      venueAddress: profile?.venueAddress ?? null,
      contactLine: profile?.contactLine ?? null,
    },
    booking: {
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
        booking.paymentMethod === "TRANSFER"
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
    },
  });
}

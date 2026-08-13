import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { resolvePublicBarberTrialSessionId } from "@/lib/barber/public-trial-scope";
import { bangkokDateKey, formatBangkokTimeHm } from "@/lib/time/bangkok";
import { getQrBarberBranding } from "@/lib/profile/qr-branding";

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

function statusLabel(status: string): string {
  switch (status) {
    case "ARRIVED":
      return "มาถึงแล้ว";
    case "NO_SHOW":
      return "ไม่มาตามนัด";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return "จองแล้ว";
  }
}

function formatDateLabel(d: Date): string {
  try {
    return d.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return bangkokDateKey(d);
  }
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

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicBarberTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  const row = await prisma.barberBooking.findFirst({
    where: {
      id: bookingId,
      ownerUserId: ownerId,
      trialSessionId,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      phone: true,
      customerName: true,
      scheduledAt: true,
      durationMinutes: true,
      status: true,
      packagePrice: true,
      depositAmountBaht: true,
      amountPaidBaht: true,
      paymentMethod: true,
      paymentStatus: true,
      depositSlipUrl: true,
      paymentSlipUrl: true,
      stylist: { select: { name: true } },
      package: { select: { name: true, price: true } },
    },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
  if (!phoneMatches(row.phone, phone)) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }

  const [branding, profile] = await Promise.all([
    getQrBarberBranding(ownerId, trialSessionId),
    prisma.barberShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: {
        displayName: true,
        contactPhone: true,
        address: true,
        contactLine: true,
      },
    }),
  ]);

  const startHm = formatBangkokTimeHm(row.scheduledAt);
  const endDate = new Date(row.scheduledAt.getTime() + Math.max(15, row.durationMinutes) * 60_000);
  const endHm = formatBangkokTimeHm(endDate);
  const priceBaht =
    row.packagePrice > 0
      ? row.packagePrice
      : row.package?.price != null
        ? Number(row.package.price)
        : null;
  const amountPaid = row.amountPaidBaht ?? 0;
  const remainingBaht =
    priceBaht != null ? Math.max(0, Math.round(priceBaht) - Math.max(0, amountPaid)) : null;

  return NextResponse.json({
    shop: {
      displayName: profile?.displayName?.trim() || branding.label || "ร้านตัดผม",
      contactPhone: profile?.contactPhone?.trim() || null,
      address: profile?.address?.trim() || null,
      contactLine: profile?.contactLine?.trim() || null,
    },
    booking: {
      id: row.id,
      customerName: row.customerName?.trim() || "ลูกค้า",
      customerPhone: row.phone,
      packageName: row.package?.name?.trim() || "บริการ",
      stylistName: row.stylist?.name?.trim() || null,
      bookingDate: formatDateLabel(row.scheduledAt),
      bookingDateKey: bangkokDateKey(row.scheduledAt),
      startTime: startHm,
      endTime: endHm,
      durationMinutes: row.durationMinutes,
      priceBaht,
      amountPaidBaht: amountPaid,
      remainingBaht,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod,
      depositAmountBaht: row.depositAmountBaht,
      depositSlipUrl: row.depositSlipUrl?.trim() || null,
      paymentSlipUrl: row.paymentSlipUrl?.trim() || null,
      status: row.status,
      statusLabel: statusLabel(row.status),
    },
  });
}

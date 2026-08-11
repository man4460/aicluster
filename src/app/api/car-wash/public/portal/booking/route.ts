import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { bangkokDateKey, formatBangkokTimeHm } from "@/lib/time/bangkok";
import { getQrCarWashBranding } from "@/lib/profile/qr-branding";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { CAR_WASH_PORTAL_SAMPLE_CONTACT } from "@/systems/car-wash/lib/portal-media";

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
    case "IN_SERVICE":
      return "กำลังบริการ";
    case "COMPLETED":
      return "เสร็จสิ้น";
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

  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  const row = await prisma.carWashBooking.findFirst({
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
      plateNumber: true,
      packageId: true,
      packageName: true,
      scheduledAt: true,
      durationMinutes: true,
      status: true,
    },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
  if (!phoneMatches(row.phone, phone)) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }

  const [branding, paymentRow, pkg] = await Promise.all([
    getQrCarWashBranding(ownerId, trialSessionId),
    prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: {
          ownerUserId: ownerId,
          trialSessionId,
          moduleSlug: CAR_WASH_MODULE_SLUG,
        },
      },
      select: { displayName: true, contactPhone: true },
    }),
    row.packageId
      ? prisma.carWashPackage.findFirst({
          where: { id: row.packageId, ownerUserId: ownerId },
          select: { price: true },
        })
      : Promise.resolve(null),
  ]);

  const startHm = formatBangkokTimeHm(row.scheduledAt);
  const endDate = new Date(row.scheduledAt.getTime() + Math.max(15, row.durationMinutes) * 60_000);
  const endHm = formatBangkokTimeHm(endDate);
  const contact = CAR_WASH_PORTAL_SAMPLE_CONTACT;

  return NextResponse.json({
    shop: {
      displayName: branding.label || paymentRow?.displayName?.trim() || "คาร์แคร์",
      contactPhone: paymentRow?.contactPhone?.trim() || contact.contactPhone,
      address: contact.address,
      contactLine: contact.contactLine,
    },
    booking: {
      id: row.id,
      customerName: row.customerName?.trim() || "ลูกค้า",
      customerPhone: row.phone,
      plateNumber: row.plateNumber?.trim() || null,
      packageName: row.packageName?.trim() || "บริการ",
      bookingDate: formatDateLabel(row.scheduledAt),
      bookingDateKey: bangkokDateKey(row.scheduledAt),
      startTime: startHm,
      endTime: endHm,
      durationMinutes: row.durationMinutes,
      priceBaht: pkg?.price ?? null,
      status: row.status,
      statusLabel: statusLabel(row.status),
    },
  });
}

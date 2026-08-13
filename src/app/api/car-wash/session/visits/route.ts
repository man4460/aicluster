import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { normalizePhone } from "@/lib/car-wash/http";
import { carWashServiceStatusZod, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { resolveAndLinkCarWashVisitBooking } from "@/lib/car-wash/link-visit-to-booking";
import { computeCarWashVisitPayment } from "@/lib/car-wash/visit-lane-payment";
import {
  CAR_WASH_VISIT_EVIDENCE_MAX,
  normalizeCarWashVisitEvidenceUrls,
} from "@/systems/car-wash/lib/visit-media";
import { notifyCarWashLaneBoard } from "@/systems/car-wash/lib/lane-board-sse";

const visitBookingSelect = { paymentStatus: true, amountPaidBaht: true, packagePrice: true } as const;

function visitJson(row: {
  id: number;
  visitAt: Date;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  packageId: number | null;
  packageName: string;
  listedPrice: number;
  finalPrice: number;
  note: string;
  recordedByName: string;
  serviceStatus: string;
  photoUrl: string;
  evidencePhotoUrlsJson?: unknown;
  bundleId: number | null;
  bookingId?: number | null;
  booking?: { paymentStatus: string; amountPaidBaht: number; packagePrice: number } | null;
}) {
  const serviceStatus = normalizeCarWashServiceStatus(row.serviceStatus);
  const payment = computeCarWashVisitPayment({
    bundleId: row.bundleId ?? null,
    finalPrice: row.finalPrice,
    serviceStatus,
    booking: row.booking ?? null,
  });
  return {
    id: row.id,
    visit_at: row.visitAt.toISOString(),
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    plate_number: row.plateNumber,
    package_id: row.packageId,
    package_name: row.packageName,
    listed_price: row.listedPrice,
    final_price: row.finalPrice,
    note: row.note,
    recorded_by_name: row.recordedByName,
    service_status: serviceStatus,
    photo_url: row.photoUrl ?? "",
    evidence_photo_urls: normalizeCarWashVisitEvidenceUrls(row.evidencePhotoUrlsJson),
    bundle_id: row.bundleId ?? null,
    booking_id: row.bookingId ?? null,
    ...payment,
  };
}

const postSchema = z
  .object({
    customer_name: z.string().max(160),
    customer_phone: z.string().max(32),
    plate_number: z.string().max(64),
    package_id: z.number().int().positive().nullable(),
    package_name: z.string().min(1).max(160),
    listed_price: z.number().int().min(0).max(9_999_999),
    final_price: z.number().int().min(0).max(9_999_999),
    note: z.string().max(1000).optional().nullable(),
    recorded_by_name: z.string().max(160).optional().nullable(),
    visit_at: z.string().datetime().optional(),
    /** จากแดชบอร์ด: ค่าเริ่ม WASHING ให้ขึ้นลานทันที */
    service_status: carWashServiceStatusZod.optional(),
    photo_url: z.string().max(512).optional().nullable(),
    evidence_photo_urls: z.array(z.string().max(512)).max(CAR_WASH_VISIT_EVIDENCE_MAX).optional(),
    /** เหมาจ่าย: เก็บ id แพ็กไว้ — หักครั้งเมื่อสถานะเป็น PAID เท่านั้น */
    bundle_id: z.number().int().positive().optional().nullable(),
    /** ผูกคิวจอง (พอร์ทัล / เพิ่มคิว) — ว่างได้ ระบบจะจับคู่เบอร์/ทะเบียนวันนี้ */
    booking_id: z.number().int().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.bundle_id != null) return;
    const plate = data.plate_number.trim();
    const phone = normalizePhone(data.customer_phone);
    const hasPlate = plate.length > 0;
    const hasPhone = phone.length > 0;
    if (!hasPlate && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณากรอกเบอร์โทรหรือทะเบียนรถอย่างน้อยหนึ่งอย่าง",
        path: ["plate_number"],
      });
    }
    if (hasPhone && phone.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "เบอร์โทรต้องอย่างน้อย 9 หลัก",
        path: ["customer_phone"],
      });
    }
  });

export async function GET(req: Request) {
  try {
    const own = await getCarWashOwnerOrStaffContext(req);
    if (!own.ok) return own.res;
    const scope = { trialSessionId: own.trialSessionId };

    const rows = await prisma.carWashVisit.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { visitAt: "desc" },
      include: { booking: { select: visitBookingSelect } },
    });
    return NextResponse.json({
      visits: rows.map((r) => visitJson(r)),
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits GET");
  }
}

export async function POST(req: Request) {
  try {
    const own = await getCarWashOwnerOrStaffContext(req);
    if (!own.ok) return own.res;
    const scope = { trialSessionId: own.trialSessionId };

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    let phone = normalizePhone(parsed.data.customer_phone);
    let packageId = parsed.data.package_id ?? null;
    let packageName = parsed.data.package_name.trim();
    const serviceStatus = parsed.data.service_status ?? "WASHING";
    const requestedBundleId = parsed.data.bundle_id ?? null;

    const visitBase = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      visitAt: parsed.data.visit_at ? new Date(parsed.data.visit_at) : new Date(),
      customerName: parsed.data.customer_name.trim(),
      plateNumber: parsed.data.plate_number.trim(),
      listedPrice: parsed.data.listed_price,
      finalPrice: parsed.data.final_price,
      note: parsed.data.note?.trim() ?? "",
      recordedByName: parsed.data.recorded_by_name?.trim() || (own.isStaff ? own.recordedByName : ""),
      serviceStatus,
      photoUrl: parsed.data.photo_url?.trim() ?? "",
      evidencePhotoUrlsJson: normalizeCarWashVisitEvidenceUrls(parsed.data.evidence_photo_urls),
    };

    let row;
    if (requestedBundleId != null) {
      try {
        row = await prisma.$transaction(async (tx) => {
          const b = await tx.carWashBundle.findFirst({
            where: {
              id: requestedBundleId,
              ownerUserId: own.ownerId,
              trialSessionId: scope.trialSessionId,
            },
          });
          if (!b || !b.isActive || b.usedUses >= b.totalUses) {
            throw new Error("BUNDLE_INVALID");
          }
          const pkgId = b.packageId;
          const pkgNm = `เหมาจ่าย: ${b.packageName}`;
          const bundlePhone = normalizePhone(b.customerPhone);
          const paidNow = serviceStatus === "PAID";
          if (paidNow) {
            await tx.carWashBundle.update({
              where: { id: b.id },
              data: { usedUses: b.usedUses + 1 },
            });
          }
          return tx.carWashVisit.create({
            data: {
              ...visitBase,
              customerPhone: bundlePhone,
              packageId: pkgId,
              packageName: pkgNm,
              bundleId: paidNow ? null : requestedBundleId,
            },
          });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "BUNDLE_INVALID") {
          return NextResponse.json(
            { error: "แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว" },
            { status: 400 },
          );
        }
        throw e;
      }
    } else {
      row = await prisma.carWashVisit.create({
        data: {
          ...visitBase,
          customerPhone: phone,
          packageId,
          packageName,
          bundleId: null,
        },
      });
    }

    const linkedBookingId = await resolveAndLinkCarWashVisitBooking(prisma, {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      visitId: row.id,
      bookingId: parsed.data.booking_id ?? null,
      customerPhone: row.customerPhone,
      plateNumber: row.plateNumber,
      serviceStatus,
    });
    if (linkedBookingId != null) {
      const refreshed = await prisma.carWashVisit.findUnique({ where: { id: row.id } });
      if (refreshed) row = refreshed;
    }

    const bookingSnapshot =
      row.bookingId != null
        ? await prisma.carWashBooking.findUnique({
            where: { id: row.bookingId },
            select: visitBookingSelect,
          })
        : null;

    notifyCarWashLaneBoard(own.ownerId);

    return NextResponse.json({ visit: visitJson({ ...row, booking: bookingSnapshot }) });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits POST");
  }
}

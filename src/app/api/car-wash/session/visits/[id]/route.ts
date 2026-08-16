import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { normalizePhone } from "@/lib/car-wash/http";
import { carWashServiceStatusZod, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { carWashBookingTotalAmount, computeCarWashVisitPayment } from "@/lib/car-wash/visit-lane-payment";
import {
  CAR_WASH_VISIT_EVIDENCE_MAX,
  normalizeCarWashVisitEvidenceUrls,
} from "@/systems/car-wash/lib/visit-media";
import { notifyCarWashLaneBoard } from "@/systems/car-wash/lib/lane-board-sse";

const visitBookingSelect = { paymentStatus: true, amountPaidBaht: true, packagePrice: true } as const;

const visitPatchSchema = z
  .object({
    customer_name: z.string().min(1).max(160).optional(),
    customer_phone: z.string().max(32).optional(),
    plate_number: z.string().min(1).max(64).optional(),
    package_id: z.number().int().positive().nullable().optional(),
    package_name: z.string().min(1).max(160).optional(),
    listed_price: z.number().int().min(0).max(9_999_999).optional(),
    final_price: z.number().int().min(0).max(9_999_999).optional(),
    note: z.string().max(1000).optional().nullable(),
    recorded_by_name: z.string().max(160).optional().nullable(),
    visit_at: z.string().datetime().optional(),
    service_status: carWashServiceStatusZod.optional(),
    photo_url: z.string().max(512).optional().nullable(),
    evidence_photo_urls: z.array(z.string().max(512)).max(CAR_WASH_VISIT_EVIDENCE_MAX).optional(),
    signature_image_url: z.string().max(512).optional().nullable(),
  })
  .refine(
    (d) =>
      d.customer_name !== undefined ||
      d.customer_phone !== undefined ||
      d.plate_number !== undefined ||
      d.package_id !== undefined ||
      d.package_name !== undefined ||
      d.listed_price !== undefined ||
      d.final_price !== undefined ||
      d.note !== undefined ||
      d.recorded_by_name !== undefined ||
      d.visit_at !== undefined ||
      d.service_status !== undefined ||
      d.photo_url !== undefined ||
      d.evidence_photo_urls !== undefined ||
      d.signature_image_url !== undefined,
    { message: "ต้องส่งอย่างน้อยหนึ่งฟิลด์" },
  );

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
  signatureImageUrl?: string | null;
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
    signature_image_url: row.signatureImageUrl?.trim() || null,
    booking_id: row.bookingId ?? null,
    ...payment,
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const own = await getCarWashOwnerOrStaffContext(req);
    if (!own.ok) return own.res;
    const scope = { trialSessionId: own.trialSessionId };

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = visitPatchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.carWashVisit.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const d = parsed.data;
    const prevStatus = normalizeCarWashServiceStatus(row.serviceStatus);
    const nextStatus = d.service_status !== undefined ? d.service_status : prevStatus;
    const becomesPaid = nextStatus === "PAID" && prevStatus !== "PAID";

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        let clearBundleId = false;
        const signatureUrl =
          d.signature_image_url !== undefined
            ? d.signature_image_url?.trim() || null
            : row.signatureImageUrl?.trim() || null;

        if (becomesPaid && row.bundleId != null) {
          if (!signatureUrl) {
            throw new Error("SIGNATURE_REQUIRED");
          }
          const b = await tx.carWashBundle.findFirst({
            where: {
              id: row.bundleId,
              ownerUserId: own.ownerId,
              trialSessionId: scope.trialSessionId,
            },
          });
          if (!b || !b.isActive || b.usedUses >= b.totalUses) {
            throw new Error("BUNDLE_CONSUME_FAIL");
          }
          await tx.carWashBundle.update({
            where: { id: b.id },
            data: { usedUses: b.usedUses + 1 },
          });
          clearBundleId = true;
        }

        if (becomesPaid && row.bundleId == null && row.bookingId != null) {
          const booking = await tx.carWashBooking.findFirst({
            where: { id: row.bookingId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
          });
          if (booking) {
            const total = carWashBookingTotalAmount(
              {
                paymentStatus: booking.paymentStatus,
                amountPaidBaht: booking.amountPaidBaht,
                packagePrice: booking.packagePrice,
              },
              d.final_price !== undefined ? d.final_price : row.finalPrice,
            );
            const remaining = Math.max(0, total - booking.amountPaidBaht);
            if (remaining > 0) {
              await tx.carWashBooking.update({
                where: { id: booking.id },
                data: { amountPaidBaht: booking.amountPaidBaht + remaining, paymentStatus: "PAID" },
              });
            }
          }
        }

        return tx.carWashVisit.update({
          where: { id: row.id },
          data: {
            ...(d.customer_name !== undefined && { customerName: d.customer_name.trim() }),
            ...(d.customer_phone !== undefined && { customerPhone: normalizePhone(d.customer_phone) }),
            ...(d.plate_number !== undefined && { plateNumber: d.plate_number.trim() }),
            ...(d.package_id !== undefined && { packageId: d.package_id }),
            ...(d.package_name !== undefined && { packageName: d.package_name.trim() }),
            ...(d.listed_price !== undefined && { listedPrice: d.listed_price }),
            ...(d.final_price !== undefined && { finalPrice: d.final_price }),
            ...(d.note !== undefined && { note: d.note?.trim() ?? "" }),
            ...(d.recorded_by_name !== undefined && { recordedByName: d.recorded_by_name?.trim() ?? "" }),
            ...(d.visit_at !== undefined && { visitAt: new Date(d.visit_at) }),
            ...(d.service_status !== undefined && { serviceStatus: d.service_status }),
            ...(d.photo_url !== undefined && { photoUrl: (d.photo_url ?? "").trim() }),
            ...(d.evidence_photo_urls !== undefined && {
              evidencePhotoUrlsJson: normalizeCarWashVisitEvidenceUrls(d.evidence_photo_urls),
            }),
            ...(d.signature_image_url !== undefined && {
              signatureImageUrl: d.signature_image_url?.trim() || null,
            }),
            ...(clearBundleId && { bundleId: null }),
          },
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SIGNATURE_REQUIRED") {
        return NextResponse.json(
          { error: "ให้ลูกค้าลงชื่อด้วยปากกาหรือนิ้วก่อนหักแพ็ก" },
          { status: 400 },
        );
      }
      if (msg === "BUNDLE_CONSUME_FAIL") {
        return NextResponse.json(
          { error: "แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว" },
          { status: 409 },
        );
      }
      throw e;
    }

    const bookingSnapshot =
      updated.bookingId != null
        ? await prisma.carWashBooking.findUnique({
            where: { id: updated.bookingId },
            select: visitBookingSelect,
          })
        : null;

    notifyCarWashLaneBoard(own.ownerId);

    return NextResponse.json({ visit: visitJson({ ...updated, booking: bookingSnapshot }) });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits/[id] PATCH");
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const own = await getCarWashOwnerOrStaffContext(req);
    if (!own.ok) return own.res;
    const scope = { trialSessionId: own.trialSessionId };

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.carWashVisit.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ ok: false });
    await prisma.carWashVisit.delete({ where: { id: row.id } });
    notifyCarWashLaneBoard(own.ownerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits/[id] DELETE");
  }
}

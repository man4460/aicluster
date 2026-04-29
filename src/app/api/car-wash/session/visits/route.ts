import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { normalizePhone } from "@/lib/car-wash/http";
import { carWashServiceStatusZod, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

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
    /** เหมาจ่าย: เก็บ id แพ็กไว้ — หักครั้งเมื่อสถานะเป็น PAID เท่านั้น */
    bundle_id: z.number().int().positive().optional().nullable(),
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

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const rows = await prisma.carWashVisit.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { visitAt: "desc" },
    });
    return NextResponse.json({
      visits: rows.map((r) => ({
        id: r.id,
        visit_at: r.visitAt.toISOString(),
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        plate_number: r.plateNumber,
        package_id: r.packageId,
        package_name: r.packageName,
        listed_price: r.listedPrice,
        final_price: r.finalPrice,
        note: r.note,
        recorded_by_name: r.recordedByName,
        service_status: normalizeCarWashServiceStatus(r.serviceStatus),
        photo_url: r.photoUrl ?? "",
        bundle_id: r.bundleId ?? null,
      })),
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

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
      recordedByName: parsed.data.recorded_by_name?.trim() ?? "",
      serviceStatus,
      photoUrl: parsed.data.photo_url?.trim() ?? "",
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
    return NextResponse.json({
      visit: {
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
        service_status: normalizeCarWashServiceStatus(row.serviceStatus),
        photo_url: row.photoUrl ?? "",
        bundle_id: row.bundleId ?? null,
      },
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/visits POST");
  }
}

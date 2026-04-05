import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { normalizePhone } from "@/lib/car-wash/http";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";

const postSchema = z.object({
  customer_name: z.string().min(1).max(160),
  customer_phone: z.string().max(32),
  plate_number: z.string().min(1).max(64),
  package_id: z.number().int().positive(),
  package_name: z.string().min(1).max(160),
  paid_amount: z.number().int().min(0).max(9_999_999),
  total_uses: z.number().int().min(1).max(9999),
  is_active: z.boolean(),
  slip_photo_url: z.string().max(512).optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const rows = await prisma.carWashBundle.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      bundles: rows.map((r) => ({
        id: r.id,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        plate_number: r.plateNumber,
        package_id: r.packageId,
        package_name: r.packageName,
        paid_amount: r.paidAmount,
        total_uses: r.totalUses,
        used_uses: r.usedUses,
        is_active: r.isActive,
        slip_photo_url: (r as { slipPhotoUrl?: string }).slipPhotoUrl ?? "",
        created_at: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/bundles GET");
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
    const phone = normalizePhone(parsed.data.customer_phone);
    if (phone.length < 9) {
      return NextResponse.json({ error: "สมัครแพ็กเกจเหมาต้องใส่เบอร์โทรอย่างน้อย 9 หลัก" }, { status: 400 });
    }

    const row = await prisma.carWashBundle.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        customerName: parsed.data.customer_name.trim(),
        customerPhone: phone,
        plateNumber: parsed.data.plate_number.trim(),
        packageId: parsed.data.package_id,
        packageName: parsed.data.package_name.trim(),
        paidAmount: parsed.data.paid_amount,
        totalUses: parsed.data.total_uses,
        usedUses: 0,
        isActive: parsed.data.is_active,
        slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- slipPhotoUrl หลัง migrate; รัน prisma generate
      } as any,
    });
    return NextResponse.json({
      bundle: {
        id: row.id,
        customer_name: row.customerName,
        customer_phone: row.customerPhone,
        plate_number: row.plateNumber,
        package_id: row.packageId,
        package_name: row.packageName,
        paid_amount: row.paidAmount,
        total_uses: row.totalUses,
        used_uses: row.usedUses,
        is_active: row.isActive,
        slip_photo_url: (row as { slipPhotoUrl?: string }).slipPhotoUrl ?? "",
        created_at: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/bundles POST");
  }
}

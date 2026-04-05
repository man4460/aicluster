import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { normalizePhone } from "@/lib/car-wash/http";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";

const patchSchema = z
  .object({
    customer_name: z.string().min(1).max(160).optional(),
    customer_phone: z.string().max(32).optional(),
    plate_number: z.string().min(1).max(64).optional(),
    package_id: z.number().int().positive().optional(),
    package_name: z.string().min(1).max(160).optional(),
    paid_amount: z.number().int().min(0).max(9_999_999).optional(),
    total_uses: z.number().int().min(1).max(9999).optional(),
    is_active: z.boolean().optional(),
    slip_photo_url: z.string().max(512).optional().nullable(),
  })
  .refine(
    (d) =>
      d.customer_name !== undefined ||
      d.customer_phone !== undefined ||
      d.plate_number !== undefined ||
      d.package_id !== undefined ||
      d.package_name !== undefined ||
      d.paid_amount !== undefined ||
      d.total_uses !== undefined ||
      d.is_active !== undefined ||
      d.slip_photo_url !== undefined,
    { message: "ต้องส่งอย่างน้อยหนึ่งฟิลด์" },
  );

function bundleJson(row: {
  id: number;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  packageId: number;
  packageName: string;
  paidAmount: number;
  totalUses: number;
  usedUses: number;
  isActive: boolean;
  slipPhotoUrl?: string;
  createdAt: Date;
}) {
  return {
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
    slip_photo_url: row.slipPhotoUrl ?? "",
    created_at: row.createdAt.toISOString(),
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.carWashBundle.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const d = parsed.data;
    const nextTotalUses = d.total_uses !== undefined ? d.total_uses : row.totalUses;
    if (nextTotalUses < row.usedUses) {
      return NextResponse.json(
        { error: "จำนวนครั้งรวมต้องไม่น้อยกว่าจำนวนที่ใช้ไปแล้ว" },
        { status: 400 },
      );
    }

    const updated = await prisma.carWashBundle.update({
      where: { id: row.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- slipPhotoUrl หลัง migrate; รัน prisma generate
      data: {
        ...(d.customer_name !== undefined && { customerName: d.customer_name.trim() }),
        ...(d.customer_phone !== undefined && { customerPhone: normalizePhone(d.customer_phone) }),
        ...(d.plate_number !== undefined && { plateNumber: d.plate_number.trim() }),
        ...(d.package_id !== undefined && { packageId: d.package_id }),
        ...(d.package_name !== undefined && { packageName: d.package_name.trim() }),
        ...(d.paid_amount !== undefined && { paidAmount: d.paid_amount }),
        ...(d.total_uses !== undefined && { totalUses: d.total_uses }),
        ...(d.is_active !== undefined && { isActive: d.is_active }),
        ...(d.slip_photo_url !== undefined && { slipPhotoUrl: (d.slip_photo_url ?? "").trim() }),
      } as any,
    });

    return NextResponse.json({ bundle: bundleJson(updated) });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/bundles/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.carWashBundle.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ ok: false });
    await prisma.carWashBundle.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/bundles/[id] DELETE");
  }
}

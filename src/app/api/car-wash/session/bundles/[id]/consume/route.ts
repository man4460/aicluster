import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const own = await getCarWashOwnerOrStaffContext(req);
    if (!own.ok) return own.res;
    const scope = { trialSessionId: own.trialSessionId };

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    const out = await prisma.$transaction(async (tx) => {
      const row = await tx.carWashBundle.findFirst({
        where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      });
      if (!row) return null;
      if (!row.isActive || row.usedUses >= row.totalUses) return null;
      return tx.carWashBundle.update({
        where: { id: row.id },
        data: { usedUses: row.usedUses + 1 },
      });
    });
    if (!out) return NextResponse.json({ bundle: null });
    return NextResponse.json({
      bundle: {
        id: out.id,
        customer_name: out.customerName,
        customer_phone: out.customerPhone,
        plate_number: out.plateNumber,
        package_id: out.packageId,
        package_name: out.packageName,
        paid_amount: out.paidAmount,
        total_uses: out.totalUses,
        used_uses: out.usedUses,
        is_active: out.isActive,
        slip_photo_url: (out as { slipPhotoUrl?: string }).slipPhotoUrl ?? "",
        created_at: out.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/bundles/[id]/consume POST");
  }
}

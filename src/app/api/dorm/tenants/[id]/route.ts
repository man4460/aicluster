import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDormitoryOwnerOrStaffContext } from "@/lib/dormitory/api-auth";
import { bangkokDateKey } from "@/lib/time/bangkok";
import type { TenantStatus } from "@/generated/prisma/enums";

const moneySchema = z.number().finite().min(0).max(1_000_000);

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  idCard: z.string().min(1).max(13).optional(),
  status: z.enum(["ACTIVE", "MOVED_OUT"]).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  bookingDepositBaht: moneySchema.optional(),
  securityDepositBaht: moneySchema.optional(),
  damageDeductionBaht: moneySchema.optional().nullable(),
  securityRefundBaht: moneySchema.optional().nullable(),
  moveOutNote: z.string().max(500).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseTenantId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function assertTenantOwner(ownerId: string, tenantId: number, trialSessionId: string) {
  return prisma.tenant.findFirst({
    where: { id: tenantId, room: { ownerUserId: ownerId, trialSessionId } },
    include: { room: true },
  });
}

function serializeTenant(tenant: {
  bookingDepositBaht: { toString(): string } | number;
  securityDepositBaht: { toString(): string } | number;
  damageDeductionBaht: { toString(): string } | number | null;
  securityRefundBaht: { toString(): string } | number | null;
  [key: string]: unknown;
}) {
  return {
    ...tenant,
    bookingDepositBaht: Number(tenant.bookingDepositBaht),
    securityDepositBaht: Number(tenant.securityDepositBaht),
    damageDeductionBaht:
      tenant.damageDeductionBaht != null ? Number(tenant.damageDeductionBaht) : null,
    securityRefundBaht: tenant.securityRefundBaht != null ? Number(tenant.securityRefundBaht) : null,
  };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withDormitoryOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const tid = parseTenantId((await ctx.params).id);
  if (tid === null) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  const existing = await assertTenantOwner(auth.ctx.ownerUserId, tid, auth.ctx.trialSessionId);
  if (!existing) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const d = parsed.data;
  const checkOut =
    d.checkOutDate != null ? new Date(`${d.checkOutDate}T12:00:00+07:00`) : undefined;

  if (d.status === "MOVED_OUT") {
    const security = Number(existing.securityDepositBaht);
    const damage = d.damageDeductionBaht ?? Number(existing.damageDeductionBaht ?? 0);
    const refund = d.securityRefundBaht ?? Number(existing.securityRefundBaht ?? 0);
    if (damage > security + 0.005) {
      return NextResponse.json({ error: "ยอดหักเสียหายต้องไม่เกินประกันห้อง" }, { status: 400 });
    }
    if (refund > security - damage + 0.005) {
      return NextResponse.json(
        { error: "ยอดคืนประกันต้องไม่เกินประกันหลังหักเสียหาย" },
        { status: 400 },
      );
    }
  }

  const tenant = await prisma.tenant.update({
    where: { id: tid },
    data: {
      ...(d.name !== undefined && { name: d.name.trim() }),
      ...(d.phone !== undefined && { phone: d.phone.trim() }),
      ...(d.idCard !== undefined && { idCard: d.idCard.trim() }),
      ...(d.status !== undefined && { status: d.status as TenantStatus }),
      ...(d.status === "MOVED_OUT" && {
        checkOutDate: checkOut ?? new Date(`${bangkokDateKey()}T12:00:00+07:00`),
      }),
      ...(d.status === undefined && checkOut !== undefined && { checkOutDate: checkOut }),
      ...(d.bookingDepositBaht !== undefined && { bookingDepositBaht: d.bookingDepositBaht }),
      ...(d.securityDepositBaht !== undefined && { securityDepositBaht: d.securityDepositBaht }),
      ...(d.damageDeductionBaht !== undefined && { damageDeductionBaht: d.damageDeductionBaht }),
      ...(d.securityRefundBaht !== undefined && { securityRefundBaht: d.securityRefundBaht }),
      ...(d.moveOutNote !== undefined && {
        moveOutNote: d.moveOutNote?.trim() ? d.moveOutNote.trim() : null,
      }),
    },
  });
  return NextResponse.json({ tenant: serializeTenant(tenant) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await withDormitoryOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const tid = parseTenantId((await ctx.params).id);
  if (tid === null) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  const existing = await assertTenantOwner(auth.ctx.ownerUserId, tid, auth.ctx.trialSessionId);
  if (!existing) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  await prisma.tenant.delete({ where: { id: tid } });
  return NextResponse.json({ ok: true });
}

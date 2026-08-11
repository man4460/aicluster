import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { z } from "zod";
import { isBarberPaymentMethod } from "@/systems/barber/lib/payment-method";

type Ctx = { params: Promise<{ id: string }> };

const barberSaleReceiptUrl = z
  .string()
  .max(512)
  .regex(/^\/uploads\/barber-cash-receipts\/[a-zA-Z0-9._-]+$/i);

const patchSchema = z.object({
  remainingSessions: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["ACTIVE", "EXHAUSTED", "CANCELLED"]).optional(),
  customerName: z.string().trim().max(100).optional().nullable(),
  /** แนบสลิปขายแพ็กใหม่ หรือส่ง null เพื่อลบ */
  saleReceiptImageUrl: z.union([barberSaleReceiptUrl, z.null()]).optional(),
  paymentMethod: z.string().max(20).optional().nullable(),
  taxInvoiceEnabled: z.boolean().optional(),
  billingName: z.string().max(160).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
  taxAddress: z.string().max(1000).optional().nullable(),
  taxBranch: z.string().max(120).optional().nullable(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function mapCustomer(c: {
  id: number;
  phone: string;
  name: string | null;
  taxInvoiceEnabled?: boolean;
  billingName?: string;
  taxId?: string;
  taxAddress?: string;
  taxBranch?: string;
}) {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    taxInvoiceEnabled: Boolean(c.taxInvoiceEnabled),
    billingName: c.billingName ?? "",
    taxId: c.taxId ?? "",
    taxAddress: c.taxAddress ?? "",
    taxBranch: c.taxBranch ?? "",
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    include: {
      customer: true,
      package: true,
    },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  return NextResponse.json({
    subscription: {
      id: sub.id,
      remainingSessions: sub.remainingSessions,
      status: sub.status,
      paymentMethod: sub.paymentMethod,
      saleReceiptImageUrl: sub.saleReceiptImageUrl,
      packageName: sub.package.name,
      packageId: sub.packageId,
      customer: mapCustomer(sub.customer),
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    include: { customer: true },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const customerPatch: {
    name?: string | null;
    taxInvoiceEnabled?: boolean;
    billingName?: string;
    taxId?: string;
    taxAddress?: string;
    taxBranch?: string;
  } = {};
  if (parsed.data.customerName !== undefined) {
    customerPatch.name = parsed.data.customerName?.trim() || null;
  }
  if (parsed.data.taxInvoiceEnabled !== undefined) {
    const enabled = parsed.data.taxInvoiceEnabled;
    customerPatch.taxInvoiceEnabled = enabled;
    customerPatch.billingName = enabled
      ? (parsed.data.billingName?.trim() || customerPatch.name || sub.customer.name || "")
      : "";
    customerPatch.taxId = enabled
      ? (parsed.data.taxId?.replace(/\D/g, "").slice(0, 13) || "")
      : "";
    customerPatch.taxAddress = enabled ? (parsed.data.taxAddress?.trim() || "") : "";
    customerPatch.taxBranch = enabled ? (parsed.data.taxBranch?.trim() || "") : "";
  } else {
    if (parsed.data.billingName !== undefined) {
      customerPatch.billingName = parsed.data.billingName?.trim() || "";
    }
    if (parsed.data.taxId !== undefined) {
      customerPatch.taxId = parsed.data.taxId?.replace(/\D/g, "").slice(0, 13) || "";
    }
    if (parsed.data.taxAddress !== undefined) {
      customerPatch.taxAddress = parsed.data.taxAddress?.trim() || "";
    }
    if (parsed.data.taxBranch !== undefined) {
      customerPatch.taxBranch = parsed.data.taxBranch?.trim() || "";
    }
  }

  if (Object.keys(customerPatch).length > 0) {
    await prisma.barberCustomer.update({
      where: { id: sub.barberCustomerId },
      data: customerPatch,
    });
  }

  const paymentMethod =
    parsed.data.paymentMethod === null
      ? null
      : parsed.data.paymentMethod !== undefined && isBarberPaymentMethod(parsed.data.paymentMethod)
        ? parsed.data.paymentMethod
        : undefined;

  const next = await prisma.barberCustomerSubscription.update({
    where: { id },
    data: {
      ...(parsed.data.remainingSessions !== undefined ? { remainingSessions: parsed.data.remainingSessions } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.saleReceiptImageUrl !== undefined ?
        { saleReceiptImageUrl: parsed.data.saleReceiptImageUrl }
      : {}),
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
    },
    include: { customer: true },
  });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "BarberCustomerSubscription",
    payload: { id, ownerUserId: own.ownerId, changes: parsed.data },
  });
  return NextResponse.json({
    subscription: {
      id: next.id,
      remainingSessions: next.remainingSessions,
      status: next.status,
      paymentMethod: next.paymentMethod,
      saleReceiptImageUrl: next.saleReceiptImageUrl,
      customer: mapCustomer(next.customer),
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.barberServiceLog.updateMany({
        where: { subscriptionId: id },
        data: { subscriptionId: null },
      });
      await tx.barberPortalStaffPing.updateMany({
        where: { subscriptionId: id },
        data: { subscriptionId: null },
      });
      await tx.barberCustomerSubscription.delete({ where: { id } });
    });
  } catch (e) {
    console.error("[barber/subscriptions DELETE]", id, e);
    const hint = prismaErrorToApiMessage(e);
    return NextResponse.json(
      { error: hint ?? "ลบไม่สำเร็จ — มีรายการอื่นอ้างแพ็กนี้อยู่ หรือฐานข้อมูลไม่ตรงสคีมา" },
      { status: 500 },
    );
  }
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "BarberCustomerSubscription",
    payload: { id, ownerUserId: own.ownerId },
  });
  return NextResponse.json({ ok: true });
}

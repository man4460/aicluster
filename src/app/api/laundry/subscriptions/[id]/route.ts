import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { isLaundryPaymentMethod } from "@/systems/laundry/lib/payment-method";

type Ctx = { params: Promise<{ id: string }> };

const laundrySaleReceiptUrl = z
  .string()
  .max(512)
  .regex(/^\/uploads\/laundry\/[a-zA-Z0-9._-]+$/);

const patchSchema = z.object({
  remainingSessions: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["ACTIVE", "EXHAUSTED", "CANCELLED"]).optional(),
  customerName: z.string().trim().max(100).optional().nullable(),
  saleReceiptImageUrl: z.union([laundrySaleReceiptUrl, z.null()]).optional(),
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

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getLaundryDataScope(own.ownerId);
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

  const sub = await prisma.laundryCustomerSubscription.findFirst({
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
    await prisma.laundryCustomer.update({
      where: { id: sub.laundryCustomerId },
      data: customerPatch,
    });
  }

  const paymentMethod =
    parsed.data.paymentMethod === null
      ? null
      : parsed.data.paymentMethod !== undefined && isLaundryPaymentMethod(parsed.data.paymentMethod)
        ? parsed.data.paymentMethod
        : undefined;

  const next = await prisma.laundryCustomerSubscription.update({
    where: { id },
    data: {
      ...(parsed.data.remainingSessions !== undefined ? { remainingSessions: parsed.data.remainingSessions } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.saleReceiptImageUrl !== undefined ?
        { saleReceiptImageUrl: parsed.data.saleReceiptImageUrl }
      : {}),
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
    },
  });

  return NextResponse.json({
    subscription: {
      id: next.id,
      remainingSessions: next.remainingSessions,
      status: next.status,
      paymentMethod: next.paymentMethod,
      saleReceiptImageUrl: next.saleReceiptImageUrl,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getLaundryDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const sub = await prisma.laundryCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!sub) return NextResponse.json({ ok: false });
  await prisma.laundryCustomerSubscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

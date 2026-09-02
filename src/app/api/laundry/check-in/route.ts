import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { prismaErrorToApiMessage, prismaKnownRequestCode } from "@/lib/prisma-api-error";
import { isLaundryPaymentMethod } from "@/systems/laundry/lib/payment-method";

const packageUseSchema = z.object({
  subscriptionId: z.number().int().positive(),
  signatureImageUrl: z
    .string()
    .max(512)
    .regex(/^\/uploads\/laundry(\/|-)/)
    .optional()
    .nullable(),
});

const laundryCashReceiptUrl = z
  .string()
  .max(512)
  .regex(/^\/uploads\/laundry\/[a-zA-Z0-9._-]+$/);

const cashSchema = z.object({
  visitType: z.literal("CASH_WALK_IN"),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  amountBaht: z.number().finite().min(0).max(999_999.99).optional().nullable(),
  receiptImageUrl: laundryCashReceiptUrl.optional().nullable(),
  paymentMethod: z.string().max(20).optional().nullable(),
  taxInvoiceEnabled: z.boolean().optional(),
  billingName: z.string().max(160).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
  taxAddress: z.string().max(1000).optional().nullable(),
  taxBranch: z.string().max(120).optional().nullable(),
});

/** cash มาก่อน — ถ้า package มาก่อน JSON ที่มีทั้ง subscriptionId + visitType อาจถูก parse เป็นหักแพ็กผิด */
const bodySchema = z.union([cashSchema, packageUseSchema]);

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function isPrismaClientValidationError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientValidationError ||
    (e instanceof Error && e.name === "PrismaClientValidationError")
  );
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);
  const trialSessionId = scope.trialSessionId;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = own.ownerId;

  if ("subscriptionId" in parsed.data) {
    const subscriptionId = parsed.data.subscriptionId;
    const signatureImageUrl =
      parsed.data.signatureImageUrl != null && parsed.data.signatureImageUrl.length > 0
        ? parsed.data.signatureImageUrl.trim()
        : null;
    try {
      const out = await prisma.$transaction(async (tx) => {
        const sub = await tx.laundryCustomerSubscription.findFirst({
          where: { id: subscriptionId, ownerUserId: ownerId, trialSessionId },
          include: { customer: true, package: { select: { name: true } } },
        });
        if (!sub) throw new Error("NOT_FOUND");
        if (sub.status !== "ACTIVE" || sub.remainingSessions <= 0) {
          throw new Error("NO_SESSIONS");
        }

        const next = sub.remainingSessions - 1;
        const updated = await tx.laundryCustomerSubscription.update({
          where: { id: sub.id },
          data: {
            remainingSessions: next,
            status: next <= 0 ? "EXHAUSTED" : "ACTIVE",
          },
        });

        const packageNote = sub.package.name.trim().slice(0, 255) || null;
        const logCore = {
          ownerUserId: ownerId,
          trialSessionId,
          subscriptionId: sub.id,
          laundryCustomerId: sub.laundryCustomerId,
          visitType: "PACKAGE_USE" as const,
          ...(packageNote ? { note: packageNote } : {}),
          ...(signatureImageUrl != null ? { signatureImageUrl } : {}),
        };

        try {
          await tx.laundryServiceLog.create({ data: logCore });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const staleSig =
            signatureImageUrl != null &&
            isPrismaClientValidationError(e) &&
            /signatureImageUrl|signature_image|Unknown argument/i.test(msg);
          if (staleSig) {
            console.warn("[laundry/check-in] Prisma ไม่รู้จัก signatureImageUrl — บันทึกแบบลดฟิลด์");
            const { signatureImageUrl: _s, ...withoutSig } = logCore;
            void _s;
            await tx.laundryServiceLog.create({ data: withoutSig });
          } else {
            throw e;
          }
        }

        return {
          remainingSessions: updated.remainingSessions,
          status: updated.status,
          customerPhone: sub.customer.phone,
        };
      });

      return NextResponse.json({
        ok: true,
        remainingSessions: out.remainingSessions,
        status: out.status,
        customerPhone: out.customerPhone,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NOT_FOUND") {
        return NextResponse.json({ error: "ไม่พบสมาชิกแพ็กเกจ" }, { status: 404 });
      }
      if (msg === "NO_SESSIONS") {
        return NextResponse.json({ error: "ไม่มียอดครั้งคงเหลือ" }, { status: 400 });
      }
      return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
    }
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }
  const name = parsed.data.name?.trim() || null;
  const note = parsed.data.note?.trim() || null;
  const amountBaht =
    parsed.data.amountBaht != null && Number.isFinite(parsed.data.amountBaht)
      ? parsed.data.amountBaht
      : null;

  const receiptImageUrl =
    parsed.data.receiptImageUrl != null && parsed.data.receiptImageUrl.length > 0
      ? parsed.data.receiptImageUrl
      : null;

  const paymentMethod =
    parsed.data.paymentMethod != null && isLaundryPaymentMethod(parsed.data.paymentMethod)
      ? parsed.data.paymentMethod
      : amountBaht != null && amountBaht > 0
        ? "CASH"
        : null;

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: {
      ownerUserId: ownerId,
      phone,
      trialSessionId,
    },
  } as const;

  try {
    const taxEnabled = Boolean(parsed.data.taxInvoiceEnabled);
    const taxData = {
      taxInvoiceEnabled: taxEnabled,
      billingName: taxEnabled ? (parsed.data.billingName?.trim() || name || "") : "",
      taxId: taxEnabled ? (parsed.data.taxId?.replace(/\D/g, "").slice(0, 13) || "") : "",
      taxAddress: taxEnabled ? (parsed.data.taxAddress?.trim() || "") : "",
      taxBranch: taxEnabled ? (parsed.data.taxBranch?.trim() || "") : "",
    };

    let customer = await prisma.laundryCustomer.findUnique({ where: whereCustomer });
    if (!customer) {
      customer = await prisma.laundryCustomer.create({
        data: {
          ownerUserId: ownerId,
          trialSessionId,
          phone,
          name,
          ...(parsed.data.taxInvoiceEnabled !== undefined ? taxData : {}),
        },
      });
    } else {
      customer = await prisma.laundryCustomer.update({
        where: { id: customer.id },
        data: {
          ...(name !== null && name.length > 0 ? { name } : {}),
          ...(parsed.data.taxInvoiceEnabled !== undefined ? taxData : {}),
        },
      });
    }

    const cashLogCore = {
      ownerUserId: ownerId,
      trialSessionId,
      laundryCustomerId: customer.id,
      visitType: "CASH_WALK_IN" as const,
      ...(note != null ? { note } : {}),
      ...(amountBaht != null ? { amountBaht: amountBaht.toFixed(2) } : {}),
      ...(paymentMethod != null ? { paymentMethod } : {}),
    };

    let serviceLogId: number | null = null;
    try {
      const created = await prisma.laundryServiceLog.create({
        data: {
          ...cashLogCore,
          ...(receiptImageUrl != null ? { receiptImageUrl } : {}),
        },
      });
      serviceLogId = created.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const staleClientReceipt =
        receiptImageUrl != null &&
        isPrismaClientValidationError(e) &&
        /receiptImageUrl|receipt_image|Unknown argument/i.test(msg);
      const stalePaymentMethod =
        paymentMethod != null &&
        isPrismaClientValidationError(e) &&
        /paymentMethod|payment_method|Unknown argument/i.test(msg);
      if (staleClientReceipt || stalePaymentMethod) {
        console.warn(
          "[laundry/check-in] Prisma ไม่รู้จักฟิลด์ใหม่ — บันทึกแบบลดฟิลด์",
          { staleClientReceipt, stalePaymentMethod },
        );
        const { paymentMethod: _pm, ...coreWithoutPay } = cashLogCore;
        void _pm;
        try {
          const created = await prisma.laundryServiceLog.create({
            data: {
              ...coreWithoutPay,
              ...(receiptImageUrl != null && !staleClientReceipt ? { receiptImageUrl } : {}),
            },
          });
          serviceLogId = created.id;
        } catch {
          const created = await prisma.laundryServiceLog.create({ data: coreWithoutPay });
          serviceLogId = created.id;
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json({
      ok: true,
      visitType: "CASH_WALK_IN",
      phone: customer.phone,
      serviceLogId,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        taxInvoiceEnabled: customer.taxInvoiceEnabled,
        billingName: customer.billingName,
        taxId: customer.taxId,
        taxAddress: customer.taxAddress,
        taxBranch: customer.taxBranch,
      },
    });
  } catch (e) {
    console.error("[laundry/check-in] CASH_WALK_IN", e);
    const mapped = prismaErrorToApiMessage(e);
    if (mapped) {
      return NextResponse.json({ error: mapped }, { status: 500 });
    }
    const code = prismaKnownRequestCode(e);
    if (code) {
      return NextResponse.json(
        { error: `บันทึกไม่สำเร็จ (รหัส ${code}) — ดู log เซิร์ฟเวอร์ หรือรัน prisma migrate deploy` },
        { status: 500 },
      );
    }
    const raw = e instanceof Error ? e.message : String(e);
    const devHint =
      process.env.NODE_ENV === "development" ? ` — ${raw.slice(0, 280)}` : "";
    return NextResponse.json(
      {
        error: `บันทึกไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและ log ฝั่งเซิร์ฟเวอร์${devHint}`,
      },
      { status: 500 },
    );
  }
}

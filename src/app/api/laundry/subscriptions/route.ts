import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import {
  isPrismaClientValidationSyncError,
  isPrismaSchemaMismatchError,
  PRISMA_FULL_SYNC_HINT_TH,
  PRISMA_SYNC_HINT_TH,
} from "@/lib/prisma-errors";
import {
  isPrismaSchemaMismatch,
  THAI_PRISMA_SCHEMA_MISMATCH,
} from "@/lib/prisma-schema-mismatch";
import { isLaundryPaymentMethod } from "@/systems/laundry/lib/payment-method";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  packageId: z.coerce.number().int().positive(),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  receiptImageUrl: z.string().max(512).optional().nullable(),
  paymentMethod: z.string().max(20).optional().nullable(),
  taxInvoiceEnabled: z.boolean().optional(),
  billingName: z.string().max(160).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
  taxAddress: z.string().max(1000).optional().nullable(),
  taxBranch: z.string().max(120).optional().nullable(),
});

function mapCustomerTax(c: {
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

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function normalizeLaundrySlipUrl(
  stored: string | null | undefined,
  requestOrigin: string,
): string | null {
  if (!stored?.trim()) return null;
  const u = stored.trim();
  if (u.startsWith("/uploads/laundry/")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const p = new URL(u);
      if (p.pathname.startsWith("/uploads/laundry/")) {
        return requestOrigin ? new URL(p.pathname, requestOrigin).pathname : p.pathname;
      }
      return u;
    } catch {
      return u;
    }
  }
  return u;
}

function shouldRetrySubscriptionCreateWithoutReceipt(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
    const meta = e.meta as Record<string, unknown> | undefined;
    const blob = `${JSON.stringify(meta ?? {})} ${e.message}`;
    return /sale_receipt_image_url|saleReceiptImageUrl/i.test(blob);
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/Unknown column/i.test(msg) && /sale_receipt_image_url/i.test(msg)) return true;
  if (e instanceof Prisma.PrismaClientValidationError) {
    const m = msg.replace(/\s+/g, " ");
    if (!/saleReceiptImageUrl|sale_receipt_image_url/i.test(m)) return false;
    return /Unknown argument/i.test(m) || /Unknown field/i.test(m);
  }
  return false;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const take = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 100));

  const ownerId = own.ownerId;
  const requestOrigin = new URL(req.url).origin;

  const mapRow = (
    s: {
      id: number;
      createdAt: Date;
      status: string;
      remainingSessions: number;
      package: {
        id: number;
        name: string;
        basePrice: number;
        totalSessions: number;
        imageUrl?: string | null;
      };
      customer: {
        id: number;
        phone: string;
        name: string | null;
        taxInvoiceEnabled?: boolean;
        billingName?: string;
        taxId?: string;
        taxAddress?: string;
        taxBranch?: string;
      };
      saleReceiptImageUrl?: string | null;
      paymentMethod?: string | null;
    },
  ) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    status: s.status,
    remainingSessions: s.remainingSessions,
    paymentMethod: s.paymentMethod ?? null,
    saleReceiptImageUrl: normalizeLaundrySlipUrl(s.saleReceiptImageUrl, requestOrigin),
    package: {
      id: s.package.id,
      name: s.package.name,
      price: String(s.package.basePrice),
      totalSessions: s.package.totalSessions,
      imageUrl: s.package.imageUrl ?? null,
    },
    customer: mapCustomerTax(s.customer),
  });

  const whereSub = { ownerUserId: ownerId, trialSessionId: scope.trialSessionId };
  const orderBy = { createdAt: "desc" as const };

  const tries: Array<() => Promise<Parameters<typeof mapRow>[0][]>> = [
    async () => {
      const rows = await prisma.laundryCustomerSubscription.findMany({
        where: whereSub,
        orderBy,
        take,
        select: {
          id: true,
          createdAt: true,
          status: true,
          remainingSessions: true,
          saleReceiptImageUrl: true,
          paymentMethod: true,
          customer: true,
          package: true,
        },
      });
      return rows;
    },
    async () => {
      const rows = await prisma.laundryCustomerSubscription.findMany({
        where: whereSub,
        orderBy,
        take,
        select: {
          id: true,
          createdAt: true,
          status: true,
          remainingSessions: true,
          saleReceiptImageUrl: true,
          customer: true,
          package: true,
        },
      });
      return rows.map((r) => ({ ...r, paymentMethod: null as string | null }));
    },
    async () => {
      const rows = await prisma.laundryCustomerSubscription.findMany({
        where: whereSub,
        orderBy,
        take,
        select: {
          id: true,
          createdAt: true,
          status: true,
          remainingSessions: true,
          customer: true,
          package: true,
        },
      });
      return rows.map((r) => ({
        ...r,
        saleReceiptImageUrl: null as string | null,
        paymentMethod: null as string | null,
      }));
    },
  ];

  let lastErr: unknown;
  for (const run of tries) {
    try {
      const raw = await run();
      return NextResponse.json({
        subscriptions: raw.map((s) => mapRow(s)),
      });
    } catch (e) {
      lastErr = e;
      if (!isPrismaSchemaMismatch(e) && !isPrismaSchemaMismatchError(e)) {
        const hint = prismaErrorToApiMessage(e);
        console.error("[laundry/subscriptions GET]", e);
        return NextResponse.json(
          { error: hint ?? "โหลดข้อมูลไม่สำเร็จ" },
          { status: 500 },
        );
      }
    }
  }
  console.error("[laundry/subscriptions GET] fallbacks exhausted", lastErr);
  return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง — ตรวจสอบแพ็กเกจและเบอร์" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const pkg = await prisma.laundryPackage.findFirst({
      where: { id: parsed.data.packageId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!pkg) {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });
    }
    if (pkg.totalSessions <= 1) {
      return NextResponse.json({ error: "แพ็กเกจนี้ไม่ใช่แพ็กเหมา — ต้องมากกว่า 1 ครั้ง" }, { status: 400 });
    }

    const name = parsed.data.name?.trim() || null;
    const taxEnabled = Boolean(parsed.data.taxInvoiceEnabled);
    const taxData = {
      taxInvoiceEnabled: taxEnabled,
      billingName: taxEnabled ? (parsed.data.billingName?.trim() || name || "") : "",
      taxId: taxEnabled ? (parsed.data.taxId?.replace(/\D/g, "").slice(0, 13) || "") : "",
      taxAddress: taxEnabled ? (parsed.data.taxAddress?.trim() || "") : "",
      taxBranch: taxEnabled ? (parsed.data.taxBranch?.trim() || "") : "",
    };

    const whereCustomer = {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: own.ownerId,
        phone,
        trialSessionId: scope.trialSessionId,
      },
    } as const;
    let customer = await prisma.laundryCustomer.findUnique({ where: whereCustomer });
    if (!customer) {
      customer = await prisma.laundryCustomer.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          phone,
          name,
          ...taxData,
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

    const receiptUrl = parsed.data.receiptImageUrl?.trim();
    const remainingSessions = Math.trunc(Number(pkg.totalSessions));
    if (!Number.isFinite(remainingSessions) || remainingSessions < 2) {
      return NextResponse.json({ error: "จำนวนครั้งของแพ็กเกจไม่ถูกต้อง" }, { status: 400 });
    }

    const paymentMethod = isLaundryPaymentMethod(parsed.data.paymentMethod)
      ? parsed.data.paymentMethod
      : "CASH";

    const baseData = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      laundryCustomerId: customer.id,
      packageId: pkg.id,
      remainingSessions,
      paymentMethod,
    };

    let sub: { id: number; remainingSessions: number; status: string };
    let receiptSkipped = false;

    const createSubscription = async (data: typeof baseData & { saleReceiptImageUrl?: string }) => {
      return prisma.laundryCustomerSubscription.create({
        data,
        select: { id: true, remainingSessions: true, status: true },
      });
    };

    try {
      sub = await createSubscription({
        ...baseData,
        ...(receiptUrl ? { saleReceiptImageUrl: receiptUrl } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const paymentColMissing =
        /payment_method|paymentMethod/i.test(msg) &&
        (/Unknown column|Unknown argument|Unknown field|P2022/i.test(msg) ||
          e instanceof Prisma.PrismaClientValidationError);
      if (paymentColMissing) {
        const { paymentMethod: _drop, ...withoutPay } = baseData;
        void _drop;
        try {
          sub = await createSubscription({
            ...withoutPay,
            ...(receiptUrl ? { saleReceiptImageUrl: receiptUrl } : {}),
          });
        } catch (e2) {
          const retry = receiptUrl && shouldRetrySubscriptionCreateWithoutReceipt(e2);
          if (retry) {
            sub = await createSubscription(withoutPay);
            receiptSkipped = true;
          } else {
            throw e2;
          }
        }
      } else {
        const retry = receiptUrl && shouldRetrySubscriptionCreateWithoutReceipt(e);
        if (retry) {
          sub = await createSubscription(baseData);
          receiptSkipped = true;
          try {
            await prisma.laundryCustomerSubscription.update({
              where: { id: sub.id },
              data: { saleReceiptImageUrl: receiptUrl },
            });
            receiptSkipped = false;
          } catch (ue) {
            console.warn("[laundry/subscriptions POST] บันทึกสลิปหลังสร้างแพ็กไม่สำเร็จ:", ue);
          }
        } else {
          throw e;
        }
      }
    }

    if (receiptUrl) {
      try {
        const saved = await prisma.laundryCustomerSubscription.findUnique({
          where: { id: sub.id },
          select: { saleReceiptImageUrl: true },
        });
        if (!saved?.saleReceiptImageUrl?.trim()) {
          await prisma.laundryCustomerSubscription.update({
            where: { id: sub.id },
            data: { saleReceiptImageUrl: receiptUrl },
          });
        }
        receiptSkipped = false;
      } catch (bf) {
        console.warn("[laundry/subscriptions POST] backfill saleReceiptImageUrl:", bf);
        receiptSkipped = true;
      }
    }

    try {
      await prisma.laundryServiceLog.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          subscriptionId: sub.id,
          laundryCustomerId: customer.id,
          visitType: "PACKAGE_SALE",
          amountBaht: pkg.basePrice.toFixed(2),
          paymentMethod,
          note: pkg.name.trim().slice(0, 255) || null,
          ...(receiptUrl ? { receiptImageUrl: receiptUrl } : {}),
        },
      });
    } catch (logErr) {
      console.error("[laundry/subscriptions POST] PACKAGE_SALE log", logErr);
    }

    const saleReceiptImageUrlForClient = receiptUrl?.trim()
      ? normalizeLaundrySlipUrl(receiptUrl, new URL(req.url).origin)
      : null;

    return NextResponse.json({
      subscription: {
        id: sub.id,
        remainingSessions: sub.remainingSessions,
        status: sub.status,
        packageName: pkg.name,
        customerId: customer.id,
        phone: customer.phone,
        saleReceiptImageUrl: saleReceiptImageUrlForClient,
        paymentMethod,
      },
      ...(receiptSkipped ?
        {
          warning:
            "บันทึกแพ็กสำเร็จแต่ยังไม่บันทึกรูปสลิป — รัน npx prisma migrate deploy แล้ว npx prisma generate ลบ .next รีสตาร์ท dev แล้วลองแนบสลิปอีกครั้ง",
        }
      : {}),
    });
  } catch (e) {
    console.error("[laundry/subscriptions POST]", e);
    if (isPrismaClientValidationSyncError(e)) {
      const msg = e instanceof Error ? e.message : String(e);
      const devExtra =
        process.env.NODE_ENV === "development" ? ` ${msg.replace(/\s+/g, " ").slice(0, 500)}` : "";
      return NextResponse.json(
        { error: `${PRISMA_FULL_SYNC_HINT_TH}${devExtra}` },
        { status: 503 },
      );
    }
    const mapped = prismaErrorToApiMessage(e);
    if (mapped) {
      const schemaRelated =
        isPrismaSchemaMismatch(e) ||
        isPrismaSchemaMismatchError(e) ||
        mapped === THAI_PRISMA_SCHEMA_MISMATCH ||
        mapped.includes("migrate deploy") ||
        mapped.includes("สคีมา") ||
        mapped.includes("Prisma Client");
      return NextResponse.json({ error: mapped }, { status: schemaRelated ? 503 : 500 });
    }
    return NextResponse.json(
      {
        error: `บันทึกไม่สำเร็จ — ${PRISMA_SYNC_HINT_TH} หรือตรวจสอบ MySQL / DATABASE_URL (ดู log: [laundry/subscriptions POST])`,
      },
      { status: 500 },
    );
  }
}

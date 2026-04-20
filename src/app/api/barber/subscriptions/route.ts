import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
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
import {
  normalizeBarberSlipUrlForDashboard,
  parseBarberCashReceiptBasenameFromStored,
} from "@/lib/barber/receipt-display-url";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  /** จากฟอร์มบางครั้งส่งเป็น string — coerce ให้ผ่าน */
  packageId: z.coerce.number().int().positive(),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  stylistId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  receiptImageUrl: z.string().max(512).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/**
 * retry แบบไม่ใส่สลิปใน `create` เฉพาะเมื่อ error ชัดว่าเกี่ยวกับฟิลด์สลิปเท่านั้น
 * ห้ามใช้ isPrismaSchemaMismatch (P2022 ทุกคอลัมน์) หรือ isPrismaSchemaMismatchError ที่แมตช์ `customer_subscriptions`
 * — จะทำให้ตัดสลิปทิ้งแม้สาเหตุจริงไม่เกี่ยวกับสลิป
 */
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
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

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
        price: unknown;
        totalSessions: number;
      };
      customer: { id: number; phone: string; name: string | null };
      soldByStylist: { id: number; name: string } | null;
      saleReceiptImageUrl?: string | null;
    },
  ) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    status: s.status,
    remainingSessions: s.remainingSessions,
    saleReceiptImageUrl: (() => {
      const raw = s.saleReceiptImageUrl?.trim() ?? null;
      if (!raw) return null;
      if (parseBarberCashReceiptBasenameFromStored(raw)) {
        return `/api/barber/subscriptions/${s.id}/sale-receipt`;
      }
      const norm = normalizeBarberSlipUrlForDashboard(raw, requestOrigin);
      if (norm && parseBarberCashReceiptBasenameFromStored(norm)) {
        return `/api/barber/subscriptions/${s.id}/sale-receipt`;
      }
      return norm;
    })(),
    package: {
      id: s.package.id,
      name: s.package.name,
      price: String(s.package.price),
      totalSessions: s.package.totalSessions,
    },
    customer: {
      id: s.customer.id,
      phone: s.customer.phone,
      name: s.customer.name,
    },
    soldByStylist: s.soldByStylist
      ? { id: s.soldByStylist.id, name: s.soldByStylist.name }
      : null,
  });

  const whereSub = { ownerUserId: ownerId, trialSessionId: scope.trialSessionId };
  const orderBy = { createdAt: "desc" as const };

  /**
   * คอลัมน์ sale_receipt / ความสัมพันธ์ช่าง อาจยังไม่มี — ลองทีละแบบ
   * ลำดับสำคัญ: ถ้าไม่มีแค่ช่าง ต้องยังดึง saleReceiptImageUrl ได้ (เดิม try สุดท้ายบังคับ null รูปเสมอ)
   */
  const tries: Array<() => Promise<Parameters<typeof mapRow>[0][]>> = [
    async () => {
      const rows = await prisma.barberCustomerSubscription.findMany({
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
          soldByStylist: true,
        },
      });
      return rows;
    },
    async () => {
      const rows = await prisma.barberCustomerSubscription.findMany({
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
      return rows.map((r) => ({ ...r, soldByStylist: null }));
    },
    async () => {
      const rows = await prisma.barberCustomerSubscription.findMany({
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
          soldByStylist: true,
        },
      });
      return rows.map((r) => ({ ...r, saleReceiptImageUrl: null as string | null }));
    },
    async () => {
      const rows = await prisma.barberCustomerSubscription.findMany({
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
        soldByStylist: null,
        saleReceiptImageUrl: null as string | null,
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
        console.error("[barber/subscriptions GET]", e);
        return NextResponse.json(
          { error: hint ?? "โหลดข้อมูลไม่สำเร็จ" },
          { status: 500 },
        );
      }
    }
  }
  console.error("[barber/subscriptions GET] fallbacks exhausted", lastErr);
  return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

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
    const pkg = await prisma.barberPackage.findFirst({
      where: { id: parsed.data.packageId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!pkg) {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });
    }

    let soldByStylistId: number | null = null;
    if (parsed.data.stylistId != null) {
      const st = await prisma.barberStylist.findFirst({
        where: {
          id: parsed.data.stylistId,
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          isActive: true,
        },
      });
      if (!st) {
        return NextResponse.json({ error: "ไม่พบช่างหรือปิดใช้งานแล้ว" }, { status: 400 });
      }
      soldByStylistId = st.id;
    }

    const name = parsed.data.name?.trim() || null;

    const whereCustomer = {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: own.ownerId,
        phone,
        trialSessionId: scope.trialSessionId,
      },
    } as const;
    let customer = await prisma.barberCustomer.findUnique({ where: whereCustomer });
    if (!customer) {
      customer = await prisma.barberCustomer.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          phone,
          name,
        },
      });
    } else if (name !== null && name.length > 0) {
      customer = await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { name },
      });
    }

    const receiptUrl = parsed.data.receiptImageUrl?.trim();
    const remainingSessions = Math.trunc(Number(pkg.totalSessions));
    if (!Number.isFinite(remainingSessions) || remainingSessions < 0) {
      return NextResponse.json({ error: "จำนวนครั้งของแพ็กเกจไม่ถูกต้อง" }, { status: 400 });
    }

    const baseData = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      barberCustomerId: customer.id,
      packageId: pkg.id,
      remainingSessions,
      ...(soldByStylistId != null ? { soldByStylistId } : {}),
    };

    let sub: { id: number; remainingSessions: number; status: string };
    let receiptSkipped = false;
    try {
      sub = await prisma.barberCustomerSubscription.create({
        data: {
          ...baseData,
          ...(receiptUrl ? { saleReceiptImageUrl: receiptUrl } : {}),
        },
        select: { id: true, remainingSessions: true, status: true },
      });
    } catch (e) {
      const retry = receiptUrl && shouldRetrySubscriptionCreateWithoutReceipt(e);
      if (retry) {
        sub = await prisma.barberCustomerSubscription.create({
          data: baseData,
          select: { id: true, remainingSessions: true, status: true },
        });
        receiptSkipped = true;
        try {
          await prisma.barberCustomerSubscription.update({
            where: { id: sub.id },
            data: { saleReceiptImageUrl: receiptUrl },
          });
          receiptSkipped = false;
        } catch (ue) {
          console.warn("[barber/subscriptions POST] บันทึกสลิปหลังสร้างแพ็กไม่สำเร็จ:", ue);
        }
      } else {
        throw e;
      }
    }

    /** ถ้ามีสลิปแต่แถวในฐานยังว่าง (เคส client/คำสั่ง create ไม่ใส่ค่า) ให้ update ซ้ำครั้งเดียว */
    if (receiptUrl) {
      try {
        const saved = await prisma.barberCustomerSubscription.findUnique({
          where: { id: sub.id },
          select: { saleReceiptImageUrl: true },
        });
        if (!saved?.saleReceiptImageUrl?.trim()) {
          await prisma.barberCustomerSubscription.update({
            where: { id: sub.id },
            data: { saleReceiptImageUrl: receiptUrl },
          });
        }
        receiptSkipped = false;
      } catch (bf) {
        console.warn("[barber/subscriptions POST] backfill saleReceiptImageUrl:", bf);
        receiptSkipped = true;
      }
    }

    /** ถ้ามีการแนบสลิปในคำขอ ให้ส่ง URL โหลดรูปเสมอ (กัน GET รายการคืน null ชั่วคราว / client อัปเดตการ์ดได้ทันที) — ถ้าฐานข้อมูลยังไม่มีค่า endpoint จะ 404 */
    const saleReceiptImageUrlForClient = receiptUrl?.trim()
      ? `/api/barber/subscriptions/${sub.id}/sale-receipt`
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
      },
      ...(receiptSkipped ?
        {
          warning:
            "บันทึกแพ็กสำเร็จแต่ยังไม่บันทึกรูปสลิป — รัน npx prisma migrate deploy แล้ว npx prisma generate ลบ .next รีสตาร์ท dev แล้วลองแนบสลิปอีกครั้ง",
        }
      : {}),
    });
  } catch (e) {
    console.error("[barber/subscriptions POST]", e);
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
        error: `บันทึกไม่สำเร็จ — ${PRISMA_SYNC_HINT_TH} หรือตรวจสอบ MySQL / DATABASE_URL (ดู log: [barber/subscriptions POST])`,
      },
      { status: 500 },
    );
  }
}

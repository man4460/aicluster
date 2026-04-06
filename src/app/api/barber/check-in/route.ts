import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { prismaErrorToApiMessage, prismaKnownRequestCode } from "@/lib/prisma-api-error";

const packageUseSchema = z.object({
  subscriptionId: z.number().int().positive(),
  stylistId: z.number().int().positive().optional().nullable(),
});

const barberCashReceiptUrl = z
  .string()
  .max(512)
  .regex(/^\/uploads\/barber-cash-receipts\/[a-zA-Z0-9._-]+$/);

const cashSchema = z.object({
  visitType: z.literal("CASH_WALK_IN"),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  amountBaht: z.number().finite().min(0).max(999_999.99).optional().nullable(),
  stylistId: z.number().int().positive().optional().nullable(),
  receiptImageUrl: barberCashReceiptUrl.optional().nullable(),
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
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
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

  async function resolveStylistId(stylistId: number | null | undefined): Promise<number | null> {
    if (stylistId == null) return null;
    const st = await prisma.barberStylist.findFirst({
      where: { id: stylistId, ownerUserId: ownerId, trialSessionId, isActive: true },
    });
    if (!st) return null;
    return st.id;
  }

  if ("subscriptionId" in parsed.data) {
    const subscriptionId = parsed.data.subscriptionId;
    const stylistIdResolved = await resolveStylistId(parsed.data.stylistId);
    if (parsed.data.stylistId != null && stylistIdResolved == null) {
      return NextResponse.json({ error: "ไม่พบช่างหรือปิดใช้งานแล้ว" }, { status: 400 });
    }
    try {
      const out = await prisma.$transaction(async (tx) => {
        const sub = await tx.barberCustomerSubscription.findFirst({
          where: { id: subscriptionId, ownerUserId: ownerId, trialSessionId },
          include: { customer: true },
        });
        if (!sub) throw new Error("NOT_FOUND");
        if (sub.status !== "ACTIVE" || sub.remainingSessions <= 0) {
          throw new Error("NO_SESSIONS");
        }

        const next = sub.remainingSessions - 1;
        const updated = await tx.barberCustomerSubscription.update({
          where: { id: sub.id },
          data: {
            remainingSessions: next,
            status: next <= 0 ? "EXHAUSTED" : "ACTIVE",
          },
        });

        await tx.barberServiceLog.create({
          data: {
            ownerUserId: ownerId,
            trialSessionId,
            subscriptionId: sub.id,
            barberCustomerId: sub.barberCustomerId,
            visitType: "PACKAGE_USE",
            ...(stylistIdResolved != null ? { stylistId: stylistIdResolved } : {}),
          },
        });

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

  const stylistIdResolved = await resolveStylistId(parsed.data.stylistId);
  if (parsed.data.stylistId != null && stylistIdResolved == null) {
    return NextResponse.json({ error: "ไม่พบช่างหรือปิดใช้งานแล้ว" }, { status: 400 });
  }

  const receiptImageUrl =
    parsed.data.receiptImageUrl != null && parsed.data.receiptImageUrl.length > 0
      ? parsed.data.receiptImageUrl
      : null;

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: {
      ownerUserId: ownerId,
      phone,
      trialSessionId,
    },
  } as const;

  try {
    let customer = await prisma.barberCustomer.findUnique({ where: whereCustomer });
    if (!customer) {
      customer = await prisma.barberCustomer.create({
        data: {
          ownerUserId: ownerId,
          trialSessionId,
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

    const cashLogCore = {
      ownerUserId: ownerId,
      trialSessionId,
      barberCustomerId: customer.id,
      visitType: "CASH_WALK_IN" as const,
      ...(note != null ? { note } : {}),
      ...(amountBaht != null ? { amountBaht: amountBaht.toFixed(2) } : {}),
      ...(stylistIdResolved != null ? { stylistId: stylistIdResolved } : {}),
    };

    try {
      await prisma.barberServiceLog.create({
        data: {
          ...cashLogCore,
          ...(receiptImageUrl != null ? { receiptImageUrl } : {}),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const staleClientReceipt =
        receiptImageUrl != null &&
        isPrismaClientValidationError(e) &&
        /receiptImageUrl|receipt_image|Unknown argument/i.test(msg);
      if (staleClientReceipt) {
        console.warn(
          "[barber/check-in] Prisma ไม่รู้จัก receiptImageUrl (มักเป็น client ค้างหลัง prisma generate) — บันทึกโดยไม่แนบรูปสลิป",
        );
        await prisma.barberServiceLog.create({ data: cashLogCore });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ ok: true, visitType: "CASH_WALK_IN", phone: customer.phone });
  } catch (e) {
    console.error("[barber/check-in] CASH_WALK_IN", e);
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

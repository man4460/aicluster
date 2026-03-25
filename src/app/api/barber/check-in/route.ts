import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";

const packageUseSchema = z.object({
  subscriptionId: z.number().int().positive(),
  stylistId: z.number().int().positive().optional().nullable(),
});

const cashSchema = z.object({
  visitType: z.literal("CASH_WALK_IN"),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  amountBaht: z.number().finite().min(0).max(999_999.99).optional().nullable(),
  stylistId: z.number().int().positive().optional().nullable(),
});

const bodySchema = z.union([packageUseSchema, cashSchema]);

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

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
      where: { id: stylistId, ownerUserId: ownerId, isActive: true },
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
          where: { id: subscriptionId, ownerUserId: ownerId },
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

  const customer = await prisma.barberCustomer.upsert({
    where: {
      ownerUserId_phone: { ownerUserId: ownerId, phone },
    },
    create: {
      ownerUserId: ownerId,
      phone,
      name,
    },
    update: {
      ...(name !== null && name.length > 0 ? { name } : {}),
    },
  });

  await prisma.barberServiceLog.create({
    data: {
      ownerUserId: ownerId,
      subscriptionId: null,
      barberCustomerId: customer.id,
      visitType: "CASH_WALK_IN",
      note,
      ...(amountBaht != null ? { amountBaht } : {}),
      ...(stylistIdResolved != null ? { stylistId: stylistIdResolved } : {}),
    },
  });

  return NextResponse.json({ ok: true, visitType: "CASH_WALK_IN", phone: customer.phone });
}

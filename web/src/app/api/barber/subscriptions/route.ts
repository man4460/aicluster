import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import {
  isPrismaSchemaMismatch,
  THAI_PRISMA_SCHEMA_MISMATCH,
} from "@/lib/prisma-schema-mismatch";

const postSchema = z.object({
  packageId: z.number().int().positive(),
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
  stylistId: z.number().int().positive().optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
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
    },
  ) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    status: s.status,
    remainingSessions: s.remainingSessions,
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

  try {
    const rows = await prisma.barberCustomerSubscription.findMany({
      where: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        customer: true,
        package: true,
        soldByStylist: true,
      },
    });
    return NextResponse.json({
      subscriptions: rows.map((s) => mapRow(s)),
    });
  } catch (e) {
    if (!isPrismaSchemaMismatch(e)) {
      console.error("[barber/subscriptions GET]", e);
      return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
    }
    try {
      const rows = await prisma.barberCustomerSubscription.findMany({
        where: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
        orderBy: { createdAt: "desc" },
        take,
        include: { customer: true, package: true },
      });
      return NextResponse.json({
        subscriptions: rows.map((s) =>
          mapRow({ ...s, soldByStylist: null }),
        ),
      });
    } catch (e2) {
      console.error("[barber/subscriptions GET] fallback", e2);
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
  }
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
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }

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

  const customer = await prisma.barberCustomer.upsert({
    where: {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: own.ownerId,
        phone,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      phone,
      name,
    },
    update: {
      ...(name !== null && name.length > 0 ? { name } : {}),
    },
  });

  const sub = await prisma.barberCustomerSubscription.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      barberCustomerId: customer.id,
      packageId: pkg.id,
      remainingSessions: pkg.totalSessions,
      status: "ACTIVE",
      ...(soldByStylistId != null ? { soldByStylistId } : {}),
    },
    include: { package: true },
  });

  return NextResponse.json({
    subscription: {
      id: sub.id,
      remainingSessions: sub.remainingSessions,
      status: sub.status,
      packageName: sub.package.name,
      customerId: customer.id,
      phone: customer.phone,
    },
  });
}

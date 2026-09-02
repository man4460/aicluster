import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const phone = normalizePhone(searchParams.get("phone") ?? "");
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const customer = await prisma.laundryCustomer.findUnique({
    where: {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: own.ownerId,
        phone,
        trialSessionId: scope.trialSessionId,
      },
    },
    include: {
      subscriptions: {
        where: { status: "ACTIVE", remainingSessions: { gt: 0 } },
        include: { package: true },
        orderBy: { id: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ customer: null, subscriptions: [] });
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
    subscriptions: customer.subscriptions.map((s) => ({
      id: s.id,
      remainingSessions: s.remainingSessions,
      status: s.status,
      packageName: s.package.name,
      packageDescription: s.package.description?.trim() || "",
      packageId: s.packageId,
      totalSessions: s.package.totalSessions,
      durationHours: Number(s.package.durationHours),
      durationMinutes: Math.round(Number(s.package.durationHours) * 60),
      imageUrl: s.package.imageUrl ?? null,
      basePrice: s.package.basePrice,
    })),
  });
}

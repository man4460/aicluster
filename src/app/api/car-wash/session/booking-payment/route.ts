import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import {
  normalizeCarWashPortalPaymentMode,
  type CarWashPortalBookingPaymentMode,
} from "@/lib/car-wash/portal-booking";

function mapPayment(row: {
  portalBookingPaymentMode: string;
  depositAmountBaht: number | null;
}) {
  return {
    portalBookingPaymentMode: normalizeCarWashPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht,
  };
}

async function ensureProfile(ownerUserId: string, trialSessionId: string) {
  return prisma.carWashShopProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: { ownerUserId, trialSessionId },
    update: {},
  });
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);
  const row = await ensureProfile(own.ownerId, scope.trialSessionId);
  return NextResponse.json({ bookingPayment: mapPayment(row) });
}

const patchSchema = z.object({
  portalBookingPaymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]),
  depositAmountBaht: z.number().int().min(0).max(9_999_999).nullable().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const mode: CarWashPortalBookingPaymentMode = parsed.data.portalBookingPaymentMode;
  let deposit = parsed.data.depositAmountBaht ?? null;
  if (mode === "DEPOSIT") {
    if (deposit == null || deposit <= 0) {
      return NextResponse.json({ error: "กรอกจำนวนมัดจำมากกว่า 0 บาท" }, { status: 400 });
    }
  } else {
    deposit = null;
  }

  await ensureProfile(own.ownerId, scope.trialSessionId);
  const row = await prisma.carWashShopProfile.update({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
    data: {
      portalBookingPaymentMode: mode,
      depositAmountBaht: deposit,
    },
  });

  return NextResponse.json({ bookingPayment: mapPayment(row) });
}

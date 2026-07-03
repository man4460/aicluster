import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  moduleShopPaymentPatchSchema,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

const patchSchema = z
  .object({
    propertyName: z.string().max(160).optional(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    checkInTime: z.string().max(8).optional(),
    checkOutTime: z.string().max(8).optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

const select = {
  propertyName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  checkInTime: true,
  checkOutTime: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

function profileFromRow(row: {
  propertyName: string;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  checkInTime: string;
  checkOutTime: string;
  promptPayPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
}) {
  return {
    propertyName: row.propertyName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    ...paymentRowToDto(row),
  };
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const row = await ensureHotelResortProfile(
    prisma,
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
  );
  const full = await prisma.hotelResortProfile.findUnique({
    where: { id: row.id },
    select,
  });
  return NextResponse.json({ profile: profileFromRow(full ?? row) });
}

export async function PATCH(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await ensureHotelResortProfile(prisma, auth.ctx.ownerUserId, auth.ctx.trialSessionId);
  const d = parsed.data;
  const updated = await prisma.hotelResortProfile.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.ctx.ownerUserId,
        trialSessionId: auth.ctx.trialSessionId,
      },
    },
    data: {
      ...(d.propertyName !== undefined ? { propertyName: d.propertyName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.checkInTime !== undefined ? { checkInTime: d.checkInTime } : {}),
      ...(d.checkOutTime !== undefined ? { checkOutTime: d.checkOutTime } : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  return NextResponse.json({ profile: profileFromRow(updated) });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  moduleShopPaymentPatchSchema,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
  })
  .merge(moduleShopPaymentPatchSchema);

function profileFromRow(row: {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  promptPayPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
}) {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
    ...paymentRowToDto(row),
  };
}

const select = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const row = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
  const full = await prisma.drinkPosShopProfile.findUnique({
    where: { id: row.id },
    select,
  });
  return NextResponse.json({ profile: profileFromRow(full ?? row) });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
  const d = parsed.data;
  const updated = await prisma.drinkPosShopProfile.update({
    where: { id: existing.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  return NextResponse.json({ profile: profileFromRow(updated) });
}

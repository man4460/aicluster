import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  moduleShopPaymentPatchSchema,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import {
  appSlipPaperSizeZod,
  normalizeModuleSlipPaperSize,
} from "@/lib/profile/module-slip-paper-size";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { applyStaffDailyPinPatch, loadDrinkPosStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import type { AppSlipPaperSize } from "@/components/app-templates/slip-print";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    slipPaperSize: appSlipPaperSizeZod.optional(),
    orderTicketSlipPaperSize: appSlipPaperSizeZod.optional(),
    staffDailyPin: z.string().max(64).optional().nullable(),
    staffDailyPinClear: z.boolean().optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

function profileFromRow(
  row: {
    displayName: string | null;
    logoUrl: string | null;
    tagline: string | null;
    address?: string | null;
    contactPhone: string | null;
    slipPaperSize?: string | null;
    orderTicketSlipPaperSize?: string | null;
    promptPayPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    taxId?: string | null;
  },
  staffDailyPinSet: boolean,
) {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    address: row.address ?? null,
    contactPhone: row.contactPhone,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize) as AppSlipPaperSize,
    orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(
      row.orderTicketSlipPaperSize,
    ) as AppSlipPaperSize,
    staffDailyPinSet,
    ...paymentRowToDto(row),
  };
}

const select = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  address: true,
  contactPhone: true,
  slipPaperSize: true,
  orderTicketSlipPaperSize: true,
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
  const pinHash = await loadDrinkPosStaffDailyPinHash(auth.ctx.ownerUserId);
  return NextResponse.json({
    profile: profileFromRow(full ?? row, Boolean(pinHash)),
  });
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
  const pinResult = await applyStaffDailyPinPatch({
    ownerId: auth.ctx.ownerUserId,
    module: "drink-pos",
    staffDailyPin: d.staffDailyPin,
    staffDailyPinClear: d.staffDailyPinClear,
  });
  if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 400 });

  const updated = await prisma.drinkPosShopProfile.update({
    where: { id: existing.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.address !== undefined ? { address: d.address?.trim() || null } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...(d.orderTicketSlipPaperSize !== undefined
        ? {
            orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(d.orderTicketSlipPaperSize),
          }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  const pinHash = await loadDrinkPosStaffDailyPinHash(auth.ctx.ownerUserId);
  return NextResponse.json({ profile: profileFromRow(updated, Boolean(pinHash)) });
}

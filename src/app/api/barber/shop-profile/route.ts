import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
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
import { getBarberDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    slipPaperSize: appSlipPaperSizeZod.optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

const select = {
  displayName: true,
  logoUrl: true,
  contactPhone: true,
  address: true,
  slipPaperSize: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

async function barberOwner() {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const scope = await getBarberDataScope(auth.session.sub);
  return { ok: true as const, userId: auth.session.sub, trialSessionId: scope.trialSessionId };
}

function profileFromRow(row: {
  displayName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  slipPaperSize?: string | null;
  promptPayPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
}) {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: null,
    contactPhone: row.contactPhone,
    address: row.address,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    ...paymentRowToDto(row),
  };
}

export async function GET() {
  const own = await barberOwner();
  if (!own.ok) return own.res;
  const row = await prisma.barberShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
    },
    select,
  });
  return NextResponse.json({
    profile: profileFromRow(
      row ?? { displayName: null, logoUrl: null, contactPhone: null, address: null, slipPaperSize: "SLIP_58" },
    ),
  });
}

export async function PATCH(req: Request) {
  const own = await barberOwner();
  if (!own.ok) return own.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.barberShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
    },
    create: {
      ownerUserId: own.userId,
      trialSessionId: own.trialSessionId,
      displayName: d.displayName,
      logoUrl: d.logoUrl,
      contactPhone: d.contactPhone,
      address: d.address,
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    update: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.address !== undefined ? { address: d.address } : {}),
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  return NextResponse.json({ profile: profileFromRow(updated) });
}

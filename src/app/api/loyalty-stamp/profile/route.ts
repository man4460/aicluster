import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  moduleShopPaymentPatchSchema,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import { getLoyaltyStampOwnerContext } from "@/systems/loyalty-stamp/lib/api-auth";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    publicCardEnabled: z.boolean().optional(),
    stampsPerReward: z.number().int().min(1).max(30).optional(),
    rewardTitle: z.string().max(160).optional(),
    rewardDescription: z.string().max(500).optional().nullable(),
    stampEmoji: z.string().max(8).optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

const select = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  publicCardEnabled: true,
  stampsPerReward: true,
  rewardTitle: true,
  rewardDescription: true,
  stampEmoji: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

function profileFromRow(row: {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  publicCardEnabled: boolean;
  stampsPerReward: number;
  rewardTitle: string;
  rewardDescription: string | null;
  stampEmoji: string;
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
    publicCardEnabled: row.publicCardEnabled,
    stampsPerReward: row.stampsPerReward,
    rewardTitle: row.rewardTitle,
    rewardDescription: row.rewardDescription,
    stampEmoji: row.stampEmoji,
    ...paymentRowToDto(row),
  };
}

export async function GET() {
  const owner = await getLoyaltyStampOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = owner.profile;
  return NextResponse.json({ profile: profileFromRow(p) });
}

export async function PATCH(req: Request) {
  const owner = await getLoyaltyStampOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.loyaltyStampShopProfile.update({
    where: { id: owner.profile.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.publicCardEnabled !== undefined ? { publicCardEnabled: d.publicCardEnabled } : {}),
      ...(d.stampsPerReward !== undefined ? { stampsPerReward: d.stampsPerReward } : {}),
      ...(d.rewardTitle !== undefined ? { rewardTitle: d.rewardTitle } : {}),
      ...(d.rewardDescription !== undefined ? { rewardDescription: d.rewardDescription } : {}),
      ...(d.stampEmoji !== undefined ? { stampEmoji: d.stampEmoji } : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  return NextResponse.json({ profile: profileFromRow(updated) });
}

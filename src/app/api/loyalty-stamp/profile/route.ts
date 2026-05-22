import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLoyaltyStampOwnerContext } from "@/systems/loyalty-stamp/lib/api-auth";

const patchSchema = z.object({
  displayName: z.string().max(200).optional().nullable(),
  tagline: z.string().max(300).optional().nullable(),
  publicCardEnabled: z.boolean().optional(),
  stampsPerReward: z.number().int().min(1).max(30).optional(),
  rewardTitle: z.string().max(160).optional(),
  rewardDescription: z.string().max(500).optional().nullable(),
  stampEmoji: z.string().max(8).optional(),
});

export async function GET() {
  const owner = await getLoyaltyStampOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = owner.profile;
  return NextResponse.json({
    profile: {
      displayName: p.displayName,
      tagline: p.tagline,
      publicCardEnabled: p.publicCardEnabled,
      stampsPerReward: p.stampsPerReward,
      rewardTitle: p.rewardTitle,
      rewardDescription: p.rewardDescription,
      stampEmoji: p.stampEmoji,
    },
  });
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

  const updated = await prisma.loyaltyStampShopProfile.update({
    where: { id: owner.profile.id },
    data: parsed.data,
  });

  return NextResponse.json({
    profile: {
      displayName: updated.displayName,
      tagline: updated.tagline,
      publicCardEnabled: updated.publicCardEnabled,
      stampsPerReward: updated.stampsPerReward,
      rewardTitle: updated.rewardTitle,
      rewardDescription: updated.rewardDescription,
      stampEmoji: updated.stampEmoji,
    },
  });
}

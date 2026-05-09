import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const SettingsSchema = z.object({
  orgName: z.string().trim().max(160).nullable().optional(),
  orgAddress: z.string().trim().max(2000).nullable().optional(),
  orgPhone: z.string().trim().max(40).nullable().optional(),
  orgEmail: z.string().trim().max(160).nullable().optional(),
  assetPrefix: z.string().trim().min(1).max(10).optional(),
  txPrefix: z.string().trim().min(1).max(10).optional(),
  mtPrefix: z.string().trim().min(1).max(10).optional(),
  dpPrefix: z.string().trim().min(1).max(10).optional(),
  auPrefix: z.string().trim().min(1).max(10).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
});

export async function GET() {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const setting = await prisma.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
  return NextResponse.json({ setting });
}

export async function PUT(req: Request) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const setting = await prisma.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: parsed.data,
    create: { ownerUserId, trialSessionId, ...parsed.data },
  });
  return NextResponse.json({ setting });
}

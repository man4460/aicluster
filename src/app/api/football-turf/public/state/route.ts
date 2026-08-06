import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { FOOTBALL_TURF_MODULE_SLUG } from "@/lib/modules/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

async function isFootballTurfPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: FOOTBALL_TURF_MODULE_SLUG, isActive: true },
    }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        role: true,
        subscriptionType: true,
        subscriptionTier: true,
        tokens: true,
      },
    }),
  ]);
  if (!mod || !user) return false;
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  return canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId });
}

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim();

  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const rl = rateLimit(`ft-public-state:${ip}:${ownerId}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "โหลดถี่เกินไป" }, { status: 429 });

  const portalOk = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(ownerId, trialParam);
  await ensureFootballTurfProfile(ownerId, trialSessionId);

  const repo = createFootballTurfServerRepo(ownerId, trialSessionId);
  const state = await repo.loadPublicState();
  return NextResponse.json(state);
}

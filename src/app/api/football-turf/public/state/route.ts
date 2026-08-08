import { NextResponse } from "next/server";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

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

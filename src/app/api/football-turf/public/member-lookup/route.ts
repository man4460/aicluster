import { NextResponse } from "next/server";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { normalizeFootballTurfPhoneDigits } from "@/systems/football-turf/lib/member-phone-search";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

/**
 * ค้นหาสมาชิกจากเบอร์เต็มเพื่อจอง — คืนชื่อ/ทีมเมื่อพบ (จับคู่เบอร์ตรงเท่านั้น)
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let body: { ownerId?: string; phone?: string; t?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = body.ownerId?.trim() ?? "";
  const phone = normalizeFootballTurfPhoneDigits(body.phone ?? "");
  if (ownerId.length < 10 || phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์โทรให้ครบ" }, { status: 400 });
  }

  const rl = rateLimit(`ft-public-member:${ip}:${ownerId}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ค้นหาถี่เกินไป" }, { status: 429 });

  const portalOk = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(ownerId, body.t);
  await ensureFootballTurfProfile(ownerId, trialSessionId);

  const repo = createFootballTurfServerRepo(ownerId, trialSessionId);
  const result = await repo.lookupPublicMemberForBooking(phone);
  return NextResponse.json(result);
}

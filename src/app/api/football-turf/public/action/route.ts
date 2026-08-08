import { NextResponse } from "next/server";
import { runFootballTurfAction } from "@/systems/football-turf/lib/run-action";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

type PublicActionBody = {
  ownerId: string;
  trialSessionId?: string | null;
  op: string;
  id?: number;
  input?: Record<string, unknown>;
};

const PUBLIC_OPS = new Set(["createBooking", "updateBooking", "usePromotionSale"]);

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`ft-public-action:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let body: PublicActionBody;
  try {
    body = (await req.json()) as PublicActionBody;
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = body.ownerId?.trim() ?? "";
  if (ownerId.length < 10 || !body.op) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!PUBLIC_OPS.has(body.op)) {
    return NextResponse.json({ error: "op not allowed" }, { status: 403 });
  }

  const portalOk = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(
    ownerId,
    body.trialSessionId,
  );
  await ensureFootballTurfProfile(ownerId, trialSessionId);

  const repo = createFootballTurfServerRepo(ownerId, trialSessionId);

  if (body.op === "updateBooking") {
    const patch = body.input ?? {};
    const allowedKeys = new Set(["status", "paymentMethod", "paymentStatus", "paymentSlipDataUrl", "paymentReference"]);
    const keys = Object.keys(patch);
    if (keys.length === 0 || keys.some((k) => !allowedKeys.has(k))) {
      return NextResponse.json({ error: "updateBooking allows status/payment fields only" }, { status: 400 });
    }
    if (patch.status && patch.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "public updateBooking status must be CHECKED_IN" }, { status: 400 });
    }
  }

  const outcome = await runFootballTurfAction(repo, {
    op: body.op,
    id: body.id,
    input: body.input,
  });
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  return NextResponse.json({ result: outcome.result });
}

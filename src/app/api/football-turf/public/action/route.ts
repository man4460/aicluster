import { NextResponse } from "next/server";
import { runFootballTurfAction } from "@/systems/football-turf/lib/run-action";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";
import {
  footballTurfComputePortalPayDue,
  footballTurfCourtPriceForDate,
  footballTurfPortalSlipProofMessage,
  normalizeFootballTurfPortalPaymentMode,
} from "@/systems/football-turf/lib/portal-booking";

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

  if (body.op === "createBooking") {
    const input = { ...(body.input ?? {}) };
    const courtId = Number(input.courtId);
    const bookingDate = typeof input.bookingDate === "string" ? input.bookingDate.trim() : "";
    if (!Number.isFinite(courtId) || courtId < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return NextResponse.json({ error: "ข้อมูลการจองไม่ถูกต้อง" }, { status: 400 });
    }

    const [settings, courts] = await Promise.all([repo.getSettings(), repo.listCourts()]);
    const court = courts.find((c) => c.id === courtId && c.isActive);
    if (!court) return NextResponse.json({ error: "ไม่พบสนาม" }, { status: 404 });

    const totalBaht = footballTurfCourtPriceForDate(court, bookingDate);
    const mode = normalizeFootballTurfPortalPaymentMode(settings.portalBookingPaymentMode);
    if (mode === "DEPOSIT") {
      const dep = Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0)));
      if (dep <= 0) {
        return NextResponse.json(
          { error: "สนามตั้งโหมดมัดจำแล้ว แต่ยังไม่ได้กำหนดจำนวนมัดจำ" },
          { status: 400 },
        );
      }
    }

    const payDue = footballTurfComputePortalPayDue({
      mode,
      depositAmountBaht: settings.depositAmountBaht,
      totalBaht,
    });
    const slipUrl =
      typeof input.paymentSlipDataUrl === "string" ? input.paymentSlipDataUrl.trim() : "";

    if (payDue != null && payDue > 0) {
      if (!slipUrl) {
        return NextResponse.json({ error: footballTurfPortalSlipProofMessage(mode) }, { status: 400 });
      }
    }

    const noteBase =
      typeof input.note === "string" && input.note.trim()
        ? input.note.trim()
        : "ลูกค้าจองผ่านลิงก์สนาม";
    const payNote =
      payDue != null && payDue > 0
        ? mode === "DEPOSIT"
          ? `ลูกค้าจองผ่านลิงก์ · มัดจำ ${payDue} บาท`
          : "ลูกค้าจองผ่านลิงก์ · ชำระเต็มยอด"
        : noteBase;

    body.input = {
      ...input,
      courtId,
      courtName: court.name,
      bookingDate,
      source: "ONLINE",
      status: "BOOKED",
      listedPrice: totalBaht,
      finalPrice: totalBaht,
      depositAmountBaht: payDue,
      note: payNote.slice(0, 500),
      paymentMethod: payDue != null && payDue > 0 ? "TRANSFER" : "UNPAID",
      paymentStatus: payDue != null && payDue > 0 ? "PENDING_REVIEW" : "UNPAID",
      paymentSlipDataUrl: payDue != null && payDue > 0 ? slipUrl : "",
      paymentReference: typeof input.paymentReference === "string" ? input.paymentReference.trim() : "",
      promotionSaleId: null,
    };
  }

  const outcome = await runFootballTurfAction(repo, {
    op: body.op,
    id: body.id,
    input: body.input,
  });
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  return NextResponse.json({ result: outcome.result });
}

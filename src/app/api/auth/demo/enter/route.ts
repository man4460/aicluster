import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { establishDemoSession } from "@/lib/auth/demo-enter";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requestHostRedirectOrigin } from "@/lib/http/public-redirect-origin";
import { prisma } from "@/lib/prisma";
import {
  MODULE_TRY_UTM_COOKIE,
  MODULE_TRY_VISITOR_COOKIE,
  hashModuleTryVisitorKey,
  moduleSlugFromTryNextPath,
  moduleTryUtmFromCookieValue,
  newModuleTryVisitorId,
  parseModuleTryUtm,
  parseReferrerHost,
  recordModuleTryEvent,
} from "@/lib/modules/try-analytics";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

async function trackTryClick(req: Request, next: string, utmRaw: Record<string, string | null>) {
  const slug = moduleSlugFromTryNextPath(next);
  if (!slug) return;
  try {
    const jar = await cookies();
    const existingVid = jar.get(MODULE_TRY_VISITOR_COOKIE)?.value ?? null;
    const pickVid =
      (existingVid && /^[a-f0-9]{16,64}$/i.test(existingVid) && existingVid.toLowerCase()) ||
      newModuleTryVisitorId();
    const visitorKey = hashModuleTryVisitorKey({
      cookieId: pickVid,
      ip: clientIp(req.headers),
      ua: req.headers.get("user-agent"),
    });
    const fromForm = parseModuleTryUtm(utmRaw);
    const fromCookie = moduleTryUtmFromCookieValue(jar.get(MODULE_TRY_UTM_COOKIE)?.value);
    const utm = {
      utmSource: fromForm.utmSource ?? fromCookie.utmSource,
      utmMedium: fromForm.utmMedium ?? fromCookie.utmMedium,
      utmCampaign: fromForm.utmCampaign ?? fromCookie.utmCampaign,
      utmContent: fromForm.utmContent ?? fromCookie.utmContent,
      utmTerm: fromForm.utmTerm ?? fromCookie.utmTerm,
    };
    await recordModuleTryEvent(prisma, {
      moduleSlug: slug,
      eventType: "TRY_CLICK",
      utm,
      visitorKey,
      referrerHost: parseReferrerHost(req.headers.get("referer")),
    });
  } catch (e) {
    console.error("[demo-enter try-click]", e);
  }
}

async function enterDemo(
  req: Request,
  nextRaw: string | null,
  utmRaw: Record<string, string | null> = {},
): Promise<NextResponse> {
  const origin = requestHostRedirectOrigin(req);
  const next = safeNextPath(nextRaw);

  const ip = clientIp(req.headers);
  const rl = rateLimit(`demo_enter:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/login?error=demo_rate_limited", origin), 303);
  }

  await trackTryClick(req, next, utmRaw);

  const result = await establishDemoSession(req);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${result.error}`, origin), 303);
  }

  return NextResponse.redirect(new URL(next, origin), 303);
}

/** GET — สำหรับสแกน QR / ลิงก์ทดลองโมดูล (`?next=/dashboard/...`) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  return enterDemo(req, url.searchParams.get("next"), {
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    utm_content: url.searchParams.get("utm_content"),
    utm_term: url.searchParams.get("utm_term"),
  });
}

/**
 * เข้าบัญชีทดลอง — เก็บ JWT เดิมไว้ในคุกกี้ชั่วคราว (ถ้าไม่ใช่บัญชีทดลองอยู่แล้ว) แล้วล็อกอินเป็นบัญชี DEMO_ACCOUNT_*
 */
export async function POST(req: Request) {
  let nextRaw: string | null = null;
  const utmRaw: Record<string, string | null> = {};
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = (await req.json()) as Record<string, unknown>;
      nextRaw = typeof j.next === "string" ? j.next : null;
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
        utmRaw[k] = typeof j[k] === "string" ? j[k] : null;
      }
    } catch {
      /* keep null */
    }
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      if (typeof fd.get("next") === "string") nextRaw = String(fd.get("next"));
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
        const v = fd.get(k);
        utmRaw[k] = typeof v === "string" ? v : null;
      }
    }
  }
  return enterDemo(req, nextRaw, utmRaw);
}

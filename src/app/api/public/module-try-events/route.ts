import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  MODULE_TRY_UTM_COOKIE,
  MODULE_TRY_VISITOR_COOKIE,
  hashModuleTryVisitorKey,
  hasAnyUtm,
  newModuleTryVisitorId,
  parseModuleTryUtm,
  parseReferrerHost,
  recordModuleTryEvent,
  serializeModuleTryUtmCookie,
} from "@/lib/modules/try-analytics";

export const dynamic = "force-dynamic";

const VID_MAX_AGE = 60 * 60 * 24 * 400; // ~400 วัน
const UTM_MAX_AGE = 60 * 60 * 24 * 30;

type Body = {
  moduleSlug?: string;
  eventType?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  visitorId?: string | null;
};

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`module_try_event:${ip}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slug = typeof body.moduleSlug === "string" ? body.moduleSlug.trim().slice(0, 191) : "";
  if (!slug) return NextResponse.json({ error: "module_slug_required" }, { status: 400 });

  const eventType = body.eventType === "TRY_CLICK" ? "TRY_CLICK" : body.eventType === "VIEW" ? "VIEW" : null;
  if (!eventType) return NextResponse.json({ error: "event_type_invalid" }, { status: 400 });

  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { slug: true },
  });
  if (!mod) return NextResponse.json({ error: "module_not_found" }, { status: 404 });

  const jar = await cookies();
  const existingVid = jar.get(MODULE_TRY_VISITOR_COOKIE)?.value ?? null;
  const bodyVid = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
  const pickVid =
    (existingVid && /^[a-f0-9]{16,64}$/i.test(existingVid) && existingVid.toLowerCase()) ||
    (bodyVid && /^[a-f0-9]{16,64}$/i.test(bodyVid) && bodyVid.toLowerCase()) ||
    newModuleTryVisitorId();
  const visitorKey = hashModuleTryVisitorKey({
    cookieId: pickVid,
    ip,
    ua: req.headers.get("user-agent"),
  });

  const utm = parseModuleTryUtm({
    utmSource: body.utmSource,
    utmMedium: body.utmMedium,
    utmCampaign: body.utmCampaign,
    utmContent: body.utmContent,
    utmTerm: body.utmTerm,
  });

  try {
    await recordModuleTryEvent(prisma, {
      moduleSlug: mod.slug,
      eventType,
      utm,
      visitorKey,
      referrerHost: parseReferrerHost(req.headers.get("referer")),
    });
  } catch (e) {
    console.error("[module-try-events]", e);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, visitorKey });
  if (existingVid?.toLowerCase() !== pickVid) {
    res.cookies.set(MODULE_TRY_VISITOR_COOKIE, pickVid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VID_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }
  if (hasAnyUtm(utm)) {
    res.cookies.set(MODULE_TRY_UTM_COOKIE, serializeModuleTryUtmCookie(utm), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: UTM_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

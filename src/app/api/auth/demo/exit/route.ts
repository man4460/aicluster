import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_RETURN_SESSION_COOKIE } from "@/lib/auth/constants";
import { isDemoSessionUsername } from "@/lib/auth/demo-account";
import { sessionCookieSecureForIncomingRequest } from "@/lib/auth/cookie-secure";
import {
  clearSessionCookie,
  setSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session";
import { publicRedirectOriginFromRequest } from "@/lib/http/public-redirect-origin";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function isLikelyPrefetch(req: Request): boolean {
  const purpose = (req.headers.get("purpose") ?? req.headers.get("Sec-Purpose") ?? "").toLowerCase();
  if (purpose.includes("prefetch")) return true;
  if (req.headers.get("Next-Router-Prefetch") === "1") return true;
  if (req.headers.get("Next-Router-Segment-Prefetch") === "1") return true;
  return false;
}

async function clearDemoReturnCookie(req: Request): Promise<void> {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  store.set(DEMO_RETURN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function exitDemo(req: Request, nextRaw: string | null): Promise<NextResponse> {
  const store = await cookies();
  const ret = store.get(DEMO_RETURN_SESSION_COOKIE)?.value ?? null;
  const origin = publicRedirectOriginFromRequest(req);
  const forcedNext = safeNextPath(nextRaw);

  /** ออกไปล็อกอิน/สมัคร — ไม่คืนเซสชันเดิม */
  if (forcedNext) {
    await clearDemoReturnCookie(req);
    await clearSessionCookie(req);
    return NextResponse.redirect(new URL(forcedNext, origin), 303);
  }

  await clearDemoReturnCookie(req);

  if (ret) {
    const prev = await verifySessionToken(ret);
    if (prev && !isDemoSessionUsername(prev.username)) {
      await setSessionCookie(ret, req);
      return NextResponse.redirect(new URL("/dashboard", origin), 303);
    }
  }

  await clearSessionCookie(req);
  return NextResponse.redirect(new URL("/login", origin), 303);
}

async function readNextFromRequest(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("next");
  if (fromQuery) return fromQuery;

  if (req.method === "GET") return null;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = (await req.json()) as { next?: string };
      return typeof j.next === "string" ? j.next : null;
    } catch {
      return null;
    }
  }
  const fd = await req.formData().catch(() => null);
  if (fd && typeof fd.get("next") === "string") return String(fd.get("next"));
  return null;
}

/**
 * GET ไม่ล้าง session — เคยถูก Next <Link> prefetch แล้วเด้งล็อกอิน
 * ออกจากบัญชีทดลองใช้ POST เท่านั้น (แบนเนอร์เป็น form)
 */
export async function GET(req: Request) {
  if (isLikelyPrefetch(req)) {
    return new NextResponse(null, { status: 204 });
  }
  const origin = publicRedirectOriginFromRequest(req);
  return NextResponse.redirect(new URL("/dashboard", origin), 303);
}

/** ออกจากบัญชีทดลอง — คืนเซสชันเดิมถ้ามี ไม่มีให้ไปหน้าเข้าสู่ระบบ */
export async function POST(req: Request) {
  const next = await readNextFromRequest(req);
  return exitDemo(req, next);
}

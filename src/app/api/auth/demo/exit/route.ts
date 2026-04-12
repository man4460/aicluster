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

/** ออกจากบัญชีทดลอง — คืนเซสชันเดิมถ้ามี ไม่มีให้ไปหน้าเข้าสู่ระบบ */
export async function POST(req: Request) {
  const store = await cookies();
  const ret = store.get(DEMO_RETURN_SESSION_COOKIE)?.value ?? null;
  await clearDemoReturnCookie(req);

  const origin = publicRedirectOriginFromRequest(req);

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

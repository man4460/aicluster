import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  DEMO_RETURN_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import {
  getDemoLoginPassword,
  getDemoLoginUsername,
  isDemoAccountConfiguredForEntry,
  isDemoSessionUsername,
} from "@/lib/auth/demo-account";
import { sessionCookieSecureForIncomingRequest } from "@/lib/auth/cookie-secure";
import { setSessionCookie, signSessionToken, verifySessionToken } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { publicRedirectOriginFromRequest } from "@/lib/http/public-redirect-origin";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

async function setDemoReturnCookie(token: string, req: Request): Promise<void> {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  store.set(DEMO_RETURN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 3,
  });
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

/**
 * เข้าบัญชีทดลอง — เก็บ JWT เดิมไว้ในคุกกี้ชั่วคราว (ถ้าไม่ใช่บัญชีทดลองอยู่แล้ว) แล้วล็อกอินเป็นบัญชี DEMO_ACCOUNT_*
 */
export async function POST(req: Request) {
  const origin = publicRedirectOriginFromRequest(req);

  if (!isDemoAccountConfiguredForEntry()) {
    return NextResponse.redirect(new URL("/login?error=demo_not_configured", origin), 303);
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`demo_enter:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/login?error=demo_rate_limited", origin), 303);
  }

  let next = "/dashboard";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = (await req.json()) as { next?: string };
      next = safeNextPath(typeof j.next === "string" ? j.next : null);
    } catch {
      /* keep default */
    }
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      next = safeNextPath(typeof fd.get("next") === "string" ? String(fd.get("next")) : null);
    }
  }

  const store = await cookies();
  const currentJwt = store.get(SESSION_COOKIE)?.value;
  if (currentJwt) {
    const cur = await verifySessionToken(currentJwt);
    if (cur && !isDemoSessionUsername(cur.username)) {
      await setDemoReturnCookie(currentJwt, req);
    }
  } else {
    await clearDemoReturnCookie(req);
  }

  const demoUserName = getDemoLoginUsername()!;
  const demoPass = getDemoLoginPassword()!;

  const user = await prisma.user.findFirst({
    where: { username: demoUserName },
  });

  if (!user?.passwordHash) {
    return NextResponse.redirect(new URL("/login?error=demo_user_missing", origin), 303);
  }

  const valid = await verifyPassword(demoPass, user.passwordHash);
  if (!valid) {
    return NextResponse.redirect(new URL("/login?error=demo_credentials_mismatch", origin), 303);
  }

  await applyDailyTokenDeduction(user.id);
  await applyBuffetMonthlyBilling(user.id);

  const jwt = await signSessionToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(jwt, req);

  return NextResponse.redirect(new URL(next, origin), 303);
}

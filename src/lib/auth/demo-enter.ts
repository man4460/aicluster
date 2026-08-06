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
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";

export type DemoEnterResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "demo_not_configured"
        | "demo_user_missing"
        | "demo_credentials_mismatch";
    };

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
 * ตั้งเซสชันเป็นบัญชีทดลอง (ไม่ redirect) — ใช้จาก API และหน้า /try/[slug]
 */
export async function establishDemoSession(req: Request): Promise<DemoEnterResult> {
  if (!isDemoAccountConfiguredForEntry()) {
    return { ok: false, error: "demo_not_configured" };
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
    return { ok: false, error: "demo_user_missing" };
  }

  const valid = await verifyPassword(demoPass, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "demo_credentials_mismatch" };
  }

  await applyDailyTokenDeduction(user.id);
  await applyBuffetMonthlyBilling(user.id);

  const jwt = await signSessionToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(jwt, req);

  return { ok: true };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_PKCE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import { cookies } from "next/headers";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserInfo,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
  resolveGoogleOAuthOrigin,
} from "@/lib/auth/google-oauth";
import { clearGoogleOauthCookies } from "@/lib/auth/google-oauth-cookies";
import { findOrCreateUserFromGoogle } from "@/lib/auth/google-user";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function loginError(code: string, req: Request): NextResponse {
  const origin = resolveGoogleOAuthOrigin(req);
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, origin));
}

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return loginError("google_not_configured", req);
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err === "access_denied") {
    await clearGoogleOauthCookies(req);
    return loginError("google_access_denied", req);
  }
  if (err) {
    await clearGoogleOauthCookies(req);
    return loginError("google_auth_failed", req);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const savedState = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextRaw = store.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value;
  const pkceVerifier = store.get(GOOGLE_OAUTH_PKCE_COOKIE)?.value;
  await clearGoogleOauthCookies(req);

  if (!code || !state || !savedState || state !== savedState || !pkceVerifier) {
    return loginError("google_state", req);
  }

  const origin = resolveGoogleOAuthOrigin(req);
  const redirectUri = getGoogleRedirectUri(origin);
  const tokens = await exchangeGoogleAuthorizationCode(code, redirectUri, pkceVerifier);
  if (!tokens) {
    return loginError("google_token", req);
  }

  const profile = await fetchGoogleUserInfo(tokens.access_token);
  if (!profile) {
    return loginError("google_profile", req);
  }

  const resolved = await findOrCreateUserFromGoogle(prisma, profile);
  if (!resolved.ok) {
    const map: Record<string, string> = {
      email_unverified: "google_email_unverified",
      account_conflict: "google_account_conflict",
      create_failed: "google_create_failed",
    };
    return loginError(map[resolved.code] ?? "google_auth_failed", req);
  }

  await applyDailyTokenDeduction(resolved.userId);
  await applyBuffetMonthlyBilling(resolved.userId);

  const user = await prisma.user.findUnique({
    where: { id: resolved.userId },
    select: { username: true, role: true, tokens: true },
  });
  if (!user) {
    return loginError("google_auth_failed", req);
  }

  const jwt = await signSessionToken({
    id: resolved.userId,
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(jwt, req);

  const next = safeNextPath(nextRaw);
  return NextResponse.redirect(new URL(next, origin));
}

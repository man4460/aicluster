import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google-oauth";
import { setGoogleOauthCookies } from "@/lib/auth/google-oauth-cookies";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const redirectUri = getGoogleRedirectUri(origin);
  const state = randomBytes(24).toString("hex");
  const next = safeNextPath(url.searchParams.get("next"));

  await setGoogleOauthCookies(req, state, next);

  const authUrl = buildGoogleAuthorizationUrl({ state, redirectUri });
  return NextResponse.redirect(authUrl);
}

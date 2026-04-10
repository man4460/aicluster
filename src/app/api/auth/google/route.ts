import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createGooglePkcePair,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
  resolveGoogleOAuthOrigin,
} from "@/lib/auth/google-oauth";
import { setGoogleOauthCookies } from "@/lib/auth/google-oauth-cookies";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", resolveGoogleOAuthOrigin(req)),
    );
  }

  const url = new URL(req.url);
  const origin = resolveGoogleOAuthOrigin(req);
  const redirectUri = getGoogleRedirectUri(origin);
  const state = randomBytes(24).toString("hex");
  const next = safeNextPath(url.searchParams.get("next"));
  const { verifier: pkceVerifier, challenge: pkceChallenge } = createGooglePkcePair();

  await setGoogleOauthCookies(req, state, next, pkceVerifier);

  const authUrl = buildGoogleAuthorizationUrl({ state, redirectUri, codeChallenge: pkceChallenge });
  return NextResponse.redirect(authUrl);
}

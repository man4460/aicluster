import { cookies } from "next/headers";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_PKCE_COOKIE,
  GOOGLE_OAUTH_REFERRER_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import { sessionCookieSecureForIncomingRequest } from "@/lib/auth/cookie-secure";

export async function clearGoogleOauthCookies(req: Request) {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  const opts = { httpOnly: true as const, secure, sameSite: "lax" as const, path: "/", maxAge: 0 };
  store.set(GOOGLE_OAUTH_STATE_COOKIE, "", opts);
  store.set(GOOGLE_OAUTH_NEXT_COOKIE, "", opts);
  store.set(GOOGLE_OAUTH_PKCE_COOKIE, "", opts);
  store.set(GOOGLE_OAUTH_REFERRER_COOKIE, "", opts);
}

export async function setGoogleOauthCookies(
  req: Request,
  state: string,
  nextPath: string,
  pkceVerifier: string,
) {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  const opts = { httpOnly: true as const, secure, sameSite: "lax" as const, path: "/", maxAge: 600 };
  store.set(GOOGLE_OAUTH_STATE_COOKIE, state, opts);
  store.set(GOOGLE_OAUTH_NEXT_COOKIE, nextPath, opts);
  store.set(GOOGLE_OAUTH_PKCE_COOKIE, pkceVerifier, opts);
  store.set(GOOGLE_OAUTH_REFERRER_COOKIE, "", { ...opts, maxAge: 0 });
}

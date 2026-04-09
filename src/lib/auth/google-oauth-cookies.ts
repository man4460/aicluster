import { cookies } from "next/headers";
import { GOOGLE_OAUTH_NEXT_COOKIE, GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/auth/constants";
import { sessionCookieSecureForIncomingRequest } from "@/lib/auth/cookie-secure";

export async function clearGoogleOauthCookies(req: Request) {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  const opts = { httpOnly: true as const, secure, sameSite: "lax" as const, path: "/", maxAge: 0 };
  store.set(GOOGLE_OAUTH_STATE_COOKIE, "", opts);
  store.set(GOOGLE_OAUTH_NEXT_COOKIE, "", opts);
}

export async function setGoogleOauthCookies(req: Request, state: string, nextPath: string) {
  const store = await cookies();
  const secure = sessionCookieSecureForIncomingRequest(req);
  const opts = { httpOnly: true as const, secure, sameSite: "lax" as const, path: "/", maxAge: 600 };
  store.set(GOOGLE_OAUTH_STATE_COOKIE, state, opts);
  store.set(GOOGLE_OAUTH_NEXT_COOKIE, nextPath, opts);
}

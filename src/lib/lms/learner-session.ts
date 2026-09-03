import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  sessionCookieSecure,
  sessionCookieSecureForIncomingRequest,
} from "@/lib/auth/cookie-secure";

export const LMS_LEARNER_SESSION_COOKIE = "lms_learner_session";

/** Path ครอบทั้งหน้าพอร์ทัล `/lms` และ API `/api/lms` */
const COOKIE_PATH = "/";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type LmsLearnerSessionPayload = {
  learnerId: string;
  profileId: string;
  slug: string;
  exp: number;
};

function hmacSecret(): string {
  const s =
    process.env.SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (s && s.length >= 8) return s;
  return "dev-lms-learner-session-secret";
}

export function createLmsLearnerToken(
  payload: Omit<LmsLearnerSessionPayload, "exp"> & { exp?: number },
): string {
  const full: LmsLearnerSessionPayload = {
    learnerId: payload.learnerId,
    profileId: payload.profileId,
    slug: payload.slug,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = createHmac("sha256", hmacSecret()).update(body, "utf8").digest("base64url");
  return `${body}.${sig}`;
}

export function verifyLmsLearnerToken(
  token: string | null | undefined,
): LmsLearnerSessionPayload | null {
  const raw = token?.trim() ?? "";
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = createHmac("sha256", hmacSecret()).update(body, "utf8").digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LmsLearnerSessionPayload;
    if (
      typeof parsed.learnerId !== "string" ||
      typeof parsed.profileId !== "string" ||
      typeof parsed.slug !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setLmsLearnerSessionCookie(token: string, req?: Request): Promise<void> {
  const store = await cookies();
  const secure = req ? sessionCookieSecureForIncomingRequest(req) : sessionCookieSecure();
  store.set(LMS_LEARNER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearLmsLearnerSessionCookie(req?: Request): Promise<void> {
  const store = await cookies();
  const secure = req ? sessionCookieSecureForIncomingRequest(req) : sessionCookieSecure();
  store.set(LMS_LEARNER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

export async function readLmsLearnerSession(): Promise<LmsLearnerSessionPayload | null> {
  const store = await cookies();
  return verifyLmsLearnerToken(store.get(LMS_LEARNER_SESSION_COOKIE)?.value);
}

import { cookies } from "next/headers";
import * as jose from "jose";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  sessionCookieSecure,
  sessionCookieSecureForIncomingRequest,
} from "@/lib/auth/cookie-secure";

export type SessionUser = {
  sub: string;
  username: string;
  role: "USER" | "ADMIN";
};

function encodeAuthSecret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export async function signSessionToken(user: {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
}) {
  const enc = encodeAuthSecret();
  if (!enc) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return new jose.SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(enc);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const enc = encodeAuthSecret();
  if (!enc) return null;
  try {
    const { payload } = await jose.jwtVerify(token, enc);
    const sub = payload.sub;
    const username = payload.username;
    const role = payload.role;
    if (typeof sub !== "string" || typeof username !== "string") return null;
    if (role !== "USER" && role !== "ADMIN") return null;
    return { sub, username, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string, req?: Request) {
  const store = await cookies();
  const secure = req ? sessionCookieSecureForIncomingRequest(req) : sessionCookieSecure();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(req?: Request) {
  const store = await cookies();
  const secure = req ? sessionCookieSecureForIncomingRequest(req) : sessionCookieSecure();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

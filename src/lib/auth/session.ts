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

/** แชร์ session ข้ามโดเมนย่อย (เช่น `.ma-well.com` สำหรับ app. / buffet.) — ปล่อยว่าง = host-only */
function sessionCookieDomain(): string | undefined {
  const raw = process.env.COOKIE_DOMAIN?.trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower === "localhost" || lower.startsWith("127.")) return undefined;
  const d = raw.startsWith(".") ? raw : `.${raw}`;
  if (d.length < 3 || d.length > 253) return undefined;
  if (!/^\.[a-z0-9][a-z0-9.-]*$/i.test(d)) return undefined;
  return d;
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
  const domain = sessionCookieDomain();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    ...(domain ? { domain } : {}),
  });
}

export async function clearSessionCookie(req?: Request) {
  const store = await cookies();
  const secure = req ? sessionCookieSecureForIncomingRequest(req) : sessionCookieSecure();
  const domain = sessionCookieDomain();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
}

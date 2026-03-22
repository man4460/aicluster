import * as jose from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

function secretBytes() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

async function hasValidSession(request: NextRequest) {
  const enc = secretBytes();
  if (!enc) return false;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jose.jwtVerify(token, enc);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");

  if (pathname.startsWith("/dashboard")) {
    const ok = await hasValidSession(request);
    if (!ok) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (isAuthPage) {
    const ok = await hasValidSession(request);
    if (ok) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};

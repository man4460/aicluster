import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGoogleUserInfo } from "@/lib/auth/google-oauth";
import { findOrCreateUserFromGoogle } from "@/lib/auth/google-user";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * MelodyWebapp-style: รับ access_token จาก @react-oauth/google ฝั่งเบราว์เซอร์
 * ไม่ต้องใช้ GOOGLE_CLIENT_SECRET / redirect callback
 */
export async function POST(req: Request) {
  let body: { accessToken?: string; next?: string };
  try {
    body = (await req.json()) as { accessToken?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "google_auth_failed" }, { status: 400 });
  }

  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  if (!accessToken) {
    return NextResponse.json({ error: "google_token" }, { status: 400 });
  }

  const profile = await fetchGoogleUserInfo(accessToken);
  if (!profile) {
    return NextResponse.json({ error: "google_profile" }, { status: 401 });
  }

  const resolved = await findOrCreateUserFromGoogle(prisma, profile);
  if (!resolved.ok) {
    const map: Record<string, string> = {
      email_unverified: "google_email_unverified",
      account_conflict: "google_account_conflict",
      create_failed: "google_create_failed",
    };
    return NextResponse.json({ error: map[resolved.code] ?? "google_auth_failed" }, { status: 403 });
  }

  await applyDailyTokenDeduction(resolved.userId);
  await applyBuffetMonthlyBilling(resolved.userId);

  const user = await prisma.user.findUnique({
    where: { id: resolved.userId },
    select: { username: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "google_auth_failed" }, { status: 500 });
  }

  const jwt = await signSessionToken({
    id: resolved.userId,
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(jwt, req);

  return NextResponse.json({ ok: true as const, next: safeNextPath(body.next) });
}

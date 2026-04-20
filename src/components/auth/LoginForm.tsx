"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AuthCard, AuthFooterLink } from "@/components/auth/AuthCard";
import { GoogleSdkLoginButton } from "@/components/auth/GoogleSdkLoginButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { cn } from "@/lib/cn";
import { parseJsonResponse } from "@/lib/parse-json-response";

const LOGIN_QUERY_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "เข้าสู่ระบบด้วย Google ยังไม่พร้อม — แบบ redirect: ตั้ง GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET และ redirect URI ใน Google Cloud หรือแบบ Melody: ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID + JavaScript origins อย่างเดียว",
  google_state: "เซสชัน Google หมดอายุหรือไม่ถูกต้อง — ลองใหม่",
  google_access_denied: "ยกเลิกการเข้าสู่ระบบด้วย Google",
  google_token: "แลกโทเคนกับ Google ไม่สำเร็จ — ลองใหม่",
  google_profile: "ดึงข้อมูลโปรไฟล์ Google ไม่สำเร็จ",
  google_email_unverified: "อีเมล Google ยังไม่ยืนยัน — ใช้บัญชีอื่น",
  google_account_conflict: "บัญชีนี้เชื่อมกับ Google คนละรายแล้ว — ติดต่อผู้ดูแลระบบ",
  google_create_failed: "สร้างบัญชีไม่สำเร็จ — ลองใหม่หรือสมัครด้วยอีเมล",
  google_auth_failed: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ลองใหม่",
  demo_not_configured: "บัญชีทดลองยังไม่เปิดใช้บนเซิร์ฟเวอร์ — ตั้ง NEXT_PUBLIC_DEMO_ENTRY=1 และ DEMO_ACCOUNT_USERNAME / DEMO_ACCOUNT_PASSWORD",
  demo_user_missing: "ไม่พบผู้ใช้ทดลองในฐานข้อมูล — สร้าง user ให้ตรง DEMO_ACCOUNT_USERNAME และตั้งรหัสผ่าน",
  demo_credentials_mismatch:
    "รหัสใน .env ไม่ตรงกับรหัสผ่านในฐานข้อมูล — DEMO_ACCOUNT_PASSWORD ต้องเป็นรหัสแบบ plain ที่ใช้ตอนสร้างบัญชี (ระบบจะเทียบกับ hash ใน DB)",
  demo_rate_limited: "กดทดลองบ่อยเกินไป — รอสักครู่แล้วลองใหม่",
};

type GoogleUiMode = "sdk" | "redirect" | "none";

function AuthPolicyInlineText() {
  return (
    <>
      <Link href="/legal#terms" className="font-semibold text-[#0000BF] hover:underline">
        ข้อกำหนดการใช้งาน
      </Link>{" "}
      และ{" "}
      <Link href="/legal#privacy" className="font-semibold text-[#0000BF] hover:underline">
        นโยบายความเป็นส่วนตัว
      </Link>
    </>
  );
}

function LoginFormInner({
  redirectTo = "/dashboard",
  initialErrorKey,
  googleUiMode,
}: {
  redirectTo?: string;
  initialErrorKey?: string;
  googleUiMode: GoogleUiMode;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    initialErrorKey ? (LOGIN_QUERY_ERROR_MESSAGES[initialErrorKey] ?? initialErrorKey) : null,
  );
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const onGoogleSdkErrorKey = useCallback((key: string) => {
    setError(LOGIN_QUERY_ERROR_MESSAGES[key] ?? key);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (turnstileRequired && !turnstileToken) {
      setError("กรุณายืนยันว่าไม่ใช่บอท");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setError(
          data.error ?? (res.status >= 500 ? "เซิร์ฟเวอร์มีปัญหา ลองใหม่ภายหลัง" : "เข้าสู่ระบบไม่สำเร็จ"),
        );
        return;
      }
      // เต็มหน้าแทน client navigation — ให้คำขอถัดไปส่งคุกกี้ session แน่นอน (กัน RSC ค้างสถานะเก่า)
      window.location.assign(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  const googleOAuthParams = new URLSearchParams({ next: redirectTo }).toString();

  return (
    <AuthCard title="เข้าสู่ระบบ">
      <div className="mb-5 flex justify-start">
        <MawellLogo size="md" />
      </div>

      {googleUiMode === "sdk" ? (
        <>
          <GoogleSdkLoginButton
            redirectTo={redirectTo}
            onErrorKey={onGoogleSdkErrorKey}
            disabled={loading}
          />
          <p className="mb-4 mt-2 text-center text-xs text-slate-600">
            การเข้าสู่ระบบด้วย Google ถือว่าคุณยอมรับ <AuthPolicyInlineText />
          </p>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">หรือใช้อีเมล / รหัสผ่าน</span>
            </div>
          </div>
        </>
      ) : googleUiMode === "redirect" ? (
        <>
          <Link
            href={`/api/auth/google?${googleOAuthParams}`}
            className={cn(
              "mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50",
            )}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            เข้าสู่ระบบด้วย Google
          </Link>
          <p className="mb-4 mt-2 text-center text-xs text-slate-600">
            การเข้าสู่ระบบด้วย Google ถือว่าคุณยอมรับ <AuthPolicyInlineText />
          </p>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">หรือใช้อีเมล / รหัสผ่าน</span>
            </div>
          </div>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-slate-700">
            อีเมลหรือชื่อผู้ใช้
          </label>
          <input
            id="identifier"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-[#0000BF]/20 transition focus:border-[#0000BF] focus:ring-2"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <TurnstileWidget onToken={setTurnstileToken} />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full rounded-lg bg-[#0000BF] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a3] disabled:opacity-60",
          )}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
      <p className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4">
        <AuthFooterLink href="/register">สมัครสมาชิก</AuthFooterLink>
        <span className="hidden text-slate-300 sm:inline">|</span>
        <AuthFooterLink href="/forgot-password">ลืมรหัสผ่าน</AuthFooterLink>
      </p>
    </AuthCard>
  );
}

/**
 * ถ้ามี NEXT_PUBLIC_GOOGLE_CLIENT_ID → แบบ MelodyWebapp (@react-oauth/google + /api/auth/google/token) ไม่ต้องมี Client secret
 * ถ้าไม่มีแต่มี GOOGLE_CLIENT_ID บนเซิร์ฟเวอร์ → redirect ไป /api/auth/google (ต้องมี GOOGLE_CLIENT_SECRET + redirect URI)
 */
export function LoginForm({
  redirectTo = "/dashboard",
  initialErrorKey,
  googleOAuthEnabled = false,
}: {
  redirectTo?: string;
  initialErrorKey?: string;
  googleOAuthEnabled?: boolean;
}) {
  const publicId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  if (publicId) {
    return (
      <GoogleOAuthProvider clientId={publicId}>
        <LoginFormInner
          redirectTo={redirectTo}
          initialErrorKey={initialErrorKey}
          googleUiMode="sdk"
        />
      </GoogleOAuthProvider>
    );
  }
  return (
    <LoginFormInner
      redirectTo={redirectTo}
      initialErrorKey={initialErrorKey}
      googleUiMode={googleOAuthEnabled ? "redirect" : "none"}
    />
  );
}

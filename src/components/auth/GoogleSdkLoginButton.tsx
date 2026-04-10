"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { parseJsonResponse } from "@/lib/parse-json-response";

type Props = {
  redirectTo: string;
  onErrorKey: (key: string) => void;
  disabled?: boolean;
};

/**
 * แบบ MelodyWebapp — @react-oauth/google ได้ access_token ในเบราว์เซอร์ แล้วส่งมา /api/auth/google/token
 * ต้องมี NEXT_PUBLIC_GOOGLE_CLIENT_ID + Authorized JavaScript origins ใน Google Cloud
 */
export function GoogleSdkLoginButton({ redirectTo, onErrorKey, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  const sendToken = useCallback(
    async (accessToken: string) => {
      setBusy(true);
      try {
        const res = await fetch("/api/auth/google/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accessToken, next: redirectTo }),
        });
        const data = await parseJsonResponse<{ ok?: boolean; next?: string; error?: string }>(res);
        if (!res.ok || !data.ok) {
          onErrorKey(typeof data.error === "string" ? data.error : "google_auth_failed");
          return;
        }
        const next = typeof data.next === "string" && data.next.startsWith("/") ? data.next : redirectTo;
        window.location.assign(next);
      } catch {
        onErrorKey("google_auth_failed");
      } finally {
        setBusy(false);
      }
    },
    [redirectTo, onErrorKey],
  );

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => void sendToken(tokenResponse.access_token),
    onError: () => {
      onErrorKey("google_auth_failed");
      setBusy(false);
    },
  });

  const loading = busy || disabled;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => login()}
      className={cn(
        "mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60",
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
      {busy ? "กำลังเชื่อมต่อ Google…" : "เข้าสู่ระบบด้วย Google"}
    </button>
  );
}

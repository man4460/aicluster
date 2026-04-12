"use client";

import { useState } from "react";
import { AuthCard, AuthFooterLink } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { cn } from "@/lib/cn";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { SIGNUP_BONUS_TOKENS } from "@/lib/tokens/signup-bonus";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("กรุณายืนยันว่าไม่ใช่บอท");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          username,
          password,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setError(
          data.error ?? (res.status >= 500 ? "เซิร์ฟเวอร์มีปัญหา ลองใหม่ภายหลัง" : "สมัครสมาชิกไม่สำเร็จ"),
        );
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="สมัครสมาชิก">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-slate-700">
            อีเมล
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            required
          />
        </div>
        <div>
          <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-slate-700">
            ชื่อผู้ใช้
          </label>
          <input
            id="reg-username"
            name="username"
            autoComplete="username"
            minLength={2}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={input}
            required
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-slate-700">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="reg-password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputClassName={inputWithEye}
            required
          />
        </div>
        <div>
          <label htmlFor="reg-password2" className="mb-1 block text-sm font-medium text-slate-700">
            ยืนยันรหัสผ่าน
          </label>
          <PasswordInput
            id="reg-password2"
            name="password2"
            autoComplete="new-password"
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            inputClassName={inputWithEye}
            required
          />
        </div>

        <p className="text-xs text-slate-600">
          โบนัสสมัครใหม่ {SIGNUP_BONUS_TOKENS} โทเคน — กำหนดเบอร์ผู้แนะนำได้ครั้งเดียวที่หน้าโปรไฟล์หลังเข้าระบบ
        </p>

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
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        มีบัญชีแล้ว?{" "}
        <AuthFooterLink href="/login" className="inline">
          เข้าสู่ระบบ
        </AuthFooterLink>
      </p>
    </AuthCard>
  );
}

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-[#0000BF]/20 transition focus:border-[#0000BF] focus:ring-2";

const inputWithEye =
  "w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-slate-900 shadow-sm outline-none ring-[#0000BF]/20 transition focus:border-[#0000BF] focus:ring-2";

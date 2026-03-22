"use client";

import { useState } from "react";
import { AuthCard, AuthFooterLink } from "@/components/auth/AuthCard";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { cn } from "@/lib/cn";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (turnstileRequired && !turnstileToken) {
      setError("กรุณายืนยันว่าไม่ใช่บอท");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken: turnstileToken ?? undefined }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "ส่งคำขอไม่สำเร็จ");
        return;
      }
      setMessage(data.message ?? "ตรวจสอบอีเมลของคุณ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลเพื่อรับลิงก์รีเซ็ต">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-[#0000BF]/20 transition focus:border-[#0000BF] focus:ring-2"
            required
          />
        </div>
        <TurnstileWidget onToken={setTurnstileToken} />
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full rounded-lg bg-[#0000BF] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a3] disabled:opacity-60",
          )}
        >
          {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
        </button>
      </form>
      <p className="mt-6 text-center">
        <AuthFooterLink href="/login">กลับไปหน้าเข้าสู่ระบบ</AuthFooterLink>
      </p>
    </AuthCard>
  );
}

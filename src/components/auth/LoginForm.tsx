"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthFooterLink } from "@/components/auth/AuthCard";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { cn } from "@/lib/cn";

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

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
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="เข้าสู่ระบบ" subtitle="MAWELL Buffet Management System">
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
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

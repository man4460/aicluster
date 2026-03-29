"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard, AuthFooterLink } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { cn } from "@/lib/cn";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== password2) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!token) {
      setError("ลิงก์ไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "รีเซ็ตไม่สำเร็จ");
        return;
      }
      setMessage(data.message ?? "สำเร็จ");
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="รีเซ็ตรหัสผ่าน" subtitle="ลิงก์ไม่ครบถ้วน">
        <p className="text-center text-sm text-slate-600">ใช้ลิงก์จากอีเมลเพื่อเปิดหน้านี้</p>
        <p className="mt-6 text-center">
          <AuthFooterLink href="/login">ไปหน้าเข้าสู่ระบบ</AuthFooterLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="ตั้งรหัสผ่านใหม่">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            รหัสผ่านใหม่
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label htmlFor="password2" className="mb-1 block text-sm font-medium text-slate-700">
            ยืนยันรหัสผ่าน
          </label>
          <PasswordInput
            id="password2"
            name="password2"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            minLength={8}
          />
        </div>
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
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
        </button>
      </form>
      <p className="mt-6 text-center">
        <AuthFooterLink href="/login">กลับไปหน้าเข้าสู่ระบบ</AuthFooterLink>
      </p>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthCard title="รีเซ็ตรหัสผ่าน">
          <p className="text-center text-sm text-slate-500">กำลังโหลด...</p>
        </AuthCard>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}

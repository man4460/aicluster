"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppNoticePopup } from "@/components/app-templates";

type Props = { slug: string };

type Institute = {
  slug: string;
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
};

export function LmsLearnerLoginClient({ slug }: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [instRes, meRes] = await Promise.all([
          fetch(`/api/lms/public/${encodeURIComponent(slug)}`, { credentials: "include" }),
          fetch(`/api/lms/public/${encodeURIComponent(slug)}/me`, { credentials: "include" }),
        ]);
        if (cancelled) return;
        if (instRes.ok) {
          const data = (await instRes.json()) as { institute?: Institute };
          if (data.institute) setInstitute(data.institute);
        } else {
          notice.error("ไม่พบสถาบัน");
        }
        if (meRes.ok) {
          router.replace(`/lms/${encodeURIComponent(slug)}/dashboard`);
          return;
        }
      } catch {
        if (!cancelled) notice.error("โหลดหน้าเข้าสู่ระบบไม่สำเร็จ");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per slug
  }, [slug, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notice.error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(`/lms/${encodeURIComponent(slug)}/dashboard`);
    } catch {
      notice.error("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  if (booting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      {notice.popup}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          {institute?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institute.logoUrl}
              alt=""
              className="mx-auto mb-3 h-16 w-16 rounded-xl object-cover"
            />
          ) : null}
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            {institute?.displayName || "เข้าสู่ระบบผู้เรียน"}
          </h1>
          {institute?.tagline ? (
            <p className="mt-1 text-sm text-slate-500">{institute.tagline}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">พอร์ทัลผู้เรียน LMS</p>
          )}
        </div>
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">ชื่อผู้ใช้</span>
            <input
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">รหัสผ่าน</span>
            <input
              type="password"
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}

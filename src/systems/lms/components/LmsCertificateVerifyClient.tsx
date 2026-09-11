"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  slug: string;
  code: string;
};

type VerifyOk = {
  valid: true;
  certificate: { certCode: string; issueDate: string };
  learner: { fullName: string };
  course: { title: string };
  institute: { displayName: string; logoUrl?: string | null; slug: string };
};

export function LmsCertificateVerifyClient({ slug, code }: Props) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<VerifyOk | null>(null);
  const [error, setError] = useState("ไม่พบใบประกาศ");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/lms/public/${encodeURIComponent(slug)}/certificates/verify/${encodeURIComponent(code)}`,
        );
        const json = (await res.json()) as VerifyOk & { error?: string; valid?: boolean };
        if (cancelled) return;
        if (!res.ok || !json.valid) {
          setError(json.error || "ไม่พบใบประกาศหรือรหัสไม่ถูกต้อง");
          setState("error");
          return;
        }
        setData(json);
        setState("ok");
      } catch {
        if (cancelled) return;
        setError("ตรวจสอบไม่สำเร็จ");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, code]);

  const issueLabel =
    data?.certificate.issueDate &&
    new Date(data.certificate.issueDate).toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b2a5b]/10 text-[#0b2a5b]">
            <Award className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-black text-slate-900">ตรวจสอบใบประกาศ</h1>
            <p className="text-xs text-slate-500">สแกนจาก QR บนใบประกาศนียบัตร</p>
          </div>
        </div>

        {state === "loading" ? (
          <p className="text-sm text-slate-500">กำลังตรวจสอบ…</p>
        ) : null}

        {state === "error" ? (
          <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">ไม่ผ่านการตรวจสอบ</p>
            </div>
            <p className="text-sm text-rose-800">{error}</p>
          </div>
        ) : null}

        {state === "ok" && data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">ใบประกาศถูกต้อง</p>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">สถาบัน</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{data.institute.displayName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">ผู้ได้รับ</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{data.learner.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">หัวข้อหลักสูตร</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{data.course.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">วันที่จบหลักสูตร</dt>
                <dd className="mt-0.5 text-slate-800">{issueLabel || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">รหัสใบประกาศ</dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-700">{data.certificate.certCode}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            href={`/lms/${encodeURIComponent(slug)}`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0b2a5b] px-4 text-sm font-semibold text-white"
          >
            กลับหน้าสถาบัน
          </Link>
        </div>
      </div>
    </main>
  );
}

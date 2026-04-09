"use client";

import { useCallback, useEffect, useState } from "react";
import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  slug: string;
  title: string;
  groupId: number;
  cardImageUrl: string | null;
  isActive: boolean;
};

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0l4 4m-4-4L8 8M4 20h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadControls({
  rowId,
  disabled,
  onFile,
}: {
  rowId: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const safeDomId = `module-card-upload-${rowId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={safeDomId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label="อัปโหลดรูปการ์ดระบบ"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => document.getElementById(safeDomId)?.click()}
        className="inline-flex min-h-[40px] min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a3] disabled:opacity-50"
      >
        {disabled ? (
          "กำลังอัปโหลด…"
        ) : (
          <>
            <UploadIcon className="shrink-0 opacity-95" />
            อัปโหลดรูป
          </>
        )}
      </button>
    </div>
  );
}

export function ModuleCardImagesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/app-modules", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { modules?: Row[]; error?: string };
    if (!res.ok) {
      setErr(
        res.status === 403
          ? "ต้องเข้าสู่ระบบเป็นแอดมินเท่านั้น"
          : (j.error ?? "โหลดรายการไม่สำเร็จ"),
      );
      setRows([]);
      return;
    }
    setRows(j.modules ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function uploadFile(id: string, file: File) {
    setErr(null);
    setBusyId(id);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/admin/app-modules/${id}/card-image`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      if (j.imageUrl) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cardImageUrl: j.imageUrl! } : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function clearImage(id: string) {
    setErr(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/app-modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cardImageUrl: null }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "ล้างรูปไม่สำเร็จ");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cardImageUrl: null } : r)));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">กำลังโหลด…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 px-4 py-3 text-sm text-sky-950">
        <p className="font-semibold text-sky-900">วิธีใช้</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sky-900/90">
          <li>หาแถวของระบบที่ต้องการ (ดูจากชื่อหรือ slug)</li>
          <li>กดปุ่มสีน้ำเงิน <strong>อัปโหลดรูป</strong> แล้วเลือกไฟล์ JPG / PNG / WebP / GIF ไม่เกิน 4MB</li>
          <li>รูปจะขึ้นที่การ์ดแดชบอร์ดและหน้าระบบทั้งหมดทันทีหลังอัปโหลดสำเร็จ</li>
        </ol>
      </div>
      <p className="text-sm text-slate-600">
        แนะนำภาพแนวนอนประมาณ 16:9 — แสดงบนการ์ดแดชบอร์ด หน้าระบบทั้งหมด และแผนผังระบบ
      </p>
      {err ? <p className="text-sm text-red-700">{err}</p> : null}

      {!err && rows.length === 0 ? (
        <p className="text-sm text-amber-800">ไม่พบรายการโมดูลในฐานข้อมูล</p>
      ) : null}

      {/* มือถือ: การ์ด + ปุ่มเต็มความกว้าง */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => {
          const preview = r.cardImageUrl && isSafeModuleCardImageUrl(r.cardImageUrl) ? r.cardImageUrl : null;
          const disabled = busyId === r.id;
          return (
            <div
              key={r.id}
              className={cn(
                "mawell-card-surface rounded-2xl border border-white/70 p-4 shadow-md",
                !r.isActive && "opacity-60",
              )}
            >
              <p className="font-semibold text-slate-900">{r.title}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{r.slug}</p>
              <p className="mt-1 text-xs text-slate-600">กลุ่ม {r.groupId}</p>
              <div className="mt-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="h-32 w-full rounded-2xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                    ยังไม่มีรูป
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <UploadControls rowId={r.id} disabled={disabled} onFile={(f) => void uploadFile(r.id, f)} />
                {preview ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void clearImage(r.id)}
                    className="rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    ล้างรูป
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* เดสก์ท็อป: ตาราง */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">โมดูล</th>
              <th className="px-3 py-3">slug</th>
              <th className="px-3 py-3">กลุ่ม</th>
              <th className="px-3 py-3">ตัวอย่าง</th>
              <th className="min-w-[200px] px-3 py-3">อัปโหลด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const preview = r.cardImageUrl && isSafeModuleCardImageUrl(r.cardImageUrl) ? r.cardImageUrl : null;
              const disabled = busyId === r.id;
              return (
                <tr key={r.id} className={cn("border-b border-slate-100", !r.isActive && "opacity-60")}>
                  <td className="px-3 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600">{r.slug}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-600">{r.groupId}</td>
                  <td className="px-3 py-3">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        className="h-14 w-24 rounded-2xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UploadControls rowId={r.id} disabled={disabled} onFile={(f) => void uploadFile(r.id, f)} />
                      {preview ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void clearImage(r.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          ล้างรูป
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { cn } from "@/lib/cn";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
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
        className={cn(
          appDashboardBrandCtaPillButtonClass,
          "min-h-[40px] min-w-[40px] rounded-xl px-0 sm:min-w-0 sm:rounded-full sm:px-5",
        )}
        aria-label="อัปโหลดรูปการ์ด"
        title="อัปโหลดรูป"
      >
        <UploadIcon className="h-5 w-5 shrink-0 sm:mr-1" />
        <span className="hidden sm:inline">{disabled ? "กำลังอัปโหลด…" : "อัปโหลดรูป"}</span>
      </button>
    </div>
  );
}

export function ModuleCardImagesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

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
  }, [load, refreshTick]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-6",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
            aria-hidden
          >
            <IconImageCards className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
              <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                รูปการ์ดระบบ
              </span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
              อัปโหลดภาพแนวนอนประมาณ 16:9 — แสดงบนการ์ดแดชบอร์ด หน้าระบบทั้งหมด และแผนผังระบบ (JPG / PNG / WebP / GIF ไม่เกิน 4MB)
            </p>
          </div>
        </div>
      </section>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="โมดูลและรูปการ์ด"
          description="เลือกระบบแล้วอัปโหลดหรือล้างรูป — กดไอคอนคู่มือเพื่อดูขั้นตอน"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen((o) => !o)}
                aria-expanded={helpOpen}
                aria-label={helpOpen ? "ปิดคู่มือ" : "เปิดคู่มือ"}
                title="วิธีใช้"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:px-3",
                  helpOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                )}
              >
                <IconBook className="h-5 w-5 shrink-0" />
                <span className="hidden sm:ml-1 sm:inline">วิธีใช้</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setRefreshTick((x) => x + 1);
                }}
                aria-busy={loading}
                aria-label="รีเฟรชรายการโมดูล"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-4",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] shadow-sm hover:bg-white disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        {helpOpen ? (
          <div className="mt-4 rounded-[1.25rem] border border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-indigo-50/40 p-4 text-sm text-sky-950 ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-5">
            <p className="font-black text-sky-900">วิธีใช้</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-bold marker:text-[#4d47b6]">
              <li>หาแถวของระบบที่ต้องการ (ชื่อหรือ slug)</li>
              <li>กดอัปโหลดแล้วเลือกไฟล์ภาพ</li>
              <li>รูปจะขึ้นที่การ์ดแดชบอร์ดและหน้าระบบทันทีหลังสำเร็จ</li>
            </ol>
          </div>
        ) : null}

        {err ? (
          <p className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
            {err}
          </p>
        ) : null}

        {loading && rows.length === 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.25rem] bg-[#ecebff]/70" />
            ))}
          </div>
        ) : !err && rows.length === 0 ? (
          <div className="mt-4">
            <AppEmptyState tone="violet">ไม่พบรายการโมดูลในฐานข้อมูล</AppEmptyState>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-3 md:hidden">
              {rows.map((r) => {
                const preview = r.cardImageUrl && isSafeModuleCardImageUrl(r.cardImageUrl) ? r.cardImageUrl : null;
                const disabled = busyId === r.id;
                return (
                  <article
                    key={r.id}
                    className={cn(
                      "overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/55 via-white/30 to-indigo-50/20 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
                      !r.isActive && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-[#1e1b4b]">{r.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-[#66638c]">{r.slug}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#66638c]">
                          กลุ่ม {r.groupId}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt=""
                          className="h-36 w-full rounded-[1rem] border border-white/50 object-cover shadow-inner"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-[1rem] border border-dashed border-white/60 bg-white/35 text-xs font-medium text-[#66638c]">
                          ยังไม่มีรูป
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-white/45 pt-3">
                      <UploadControls rowId={r.id} disabled={disabled} onFile={(f) => void uploadFile(r.id, f)} />
                      {preview ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void clearImage(r.id)}
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ล้างรูป ${r.title}`}
                          title="ล้างรูป"
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-[1.25rem] border border-[#e8e6fc] md:block md:rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e6fc] bg-[#faf9ff]/90 text-[11px] font-black uppercase tracking-wide text-[#66638c]">
                      <th className="px-4 py-3 font-black">โมดูล</th>
                      <th className="px-4 py-3 font-black">slug</th>
                      <th className="px-4 py-3 font-black">กลุ่ม</th>
                      <th className="px-4 py-3 font-black">ตัวอย่าง</th>
                      <th className="min-w-[200px] px-4 py-3 text-right font-black">การทำงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const preview = r.cardImageUrl && isSafeModuleCardImageUrl(r.cardImageUrl) ? r.cardImageUrl : null;
                      const disabled = busyId === r.id;
                      return (
                        <tr
                          key={r.id}
                          className={cn("border-b border-[#f0eefc]/90 transition-colors last:border-0 hover:bg-white/60", !r.isActive && "opacity-60")}
                        >
                          <td className="px-4 py-3 font-bold text-[#1e1b4b]">{r.title}</td>
                          <td className="px-4 py-3 font-mono text-xs text-[#66638c]">{r.slug}</td>
                          <td className="px-4 py-3 tabular-nums text-[#5f5a8a]">{r.groupId}</td>
                          <td className="px-4 py-3">
                            {preview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={preview}
                                alt=""
                                className="h-14 w-24 rounded-xl border border-white/60 object-cover shadow-sm"
                              />
                            ) : (
                              <span className="text-xs text-[#66638c]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <UploadControls rowId={r.id} disabled={disabled} onFile={(f) => void uploadFile(r.id, f)} />
                              {preview ? (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => void clearImage(r.id)}
                                  className={assetRowRemoveIconButtonClass}
                                  aria-label={`ล้างรูป ${r.title}`}
                                  title="ล้างรูป"
                                >
                                  <IconRowRemove className="h-4 w-4" />
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
          </>
        )}
      </AppDashboardSection>
    </div>
  );
}

function IconImageCards({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M14 9h4M14 13h4" strokeLinecap="round" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

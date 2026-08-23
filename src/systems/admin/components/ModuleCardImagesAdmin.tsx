"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { downloadAdminExcel } from "@/lib/admin/export-excel";
import { cn } from "@/lib/cn";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import { MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { LandingBannerAdmin } from "@/systems/admin/components/LandingBannerAdmin";

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
    <>
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
          "min-h-[36px] min-w-[36px] rounded-lg px-0 sm:min-w-0 sm:rounded-xl sm:px-3",
        )}
        aria-label="อัปโหลดรูปการ์ด"
        title="อัปโหลดรูป"
      >
        <UploadIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:ml-1 sm:inline">{disabled ? "…" : "อัปโหลด"}</span>
      </button>
    </>
  );
}

export function ModuleCardImagesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.slug.toLowerCase().includes(needle) ||
        String(r.groupId).includes(needle),
    );
  }, [rows, q]);

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

  function onExportExcel() {
    downloadAdminExcel({
      filename: "admin-module-cards",
      sheetName: "รูปการ์ด",
      headers: ["ชื่อ", "slug", "กลุ่ม", "มีรูปอัปโหลด", "URL รูป", "สถานะ"],
      rows: filtered.map((r) => [
        r.title,
        r.slug,
        MODULE_GROUP_TIER_NAME[r.groupId] ?? r.groupId,
        r.cardImageUrl ? "ใช่" : "ไม่",
        r.cardImageUrl ?? "",
        r.isActive ? "เปิด" : "ปิด",
      ]),
    });
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
          </div>
        </div>
      </section>

      <LandingBannerAdmin />

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="โมดูลและรูปการ์ด"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:px-3",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:ml-1 sm:inline">กรอง</span>
                {q.trim() ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#5b61ff]" aria-hidden />
                ) : null}
              </button>
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
                onClick={onExportExcel}
                disabled={loading || filtered.length === 0}
                aria-label="Export Excel"
                title="Export Excel"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-50",
                )}
              >
                <IconExcel className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Excel</span>
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

        {filterOpen ? (
          <div className="mt-4">
            <label className="block">
              <span className="sr-only">ค้นหาโมดูล</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาชื่อหรือ slug…"
                className="w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2.5 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:bg-[#eeedf8] focus:ring-2"
              />
            </label>
          </div>
        ) : null}

        {helpOpen ? (
          <div className="mt-4 rounded-[1.25rem] border border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-indigo-50/40 p-4 text-sm text-sky-950 ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-5">
            <p className="font-black text-sky-900">วิธีใช้</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-bold marker:text-[#4d47b6]">
              <li>หาการ์ดของระบบที่ต้องการ</li>
              <li>กดอัปโหลดแล้วเลือกไฟล์ภาพ (JPG / PNG / WebP / GIF)</li>
              <li>รูปจะขึ้นที่การ์ดแดชบอร์ดและหน้าระบบทันทีหลังสำเร็จ</li>
            </ol>
          </div>
        ) : null}

        {err ? (
          <p className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
            {err}
          </p>
        ) : null}

        <div className="mt-4">
          {loading && rows.length === 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-[#ecebff]/70" />
              ))}
            </ul>
          ) : !err && filtered.length === 0 ? (
            <AppEmptyState tone="violet">
              {rows.length === 0 ? "ไม่พบรายการโมดูลในฐานข้อมูล" : "ไม่พบโมดูลตามคำค้น"}
            </AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {filtered.map((r) => {
                const cover = resolveModuleCardDisplayImageUrl(r.slug, r.cardImageUrl);
                const safe = cover && isSafeModuleCardDisplayUrl(cover) ? cover : null;
                const disabled = busyId === r.id;
                const hasUpload = Boolean(r.cardImageUrl && isSafeModuleCardDisplayUrl(r.cardImageUrl));
                return (
                  <li key={r.id}>
                    <article
                      className={cn(
                        "group flex min-w-0 max-w-full items-start gap-3 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white",
                        !r.isActive && "opacity-60",
                      )}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 shadow-sm">
                        {safe ? (
                          <Image src={safe} alt="" fill sizes="44px" className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#4d47b6]">
                            <IconImageCards className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-black leading-snug text-[#1e1b4b]">{r.title}</p>
                        <p className="mt-0.5 break-all font-mono text-[10px] leading-snug text-[#66638c]">{r.slug}</p>
                        <p className="mt-0.5 break-words text-[11px] font-semibold leading-snug text-slate-500">
                          {MODULE_GROUP_TIER_NAME[r.groupId] ?? `กลุ่ม ${r.groupId}`}
                          {hasUpload ? " · มีรูปอัปโหลด" : " · ใช้รูปค่าเริ่ม"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <UploadControls rowId={r.id} disabled={disabled} onFile={(f) => void uploadFile(r.id, f)} />
                        {hasUpload ? (
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExcel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M8.5 17l3-4-3-4M12.5 9H15M12.5 17H15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

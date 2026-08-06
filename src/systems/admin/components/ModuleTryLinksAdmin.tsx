"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import { MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";
import { dashboardModuleCardDescription } from "@/lib/modules/dashboard-card-descriptions";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import { moduleTryAbsoluteUrl } from "@/lib/modules/try-link";

type Row = {
  id: string;
  slug: string;
  title: string;
  groupId: number;
  cardImageUrl: string | null;
  isActive: boolean;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <rect x="2" y="2" width="13" height="13" rx="2" />
    </svg>
  );
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GroupIcon({ groupId, className }: { groupId: number; className?: string }) {
  if (groupId === 1) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M8 4h4v4H8zM4 8h4v4H4zM8 12h4v4H8zM12 8h4v4h-4z" />
      </svg>
    );
  }
  if (groupId === 2) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    );
  }
  if (groupId === 3) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19V9M10 19V5M16 19v-8M22 19V7" />
      </svg>
    );
  }
  if (groupId === 4) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 20l5-8 4 4 7-12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z" />
    </svg>
  );
}

function groupChipClass(groupId: number): string {
  if (groupId === 1) return "bg-[#0000BF]/10 text-[#0000BF] border-[#0000BF]/20";
  if (groupId === 2) return "bg-slate-100 text-slate-700 border-slate-200";
  if (groupId === 3) return "bg-amber-100 text-amber-800 border-amber-200";
  if (groupId === 4) return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

function catalogLine(slug: string): string {
  return (
    dashboardModuleCardDescription(slug)
      .split("\n")[0]
      ?.trim()
      .replace(/^กลุ่ม\s*\d+\s*\([^)]*\)\s*[—–\-:]?\s*/u, "")
      .trim() || "—"
  );
}

function ModuleThumb({ url, fallback }: { url: string | null; fallback: ReactNode }) {
  const safe = url && isSafeModuleCardDisplayUrl(url) ? url : null;
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 shadow-sm">
      {safe ? <Image src={safe} alt="" fill sizes="44px" className="object-cover" unoptimized /> : null}
      {!safe ? <div className="flex h-full w-full items-center justify-center text-[#4d47b6]">{fallback}</div> : null}
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const iconBtn =
  "inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/70 bg-white/90 text-[#4d47b6] shadow-sm transition hover:bg-white disabled:opacity-50";

export function ModuleTryLinksAdmin({
  appBaseUrl,
  demoReady,
}: {
  appBaseUrl: string;
  demoReady: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [qrRow, setQrRow] = useState<Row | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const base = appBaseUrl.replace(/\/$/, "");
  const hasActiveFilter = q.trim().length > 0;

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
    setRows((j.modules ?? []).filter((m) => m.isActive));
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

  useEffect(() => {
    if (!qrRow || !base) {
      setQrDataUrl(null);
      return;
    }
    const url = moduleTryAbsoluteUrl(base, qrRow.slug);
    let cancelled = false;
    void QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: "M" })
      .then((img) => {
        if (!cancelled) setQrDataUrl(img);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrRow, base]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.slug.toLowerCase().includes(needle) ||
        String(r.groupId).includes(needle) ||
        catalogLine(r.slug).toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const groupIds = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.groupId))).sort((a, b) => a - b),
    [filtered],
  );

  const flashCopy = (msg: string) => {
    setCopyMsg(msg);
    window.setTimeout(() => setCopyMsg(null), 1800);
  };

  const onCopy = async (row: Row) => {
    if (!base) {
      flashCopy("ยังไม่มี APP_URL — ตั้ง NEXT_PUBLIC_APP_URL");
      return;
    }
    const url = moduleTryAbsoluteUrl(base, row.slug);
    const ok = await copyText(url);
    flashCopy(ok ? `คัดลอกแล้ว · ${row.title}` : "คัดลอกไม่สำเร็จ");
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <AppDashboardSection className="space-y-4">
          <AppSectionHeader
            title="ลิงก์ทดลองโมดูล"
            tone="violet"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="module-try-links-filter"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                )}
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "กรอง"}</span>
                {hasActiveFilter ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#5b61ff]" aria-hidden />
                ) : null}
              </button>
            }
          />

          {!demoReady ? (
            <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950" role="status">
              บัญชีทดลองยังไม่พร้อม — ตั้ง{" "}
              <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_DEMO_ENTRY=1</code> และ{" "}
              <code className="rounded bg-white/80 px-1">DEMO_ACCOUNT_USERNAME</code> /{" "}
              <code className="rounded bg-white/80 px-1">DEMO_ACCOUNT_PASSWORD</code>
            </p>
          ) : null}

          {!base ? (
            <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-800" role="status">
              ตั้ง <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_APP_URL</code> ให้เป็นโดเมนจริงก่อนสร้างลิงก์/QR
            </p>
          ) : null}

          {filterOpen ? (
            <div id="module-try-links-filter" className="space-y-2">
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
              {base ? (
                <p className="text-xs text-[#5f5a8a]">
                  ฐานลิงก์: <span className="font-mono text-[#4d47b6]">{base}/try/…</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {copyMsg ? (
            <p
              className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm font-semibold text-emerald-800"
              role="status"
            >
              {copyMsg}
            </p>
          ) : null}

          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {err}
            </p>
          ) : null}
        </AppDashboardSection>

        {loading ? (
          <div className="app-surface space-y-3 rounded-[1.15rem] border border-[#e8e6fc]/80 p-3.5 sm:p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-[#ecebff]/70" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <AppDashboardSection>
            <AppEmptyState tone="violet">ไม่พบโมดูล — ลองเปลี่ยนคำค้น หรือตรวจสอบว่าโมดูลเปิดใช้งานอยู่</AppEmptyState>
          </AppDashboardSection>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {groupIds.map((gid) => {
              const items = filtered.filter((r) => r.groupId === gid);
              return (
                <section
                  key={gid}
                  className="app-surface min-w-0 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-3.5 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[10px] font-black tracking-[0.12em] text-[#66638c]">
                      <span className="uppercase tracking-[0.2em]">
                        {MODULE_GROUP_TIER_NAME[gid] ?? `กลุ่ม ${gid}`}
                      </span>
                      <span className="ml-1.5 font-black normal-case tracking-normal text-[#5f5a8a]">
                        {gid === 1 ? "1 บาท/วัน" : "รวมแพ็กเกจ"}
                      </span>
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black",
                        groupChipClass(gid),
                      )}
                    >
                      {items.length}
                    </span>
                  </div>
                  <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
                    {items.map((row) => {
                      const cover = resolveModuleCardDisplayImageUrl(row.slug, row.cardImageUrl);
                      return (
                        <li key={row.id}>
                          <div className="group flex min-w-0 max-w-full items-center gap-3 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white">
                            <ModuleThumb
                              url={cover}
                              fallback={<GroupIcon groupId={row.groupId} className="h-5 w-5" />}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-[#1e1b4b]">{row.title}</p>
                              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                {catalogLine(row.slug)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                className={iconBtn}
                                aria-label={`คัดลอกลิงก์ทดลอง ${row.title}`}
                                title="คัดลอกลิงก์"
                                disabled={!base}
                                onClick={() => void onCopy(row)}
                              >
                                <CopyIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className={iconBtn}
                                aria-label={`แสดง QR ${row.title}`}
                                title="สร้าง QR"
                                disabled={!base}
                                onClick={() => setQrRow(row)}
                              >
                                <QrIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <FormModal
        open={Boolean(qrRow)}
        onClose={() => setQrRow(null)}
        title={qrRow ? `QR · ${qrRow.title}` : "QR"}
        size="md"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {qrRow && base ? (
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px]")}
                onClick={() => void onCopy(qrRow)}
              >
                คัดลอกลิงก์
              </button>
            ) : null}
            <button
              type="button"
              className="app-btn-primary min-h-[40px] rounded-xl px-4"
              onClick={() => setQrRow(null)}
            >
              ปิด
            </button>
          </div>
        }
      >
        {qrRow ? (
          <div className="flex flex-col items-center gap-4 py-2">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR ทดลอง ${qrRow.title}`}
                className="h-56 w-56 rounded-2xl border border-white/60 bg-white p-2 shadow-sm"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-white/50 bg-white/40 text-sm text-[#5f5a8a]">
                กำลังสร้าง QR…
              </div>
            )}
            <p className="max-w-full break-all text-center font-mono text-[11px] text-[#5f5a8a]">
              {base ? moduleTryAbsoluteUrl(base, qrRow.slug) : ""}
            </p>
            {qrDataUrl ? (
              <a
                href={qrDataUrl}
                download={`mawell-try-${qrRow.slug}.png`}
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px]")}
              >
                ดาวน์โหลด PNG
              </a>
            ) : null}
          </div>
        ) : null}
      </FormModal>
    </>
  );
}

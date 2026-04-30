"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { carWashStatusLabelTh, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
import { FormModal } from "@/components/ui/FormModal";
import { AppPublicCheckInGlassPage, appPublicCheckInGlassCardClass } from "@/components/app-templates";
import type { WashBundle } from "@/systems/car-wash/car-wash-service";

export type CarWashPublicVisitRow = {
  id: number;
  visit_at: string;
  service_status: string;
  package_name: string;
  plate_number: string;
  bundle_id: number | null;
  final_price: number;
};

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

function isVisitOpenInLane(statusRaw: string): boolean {
  const s = normalizeCarWashServiceStatus(statusRaw);
  return s !== "PAID";
}

export function CarWashCustomerPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId?: string;
  trialSessionId?: string;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bundles, setBundles] = useState<WashBundle[]>([]);
  const [recentVisits, setRecentVisits] = useState<CarWashPublicVisitRow[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [laneVisitAckId, setLaneVisitAckId] = useState<number | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const selected = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) ?? null,
    [bundles, selectedBundleId],
  );

  const primaryCustomer = bundles[0] ?? null;
  const customerBundleSummary = selected ?? bundles[0] ?? null;

  const openLaneVisit = useMemo(() => {
    for (const v of recentVisits) {
      if (isVisitOpenInLane(v.service_status)) return v;
    }
    return null;
  }, [recentVisits]);

  useEffect(() => {
    setLaneVisitAckId(null);
  }, [openLaneVisit?.id]);

  const laneConfirmed = openLaneVisit != null && laneVisitAckId === openLaneVisit.id;

  const historyPreview = useMemo(() => recentVisits.slice(0, 6), [recentVisits]);

  const canPay =
    Boolean(selected) &&
    Boolean(openLaneVisit) &&
    laneConfirmed &&
    Boolean(selected?.is_active) &&
    (selected?.used_uses ?? 0) < (selected?.total_uses ?? 0) &&
    !checkInLoading;

  async function runLookup(raw: string, options?: { keepMessage?: boolean }): Promise<boolean> {
    setErr(null);
    if (!options?.keepMessage) setMsg(null);
    if (!ownerId) {
      setErr("ไม่พบข้อมูลเจ้าของร้าน");
      return false;
    }
    const res = await fetch("/api/car-wash/public/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, query: raw, trialSessionId: trialSessionId ?? null }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      bundles?: WashBundle[];
      recent_visits?: CarWashPublicVisitRow[];
    };
    if (!res.ok) {
      setErr(data.error || "ค้นหาไม่สำเร็จ");
      if (!options?.keepMessage) {
        setBundles([]);
        setRecentVisits([]);
        setSelectedBundleId(null);
      }
      return false;
    }
    const found = data.bundles ?? [];
    if (found.length === 0) {
      setErr("ไม่พบแพ็กเกจเหมาจากข้อมูลที่ค้นหา");
      if (!options?.keepMessage) {
        setBundles([]);
        setRecentVisits([]);
        setSelectedBundleId(null);
      }
      return false;
    }
    setBundles(found);
    setRecentVisits(Array.isArray(data.recent_visits) ? data.recent_visits : []);
    setHistoryModalOpen(false);
    const firstActive = found.find((b) => b.is_active && b.used_uses < b.total_uses) ?? found[0] ?? null;
    setSelectedBundleId(firstActive?.id ?? null);
    return true;
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    const digits = raw.replace(/\D/g, "");
    const plate = raw.trim().toLowerCase().replace(/[^0-9a-zA-Zก-๙]/g, "");
    if (digits.length < 9 && plate.length < 2) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก หรือทะเบียนรถอย่างน้อย 2 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      await runLookup(raw);
    } finally {
      setLoading(false);
    }
  }

  async function onCheckIn() {
    setErr(null);
    setMsg(null);
    if (!selectedBundleId || !selected) { setErr("เลือกแพ็กเกจก่อน"); return; }
    if (!openLaneVisit) { setErr("ยังไม่มีข้อมูลคิวในลาน — รอร้านรับรถก่อน"); return; }
    if (!laneConfirmed) { setErr("แตะการ์ดคิวในลานด้านบนเพื่อยืนยัน ก่อนชำระ"); return; }
    if (!selected.is_active || selected.used_uses >= selected.total_uses) {
      setErr("แพ็กเกจนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน");
      return;
    }
    setCheckInLoading(true);
    try {
      if (!ownerId) { setErr("ไม่พบข้อมูลเจ้าของร้าน"); return; }
      const res = await fetch("/api/car-wash/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, bundleId: selectedBundleId, trialSessionId: trialSessionId ?? null }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        bundle?: WashBundle;
      };
      if (!res.ok || !data.ok || !data.bundle) {
        setErr(data.error || "ไม่สามารถหักสิทธิ์ได้");
        return;
      }
      const consumed = data.bundle;
      const remain = Math.max(0, consumed.total_uses - consumed.used_uses);
      setBundles((prev) => prev.map((b) => (b.id === consumed.id ? consumed : b)));
      setMsg(`ชำระและหักสิทธิ์แล้ว — คงเหลือ ${remain} ครั้ง จาก ${consumed.total_uses} ครั้ง`);
      await runLookup(query.trim(), { keepMessage: true });
    } finally {
      setCheckInLoading(false);
    }
  }

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">

        {/* ── header logo / title ── */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/>
              <circle cx="12" cy="11" r="2.5"/>
              <path d="m8 19 4-2 4 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">คาร์แคร์สมาชิก</h1>
          <p className="mt-1 text-sm text-[#6b6894]">ค้นหาด้วยเบอร์โทรหรือทะเบียนรถ</p>
        </div>

        {/* ── search card ── */}
        <div className={appPublicCheckInGlassCardClass}>
          <div className="px-5 py-5 sm:px-6">
            <form onSubmit={onSearch} className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490c0]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <input
                  id="cw-member-query"
                  type="text"
                  suppressHydrationWarning
                  className="w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15"
                  placeholder="เบอร์โทร หรือ ทะเบียนรถ"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.slice(0, 64))}
                  autoComplete="tel"
                />
              </div>
              <button
                type="submit"
                suppressHydrationWarning
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5b61ff]/30 bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] py-3.5 text-sm font-black text-white shadow-[0_12px_28px_-10px_rgba(91,97,255,0.65)] transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                  </svg>
                )}
                {loading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}
              </button>
            </form>
          </div>
        </div>

        {/* ── results ── */}
        {bundles.length > 0 && (
          <>
            {/* customer header */}
            <div className={appPublicCheckInGlassCardClass}>
              <div className="border-b border-white/50 bg-gradient-to-r from-[#5b61ff]/8 via-transparent to-transparent px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-sm backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-[#1e1b4b]">{primaryCustomer?.customer_name}</p>
                    <p className="mt-0.5 text-xs text-[#6b6894]">
                      {formatPhoneDisplay(primaryCustomer?.customer_phone ?? "")}
                      {primaryCustomer?.plate_number ? (
                        <>
                          {" · "}
                          <span className="font-semibold text-[#4d47b6]">{primaryCustomer.plate_number}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {customerBundleSummary ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold text-[#4d47b6]">{customerBundleSummary.package_name}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#6b6894]">
                        ใช้แล้ว {customerBundleSummary.used_uses}/{customerBundleSummary.total_uses}
                      </p>
                      <p className="mt-0.5 text-xs font-black text-emerald-700">
                        คงเหลือ {Math.max(0, customerBundleSummary.total_uses - customerBundleSummary.used_uses)} ครั้ง
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* lane status */}
              <div className="px-5 py-4 sm:px-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">สถานะการล้าง (คิวในลาน)</p>
                  {historyPreview.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setHistoryModalOpen(true)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/55 text-[#5b61ff] shadow-sm backdrop-blur-sm transition hover:bg-white/75"
                      aria-label="เปิดประวัติการใช้งานล่าสุด"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 8v5l3 2" />
                        <path d="M3.05 11a9 9 0 1 1 .5 4" />
                        <path d="M3 4v5h5" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {openLaneVisit ? (
                  <button
                    type="button"
                    onClick={() => setLaneVisitAckId(openLaneVisit.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3.5 text-left transition-all ring-offset-2 focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/40",
                      laneConfirmed
                        ? "border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 ring-2 ring-emerald-400/30 backdrop-blur-sm shadow-[0_4px_16px_-6px_rgba(16,185,129,0.25)]"
                        : "border-amber-300/70 bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-sm shadow-[0_4px_16px_-6px_rgba(217,119,6,0.2)] hover:border-amber-400/80",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-black text-[#1e1b4b]">{openLaneVisit.plate_number || "—"}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1",
                          normalizeCarWashServiceStatus(openLaneVisit.service_status) === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                            : "bg-sky-100 text-sky-800 ring-sky-200",
                        )}
                      >
                        {carWashStatusLabelTh(openLaneVisit.service_status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#4d47b6]">{openLaneVisit.package_name}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-[#8b87ad]">
                      {new Date(openLaneVisit.visit_at).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <div
                      className={cn(
                        "mt-2.5 flex items-center gap-1.5 border-t pt-2.5 text-[11px] font-semibold",
                        laneConfirmed
                          ? "border-emerald-200/60 text-emerald-700"
                          : "border-amber-200/60 text-amber-700",
                      )}
                    >
                      {laneConfirmed ? (
                        <>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                          ยืนยันแล้ว — กดชำระด้านล่างได้เลย
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
                          แตะที่นี่เพื่อยืนยันรถในลาน ก่อนกดชำระ
                        </>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-white/60 bg-white/40 px-4 py-4 text-center text-xs text-[#8b87ad] backdrop-blur-sm">
                    ไม่มีคิวค้างในลาน — หลังร้านรับรถ สถานะจะแสดงที่นี่
                  </div>
                )}
                <div className="mt-4 space-y-2 border-t border-white/50 pt-4">
                  <button
                    type="button"
                    onClick={() => void onCheckIn()}
                    disabled={!canPay}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all",
                      canPay
                        ? "border border-[#5b61ff]/30 bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_14px_30px_-10px_rgba(91,97,255,0.65)] active:scale-[0.98]"
                        : "border border-white/60 bg-white/40 text-[#a8a5cc] backdrop-blur-sm",
                    )}
                  >
                    {checkInLoading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 7 9 18l-5-5"/>
                      </svg>
                    )}
                    {checkInLoading ? "กำลังบันทึก..." : "ชำระและหักสิทธิ์ 1 ครั้ง"}
                  </button>

                  {!openLaneVisit ? (
                    <p className="text-center text-xs text-amber-700">รอให้ร้านรับรถและมีคิวในลานก่อน จึงจะชำระได้</p>
                  ) : !laneConfirmed ? (
                    <p className="text-center text-xs text-[#8b87ad]">แตะการ์ดคิวด้านบนเพื่อยืนยัน ก่อนกดชำระ</p>
                  ) : selected && selected.is_active && selected.used_uses < selected.total_uses ? (
                    <p className="text-center text-xs text-[#6b6894]">
                      หลังชำระ สิทธิ์คงเหลือจะเป็น{" "}
                      <span className="font-bold text-[#4d47b6]">
                        {Math.max(0, selected.total_uses - selected.used_uses - 1)}
                      </span>{" "}
                      ครั้ง (จาก {selected.total_uses} ครั้ง)
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

          </>
        )}

        {/* ── messages ── */}
        {msg && (
          <div className="overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.3)] backdrop-blur-xl ring-1 ring-inset ring-emerald-200/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p className="text-sm font-semibold text-emerald-900">{msg}</p>
            </div>
          </div>
        )}
        {err && (
          <div className="overflow-hidden rounded-2xl border border-red-300/60 bg-gradient-to-br from-red-50/80 to-rose-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(220,38,38,0.2)] backdrop-blur-xl ring-1 ring-inset ring-red-200/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-red-700" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
              <p className="text-sm text-red-800">{err}</p>
            </div>
          </div>
        )}

        <FormModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="ประวัติการใช้งานล่าสุด"
          description="รายการเข้าใช้งานของลูกค้าจากการค้นหาครั้งนี้"
          appearance="glass"
          glassTint="violet"
        >
          <ul className="space-y-2">
            {historyPreview.map((v) => {
              const st = normalizeCarWashServiceStatus(v.service_status);
              return (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl border border-white/65 bg-white/55 px-3 py-2.5 text-[11px] shadow-sm backdrop-blur-sm"
                >
                  <span className="min-w-0 font-semibold text-[#2e2a58]">{v.package_name}</span>
                  <span className="shrink-0 rounded-full bg-[#ede9fe] px-2 py-px text-[10px] font-bold text-[#4d47b6]">
                    {carWashStatusLabelTh(v.service_status)}
                  </span>
                  <span className="w-full tabular-nums text-[#9490c0] sm:w-auto sm:text-right">
                    {new Date(v.visit_at).toLocaleString("th-TH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {st === "PAID" && v.final_price > 0 ? ` · ฿${v.final_price.toLocaleString("th-TH")}` : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </FormModal>

      </div>
    </AppPublicCheckInGlassPage>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardHistoryListShellClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { carWashStatusLabelTh, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
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
  /** ต้องแตะการ์ดคิวในลานให้ตรงกับ openLaneVisit ก่อนปุ่มชำระจะเปิด */
  const [laneVisitAckId, setLaneVisitAckId] = useState<number | null>(null);

  const selected = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) ?? null,
    [bundles, selectedBundleId],
  );

  const primaryCustomer = bundles[0] ?? null;

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
      body: JSON.stringify({
        ownerId,
        query: raw,
        trialSessionId: trialSessionId ?? null,
      }),
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
    const firstActive = found.find((b) => b.is_active && b.used_uses < b.total_uses) ?? found[0] ?? null;
    setSelectedBundleId(firstActive?.id ?? null);
    return true;
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    const digits = raw.replace(/\D/g, "");
    const plate = raw.trim().toLowerCase().replace(/[^0-9a-zA-Zก-๙]/g, "");
    const canSearchPhone = digits.length >= 9;
    const canSearchPlate = plate.length >= 2;
    if (!canSearchPhone && !canSearchPlate) {
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
    if (!selectedBundleId || !selected) {
      setErr("เลือกแพ็กเกจก่อน");
      return;
    }
    if (!openLaneVisit) {
      setErr("ยังไม่มีข้อมูลคิวในลาน — รอร้านรับรถก่อน");
      return;
    }
    if (!laneConfirmed) {
      setErr("แตะการ์ดคิวในลานด้านบนเพื่อยืนยัน ก่อนชำระ");
      return;
    }
    if (!selected.is_active || selected.used_uses >= selected.total_uses) {
      setErr("แพ็กเกจนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน");
      return;
    }
    setCheckInLoading(true);
    try {
      if (!ownerId) {
        setErr("ไม่พบข้อมูลเจ้าของร้าน");
        return;
      }
      const res = await fetch("/api/car-wash/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          bundleId: selectedBundleId,
          trialSessionId: trialSessionId ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; bundle?: WashBundle };
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
    <div className="min-h-[100dvh] bg-[#f4f3fb] px-4 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-lg space-y-4 sm:space-y-5">
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="คาร์แคร์สมาชิก"
            description="ค้นหาด้วยเบอร์โทรหรือทะเบียนรถ — ดูสถานะคิว สิทธิ์เหลือ แล้วกดชำระเพื่อหัก 1 ครั้ง"
          />
          <form onSubmit={onSearch} className="space-y-3">
            <label className="block text-xs font-medium text-[#66638c]" htmlFor="cw-member-query">
              ค้นหาลูกค้า
            </label>
            <input
              id="cw-member-query"
              type="text"
              className="app-surface-strong w-full rounded-xl border border-[#e8e6f4] px-3 py-2.5 text-sm text-[#2e2a58] shadow-sm outline-none ring-[#4d47b6]/20 focus:ring-2"
              placeholder="เบอร์โทรลูกค้า หรือทะเบียนรถ"
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 64))}
              autoComplete="tel"
            />
            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "กำลังค้นหา..." : "ค้นหา"}
            </button>
          </form>
        </AppDashboardSection>

        {bundles.length > 0 ? (
          <AppDashboardSection tone="violet" className="space-y-5">
            <AppSectionHeader
              tone="violet"
              title="ข้อมูลลูกค้า"
              description={
                primaryCustomer ?
                  <>
                    <span className="font-semibold text-[#2e2a58]">{primaryCustomer.customer_name}</span>
                    {" · "}
                    {formatPhoneDisplay(primaryCustomer.customer_phone)}
                    {" · ทะเบียน "}
                    <span className="font-medium text-[#4d47b6]">{primaryCustomer.plate_number}</span>
                  </>
                : null
              }
            />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8b87ad]">สถานะการล้าง (คิวในลาน)</h3>
              {openLaneVisit ?
                <button
                  type="button"
                  onClick={() => setLaneVisitAckId(openLaneVisit.id)}
                  className={cn(
                    "mt-2 w-full rounded-xl border px-3 py-3 text-left shadow-sm transition ring-offset-2 ring-offset-[#faf9ff] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/40",
                    laneConfirmed ?
                      "border-emerald-400 bg-emerald-50/95 ring-2 ring-emerald-500/30"
                    : "border-amber-200 bg-amber-50/90 hover:border-amber-300",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#2e2a58]">{openLaneVisit.plate_number}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                        normalizeCarWashServiceStatus(openLaneVisit.service_status) === "COMPLETED" ?
                          "bg-emerald-100 text-emerald-900 ring-emerald-200"
                        : "bg-sky-100 text-sky-900 ring-sky-200",
                      )}
                    >
                      {carWashStatusLabelTh(openLaneVisit.service_status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#5f5a8a]">{openLaneVisit.package_name}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-[#66638c]">
                    {new Date(openLaneVisit.visit_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-2 border-t border-amber-200/60 pt-2 text-[11px] font-medium text-[#4d47b6]">
                    {laneConfirmed ? "✓ ยืนยันแล้ว — กดชำระด้านล่างได้" : "แตะที่นี่เพื่อยืนยันรถในลาน ก่อนกดชำระ"}
                  </p>
                </button>
              : (
                <AppEmptyState tone="violet" className="mt-2 py-5 text-xs sm:text-sm">
                  ไม่มีคิวค้างในลาน — หลังร้านรับรถ สถานะจะแสดงที่นี่จนกว่าจะชำระแล้ว
                </AppEmptyState>
              )}
            </div>

            {historyPreview.length > 0 ?
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8b87ad]">การเข้าใช้ล่าสุด</h3>
                <ul className={cn(appDashboardHistoryListShellClass, "mt-2 space-y-1.5")}>
                  {historyPreview.map((v) => {
                    const st = normalizeCarWashServiceStatus(v.service_status);
                    return (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ecebff] bg-white/90 px-2.5 py-2 text-[11px] sm:text-xs"
                      >
                        <span className="min-w-0 font-medium text-[#2e2a58]">{v.package_name}</span>
                        <span className="shrink-0 rounded-full bg-[#ecebff] px-2 py-px font-semibold text-[#4d47b6]">
                          {carWashStatusLabelTh(v.service_status)}
                        </span>
                        <span className="w-full tabular-nums text-[#8b87ad] sm:w-auto sm:text-right">
                          {new Date(v.visit_at).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {st === "PAID" && v.final_price > 0 ?
                            ` · ฿${v.final_price.toLocaleString("th-TH")}`
                          : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            : null}

            <div>
              <AppSectionHeader
                tone="violet"
                title="สิทธิ์แพ็กเหมา"
                description="เมื่อมีคิวในลาน ให้แตะการ์ดคิวเพื่อยืนยัน แล้วเลือกแพ็กและกดชำระ"
              />
              <div className="mt-3 flex flex-col gap-2">
                {bundles.map((b) => {
                  const remain = Math.max(0, b.total_uses - b.used_uses);
                  const canUse = b.is_active && remain > 0;
                  const isSel = selectedBundleId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBundleId(b.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left shadow-sm transition",
                        isSel ?
                          "border-[#4d47b6] bg-[#ecebff] ring-1 ring-[#4d47b6]/25"
                        : "border-[#e8e6f4] bg-white hover:border-[#4d47b6]/35",
                      )}
                    >
                      <p className="text-sm font-bold text-[#2e2a58]">{b.package_name}</p>
                      <p className="mt-0.5 text-xs text-[#66638c]">
                        ใช้แล้ว {b.used_uses} / {b.total_uses} ครั้ง
                      </p>
                      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                        <span className={cn("text-base font-bold tabular-nums", canUse ? "text-emerald-700" : "text-amber-800")}>
                          เหลือ {remain} ครั้ง
                        </span>
                        {!b.is_active ?
                          <span className="text-[11px] font-semibold text-amber-800">ปิดใช้งาน</span>
                        : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#ecebff] pt-4">
              <button
                type="button"
                onClick={() => void onCheckIn()}
                disabled={!canPay}
                className="app-btn-primary w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              >
                {checkInLoading ? "กำลังบันทึก..." : "ชำระและหักสิทธิ์ 1 ครั้ง"}
              </button>
              {!openLaneVisit ?
                <p className="mt-2 text-center text-xs text-amber-800">รอให้มีข้อมูลคิวในลานก่อน จึงจะชำระได้</p>
              : !laneConfirmed ?
                <p className="mt-2 text-center text-xs text-[#66638c]">แตะการ์ดคิวในลานด้านบนเพื่อยืนยัน ก่อนกดชำระ</p>
              : selected && selected.is_active && selected.used_uses < selected.total_uses ?
                <p className="mt-2 text-center text-xs text-[#66638c]">
                  หลังชำระ สิทธิ์คงเหลือจะเป็น{" "}
                  <span className="font-bold text-[#4d47b6]">
                    {Math.max(0, selected.total_uses - selected.used_uses - 1)}
                  </span>{" "}
                  ครั้ง (จาก {selected.total_uses} ครั้ง)
                </p>
              : null}
            </div>
          </AppDashboardSection>
        ) : null}

        {msg ?
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm">
            {msg}
          </div>
        : null}
        {err ?
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">{err}</div>
        : null}
      </div>
    </div>
  );
}

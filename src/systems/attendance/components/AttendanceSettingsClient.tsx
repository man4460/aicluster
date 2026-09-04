"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AttendanceDeviceApiSettings } from "@/systems/attendance/components/AttendanceDeviceApiSettings";
import {
  AppDashboardSection,
  AppSectionHeader,
  AppTime24Input,
} from "@/components/app-templates";
import {
  ATTENDANCE_MAX_RADIUS_METERS,
  ATTENDANCE_MIN_RADIUS_METERS,
} from "@/lib/attendance/constants";
import type { AttendancePlanQuota } from "@/lib/attendance/plan-quota";
import {
  ATTENDANCE_MAX_SHIFTS_PER_LOCATION,
  formatAttendanceLocationLimit,
} from "@/lib/attendance/plan-quota";
import { ModuleMonthlyUpgradeCta } from "@/components/dashboard/ModuleMonthlyUpgradeCta";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { cn } from "@/lib/cn";
import {
  attendanceAddLocationDashedClass,
  attendanceFieldClass,
  attendanceInsetClass,
  attendanceLabelClass,
  attendancePrimaryBtnClass,
} from "@/systems/attendance/attendance-ui";
import {
  attendanceMobileSelectClass,
  attendancePrimaryTabPillClass,
  attendancePrimaryTabShellClass,
  attendanceSectionRadiusClass,
} from "@/systems/attendance/lib/ui-tokens";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type ShiftRow = { startTime: string; endTime: string };
type LocRow = {
  id?: number;
  name: string;
  allowedLocationLat: number;
  allowedLocationLng: number;
  radiusMeters: number;
  shifts: ShiftRow[];
};
type BranchRow = {
  id?: number;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  locations: LocRow[];
};

type SettingsTab = "locations" | "checkin" | "device";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "locations", label: "สาขา · จุดเช็ค" },
  { id: "checkin", label: "ทางเลือกเช็คอิน" },
  { id: "device", label: "อุปกรณ์ (ESP32)" },
];

function emptyLocation(): LocRow {
  return {
    name: "จุดเช็ค",
    allowedLocationLat: 13.7563309,
    allowedLocationLng: 100.5017651,
    radiusMeters: 150,
    shifts: [{ startTime: "09:00", endTime: "18:00" }],
  };
}

function emptyBranch(index: number): BranchRow {
  return {
    name: index === 0 ? "สาขาหลัก" : `สาขา ${index + 1}`,
    code: index === 0 ? "MAIN" : `BR${index + 1}`,
    address: "",
    isActive: true,
    locations: [emptyLocation()],
  };
}

function totalLocationCount(branches: BranchRow[]): number {
  return branches.reduce((n, b) => n + b.locations.length, 0);
}

function parseTab(raw: string | null): SettingsTab {
  if (raw && TABS.some((t) => t.id === raw)) return raw as SettingsTab;
  return "locations";
}

function mapApiBranches(
  rows: {
    id: number;
    name: string;
    code: string;
    address: string;
    isActive: boolean;
    locations: {
      id: number;
      name: string;
      allowedLocationLat: number;
      allowedLocationLng: number;
      radiusMeters: number;
      shifts: { startTime: string; endTime: string }[];
    }[];
  }[],
): BranchRow[] {
  return rows.map((br) => ({
    id: br.id,
    name: br.name,
    code: br.code,
    address: br.address,
    isActive: br.isActive,
    locations: br.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      allowedLocationLat: loc.allowedLocationLat,
      allowedLocationLng: loc.allowedLocationLng,
      radiusMeters: loc.radiusMeters,
      shifts: loc.shifts.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
    })),
  }));
}

export function AttendanceSettingsClient() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.25rem] bg-white/30" aria-busy />}>
      <AttendanceSettingsClientInner />
    </Suspense>
  );
}

function AttendanceSettingsClientInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseTab(searchParams.get("tab")));
  const [quota, setQuota] = useState<AttendancePlanQuota | null>(null);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [faceCheckInEnabled, setFaceCheckInEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [geoBusyKey, setGeoBusyKey] = useState<string | null>(null);
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [activeLocIndex, setActiveLocIndex] = useState(0);

  const locCount = useMemo(() => totalLocationCount(branches), [branches]);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/settings", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      quota?: AttendancePlanQuota;
      faceCheckInEnabled?: boolean;
      branches?: Parameters<typeof mapApiBranches>[0];
      locations?: {
        id: number;
        name: string;
        allowedLocationLat: number;
        allowedLocationLng: number;
        radiusMeters: number;
        shifts: { startTime: string; endTime: string }[];
      }[];
      error?: string;
    };
    if (!res.ok) {
      setErr(j.error ?? "โหลดไม่สำเร็จ");
      setQuota(null);
      setBranches([]);
      return;
    }
    setQuota(j.quota ?? null);
    setFaceCheckInEnabled(Boolean(j.faceCheckInEnabled));
    if (j.branches?.length) {
      setBranches(mapApiBranches(j.branches));
    } else if (j.locations?.length) {
      setBranches([
        {
          name: "สาขาหลัก",
          code: "MAIN",
          address: "",
          isActive: true,
          locations: j.locations.map((loc) => ({
            id: loc.id,
            name: loc.name,
            allowedLocationLat: loc.allowedLocationLat,
            allowedLocationLng: loc.allowedLocationLng,
            radiusMeters: loc.radiusMeters,
            shifts: loc.shifts.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
          })),
        },
      ]);
    } else {
      setBranches([emptyBranch(0)]);
    }
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [load]);

  useEffect(() => {
    if (activeBranchIndex >= branches.length) {
      setActiveBranchIndex(Math.max(0, branches.length - 1));
    }
  }, [branches.length, activeBranchIndex]);

  const branch = branches[activeBranchIndex];
  const branchLocs = branch?.locations ?? [];

  useEffect(() => {
    if (activeLocIndex >= branchLocs.length) {
      setActiveLocIndex(Math.max(0, branchLocs.length - 1));
    }
  }, [branchLocs.length, activeLocIndex]);

  const fillLocationFromDevice = useCallback((bi: number, li: number) => {
    if (!navigator.geolocation) {
      setErr("เบราว์เซอร์ไม่รองรับการดึงตำแหน่ง");
      return;
    }
    const key = `${bi}-${li}`;
    setGeoBusyKey(key);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBranches((prev) =>
          prev.map((b, i) => {
            if (i !== bi) return b;
            return {
              ...b,
              locations: b.locations.map((L, j) =>
                j === li
                  ? {
                      ...L,
                      allowedLocationLat: pos.coords.latitude,
                      allowedLocationLng: pos.coords.longitude,
                    }
                  : L,
              ),
            };
          }),
        );
        setGeoBusyKey(null);
      },
      () => {
        setErr("ไม่ได้รับพิกัด — อนุญาตการเข้าถึงตำแหน่งแล้วลองอีกครั้ง");
        setGeoBusyKey(null);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  const maxLoc = quota?.maxLocations ?? 1;
  const maxLocLabel = formatAttendanceLocationLimit(quota?.maxLocations ?? 1);
  const canAddLocation = quota?.maxLocations == null || locCount < quota.maxLocations;
  const overLocationQuota = quota?.maxLocations != null && locCount > quota.maxLocations;

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          faceCheckInEnabled,
          branches: branches.map((br) => ({
            ...(br.id != null ? { id: br.id } : {}),
            name: br.name,
            code: br.code,
            address: br.address,
            isActive: br.isActive,
            locations: br.locations.map((loc) => ({
              ...(loc.id != null ? { id: loc.id } : {}),
              name: loc.name,
              allowedLocationLat: loc.allowedLocationLat,
              allowedLocationLng: loc.allowedLocationLng,
              radiusMeters: loc.radiusMeters,
              shifts: loc.shifts,
            })),
          })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      await load();
      setMsg("บันทึกแล้ว — สาขาและจุดเช็คจะสะท้อนใน QR / รายงาน");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppDashboardSection tone="violet" className={cn(attendanceSectionRadiusClass, "animate-pulse")}>
        <p className="text-sm font-medium text-[#66638c]">กำลังโหลดตั้งค่า…</p>
      </AppDashboardSection>
    );
  }

  if (!quota) {
    return (
      <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {err ?? "ไม่สามารถโหลดข้อมูลได้"}
        </p>
      </AppDashboardSection>
    );
  }

  const bi = Math.min(activeBranchIndex, Math.max(0, branches.length - 1));
  const li = Math.min(activeLocIndex, Math.max(0, branchLocs.length - 1));
  const loc = branchLocs[li];
  const geoKey = `${bi}-${li}`;

  return (
    <AppDashboardSection tone="violet" className={cn(attendanceSectionRadiusClass, "!rounded-[1.25rem]")}>
      <form onSubmit={onSave}>
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าเช็คอิน"
          description="สาขา · จุดเช็ค · กะ · สแกนใบหน้า · Device API"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            tab !== "device" ? (
              <button
                type="submit"
                disabled={saving || locCount === 0 || overLocationQuota}
                className={cn(attendancePrimaryBtnClass, "min-h-10 rounded-xl px-4 text-sm")}
              >
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            ) : null
          }
        />

        <div className="mt-3 space-y-2 sm:hidden">
          <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="attendance-settings-tab">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="attendance-settings-tab"
            className={attendanceMobileSelectClass}
            value={tab}
            onChange={(e) => selectTab(e.target.value as SettingsTab)}
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 hidden sm:block">
          <nav className={attendancePrimaryTabShellClass} role="tablist" aria-label="หมวดตั้งค่าเช็คอิน">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`attendance-settings-panel-${t.id}`}
                id={`attendance-settings-tab-${t.id}`}
                className={attendancePrimaryTabPillClass(tab === t.id)}
                onClick={() => selectTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {err ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {msg}
          </p>
        ) : null}
        {tab === "locations" && maxLoc != null && !canAddLocation ? (
          <div className="mt-3">
            <ModuleMonthlyUpgradeCta
              moduleSlug={ATTENDANCE_MODULE_SLUG}
              benefit={
                overLocationQuota
                  ? `มีจุดเช็ค ${locCount} จุด แต่แพ็กปัจจุบันรองรับได้ ${maxLoc} จุด — อัปเกรดแพ็กรายเดือนเพื่อเพิ่มโควต้า (หรือลบจุดที่ไม่ใช้)`
                  : `ใช้ครบโควต้าจุดเช็คแล้ว (${locCount}/${maxLocLabel}) — อัปเกรดแพ็กรายเดือนเพื่อเพิ่มจุด`
              }
              onUpgraded={() => void load()}
            />
          </div>
        ) : null}

        <div
          className="mt-4"
          role="tabpanel"
          id={`attendance-settings-panel-${tab}`}
          aria-labelledby={`attendance-settings-tab-${tab}`}
        >
          {tab === "locations" && branch && loc ? (
            <div className="space-y-4">
              <div className={attendanceInsetClass}>
                <p className="text-xs font-bold text-[#4d47b6]">โควต้าจุดเช็ค</p>
                <p className="mt-1 text-xs font-medium text-[#66638c]">
                  แพ็ก {quota.label} · ใช้ {locCount}/{maxLocLabel} จุด · {branches.length} สาขา · กะต่อจุดไม่เกิน{" "}
                  {ATTENDANCE_MAX_SHIFTS_PER_LOCATION}
                </p>
                <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#8b87b8]">
                  สาขา = หน่วยองค์กร · จุดเช็ค = GPS + QR แยกต่อจุด · โควต้านับจำนวนจุดเช็ครวมทุกสาขา
                </p>
              </div>

              {branches.length > 1 ? (
                <>
                  <div className="space-y-2 sm:hidden">
                    <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="attendance-settings-branch">
                      เลือกสาขา
                    </label>
                    <select
                      id="attendance-settings-branch"
                      className={attendanceMobileSelectClass}
                      value={bi}
                      onChange={(e) => {
                        setActiveBranchIndex(Number(e.target.value));
                        setActiveLocIndex(0);
                      }}
                    >
                      {branches.map((b, i) => (
                        <option key={i} value={i}>
                          {b.name.trim() || b.code} ({b.locations.length} จุด)
                        </option>
                      ))}
                    </select>
                  </div>
                  <nav
                    className="hidden flex-wrap gap-1.5 sm:flex"
                    role="tablist"
                    aria-label="เลือกสาขา"
                  >
                    {branches.map((b, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={bi === i}
                        className={attendancePrimaryTabPillClass(bi === i)}
                        onClick={() => {
                          setActiveBranchIndex(i);
                          setActiveLocIndex(0);
                        }}
                      >
                        {b.name.trim() || b.code}
                      </button>
                    ))}
                  </nav>
                </>
              ) : null}

              <div className="space-y-3 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลสาขา</p>
                  {branches.length > 1 ? (
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบสาขา ${branch.name}`}
                      title="ลบสาขานี้"
                      onClick={() => {
                        setBranches((prev) => prev.filter((_, i) => i !== bi));
                        setActiveBranchIndex((prev) => Math.max(0, prev - 1));
                        setActiveLocIndex(0);
                      }}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={cn("block", attendanceLabelClass)}>
                    ชื่อสาขา
                    <input
                      className={attendanceFieldClass}
                      value={branch.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBranches((prev) => prev.map((b, i) => (i === bi ? { ...b, name: v } : b)));
                      }}
                    />
                  </label>
                  <label className={cn("block", attendanceLabelClass)}>
                    รหัสสาขา (Excel / รายงาน)
                    <input
                      className={attendanceFieldClass}
                      value={branch.code}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        setBranches((prev) => prev.map((b, i) => (i === bi ? { ...b, code: v } : b)));
                      }}
                    />
                  </label>
                </div>

                <label className={cn("block", attendanceLabelClass)}>
                  ที่อยู่ (ไม่บังคับ)
                  <input
                    className={attendanceFieldClass}
                    value={branch.address}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBranches((prev) => prev.map((b, i) => (i === bi ? { ...b, address: v } : b)));
                    }}
                  />
                </label>
              </div>

              {branchLocs.length > 1 ? (
                <nav className="flex flex-wrap gap-1.5" role="tablist" aria-label="เลือกจุดเช็ค">
                  {branchLocs.map((L, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={li === i}
                      className={attendancePrimaryTabPillClass(li === i)}
                      onClick={() => setActiveLocIndex(i)}
                    >
                      {L.name.trim() || `จุด ${i + 1}`}
                    </button>
                  ))}
                </nav>
              ) : null}

              <div className="space-y-3 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#4d47b6]">จุดเช็คอิน {li + 1}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                      {loc.name.trim() || "ยังไม่ตั้งชื่อ"}
                    </p>
                  </div>
                  {branchLocs.length > 1 ? (
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบจุดเช็คอิน ${li + 1}`}
                      title="ลบจุดนี้"
                      onClick={() => {
                        setBranches((prev) =>
                          prev.map((b, i) =>
                            i === bi ? { ...b, locations: b.locations.filter((_, j) => j !== li) } : b,
                          ),
                        );
                        setActiveLocIndex((prev) => Math.max(0, prev - 1));
                      }}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <label className={cn("block", attendanceLabelClass)}>
                  ชื่อจุดเช็ค (แสดงบนหน้าเช็ค / QR)
                  <input
                    className={attendanceFieldClass}
                    value={loc.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBranches((prev) =>
                        prev.map((b, i) =>
                          i === bi
                            ? {
                                ...b,
                                locations: b.locations.map((L, j) => (j === li ? { ...L, name: v } : L)),
                              }
                            : b,
                        ),
                      );
                    }}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={attendanceLabelClass}>
                    ละติจูด
                    <input
                      type="number"
                      step="any"
                      className={attendanceFieldClass}
                      value={loc.allowedLocationLat}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setBranches((prev) =>
                          prev.map((b, i) =>
                            i === bi
                              ? {
                                  ...b,
                                  locations: b.locations.map((L, j) =>
                                    j === li ? { ...L, allowedLocationLat: n } : L,
                                  ),
                                }
                              : b,
                          ),
                        );
                      }}
                    />
                  </label>
                  <label className={attendanceLabelClass}>
                    ลองจิจูด
                    <input
                      type="number"
                      step="any"
                      className={attendanceFieldClass}
                      value={loc.allowedLocationLng}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setBranches((prev) =>
                          prev.map((b, i) =>
                            i === bi
                              ? {
                                  ...b,
                                  locations: b.locations.map((L, j) =>
                                    j === li ? { ...L, allowedLocationLng: n } : L,
                                  ),
                                }
                              : b,
                          ),
                        );
                      }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={geoBusyKey === geoKey}
                  onClick={() => fillLocationFromDevice(bi, li)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm transition hover:bg-white disabled:opacity-50 sm:w-auto"
                >
                  {geoBusyKey === geoKey ? "กำลังดึงตำแหน่ง…" : "ดึงตำแหน่งจากอุปกรณ์นี้"}
                </button>

                <label className={cn("block", attendanceLabelClass)}>
                  รัศมี (เมตร) — สูงสุด {ATTENDANCE_MAX_RADIUS_METERS} ม.
                  <input
                    type="number"
                    min={ATTENDANCE_MIN_RADIUS_METERS}
                    max={ATTENDANCE_MAX_RADIUS_METERS}
                    className={cn(attendanceFieldClass, "max-w-xs")}
                    value={loc.radiusMeters}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setBranches((prev) =>
                        prev.map((b, i) =>
                          i === bi
                            ? {
                                ...b,
                                locations: b.locations.map((L, j) =>
                                  j === li ? { ...L, radiusMeters: n } : L,
                                ),
                              }
                            : b,
                        ),
                      );
                    }}
                  />
                </label>

                <div className="border-t border-[#ecebff]/80 pt-3">
                  <p className="text-xs font-bold text-[#4d47b6]">
                    กะ (สูงสุด {ATTENDANCE_MAX_SHIFTS_PER_LOCATION})
                  </p>
                  <div className="mt-2.5 space-y-2.5">
                    {loc.shifts.map((sh, si) => (
                      <div
                        key={si}
                        className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm"
                      >
                        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                          <label className="text-[11px] font-semibold text-[#66638c]">
                            เริ่ม (เวลาไทย)
                            <AppTime24Input
                              className="mt-0.5"
                              selectClassName="min-h-[40px] rounded-xl border border-[#e1e3ff] bg-white px-2 py-1.5 text-sm font-semibold"
                              value={sh.startTime}
                              onChange={(v) => {
                                setBranches((prev) =>
                                  prev.map((b, i) => {
                                    if (i !== bi) return b;
                                    return {
                                      ...b,
                                      locations: b.locations.map((L, j) => {
                                        if (j !== li) return L;
                                        return {
                                          ...L,
                                          shifts: L.shifts.map((s, k) =>
                                            k === si ? { ...s, startTime: v } : s,
                                          ),
                                        };
                                      }),
                                    };
                                  }),
                                );
                              }}
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-[#66638c]">
                            สิ้นสุด (เวลาไทย)
                            <AppTime24Input
                              className="mt-0.5"
                              selectClassName="min-h-[40px] rounded-xl border border-[#e1e3ff] bg-white px-2 py-1.5 text-sm font-semibold"
                              value={sh.endTime}
                              onChange={(v) => {
                                setBranches((prev) =>
                                  prev.map((b, i) => {
                                    if (i !== bi) return b;
                                    return {
                                      ...b,
                                      locations: b.locations.map((L, j) => {
                                        if (j !== li) return L;
                                        return {
                                          ...L,
                                          shifts: L.shifts.map((s, k) =>
                                            k === si ? { ...s, endTime: v } : s,
                                          ),
                                        };
                                      }),
                                    };
                                  }),
                                );
                              }}
                            />
                          </label>
                        </div>
                        {loc.shifts.length > 1 ? (
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบกะ ${si + 1}`}
                            title="ลบกะ"
                            onClick={() =>
                              setBranches((prev) =>
                                prev.map((b, i) => {
                                  if (i !== bi) return b;
                                  return {
                                    ...b,
                                    locations: b.locations.map((L, j) => {
                                      if (j !== li) return L;
                                      return { ...L, shifts: L.shifts.filter((_, k) => k !== si) };
                                    }),
                                  };
                                }),
                              )
                            }
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {loc.shifts.length < quota.maxShiftsPerLocation ? (
                      <button
                        type="button"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#4d47b6]/25 bg-[#ecebff]/80 px-3 text-xs font-black text-[#4d47b6] hover:bg-[#e4e1ff]"
                        onClick={() =>
                          setBranches((prev) =>
                            prev.map((b, i) => {
                              if (i !== bi) return b;
                              return {
                                ...b,
                                locations: b.locations.map((L, j) => {
                                  if (j !== li) return L;
                                  return {
                                    ...L,
                                    shifts: [...L.shifts, { startTime: "13:00", endTime: "17:00" }],
                                  };
                                }),
                              };
                            }),
                          )
                        }
                      >
                        + เพิ่มกะ
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {canAddLocation ? (
                  <div className={cn(attendanceAddLocationDashedClass, "flex-1 min-w-[200px]")}>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] bg-gradient-to-r from-[#5b61ff] to-[#8b5cf6] px-5 text-sm font-black text-white shadow-md"
                      onClick={() => {
                        setBranches((prev) =>
                          prev.map((b, i) =>
                            i === bi ? { ...b, locations: [...b.locations, emptyLocation()] } : b,
                          ),
                        );
                        setActiveLocIndex(branchLocs.length);
                      }}
                    >
                      + เพิ่มจุดเช็คในสาขานี้
                      <span className="text-[11px] font-semibold text-white/80">
                        ({locCount}/{maxLocLabel})
                      </span>
                    </button>
                  </div>
                ) : maxLoc != null ? (
                  <div className={cn(attendanceAddLocationDashedClass, "flex-1 min-w-[200px]")}>
                    <p className="px-2 text-center text-sm font-semibold text-[#66638c]">
                      โควตาจุดเช็คเต็มแล้ว ({locCount}/{maxLocLabel}) — ใช้ปุ่มอัปเกรดด้านบน
                    </p>
                  </div>
                ) : null}

                <div className={cn(attendanceAddLocationDashedClass, "flex-1 min-w-[200px]")}>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] border-2 border-dashed border-[#4d47b6]/35 bg-white/70 px-5 text-sm font-black text-[#4d47b6] shadow-sm hover:bg-white"
                    onClick={() => {
                      setBranches((prev) => [...prev, emptyBranch(prev.length)]);
                      setActiveBranchIndex(branches.length);
                      setActiveLocIndex(0);
                    }}
                  >
                    + เพิ่มสาขาใหม่
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "checkin" ? (
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
                <p className="text-xs font-bold text-[#4d47b6]">สแกนใบหน้า</p>
                <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                  เปิดสแกนใบหน้าเพิ่มจากลิงก์ / QR แยก — เช็คด้วยเบอร์ยังใช้ได้ตามปกติ
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[#d8d6ec] text-[#5b61ff] focus:ring-[#5b61ff]"
                    checked={faceCheckInEnabled}
                    onChange={(e) => setFaceCheckInEnabled(e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className={cn("block", attendanceLabelClass)}>เปิดเช็คอินด้วยสแกนใบหน้า</span>
                    <span className="mt-0.5 block text-xs font-medium text-[#66638c]">
                      ใช้กับลิงก์ «สแกนใบหน้า» / QR iPad · ต้องลงทะเบียนใบหน้าในรายชื่อก่อน · จับคู่เฉพาะในองค์กรนี้
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {tab === "device" ? <AttendanceDeviceApiSettings embedded /> : null}
        </div>
      </form>
    </AppDashboardSection>
  );
}

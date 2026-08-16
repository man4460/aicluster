"use client";

import { AttendanceDeviceApiSettings } from "@/systems/attendance/components/AttendanceDeviceApiSettings";
import { AppTime24Input } from "@/components/app-templates";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AttendancePlanQuota } from "@/lib/attendance/plan-quota";
import { ATTENDANCE_MAX_SHIFTS_PER_LOCATION } from "@/lib/attendance/plan-quota";
import { cn } from "@/lib/cn";
import {
  ATTENDANCE_LOCATION_TONES,
  attendanceAddLocationDashedClass,
  attendanceFieldClass,
  attendanceIconBadgeClass,
  attendanceInsetToneClass,
  attendanceLabelClass,
  attendancePanelAccentBarClass,
  attendancePanelToneClass,
  attendancePrimaryBtnClass,
  attendanceSectionTitleClass,
  type AttendancePanelTone,
} from "@/systems/attendance/attendance-ui";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type ShiftRow = { startTime: string; endTime: string };
type LocRow = {
  /** จากเซิร์ฟเวอร์ — คงไว้เพื่อไม่ให้ลิงก์ ?loc= เปลี่ยนทุกครั้งที่แก้ชื่อจุด */
  id?: number;
  name: string;
  allowedLocationLat: number;
  allowedLocationLng: number;
  radiusMeters: number;
  shifts: ShiftRow[];
};

function emptyLocation(): LocRow {
  return {
    name: "จุดเช็ค",
    allowedLocationLat: 13.7563309,
    allowedLocationLng: 100.5017651,
    radiusMeters: 150,
    shifts: [{ startTime: "09:00", endTime: "18:00" }],
  };
}

function SettingsSectionHeader({
  tone,
  title,
  description,
  icon,
  action,
}: {
  tone: AttendancePanelTone;
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={attendanceIconBadgeClass(tone)} aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className={attendanceSectionTitleClass}>{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs font-medium leading-snug text-[#66638c]">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function IconFace({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01M8.5 15c1.2 1.2 2.5 1.8 3.5 1.8s2.3-.6 3.5-1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function IconRadius({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  );
}

export function AttendanceSettingsClient() {
  const [quota, setQuota] = useState<AttendancePlanQuota | null>(null);
  const [locations, setLocations] = useState<LocRow[]>([]);
  const [faceCheckInEnabled, setFaceCheckInEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [geoBusyIndex, setGeoBusyIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/settings", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      quota?: AttendancePlanQuota;
      faceCheckInEnabled?: boolean;
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
      setLocations([]);
      return;
    }
    setQuota(j.quota ?? null);
    setFaceCheckInEnabled(Boolean(j.faceCheckInEnabled));
    if (j.locations?.length) {
      setLocations(
        j.locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          allowedLocationLat: loc.allowedLocationLat,
          allowedLocationLng: loc.allowedLocationLng,
          radiusMeters: loc.radiusMeters,
          shifts: loc.shifts.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
        })),
      );
    } else {
      setLocations([emptyLocation()]);
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

  const fillLocationFromDevice = useCallback((li: number) => {
    if (!navigator.geolocation) {
      setErr("เบราว์เซอร์ไม่รองรับการดึงตำแหน่ง");
      return;
    }
    setGeoBusyIndex(li);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocations((prev) =>
          prev.map((L, i) =>
            i === li
              ? {
                  ...L,
                  allowedLocationLat: pos.coords.latitude,
                  allowedLocationLng: pos.coords.longitude,
                }
              : L,
          ),
        );
        setGeoBusyIndex(null);
      },
      () => {
        setErr("ไม่ได้รับพิกัด — อนุญาตการเข้าถึงตำแหน่งแล้วลองอีกครั้ง");
        setGeoBusyIndex(null);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  const maxLoc = quota?.maxLocations ?? 1;
  const canAddLocation = locations.length < maxLoc;

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
          locations: locations.map((loc) => ({
            ...(loc.id != null ? { id: loc.id } : {}),
            name: loc.name,
            allowedLocationLat: loc.allowedLocationLat,
            allowedLocationLng: loc.allowedLocationLng,
            radiusMeters: loc.radiusMeters,
            shifts: loc.shifts,
          })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; locations?: unknown };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      await load();
      setMsg("บันทึกแล้ว — ลิงก์และ QR ที่สร้างจากหน้า QR จะชี้ตามจุดเช็คที่ตั้งไว้");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={cn(attendancePanelToneClass("violet"), "animate-pulse")}>
        <p className="text-sm font-medium text-[#66638c]">กำลังโหลดตั้งค่า…</p>
      </div>
    );
  }

  if (!quota) {
    return (
      <p className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
        {err ?? "ไม่สามารถโหลดข้อมูลได้"}
      </p>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      {err ? (
        <p className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {msg}
        </p>
      ) : null}

      <section className={attendancePanelToneClass("violet")}>
        <div className={attendancePanelAccentBarClass("violet")} aria-hidden />
        <div className="mt-4">
          <SettingsSectionHeader
            tone="violet"
            title="ทางเลือกเช็คอิน"
            description="เปิดสแกนใบหน้าเพิ่มจากลิงก์ / QR แยก — เช็คด้วยเบอร์ยังใช้ได้ตามปกติ"
            icon={<IconFace className="h-5 w-5" />}
          />
          <label
            className={cn(
              attendanceInsetToneClass("violet"),
              "mt-4 flex cursor-pointer items-start gap-3 transition hover:brightness-[1.02]",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[#d8d6ec] text-[#5b61ff] focus:ring-[#5b61ff]"
              checked={faceCheckInEnabled}
              onChange={(e) => setFaceCheckInEnabled(e.target.checked)}
            />
            <span className="min-w-0">
              <span className={cn("block", attendanceLabelClass)}>เปิดเช็คอินด้วยสแกนใบหน้า</span>
              <span className="mt-0.5 block text-xs font-medium text-[#66638c]">
                ใช้กับลิงก์ «สแกนใบหน้า» / QR iPad · ต้องลงทะเบียนใบหน้าในรายชื่อก่อน
              </span>
            </span>
          </label>
        </div>
      </section>

      <AttendanceDeviceApiSettings />

      {locations.map((loc, li) => {
        const tone = ATTENDANCE_LOCATION_TONES[li % ATTENDANCE_LOCATION_TONES.length]!;
        return (
          <section key={li} className={attendancePanelToneClass(tone)}>
            <div className={attendancePanelAccentBarClass(tone)} aria-hidden />
            <div className="mt-4 space-y-3.5">
              <SettingsSectionHeader
                tone={tone}
                title={`จุดเช็คอิน ${li + 1}`}
                description={loc.name.trim() || "ยังไม่ตั้งชื่อ"}
                icon={<IconPin className="h-5 w-5" />}
                action={
                  locations.length > 1 ? (
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบจุดเช็คอิน ${li + 1}`}
                      title="ลบจุดนี้"
                      onClick={() => setLocations((prev) => prev.filter((_, i) => i !== li))}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  ) : null
                }
              />

              <div className={attendanceInsetToneClass(tone)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn(attendanceIconBadgeClass(tone), "h-8 w-8 rounded-xl shadow-md")}>
                    <IconPin className="h-4 w-4" />
                  </span>
                  <p className={cn(attendanceSectionTitleClass, "text-xs")}>ชื่อและตำแหน่ง</p>
                </div>
                <label className={cn("block", attendanceLabelClass)}>
                  ชื่อจุดเช็ค (แสดงบนหน้าเช็ค / QR)
                  <input
                    className={attendanceFieldClass}
                    value={loc.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLocations((prev) => prev.map((L, i) => (i === li ? { ...L, name: v } : L)));
                    }}
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={attendanceLabelClass}>
                    ละติจูด
                    <input
                      type="number"
                      step="any"
                      className={attendanceFieldClass}
                      value={loc.allowedLocationLat}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setLocations((prev) =>
                          prev.map((L, i) => (i === li ? { ...L, allowedLocationLat: n } : L)),
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
                        setLocations((prev) =>
                          prev.map((L, i) => (i === li ? { ...L, allowedLocationLng: n } : L)),
                        );
                      }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={geoBusyIndex === li}
                  onClick={() => fillLocationFromDevice(li)}
                  className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm transition hover:bg-white disabled:opacity-50 sm:w-auto"
                >
                  <IconPin className="h-4 w-4 text-[#5b61ff]" />
                  {geoBusyIndex === li ? "กำลังดึงตำแหน่ง…" : "ดึงตำแหน่งจากอุปกรณ์นี้"}
                </button>
              </div>

              <div className={attendanceInsetToneClass(tone)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn(attendanceIconBadgeClass(tone), "h-8 w-8 rounded-xl shadow-md")}>
                    <IconRadius className="h-4 w-4" />
                  </span>
                  <p className={cn(attendanceSectionTitleClass, "text-xs")}>รัศมีอนุญาต</p>
                </div>
                <label className={cn("block", attendanceLabelClass)}>
                  รัศมี (เมตร) — พนักงานต้องอยู่ในระยะนี้จากจุดกลาง
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    className={cn(attendanceFieldClass, "max-w-xs")}
                    value={loc.radiusMeters}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setLocations((prev) =>
                        prev.map((L, i) => (i === li ? { ...L, radiusMeters: n } : L)),
                      );
                    }}
                  />
                </label>
              </div>

              <div className={attendanceInsetToneClass(tone)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn(attendanceIconBadgeClass(tone), "h-8 w-8 rounded-xl shadow-md")}>
                    <IconClock className="h-4 w-4" />
                  </span>
                  <p className={cn(attendanceSectionTitleClass, "text-xs")}>
                    กะ (สูงสุด {ATTENDANCE_MAX_SHIFTS_PER_LOCATION})
                  </p>
                </div>
                <div className="space-y-2.5">
                  {loc.shifts.map((sh, si) => (
                    <div
                      key={si}
                      className="flex flex-wrap items-end justify-between gap-3 rounded-[1.25rem] border border-white/70 bg-white/85 p-3 shadow-sm"
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                        <label className="text-[11px] font-semibold text-[#66638c]">
                          เริ่ม (เวลาไทย)
                          <AppTime24Input
                            className="mt-0.5"
                            selectClassName="min-h-[40px] rounded-xl border border-[#e1e3ff] bg-white px-2 py-1.5 text-sm font-semibold"
                            value={sh.startTime}
                            onChange={(v) => {
                              setLocations((prev) =>
                                prev.map((L, i) => {
                                  if (i !== li) return L;
                                  const nextSh = L.shifts.map((s, j) =>
                                    j === si ? { ...s, startTime: v } : s,
                                  );
                                  return { ...L, shifts: nextSh };
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
                              setLocations((prev) =>
                                prev.map((L, i) => {
                                  if (i !== li) return L;
                                  const nextSh = L.shifts.map((s, j) =>
                                    j === si ? { ...s, endTime: v } : s,
                                  );
                                  return { ...L, shifts: nextSh };
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
                            setLocations((prev) =>
                              prev.map((L, i) => {
                                if (i !== li) return L;
                                return { ...L, shifts: L.shifts.filter((_, j) => j !== si) };
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
                        setLocations((prev) =>
                          prev.map((L, i) => {
                            if (i !== li) return L;
                            return {
                              ...L,
                              shifts: [...L.shifts, { startTime: "13:00", endTime: "17:00" }],
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
          </section>
        );
      })}

      {canAddLocation ? (
        <div className={attendanceAddLocationDashedClass}>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] bg-gradient-to-r from-[#5b61ff] to-[#8b5cf6] px-5 text-sm font-black text-white shadow-md"
            onClick={() => setLocations((prev) => [...prev, emptyLocation()])}
          >
            + เพิ่มโลเคชัน
            <span className="text-[11px] font-semibold text-white/80">
              ({locations.length}/{maxLoc})
            </span>
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          attendancePanelToneClass("fuchsia"),
          "sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 lg:bottom-4",
        )}
      >
        <div className={attendancePanelAccentBarClass("fuchsia")} aria-hidden />
        <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#66638c]">
            บันทึกจุดเช็ค · กะ · ตำแหน่ง · ตัวเลือกเช็คอินพร้อมกัน
          </p>
          <button
            type="submit"
            disabled={saving || locations.length === 0}
            className={attendancePrimaryBtnClass}
          >
            {saving ? "กำลังบันทึก…" : "บันทึกทั้งหมด"}
          </button>
        </div>
      </div>
    </form>
  );
}

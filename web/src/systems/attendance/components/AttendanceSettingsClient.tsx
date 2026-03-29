"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendancePlanQuota } from "@/lib/attendance/plan-quota";
import { ATTENDANCE_MAX_SHIFTS_PER_LOCATION } from "@/lib/attendance/plan-quota";

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

export function AttendanceSettingsClient() {
  const [quota, setQuota] = useState<AttendancePlanQuota | null>(null);
  const [locations, setLocations] = useState<LocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [geoBusyIndex, setGeoBusyIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/settings", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      quota?: AttendancePlanQuota;
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">กำลังโหลด…</p>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
        {err ?? "ไม่สามารถโหลดข้อมูลได้"}
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-slate-900">แพ็กเกจและข้อจำกัด</h2>
        <p className="mt-1 text-xs text-slate-600">{quota.label}</p>
        <ul className="mt-3 list-inside list-disc space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <li>พนักงานในรายชื่อ: ไม่จำกัดจำนวน</li>
          <li>โลเคชันจุดเช็ค: 1 แห่ง</li>
          <li>
            กะต่อจุดเช็ค: สูงสุด {quota.maxShiftsPerLocation} กะ — กำหนดช่วงเวลาแล้วให้พนักงานเลือกกะในรายชื่อ
          </li>
        </ul>
      </section>

      {err ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
      ) : null}
      {msg ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {msg}
        </p>
      ) : null}

      {locations.map((loc, li) => (
        <section
          key={li}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">จุดเช็คอิน {li + 1}</h2>
            {locations.length > 1 ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:underline"
                onClick={() => setLocations((prev) => prev.filter((_, i) => i !== li))}
              >
                ลบจุดนี้
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-800">ชื่อและตำแหน่ง</p>
              <label className="mt-3 block text-xs font-semibold text-slate-700">
                ชื่อจุดเช็ค (แสดงบนหน้าเช็ค / QR)
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={loc.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocations((prev) => prev.map((L, i) => (i === li ? { ...L, name: v } : L)));
                  }}
                />
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  ละติจูด
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                    value={loc.allowedLocationLat}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setLocations((prev) =>
                        prev.map((L, i) => (i === li ? { ...L, allowedLocationLat: n } : L)),
                      );
                    }}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  ลองจิจูด
                  <input
                    type="number"
                    step="any"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
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
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                {geoBusyIndex === li ? "กำลังดึงตำแหน่ง…" : "ดึงตำแหน่งจากอุปกรณ์นี้"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-800">รัศมีอนุญาต</p>
              <label className="mt-3 block text-xs font-semibold text-slate-700">
                รัศมี (เมตร) — พนักงานต้องอยู่ในระยะนี้จากจุดกลาง
                <input
                  type="number"
                  min={10}
                  max={5000}
                  className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2"
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

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-800">
                กะ (สูงสุด {ATTENDANCE_MAX_SHIFTS_PER_LOCATION})
              </p>
              <div className="mt-3 space-y-3">
                {loc.shifts.map((sh, si) => (
                  <div
                    key={si}
                    className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200/80 bg-white p-3"
                  >
                    <label className="text-[11px] font-medium text-slate-600">
                      เริ่ม (HH:mm)
                      <input
                        className="mt-0.5 block w-[100px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        value={sh.startTime}
                        onChange={(e) => {
                          const v = e.target.value;
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
                    <label className="text-[11px] font-medium text-slate-600">
                      สิ้นสุด (HH:mm)
                      <input
                        className="mt-0.5 block w-[100px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        value={sh.endTime}
                        onChange={(e) => {
                          const v = e.target.value;
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
                    {loc.shifts.length > 1 ? (
                      <button
                        type="button"
                        className="mb-0.5 text-xs font-semibold text-red-600 hover:underline"
                        onClick={() =>
                          setLocations((prev) =>
                            prev.map((L, i) => {
                              if (i !== li) return L;
                              return { ...L, shifts: L.shifts.filter((_, j) => j !== si) };
                            }),
                          )
                        }
                      >
                        ลบกะ
                      </button>
                    ) : null}
                  </div>
                ))}
                {loc.shifts.length < quota.maxShiftsPerLocation ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-[#0000BF] hover:underline"
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
      ))}

      {canAddLocation ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center shadow-sm">
          <button
            type="button"
            className="text-sm font-bold text-[#0000BF] hover:underline"
            onClick={() => setLocations((prev) => [...prev, emptyLocation()])}
          >
            + เพิ่มโลเคชัน
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="submit"
          disabled={saving || locations.length === 0}
          className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกทั้งหมด"}
        </button>
      </div>
    </form>
  );
}

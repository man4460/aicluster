"use client";

import { useCallback, useEffect, useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import type { SmartPoliceProfileDto } from "@/lib/smart-police/types";

export function SmartPoliceSettingsClient() {
  const [profile, setProfile] = useState<SmartPoliceProfileDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/smart-police/profile", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { profile: SmartPoliceProfileDto };
    setProfile(data.profile);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/smart-police/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (res.ok) {
      setToast("บันทึกแล้ว");
      setTimeout(() => setToast(null), 2000);
    }
  }

  if (!profile) return <p className="text-sm text-[#66638c]">กำลังโหลด…</p>;

  return (
    <AppDashboardSection>
      <AppSectionHeader
        title="ตั้งค่าสถานี / หัวกระดาษพิมพ์"
        description="ใช้กับทุกเอกสารที่พิมพ์ — ชื่อสถานี ผู้กำกับ ค่าเริ่มต้นพนักงานสอบสวน"
      />
      {toast ? <p className="mb-3 text-sm font-semibold text-emerald-700">{toast}</p> : null}
      <div className="grid gap-3 text-left sm:grid-cols-2">
        <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
          ชื่อสถานี *
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.stationName}
            onChange={(e) => setProfile((p) => (p ? { ...p, stationName: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
          ที่อยู่สถานี
          <textarea
            className="app-input mt-1 w-full rounded-xl"
            value={profile.stationAddress ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, stationAddress: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58]">
          จังหวัด
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.province ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, province: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58]">
          คำนำหน้าเลขคดี
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.caseNumberPrefix}
            onChange={(e) => setProfile((p) => (p ? { ...p, caseNumberPrefix: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58]">
          ยศผู้กำกับ
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.commanderRank ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, commanderRank: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58]">
          ชื่อผู้กำกับ
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.commanderName ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, commanderName: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
          พนักงานสอบสวน (ค่าเริ่มต้นในเอกสาร)
          <input
            className="app-input mt-1 w-full rounded-xl"
            value={profile.investigatorDefault ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, investigatorDefault: e.target.value } : p))}
          />
        </label>
        <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
          ท้ายกระดาษพิมพ์
          <textarea
            className="app-input mt-1 w-full rounded-xl"
            value={profile.printFooter ?? ""}
            onChange={(e) => setProfile((p) => (p ? { ...p, printFooter: e.target.value } : p))}
          />
        </label>
      </div>
      <button
        type="button"
        className="app-btn-primary mt-4 min-h-[44px] rounded-xl px-6"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "กำลังบันทึก…" : "บันทึกตั้งค่า"}
      </button>
    </AppDashboardSection>
  );
}

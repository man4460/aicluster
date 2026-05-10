"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";

export function CommunityCoopSettingsClient({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/community-coop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ displayName: name }),
      });
      if (!res.ok) {
        setMsg("บันทึกไม่สำเร็จ");
        return;
      }
      const j = (await res.json()) as { displayName?: string };
      if (j.displayName) setName(j.displayName);
      setMsg("บันทึกแล้ว");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      <AppSectionHeader
        tone="violet"
        title="ชื่อสหกรณ์"
        description="ปรับชื่อที่แสดงบนหัวโมดูลให้เข้ากับชุมชนของคุณ"
      />
      <div className="mt-4 space-y-4">
        {msg && <p className="text-sm font-bold text-amber-800">{msg}</p>}
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#66638c]">ชื่อที่แสดง</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-black text-[#1e1b4b] shadow-inner backdrop-blur-sm"
            maxLength={120}
          />
        </label>
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={() => void save()}
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 text-sm font-black text-white shadow-lg disabled:opacity-45"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </AppDashboardSection>
  );
}

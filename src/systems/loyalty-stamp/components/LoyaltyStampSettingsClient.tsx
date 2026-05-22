"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { lsFieldClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type Profile = {
  displayName: string | null;
  tagline: string | null;
  publicCardEnabled: boolean;
  stampsPerReward: number;
  rewardTitle: string;
  rewardDescription: string | null;
  stampEmoji: string;
};

export function LoyaltyStampSettingsClient({ initial }: { initial: Profile }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/loyalty-stamp/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) setForm(json.profile);
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      <AppSectionHeader title="ตั้งค่าร้าน" description="ชื่อร้าน จำนวนแต้มต่อรางวัล และของรางวัล" />
      <div className="space-y-3 text-left">
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้าน</span>
          <input
            className={lsFieldClass}
            value={form.displayName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">คำโปรย</span>
          <input
            className={lsFieldClass}
            value={form.tagline ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#4d47b6]">
          <input
            type="checkbox"
            checked={form.publicCardEnabled}
            onChange={(e) => setForm((f) => ({ ...f, publicCardEnabled: e.target.checked }))}
          />
          เปิดการ์ดสาธารณะ (ลิงก์/QR)
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">จำนวนแต้มต่อ 1 รางวัล</span>
          <input
            type="number"
            min={1}
            max={30}
            className={lsFieldClass}
            value={form.stampsPerReward}
            onChange={(e) => setForm((f) => ({ ...f, stampsPerReward: Number(e.target.value) }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ไอคอนบนแต้ม (อีโมจิ 1 ตัว)</span>
          <input
            className={lsFieldClass}
            maxLength={8}
            value={form.stampEmoji}
            onChange={(e) => setForm((f) => ({ ...f, stampEmoji: e.target.value }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ชื่อของรางวัล</span>
          <input
            className={lsFieldClass}
            value={form.rewardTitle}
            onChange={(e) => setForm((f) => ({ ...f, rewardTitle: e.target.value }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">รายละเอียดของรางวัล</span>
          <input
            className={lsFieldClass}
            value={form.rewardDescription ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, rewardDescription: e.target.value }))}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
        >
          {busy ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </AppDashboardSection>
  );
}

"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { aqFieldClass, aqListRowCardClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

type Profile = {
  displayName: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  publicBookingEnabled: boolean;
  depositRequired: boolean;
  depositAmountBaht: number | null;
  promptPayId: string | null;
  promptPayName: string | null;
  bankAccountNote: string | null;
  defaultSlotMinutes: number;
};

export function AppointmentQueueSettingsClient({ initial }: { initial: Profile }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/appointment-queue/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      <AppSectionHeader title="ตั้งค่าร้านและมัดจำ" description="ชื่อร้าน · เปิดจองสาธารณะ · PromptPay" />
      <div className={aqListRowCardClass}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-left text-sm">
            <span className="font-semibold text-[#4d47b6]">ชื่อร้าน</span>
            <input
              className={aqFieldClass}
              value={form.displayName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <label className="block text-left text-sm">
            <span className="font-semibold text-[#4d47b6]">เบอร์ติดต่อ</span>
            <input
              className={aqFieldClass}
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>
          <label className="col-span-full block text-left text-sm">
            <span className="font-semibold text-[#4d47b6]">คำโปรย</span>
            <input
              className={aqFieldClass}
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-left text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.publicBookingEnabled}
              onChange={(e) => setForm((f) => ({ ...f, publicBookingEnabled: e.target.checked }))}
            />
            <span className="font-semibold text-[#4d47b6]">เปิดรับจองจากลิงก์สาธารณะ</span>
          </label>
          <label className="flex items-center gap-2 text-left text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.depositRequired}
              onChange={(e) => setForm((f) => ({ ...f, depositRequired: e.target.checked }))}
            />
            <span className="font-semibold text-[#4d47b6]">เก็บมัดจำก่อนยืนยันคิว</span>
          </label>
          <label className="block text-left text-sm">
            <span className="font-semibold text-[#4d47b6]">มัดจำ (บาท)</span>
            <input
              type="number"
              className={aqFieldClass}
              value={form.depositAmountBaht ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  depositAmountBaht: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block text-left text-sm">
            <span className="font-semibold text-[#4d47b6]">PromptPay ID</span>
            <input
              className={aqFieldClass}
              value={form.promptPayId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, promptPayId: e.target.value }))}
            />
          </label>
          <label className="block text-left text-sm sm:col-span-2">
            <span className="font-semibold text-[#4d47b6]">ชื่อบัญชี / หมายเหตุโอน</span>
            <input
              className={aqFieldClass}
              value={form.promptPayName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, promptPayName: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="app-btn-primary min-h-[40px] rounded-xl px-5"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          {msg ? <span className="text-sm font-medium text-[#4d47b6]">{msg}</span> : null}
        </div>
      </div>
    </AppDashboardSection>
  );
}

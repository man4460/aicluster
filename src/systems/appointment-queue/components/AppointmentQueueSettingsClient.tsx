"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { cn } from "@/lib/cn";

type Profile = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  publicBookingEnabled: boolean;
  depositRequired: boolean;
  depositAmountBaht: number | null;
  defaultSlotMinutes: number;
} & ModuleShopPaymentDto;

export function AppointmentQueueSettingsClient({
  initial,
}: {
  initial: Profile;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/appointment-queue/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { profile?: Profile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) setForm(json.profile);
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader
          title="ตั้งค่าร้านและมัดจำ"
          description="ชื่อร้าน · เปิดจองสาธารณะ · ช่องทางรับมัดจำ"
        />
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.displayName ?? "ร้าน"}
            uploadUrl="/api/appointment-queue/upload-logo"
            onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้าน</span>
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.displayName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์ติดต่อร้าน</span>
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คำโปรย</span>
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ที่อยู่</span>
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </label>

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
          />

          <div className="space-y-3 border-t border-white/40 pt-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#4d47b6]">การจองและมัดจำ</p>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4d47b6]">
              <input
                type="checkbox"
                checked={form.publicBookingEnabled}
                onChange={(e) => setForm((f) => ({ ...f, publicBookingEnabled: e.target.checked }))}
              />
              เปิดรับจองจากลิงก์สาธารณะ
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4d47b6]">
              <input
                type="checkbox"
                checked={form.depositRequired}
                onChange={(e) => setForm((f) => ({ ...f, depositRequired: e.target.checked }))}
              />
              เก็บมัดจำก่อนยืนยันคิว
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">มัดจำ (บาท)</span>
                <input
                  type="number"
                  className="app-input mt-1 w-full rounded-xl"
                  value={form.depositAmountBaht ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      depositAmountBaht: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ระยะคิวเริ่มต้น (นาที)</span>
                <input
                  type="number"
                  min={15}
                  max={240}
                  className="app-input mt-1 w-full rounded-xl"
                  value={form.defaultSlotMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, defaultSlotMinutes: Number(e.target.value) }))}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className={cn("app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold")}
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </AppDashboardSection>
    </div>
  );
}

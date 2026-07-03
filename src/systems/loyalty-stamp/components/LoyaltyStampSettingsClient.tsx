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
  publicCardEnabled: boolean;
  stampsPerReward: number;
  rewardTitle: string;
  rewardDescription: string | null;
  stampEmoji: string;
} & ModuleShopPaymentDto;

export function LoyaltyStampSettingsClient({
  initial,
}: {
  initial: Profile;
}) {
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
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader title="ตั้งค่าร้าน" description="ชื่อร้าน · แต้มสะสม · ช่องทางรับชำระ" />
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.displayName ?? "ร้าน"}
            uploadUrl="/api/loyalty-stamp/upload-logo"
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
            <span className="text-xs font-bold text-[#4d47b6]">คำโปรย</span>
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
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

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
          />

          <div className="space-y-3 border-t border-white/40 pt-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#4d47b6]">การ์ดสะสมแต้ม</p>
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
                className="app-input mt-1 w-full rounded-xl"
                value={form.stampsPerReward}
                onChange={(e) => setForm((f) => ({ ...f, stampsPerReward: Number(e.target.value) }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ไอคอนบนแต้ม (อีโมจิ 1 ตัว)</span>
              <input
                className="app-input mt-1 w-full rounded-xl"
                maxLength={8}
                value={form.stampEmoji}
                onChange={(e) => setForm((f) => ({ ...f, stampEmoji: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อของรางวัล</span>
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={form.rewardTitle}
                onChange={(e) => setForm((f) => ({ ...f, rewardTitle: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">รายละเอียดของรางวัล</span>
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={form.rewardDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, rewardDescription: e.target.value }))}
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className={cn("app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold")}
          >
            {busy ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </AppDashboardSection>
    </div>
  );
}

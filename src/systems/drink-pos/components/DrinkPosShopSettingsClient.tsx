"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { drinkPosFieldClass } from "@/systems/drink-pos/lib/ui-tokens";

export type DrinkPosShopSettingsProfile = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
} & ModuleShopPaymentDto;

export function DrinkPosShopSettingsClient({
  initial,
}: {
  initial: DrinkPosShopSettingsProfile;
}) {
  const [form, setForm] = useState<DrinkPosShopSettingsProfile>({ ...initial });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/drink-pos/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as {
        profile?: DrinkPosShopSettingsProfile;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        setForm({
          displayName: json.profile.displayName,
          logoUrl: json.profile.logoUrl,
          tagline: json.profile.tagline,
          contactPhone: json.profile.contactPhone,
          promptPayPhone: json.profile.promptPayPhone,
          bankName: json.profile.bankName,
          bankAccountNumber: json.profile.bankAccountNumber,
          bankAccountName: json.profile.bankAccountName,
          taxId: json.profile.taxId,
        });
      }
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
        <AppSectionHeader title="ตั้งค่าร้าน" />
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.displayName ?? "ร้านเครื่องดื่ม"}
            uploadUrl="/api/drink-pos/upload-logo"
            onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          />

          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้าน</span>
            <input
              className={drinkPosFieldClass}
              value={form.displayName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คำโปรย</span>
            <input
              className={drinkPosFieldClass}
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์ติดต่อร้าน</span>
            <input
              className={drinkPosFieldClass}
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
            fieldClassName={drinkPosFieldClass}
          />

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

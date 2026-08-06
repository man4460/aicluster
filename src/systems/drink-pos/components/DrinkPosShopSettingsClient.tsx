"use client";

import { useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import {
  clampDrinkPosStampsPerReward,
  formatDrinkPosLoyaltyRule,
} from "@/systems/drink-pos/lib/loyalty-rule";
import { drinkPosFieldClass } from "@/systems/drink-pos/lib/ui-tokens";

export type DrinkPosShopSettingsProfile = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  stampsPerReward: number;
  rewardTitle: string;
} & ModuleShopPaymentDto;

export function DrinkPosShopSettingsClient({
  initial,
}: {
  initial: DrinkPosShopSettingsProfile;
}) {
  const [form, setForm] = useState<DrinkPosShopSettingsProfile>({
    ...initial,
    stampsPerReward: clampDrinkPosStampsPerReward(initial.stampsPerReward),
    rewardTitle: initial.rewardTitle || "เครื่องดื่มฟรี 1 แก้ว",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const rulePreview = useMemo(
    () => formatDrinkPosLoyaltyRule(form.stampsPerReward, form.rewardTitle),
    [form.stampsPerReward, form.rewardTitle],
  );

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        ...form,
        stampsPerReward: clampDrinkPosStampsPerReward(form.stampsPerReward),
        rewardTitle: form.rewardTitle.trim() || "เครื่องดื่มฟรี 1 แก้ว",
      };
      const res = await fetch("/api/drink-pos/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        profile?: DrinkPosShopSettingsProfile;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        setForm({
          ...json.profile,
          stampsPerReward: clampDrinkPosStampsPerReward(json.profile.stampsPerReward),
          rewardTitle: json.profile.rewardTitle || "เครื่องดื่มฟรี 1 แก้ว",
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

          <div className="space-y-3 border-t border-white/40 pt-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#4d47b6]">สะสมแต้ม</p>
              <p className="mt-1 text-xs font-semibold text-[#66638c]">
                กำหนดจำนวนครั้งที่ต้องซื้อก่อนแลกรางวัล เช่น ซื้อ 10 ฟรี 1 หรือซื้อ 5 แลกของว่าง
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">จำนวนแต้มต่อ 1 รางวัล (1–30)</span>
              <input
                type="number"
                min={1}
                max={30}
                inputMode="numeric"
                className={drinkPosFieldClass}
                value={form.stampsPerReward}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stampsPerReward: clampDrinkPosStampsPerReward(Number(e.target.value)),
                  }))
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อของรางวัลเมื่อครบแต้ม</span>
              <input
                className={drinkPosFieldClass}
                maxLength={160}
                placeholder="เช่น เครื่องดื่มฟรี 1 แก้ว"
                value={form.rewardTitle}
                onChange={(e) => setForm((f) => ({ ...f, rewardTitle: e.target.value }))}
              />
            </label>

            <div
              className="rounded-2xl border border-[#0000BF]/20 bg-gradient-to-r from-[#0000BF]/8 via-[#8b5cf6]/8 to-[#ec4899]/8 px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ตัวอย่างกฎที่แสดง</p>
              <p className="mt-1 text-sm font-black text-[#1e1b4b]">{rulePreview}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#66638c]">
                บันทึกบิลปกติ +1 แต้ม · ครบแล้วติ๊กแลกฟรีได้ (ยอด 0 บาท)
              </p>
            </div>
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

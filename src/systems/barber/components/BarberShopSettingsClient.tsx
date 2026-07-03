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

type ShopProfile = {
  displayName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
} & ModuleShopPaymentDto;

export function BarberShopSettingsClient({
  initial,
  apiBase,
}: {
  initial: ShopProfile;
  apiBase: "/api/barber/shop-profile" | "/api/massage/shop-profile";
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
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: ShopProfile; error?: string };
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
        <AppSectionHeader title="ตั้งค่าร้าน" description="ชื่อร้าน · โลโก้ · ช่องทางชำระ · ใช้บนโปสเตอร์ QR และพอร์ทัลลูกค้า" />
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.displayName ?? "ร้าน"}
            uploadUrl={`${apiBase}/upload-logo`}
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

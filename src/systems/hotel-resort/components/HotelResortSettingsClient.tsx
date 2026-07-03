"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
} from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { cn } from "@/lib/cn";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortSuccessBannerClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type HotelProfile = {
  propertyName: string;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  checkInTime: string;
  checkOutTime: string;
} & ModuleShopPaymentDto;

export function HotelResortSettingsClient({
  initial,
}: {
  initial: HotelProfile;
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
      const res = await fetch("/api/hotel-resort/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: HotelProfile; error?: string };
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
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าที่พัก"
          description="ชื่อโรงแรม · โลโก้ · ช่องทางชำระ · ใช้บน QR พอร์ทัลลูกค้า"
        />
        <div className="space-y-3 text-left">
          {err ? <HotelResortErrorBanner message={err} /> : null}
          {msg ? <p className={hotelResortSuccessBannerClass}>{msg}</p> : null}
          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.propertyName}
            uploadUrl="/api/hotel-resort/upload-logo"
            onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          />
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>ชื่อโรงแรม / รีสอร์ท</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={form.propertyName}
              onChange={(e) => setForm((f) => ({ ...f, propertyName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>คำโปรย</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>เบอร์ติดต่อ</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className={hotelResortFormLabelClass}>เวลาเช็คอิน</span>
              <input
                className={cn(hotelResortFieldClass, "mt-1")}
                value={form.checkInTime}
                onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={hotelResortFormLabelClass}>เวลาเช็คเอาต์</span>
              <input
                className={cn(hotelResortFieldClass, "mt-1")}
                value={form.checkOutTime}
                onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
              />
            </label>
          </div>

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
            fieldClassName={hotelResortFieldClass}
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

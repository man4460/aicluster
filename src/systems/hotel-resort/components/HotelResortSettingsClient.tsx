"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  staffDailyPinPatchBody,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { cn } from "@/lib/cn";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortReviewsSettings } from "@/systems/hotel-resort/components/HotelResortReviewsSettings";
import type { HotelPortalBookingPaymentMode } from "@/systems/hotel-resort/lib/portal-booking";
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortSectionRadiusClass,
  hotelResortSuccessBannerClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type HotelProfile = {
  propertyName: string;
  managerName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBookingPaymentMode: HotelPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  checkInTime: string;
  checkOutTime: string;
  slipPaperSize: AppSlipPaperSize;
  staffDailyPinSet?: boolean;
} & ModuleShopPaymentDto;

export function HotelResortSettingsClient({
  initial,
}: {
  initial: HotelProfile;
}) {
  const [form, setForm] = useState({
    ...initial,
    slipPaperSize: initial.slipPaperSize ?? ("SLIP_58" as AppSlipPaperSize),
    staffDailyPinSet: initial.staffDailyPinSet ?? false,
    portalBookingPaymentMode: initial.portalBookingPaymentMode ?? "NONE",
    depositAmountBaht: initial.depositAmountBaht ?? null,
    address: initial.address ?? null,
    lineId: initial.lineId ?? null,
    facebookUrl: initial.facebookUrl ?? null,
    mapUrl: initial.mapUrl ?? null,
  });
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);
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
        body: JSON.stringify({
          ...form,
          ...staffDailyPinPatchBody({ pinDraft, clearPin }),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: HotelProfile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        setForm({
          ...json.profile,
          slipPaperSize: json.profile.slipPaperSize ?? "SLIP_58",
          staffDailyPinSet: json.profile.staffDailyPinSet ?? false,
          portalBookingPaymentMode: json.profile.portalBookingPaymentMode ?? "NONE",
          depositAmountBaht: json.profile.depositAmountBaht ?? null,
        });
        setPinDraft("");
        setClearPin(false);
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
      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader tone="violet" title="ตั้งค่าที่พัก" />
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
            <span className={hotelResortFormLabelClass}>ชื่อผู้จัดการ</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={form.managerName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
              placeholder="ใช้ในลายเซ็นผู้รับเงินบนใบเสร็จ / ใบกำกับ / โฟลิโอ"
              autoComplete="name"
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
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>ที่อยู่</span>
            <textarea
              className={cn(hotelResortFieldClass, "mt-1 min-h-[72px]")}
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className={hotelResortFormLabelClass}>LINE ID</span>
              <input
                className={cn(hotelResortFieldClass, "mt-1")}
                value={form.lineId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={hotelResortFormLabelClass}>Facebook URL</span>
              <input
                className={cn(hotelResortFieldClass, "mt-1")}
                value={form.facebookUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>ลิงก์แผนที่</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={form.mapUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, mapUrl: e.target.value }))}
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

          <div className="rounded-2xl border border-white/60 bg-white/40 p-3 sm:p-4">
            <p className={hotelResortFormLabelClass}>ชำระตอนจองจากลิงก์ลูกค้า</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  { value: "NONE", label: "ไม่ต้องชำระ" },
                  { value: "DEPOSIT", label: "มัดจำ" },
                  { value: "FULL", label: "ชำระเต็มยอด" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      portalBookingPaymentMode: opt.value,
                    }))
                  }
                  className={cn(
                    "min-h-[44px] rounded-xl border px-3 text-sm font-bold transition",
                    form.portalBookingPaymentMode === opt.value
                      ? "border-[#5b61ff]/50 bg-[#5b61ff]/15 text-[#4d47b6]"
                      : "border-white/60 bg-white/60 text-[#66638c]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.portalBookingPaymentMode === "DEPOSIT" ? (
              <label className="mt-3 block space-y-1">
                <span className={hotelResortFormLabelClass}>จำนวนมัดจำ (บาท)</span>
                <input
                  type="number"
                  min={0}
                  className={cn(hotelResortFieldClass, "mt-1")}
                  value={form.depositAmountBaht ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      depositAmountBaht: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </label>
            ) : null}
          </div>

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
            fieldClassName={hotelResortFieldClass}
          />

          <AppSlipPaperSizeSettingsField
            fieldClassName={hotelResortFieldClass}
            value={form.slipPaperSize}
            onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
            disabled={busy}
          />

          <AppStaffDailyPinSettingsField
            fieldClassName={hotelResortFieldClass}
            pinSet={Boolean(form.staffDailyPinSet)}
            pinDraft={pinDraft}
            onPinDraftChange={setPinDraft}
            clearPin={clearPin}
            onClearPinChange={setClearPin}
            disabled={busy}
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

      <HotelResortReviewsSettings />
    </div>
  );
}

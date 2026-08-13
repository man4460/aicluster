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
  appDashboardSectionVioletClass,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { drinkPosFieldClass } from "@/systems/drink-pos/lib/ui-tokens";

export type DrinkPosShopSettingsProfile = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  address: string | null;
  contactPhone: string | null;
  slipPaperSize: AppSlipPaperSize;
  orderTicketSlipPaperSize: AppSlipPaperSize;
  staffDailyPinSet?: boolean;
} & ModuleShopPaymentDto;

export function DrinkPosShopSettingsClient({
  initial,
  embedded = false,
  showBasicFields = true,
  showPaymentFields = true,
}: {
  initial: DrinkPosShopSettingsProfile;
  embedded?: boolean;
  showBasicFields?: boolean;
  showPaymentFields?: boolean;
}) {
  const [form, setForm] = useState<DrinkPosShopSettingsProfile>({
    ...initial,
    slipPaperSize: initial.slipPaperSize ?? "SLIP_58",
    orderTicketSlipPaperSize: initial.orderTicketSlipPaperSize ?? "SLIP_58",
    staffDailyPinSet: initial.staffDailyPinSet ?? false,
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
      const res = await fetch("/api/drink-pos/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          ...staffDailyPinPatchBody({ pinDraft, clearPin }),
        }),
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
          address: json.profile.address,
          contactPhone: json.profile.contactPhone,
          slipPaperSize: json.profile.slipPaperSize ?? "SLIP_58",
          orderTicketSlipPaperSize: json.profile.orderTicketSlipPaperSize ?? "SLIP_58",
          staffDailyPinSet: json.profile.staffDailyPinSet ?? false,
          promptPayPhone: json.profile.promptPayPhone,
          bankName: json.profile.bankName,
          bankAccountNumber: json.profile.bankAccountNumber,
          bankAccountName: json.profile.bankAccountName,
          taxId: json.profile.taxId,
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

  const fields = (
    <div className="space-y-3 text-left">
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

      {showBasicFields ? (
        <>
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
            <span className="text-xs font-bold text-[#4d47b6]">ที่อยู่ร้าน (บนใบเสร็จ)</span>
            <textarea
              className={cn(drinkPosFieldClass, "min-h-[72px] resize-y py-2")}
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="บ้านเลขที่ · ถนน · ตำบล · อำเภอ · จังหวัด"
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
        </>
      ) : null}

      {showPaymentFields ? (
        <>
          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
            fieldClassName={drinkPosFieldClass}
          />

          <AppSlipPaperSizeSettingsField
            fieldClassName={drinkPosFieldClass}
            value={form.slipPaperSize}
            onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
            disabled={busy}
          />

          <AppSlipPaperSizeSettingsField
            fieldClassName={drinkPosFieldClass}
            label="ขนาดสลิปคิวออเดอร์"
            hint="สลิปครัว / พร้อมเสิร์ฟ · แยกจากใบเสร็จลูกค้า · 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย"
            value={form.orderTicketSlipPaperSize}
            onChange={(orderTicketSlipPaperSize) =>
              setForm((f) => ({ ...f, orderTicketSlipPaperSize }))
            }
            disabled={busy}
          />

          <AppStaffDailyPinSettingsField
            fieldClassName={drinkPosFieldClass}
            pinSet={Boolean(form.staffDailyPinSet)}
            pinDraft={pinDraft}
            onPinDraftChange={setPinDraft}
            clearPin={clearPin}
            onClearPinChange={setClearPin}
            disabled={busy}
          />
        </>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className={cn("app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold")}
      >
        {busy ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </div>
  );

  if (embedded) return fields;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader title="ตั้งค่าร้าน" />
        {fields}
      </AppDashboardSection>
    </div>
  );
}

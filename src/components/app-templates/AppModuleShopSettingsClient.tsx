"use client";

import { useState, type ReactNode } from "react";
import { AppDashboardSection } from "./AppDashboardSection";
import { AppModuleShopPaymentFields } from "./AppModuleShopPaymentFields";
import { AppSectionHeader } from "./AppSectionHeader";
import { AppShopLogoField } from "./AppShopLogoField";
import { AppSlipPaperSizeSettingsField } from "./AppSlipPaperSizeSettingsField";
import { AppStaffDailyPinSettingsField, staffDailyPinPatchBody } from "./AppStaffDailyPinSettingsField";
import { appDashboardSectionVioletClass } from "./dashboard-tokens";
import type { ModuleShopBrandingDto } from "@/lib/module-shop/slugs";
import { cn } from "@/lib/cn";

export type AppModuleShopSettingsClientProps = {
  title?: string;
  description?: string;
  initial: ModuleShopBrandingDto;
  profileApiUrl: string;
  uploadLogoApiUrl: string;
  displayNameLabel?: string;
  fieldClassName?: string;
  children?: ReactNode;
  onSaved?: (profile: ModuleShopBrandingDto) => void;
  /** แสดงช่องตั้งขนาดสลิปใบเสร็จ (โปรไฟล์ส่วนกลาง) — ค่าเริ่มเปิด */
  showSlipPaperSizeSettings?: boolean;
  /** แสดงช่องขนาดสลิปคิวออเดอร์ (ครัว / พร้อมเสิร์ฟ) — ค่าเริ่มปิด */
  showOrderTicketSlipPaperSize?: boolean;
  /** แสดงช่องรหัสเข้าลิงก์พนักงานรายวัน — ค่าเริ่มปิด */
  showStaffDailyPinSettings?: boolean;
};

export function AppModuleShopSettingsClient({
  title = "ตั้งค่าร้าน",
  description = "ชื่อร้าน · โลโก้ · ช่องทางชำระ · ใช้บนโปสเตอร์ QR และลิงก์สาธารณะ",
  initial,
  profileApiUrl,
  uploadLogoApiUrl,
  displayNameLabel = "ชื่อร้าน",
  fieldClassName = "app-input mt-1 w-full rounded-xl",
  children,
  onSaved,
  showSlipPaperSizeSettings = true,
  showOrderTicketSlipPaperSize = false,
  showStaffDailyPinSettings = false,
}: AppModuleShopSettingsClientProps) {
  const [form, setForm] = useState(initial);
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
      const res = await fetch(profileApiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(showStaffDailyPinSettings ? staffDailyPinPatchBody({ pinDraft, clearPin }) : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        profile?: ModuleShopBrandingDto;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        setForm(json.profile);
        onSaved?.(json.profile);
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
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader title={title} description={description} />
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
          <AppShopLogoField
            logoUrl={form.logoUrl}
            fallbackLabel={form.displayName ?? displayNameLabel}
            uploadUrl={uploadLogoApiUrl}
            onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">{displayNameLabel}</span>
            <input
              className={fieldClassName}
              value={form.displayName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คำโปรย</span>
            <input
              className={fieldClassName}
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์ติดต่อร้าน</span>
            <input
              className={fieldClassName}
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>

          <AppModuleShopPaymentFields
            value={form}
            onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
            fieldClassName={fieldClassName}
          />

          {showSlipPaperSizeSettings ? (
            <>
              <AppSlipPaperSizeSettingsField
                fieldClassName={fieldClassName}
                value={form.slipPaperSize ?? "SLIP_58"}
                onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
                disabled={busy}
              />
              {showOrderTicketSlipPaperSize ? (
                <AppSlipPaperSizeSettingsField
                  fieldClassName={fieldClassName}
                  label="ขนาดสลิปคิวออเดอร์"
                  hint="สลิปครัว / พร้อมเสิร์ฟ · แยกจากใบเสร็จลูกค้า · 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย"
                  value={form.orderTicketSlipPaperSize ?? "SLIP_58"}
                  onChange={(orderTicketSlipPaperSize) =>
                    setForm((f) => ({ ...f, orderTicketSlipPaperSize }))
                  }
                  disabled={busy}
                />
              ) : null}
            </>
          ) : null}

          {showStaffDailyPinSettings ? (
            <AppStaffDailyPinSettingsField
              fieldClassName={fieldClassName}
              pinSet={Boolean(form.staffDailyPinSet)}
              pinDraft={pinDraft}
              onPinDraftChange={setPinDraft}
              clearPin={clearPin}
              onClearPinChange={setClearPin}
              disabled={busy}
            />
          ) : null}

          {children}
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

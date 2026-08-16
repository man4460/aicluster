"use client";

import { useState, type ReactNode } from "react";
import { AppDashboardSection } from "./AppDashboardSection";
import { AppModuleShopPaymentFields } from "./AppModuleShopPaymentFields";
import { AppSectionHeader } from "./AppSectionHeader";
import { AppShopLogoField } from "./AppShopLogoField";
import { AppSlipPaperSizeSettingsField } from "./AppSlipPaperSizeSettingsField";
import { AppStaffDailyPinSettingsField, staffDailyPinPatchBody } from "./AppStaffDailyPinSettingsField";
import { appDashboardSectionVioletClass, appTemplateOutlineButtonClass } from "./dashboard-tokens";
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
  /** แสดงชื่อ/โลโก้/คำโปรย/เบอร์ — ค่าเริ่มเปิด */
  showBasicFields?: boolean;
  /** แสดงช่องทางชำระ — ค่าเริ่มเปิด */
  showPaymentFields?: boolean;
  /** แสดงอัปโหลดรูป QR พร้อมเพย์ (เมื่อมี showPaymentFields) — ค่าเริ่มปิด */
  showPromptPayQrUpload?: boolean;
  /** API อัปโหลด QR พร้อมเพย์ — ต้องส่งเมื่อเปิด showPromptPayQrUpload */
  uploadPromptPayQrApiUrl?: string;
  /** แสดงช่องตั้งขนาดสลิปใบเสร็จ (โปรไฟล์ส่วนกลาง) — ค่าเริ่มเปิด */
  showSlipPaperSizeSettings?: boolean;
  /** แสดงช่องขนาดสลิปคิวออเดอร์ (ครัว / พร้อมเสิร์ฟ) — ค่าเริ่มปิด */
  showOrderTicketSlipPaperSize?: boolean;
  /** แสดงช่องรหัสเข้าลิงก์พนักงานรายวัน — ค่าเริ่มปิด */
  showStaffDailyPinSettings?: boolean;
  /** ไม่ห่อ AppDashboardSection (เมื่ออยู่ภายใต้แท็บตั้งค่าแล้ว) */
  embedded?: boolean;
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
  showBasicFields = true,
  showPaymentFields = true,
  showPromptPayQrUpload = false,
  uploadPromptPayQrApiUrl,
  showSlipPaperSizeSettings = true,
  showOrderTicketSlipPaperSize = false,
  showStaffDailyPinSettings = false,
  embedded = false,
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

  const body = (
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
          {showBasicFields ? (
            <>
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
            </>
          ) : null}

          {showPaymentFields ? (
            <>
              <AppModuleShopPaymentFields
                value={form}
                onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
                fieldClassName={fieldClassName}
              />
              {showPromptPayQrUpload && uploadPromptPayQrApiUrl ? (
                <div className="space-y-2 rounded-2xl border border-[#ecebff] bg-[#faf9ff]/80 p-3">
                  <p className="text-xs font-black text-[#4d47b6]">QR พร้อมเพย์ (อัปโหลดรูป)</p>
                  <p className="text-[11px] font-semibold text-[#8b87b8]">
                    ทางเลือก — อัปโหลดภาพ QR จากแอปธนาคารที่มีอยู่แล้ว ถ้ามีรูปนี้ระบบจะแสดงรูปนี้แทนการสร้างจากเบอร์
                  </p>
                  {form.promptPayQrImageUrl ? (
                    <div className="flex flex-wrap items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.promptPayQrImageUrl}
                        alt="QR พร้อมเพย์ที่อัปโหลด"
                        className="h-28 w-28 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "min-h-10 rounded-xl px-3 text-xs font-bold text-rose-700",
                        )}
                        onClick={() => setForm((f) => ({ ...f, promptPayQrImageUrl: null }))}
                      >
                        ลบรูป QR
                      </button>
                    </div>
                  ) : null}
                  <label
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "inline-flex min-h-10 cursor-pointer items-center rounded-xl px-4 text-sm font-bold",
                    )}
                  >
                    {form.promptPayQrImageUrl ? "เปลี่ยนภาพ QR" : "เลือกภาพ QR พร้อมเพย์"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        void (async () => {
                          setBusy(true);
                          setErr(null);
                          try {
                            const fd = new FormData();
                            fd.set("file", f);
                            const res = await fetch(uploadPromptPayQrApiUrl, {
                              method: "POST",
                              body: fd,
                            });
                            const json = (await res.json().catch(() => ({}))) as {
                              imageUrl?: string;
                              error?: string;
                            };
                            if (!res.ok || !json.imageUrl) {
                              throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
                            }
                            setForm((prev) => ({ ...prev, promptPayQrImageUrl: json.imageUrl! }));
                            setMsg("อัปโหลด QR พร้อมเพย์แล้ว");
                          } catch (errUpload) {
                            setErr(errUpload instanceof Error ? errUpload.message : "อัปโหลดไม่สำเร็จ");
                          } finally {
                            setBusy(false);
                          }
                        })();
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

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
  );

  if (embedded) {
    return <div className="space-y-3">{body}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader title={title} description={description} />
        {body}
      </AppDashboardSection>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppModuleShopPaymentFields,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  useAppNoticePopup,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { cn } from "@/lib/cn";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import {
  LMS_SETTINGS_TAB_ITEMS,
  lmsSettingsHref,
  parseLmsSettingsTab,
  type LmsSettingsTab,
} from "@/systems/lms/lms-module-nav";
import { LmsPageSubNav } from "@/systems/lms/components/LmsPageSubNav";
import type { LmsProfileDto } from "@/systems/lms/lib/mappers";
import {
  lmsPageTitleIcon,
  lmsPageTitleTone,
  lmsSettingsTabIcon,
} from "@/systems/lms/lib/page-menu-icons";
import {
  lmsFieldClass,
  lmsFixedBottomActionClass,
  lmsOutlineButtonClass,
  lmsPrimaryButtonClass,
} from "@/systems/lms/lib/ui-tokens";

const LOGO_UPLOAD = "/api/lms/session/images/upload";
const QR_UPLOAD = "/api/lms/session/images/upload";

const SETTINGS_TAB_ITEMS = LMS_SETTINGS_TAB_ITEMS.map((item) => ({
  ...item,
  icon: lmsSettingsTabIcon(item.key),
}));

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function LmsSettingsClient({
  initialProfile,
  trialSessionId = TRIAL_PROD_SCOPE,
}: {
  initialProfile: LmsProfileDto;
  trialSessionId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseLmsSettingsTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [form, setForm] = useState(initialProfile);
  const [saving, setSaving] = useState(false);

  const setTab = useCallback(
    (next: string) => {
      router.replace(lmsSettingsHref(next as LmsSettingsTab), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setForm(initialProfile);
  }, [initialProfile]);

  const portalAbsoluteUrl = useMemo(
    () => absoluteUrl(form.publicUrl || `/lms/${form.slug}`),
    [form.publicUrl, form.slug],
  );

  const paymentDto: ModuleShopPaymentDto = {
    promptPayPhone: form.promptPayPhone,
    promptPayQrImageUrl: form.promptPayQrImageUrl,
    bankName: form.bankName,
    bankAccountNumber: form.bankAccountNumber,
    bankAccountName: form.bankAccountName,
    taxId: form.taxId,
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/lms/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          slug: form.slug,
          logoUrl: form.logoUrl,
          tagline: form.tagline,
          contactPhone: form.contactPhone,
          contactLine: form.contactLine,
          address: form.address,
          promptPayPhone: form.promptPayPhone,
          promptPayQrImageUrl: form.promptPayQrImageUrl,
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountName: form.bankAccountName,
          taxId: form.taxId,
          slipPaperSize: form.slipPaperSize,
        }),
      });
      const data = (await res.json()) as { profile?: LmsProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setForm(data.profile);
      notice.success("บันทึกตั้งค่าแล้ว");
      router.refresh();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {notice.popup}
      <LmsPageSubNav
        title="ตั้งค่า"
        titleIcon={lmsPageTitleIcon("settings")}
        titleTone={lmsPageTitleTone("settings")}
        items={SETTINGS_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="เมนูย่อยตั้งค่า"
      >
        {tab === "basic" ? (
          <div className="space-y-4">
            <AppShopLogoField
              logoUrl={form.logoUrl}
              fallbackLabel={form.displayName || "LMS"}
              uploadUrl={LOGO_UPLOAD}
              onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              buttonClassName={lmsOutlineButtonClass}
            />
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อสถาบัน</span>
              <input
                className={lmsFieldClass}
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">slug (ลิงก์สาธารณะ)</span>
              <input
                className={lmsFieldClass}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
              <input
                className={lmsFieldClass}
                value={form.contactPhone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value || null }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">LINE</span>
              <input
                className={lmsFieldClass}
                value={form.contactLine ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contactLine: e.target.value || null }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div className="space-y-4">
            <AppModuleShopPaymentFields
              value={paymentDto}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  promptPayPhone: next.promptPayPhone,
                  promptPayQrImageUrl: next.promptPayQrImageUrl,
                  bankName: next.bankName,
                  bankAccountNumber: next.bankAccountNumber,
                  bankAccountName: next.bankAccountName,
                  taxId: next.taxId,
                }))
              }
              fieldClassName={cn(lmsFieldClass, "mt-1")}
            />
            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
              <p className="text-xs font-black text-[#4d47b6]">QR พร้อมเพย์ (อัปโหลดรูป)</p>
              {form.promptPayQrImageUrl ? (
                <div className="flex flex-wrap items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.promptPayQrImageUrl}
                    alt="QR พร้อมเพย์"
                    className="h-28 w-28 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                  />
                  <button
                    type="button"
                    className={cn(lmsOutlineButtonClass, "text-rose-700")}
                    onClick={() => setForm((f) => ({ ...f, promptPayQrImageUrl: null }))}
                  >
                    ลบรูป QR
                  </button>
                </div>
              ) : null}
              <label className={cn(lmsOutlineButtonClass, "cursor-pointer")}>
                {form.promptPayQrImageUrl ? "เปลี่ยนภาพ QR" : "เลือกภาพ QR พร้อมเพย์"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void (async () => {
                      try {
                        const fd = new FormData();
                        fd.set("file", file);
                        const res = await fetch(QR_UPLOAD, { method: "POST", body: fd });
                        const json = (await res.json().catch(() => ({}))) as {
                          imageUrl?: string;
                          error?: string;
                        };
                        if (!res.ok || !json.imageUrl) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
                        setForm((prev) => ({ ...prev, promptPayQrImageUrl: json.imageUrl! }));
                        notice.success("อัปโหลด QR แล้ว");
                      } catch (errUpload) {
                        notice.error(errUpload instanceof Error ? errUpload.message : "อัปโหลดไม่สำเร็จ");
                      }
                    })();
                  }}
                />
              </label>
            </div>
            <AppSlipPaperSizeSettingsField
              value={(form.slipPaperSize as AppSlipPaperSize) || "SLIP_58"}
              onChange={(v) => setForm((f) => ({ ...f, slipPaperSize: v }))}
              fieldClassName={cn(lmsFieldClass, "mt-1")}
            />
          </div>
        ) : null}

        {tab === "portal" ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
              <p className="text-xs font-black text-[#4d47b6]">ลิงก์เว็บ LMS สาธารณะ</p>
              <p className="break-all text-sm font-semibold text-[#1e1b4b]">{form.publicUrl}</p>
              <p className="text-xs text-[#66638c]">
                พอร์ทัลนักเรียนอยู่ที่ /lms/{form.slug} — สร้าง QR ด้านล่างเพื่อพิมพ์หรือแชร์
              </p>
            </div>
            <ModulePublicLinkQrPanel
              pageUrl={portalAbsoluteUrl}
              shopLabel={form.displayName || "LMS"}
              logoUrl={form.logoUrl}
              trialExportBlocked={trialSessionId !== TRIAL_PROD_SCOPE}
              tagline="สแกนเพื่อเข้าเรียน / ดูคอร์สออนไลน์"
              mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อเข้าเว็บ LMS"
              openPrimaryLabel="เปิดเว็บ LMS"
              openSecondaryLabel="เปิดเว็บ"
              qrAlt="QR เว็บ LMS สาธารณะ"
              posterAlt="โปสเตอร์ QR เว็บ LMS"
              downloadFilePrefix={`lms-portal-${form.slug || "portal"}`}
            />
          </div>
        ) : null}

        <div className={cn(lmsFixedBottomActionClass, "mt-4")}>
          <button type="button" className={cn(lmsPrimaryButtonClass, "w-full sm:w-auto")} disabled={saving} onClick={() => void saveProfile()}>
            {saving ? "กำลังบันทึก…" : "บันทึกตั้งค่า"}
          </button>
        </div>
      </LmsPageSubNav>
    </div>
  );
}

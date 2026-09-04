"use client";

import { useCallback, useMemo, useState } from "react";
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
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  CLUB_EVENT_SETTINGS_TAB_ITEMS,
  clubEventSettingsHref,
  parseClubEventSettingsTab,
  type ClubEventSettingsTab,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventDuesSettingsPanel } from "@/systems/club-event/components/ClubEventDuesSettingsPanel";
import { ClubEventPortalMediaSettings } from "@/systems/club-event/components/ClubEventPortalMediaSettings";
import type { ClubEventProfileDto } from "@/systems/club-event/lib/mappers";
import {
  CLUB_PORTAL_MEMBER_FIELD_OPTIONS,
  DEFAULT_CLUB_PORTAL_MEMBER_FIELDS,
} from "@/systems/club-event/lib/portal-member-fields";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
  clubEventSettingsTabIcon,
} from "@/systems/club-event/lib/page-menu-icons";
import {
  clubEventFieldClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

const SETTINGS_TAB_ITEMS = CLUB_EVENT_SETTINGS_TAB_ITEMS.map((item) => ({
  ...item,
  icon: clubEventSettingsTabIcon(item.key),
}));
const LOGO_UPLOAD = "/api/club-event/session/images/upload";
const labelClass = "block space-y-1";
const labelTextClass = "text-xs font-bold text-[#4d47b6]";

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ClubEventSettingsClient({
  initialProfile,
  trialSessionId = TRIAL_PROD_SCOPE,
}: {
  initialProfile: ClubEventProfileDto;
  trialSessionId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseClubEventSettingsTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [form, setForm] = useState(initialProfile);
  const [saving, setSaving] = useState(false);

  const setTab = useCallback(
    (next: string) => {
      router.replace(clubEventSettingsHref(next as ClubEventSettingsTab), { scroll: false });
    },
    [router],
  );

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/club-event/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          slug: form.slug,
          logoUrl: form.logoUrl,
          tagline: form.tagline,
          rulesMarkdown: form.rulesMarkdown,
          contactPhone: form.contactPhone,
          contactLine: form.contactLine,
          address: form.address,
          facebookUrl: form.facebookUrl,
          mapUrl: form.mapUrl,
          portalBannerUrl: form.portalBannerUrl,
          portalGallery: form.portalGallery,
          portalShowCommittee: form.portalShowCommittee !== false,
          portalShowMembers: Boolean(form.portalShowMembers),
          portalMemberFields: form.portalMemberFields,
          paymentRulesNote: form.paymentRulesNote,
          promptPayPhone: form.promptPayPhone,
          promptPayQrImageUrl: form.promptPayQrImageUrl,
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountName: form.bankAccountName,
          taxId: form.taxId,
          slipPaperSize: form.slipPaperSize,
          duesEnabled: form.duesEnabled,
          duesAmountBaht: form.duesAmountBaht,
          duesPeriod: form.duesPeriod,
        }),
      });
      const data = (await res.json()) as { profile?: ClubEventProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setForm(data.profile);
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const paymentValue: ModuleShopPaymentDto = {
    promptPayPhone: form.promptPayPhone,
    promptPayQrImageUrl: form.promptPayQrImageUrl,
    bankName: form.bankName,
    bankAccountNumber: form.bankAccountNumber,
    bankAccountName: form.bankAccountName,
    taxId: form.taxId,
  };

  const portalPath = form.publicUrl || `/club/${form.slug}`;
  const portalAbsoluteUrl = useMemo(() => absoluteUrl(portalPath), [portalPath]);

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="ตั้งค่า"
        titleIcon={clubEventPageTitleIcon("settings")}
        titleTone={clubEventPageTitleTone("settings")}
        items={SETTINGS_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="แท็บตั้งค่า"
        action={
          <button
            type="button"
            className={clubEventPrimaryButtonClass}
            disabled={saving}
            onClick={() => void saveProfile()}
          >
            บันทึก
          </button>
        }
      >
        {tab === "basic" ? (
          <div id="club-event-settings-panel-basic" role="tabpanel" className="space-y-3">
            <AppShopLogoField
              logoUrl={form.logoUrl}
              fallbackLabel={form.displayName || "ชมรม"}
              uploadUrl={LOGO_UPLOAD}
              onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              buttonClassName={clubEventOutlineButtonClass}
            />
            <label className={labelClass}>
              <span className={labelTextClass}>ชื่อชมรม / กิจกรรม</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="เช่น ชมรมวิ่งชุมชน"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Slug (ใช้ใน URL เว็บสาธารณะ)</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="my-club"
              />
              <p className="mt-1 text-[11px] font-semibold text-[#8b87b8]">พอร์ทัล: {portalPath}</p>
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>สโลแกน</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.tagline ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="ข้อความสั้นใต้ชื่อชมรม"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>เบอร์ติดต่อ</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.contactPhone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="08x-xxx-xxxx"
                inputMode="tel"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>ที่อยู่ / สถานที่ชมรม</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="ที่อยู่สำหรับแสดงบนเว็บ"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>กฎระเบียบ / ข้อปฏิบัติ</span>
              <textarea
                className={cn(clubEventTextareaClass, "mt-1")}
                value={form.rulesMarkdown}
                onChange={(e) => setForm((f) => ({ ...f, rulesMarkdown: e.target.value }))}
                placeholder="ข้อความแสดงบนเว็บสาธารณะ"
              />
            </label>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div id="club-event-settings-panel-finance" role="tabpanel" className="space-y-3">
            <AppModuleShopPaymentFields
              value={paymentValue}
              onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
              fieldClassName={cn(clubEventFieldClass, "mt-1")}
            />

            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
              <p className="text-xs font-black text-[#4d47b6]">QR พร้อมเพย์ (อัปโหลดรูป)</p>
              <p className="text-[11px] font-semibold text-[#8b87b8]">
                ทางเลือก — อัปโหลดภาพ QR จากแอปธนาคาร ถ้ามีรูปนี้ระบบจะแสดงรูปนี้แทนการสร้างจากเบอร์
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
                    disabled={saving}
                    className={cn(clubEventOutlineButtonClass, "text-rose-700")}
                    onClick={() => setForm((f) => ({ ...f, promptPayQrImageUrl: null }))}
                  >
                    ลบรูป QR
                  </button>
                </div>
              ) : null}
              <label className={cn(clubEventOutlineButtonClass, "cursor-pointer")}>
                {form.promptPayQrImageUrl ? "เปลี่ยนภาพ QR" : "เลือกภาพ QR พร้อมเพย์"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void (async () => {
                      setSaving(true);
                      try {
                        const fd = new FormData();
                        fd.set("file", file);
                        const res = await fetch(LOGO_UPLOAD, { method: "POST", body: fd });
                        const json = (await res.json().catch(() => ({}))) as {
                          imageUrl?: string;
                          error?: string;
                        };
                        if (!res.ok || !json.imageUrl) {
                          throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
                        }
                        setForm((prev) => ({ ...prev, promptPayQrImageUrl: json.imageUrl! }));
                        notice.success("อัปโหลด QR พร้อมเพย์แล้ว");
                      } catch (err) {
                        notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                      } finally {
                        setSaving(false);
                      }
                    })();
                  }}
                />
              </label>
            </div>

            <label className={labelClass}>
              <span className={labelTextClass}>กฎ / หมายเหตุการชำระเงิน (แสดงบนลิงก์เก็บค่า)</span>
              <textarea
                className={cn(clubEventTextareaClass, "mt-1")}
                value={form.paymentRulesNote ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, paymentRulesNote: e.target.value }))}
                placeholder="เช่น โอนแล้วแนบสลิป · ชำระภายใน 24 ชม."
              />
            </label>

            <AppSlipPaperSizeSettingsField
              value={form.slipPaperSize as AppSlipPaperSize}
              onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
              disabled={saving}
            />
          </div>
        ) : null}

        {tab === "dues" ? (
          <ClubEventDuesSettingsPanel
            form={form}
            setForm={setForm}
            saving={saving}
            onCopied={() => notice.success("คัดลอกลิงก์แล้ว")}
            onCopyFailed={() => notice.error("คัดลอกไม่สำเร็จ")}
          />
        ) : null}

        {tab === "portal" ? (
          <div id="club-event-settings-panel-portal" role="tabpanel" className="space-y-4">
            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
              <p className="text-xs font-black text-[#4d47b6]">ลิงก์เว็บชมรมสาธารณะ</p>
              <p className="break-all text-sm font-semibold text-[#1e1b4b]">{portalPath}</p>
              <p className="text-xs text-[#66638c]">
                พอร์ทัลชมรมอยู่ที่ /club/{form.slug} — สร้าง QR ด้านล่างเพื่อพิมพ์หรือแชร์
              </p>
            </div>
            <ModulePublicLinkQrPanel
              pageUrl={portalAbsoluteUrl}
              shopLabel={form.displayName || "ชมรม"}
              logoUrl={form.logoUrl}
              trialExportBlocked={trialSessionId !== TRIAL_PROD_SCOPE}
              tagline="สแกนเพื่อเข้าเว็บชมรม / ดูกิจกรรม"
              mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อเข้าเว็บชมรม"
              openPrimaryLabel="เปิดเว็บชมรม"
              openSecondaryLabel="เปิดเว็บ"
              qrAlt="QR เว็บชมรมสาธารณะ"
              posterAlt="โปสเตอร์ QR เว็บชมรม"
              downloadFilePrefix={`club-portal-${form.slug || "portal"}`}
            />
            <p className="text-xs font-semibold text-[#66638c]">
              ลิงก์ RSVP / สำรวจ / เก็บค่า — สร้างและจัดการจากหน้ากำหนดการของแต่ละกิจกรรม
            </p>
            <ClubEventPortalMediaSettings
              bannerUrl={form.portalBannerUrl ?? ""}
              gallery={form.portalGallery ?? []}
              facebookUrl={form.facebookUrl ?? ""}
              mapUrl={form.mapUrl ?? ""}
              contactLine={form.contactLine ?? ""}
              onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url || null }))}
              onGalleryChange={(urls) => setForm((f) => ({ ...f, portalGallery: urls }))}
              onFacebookUrlChange={(url) => setForm((f) => ({ ...f, facebookUrl: url || null }))}
              onMapUrlChange={(url) => setForm((f) => ({ ...f, mapUrl: url || null }))}
              onContactLineChange={(value) => setForm((f) => ({ ...f, contactLine: value || null }))}
              disabled={saving}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0000BF] focus:ring-[#0000BF]/30"
                checked={form.portalShowCommittee !== false}
                disabled={saving}
                onChange={(e) => setForm((f) => ({ ...f, portalShowCommittee: e.target.checked }))}
              />
              <span>
                <span className="block text-sm font-bold text-[#1e1b4b]">แสดงคณะกรรมการบนเว็บไซต์</span>
                <span className="mt-0.5 block text-xs font-semibold text-[#66638c]">
                  เมื่อเปิด จะมีปุ่มคณะกรรมการบนเว็บสาธารณะ — กดแล้วเปิดป๊อปอัปรายชื่อ
                </span>
              </span>
            </label>

            <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0000BF] focus:ring-[#0000BF]/30"
                  checked={Boolean(form.portalShowMembers)}
                  disabled={saving}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      portalShowMembers: e.target.checked,
                      // เมื่อเปิดครั้งแรกให้คงค่าเดิม — ถ้ายังไม่มี ให้ใช้ค่าเริ่มที่ปิดเบอร์/อีเมล/โซเชียล
                      portalMemberFields: f.portalMemberFields ?? DEFAULT_CLUB_PORTAL_MEMBER_FIELDS,
                    }))
                  }
                />
                <span>
                  <span className="block text-sm font-bold text-[#1e1b4b]">เปิดค้นหาสมาชิกบนเว็บไซต์</span>
                  <span className="mt-0.5 block text-xs font-semibold text-[#66638c]">
                    ผู้เยี่ยมชมค้นหาสมาชิกที่ใช้งานอยู่ได้ — ชื่อเต็มแสดงเสมอเมื่อเปิดส่วนนี้
                  </span>
                </span>
              </label>

              {form.portalShowMembers ? (
                <fieldset className="space-y-2 border-t border-slate-100 pt-3" disabled={saving}>
                  <legend className="text-xs font-bold uppercase tracking-wide text-[#66638c]">
                    เปิดเผยข้อมูลสมาชิกใดบ้าง
                  </legend>
                  <p className="text-xs font-semibold text-[#66638c]">
                    ชื่อเต็มเปิดเสมอ · เลือกฟิลด์เพิ่มด้านล่าง (ค่าเริ่มต้นปิดเบอร์โทรและอีเมล)
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CLUB_PORTAL_MEMBER_FIELD_OPTIONS.map((opt) => {
                      const fields = form.portalMemberFields ?? DEFAULT_CLUB_PORTAL_MEMBER_FIELDS;
                      const checked = Boolean(fields[opt.key]);
                      return (
                        <label
                          key={opt.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0000BF] focus:ring-[#0000BF]/30"
                            checked={checked}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                portalMemberFields: {
                                  ...(f.portalMemberFields ?? DEFAULT_CLUB_PORTAL_MEMBER_FIELDS),
                                  [opt.key]: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span>
                            <span className="block text-sm font-bold text-[#1e1b4b]">{opt.label}</span>
                            {opt.hint ? (
                              <span className="mt-0.5 block text-[11px] font-semibold text-[#66638c]">
                                {opt.hint}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
            </div>
          </div>
        ) : null}
      </ClubEventPageSubNav>
    </>
  );
}

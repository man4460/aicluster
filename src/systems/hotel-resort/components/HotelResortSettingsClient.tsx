"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  AppTime24Input,
  appTemplateOutlineButtonClass,
  staffDailyPinPatchBody,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { hotelResortPublicPortalUrl } from "@/lib/hotel-resort/public-url";
import { cn } from "@/lib/cn";
import { HotelResortBookingPaymentSettings } from "@/systems/hotel-resort/components/HotelResortBookingPaymentSettings";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortGuestPortalHubClient } from "@/systems/hotel-resort/components/HotelResortGuestPortalHubClient";
import { HotelResortPortalMediaSettings } from "@/systems/hotel-resort/components/HotelResortPortalMediaSettings";
import { HotelResortReviewsSettings } from "@/systems/hotel-resort/components/HotelResortReviewsSettings";
import type { HotelPortalBookingPaymentMode } from "@/systems/hotel-resort/lib/portal-booking";
import {
  HOTEL_RESORT_ROOMS_HREF,
  type HotelResortSettingsTab,
} from "@/systems/hotel-resort/hotel-resort-module-nav";
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortMobileSelectClass,
  hotelResortPrimaryTabPillClass,
  hotelResortPrimaryTabShellClass,
  hotelResortSectionRadiusClass,
  hotelResortSuccessBannerClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type SettingsTab = HotelResortSettingsTab;

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "hours", label: "ตั้งค่าเวลาเช็คอิน / เช็คเอาต์" },
  { id: "link", label: "ลิงก์ QR" },
];

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

function parseTab(raw: string | null): SettingsTab {
  if (raw && TABS.some((t) => t.id === raw)) return raw as SettingsTab;
  return "basic";
}

export function HotelResortSettingsClient({
  initial,
  ownerId,
  trialSessionId,
  initialPortalBannerUrl = null,
  initialPortalGallery = [],
  guestPortal,
}: {
  initial: HotelProfile;
  ownerId: string;
  trialSessionId: string;
  initialPortalBannerUrl?: string | null;
  initialPortalGallery?: string[];
  guestPortal: {
    baseUrl: string;
    hotelLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
  };
}) {
  return (
    <Suspense fallback={<div className={cn(hotelResortSectionRadiusClass, "h-40 animate-pulse bg-white/30")} aria-busy />}>
      <HotelResortSettingsClientInner
        initial={initial}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        initialPortalBannerUrl={initialPortalBannerUrl}
        initialPortalGallery={initialPortalGallery}
        guestPortal={guestPortal}
      />
    </Suspense>
  );
}

function HotelResortSettingsClientInner({
  initial,
  ownerId,
  trialSessionId,
  initialPortalBannerUrl = null,
  initialPortalGallery = [],
  guestPortal,
}: {
  initial: HotelProfile;
  ownerId: string;
  trialSessionId: string;
  initialPortalBannerUrl?: string | null;
  initialPortalGallery?: string[];
  guestPortal: {
    baseUrl: string;
    hotelLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseTab(searchParams.get("tab")));
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
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const portalPath = useMemo(
    () => hotelResortPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "rooms") {
      router.replace(HOTEL_RESORT_ROOMS_HREF);
      return;
    }
    setTab(parseTab(raw));
  }, [searchParams, router]);

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    setMsg(null);
    setErr(null);
    setCopyMsg(null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  const applyProfile = (profile: HotelProfile) => {
    setForm({
      ...profile,
      slipPaperSize: profile.slipPaperSize ?? "SLIP_58",
      staffDailyPinSet: profile.staffDailyPinSet ?? false,
      portalBookingPaymentMode: profile.portalBookingPaymentMode ?? "NONE",
      depositAmountBaht: profile.depositAmountBaht ?? null,
      address: profile.address ?? null,
      lineId: profile.lineId ?? null,
      facebookUrl: profile.facebookUrl ?? null,
      mapUrl: profile.mapUrl ?? null,
    });
    setPinDraft("");
    setClearPin(false);
  };

  const saveProfile = async (fields: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/hotel-resort/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ...(tab === "finance" ? staffDailyPinPatchBody({ pinDraft, clearPin }) : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: HotelProfile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) applyProfile(json.profile);
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveBasic = () =>
    void saveProfile({
      propertyName: form.propertyName,
      managerName: form.managerName,
      logoUrl: form.logoUrl,
      tagline: form.tagline,
      contactPhone: form.contactPhone,
    });

  const saveFinance = () =>
    void saveProfile({
      promptPayPhone: form.promptPayPhone,
      promptPayQrImageUrl: form.promptPayQrImageUrl,
      bankName: form.bankName,
      bankAccountNumber: form.bankAccountNumber,
      bankAccountName: form.bankAccountName,
      taxId: form.taxId,
      slipPaperSize: form.slipPaperSize,
    });

  const savePortal = () =>
    void saveProfile({
      address: form.address,
      lineId: form.lineId,
      facebookUrl: form.facebookUrl,
      mapUrl: form.mapUrl,
      portalBookingPaymentMode: form.portalBookingPaymentMode,
      depositAmountBaht: form.depositAmountBaht,
    });

  const saveHours = () =>
    void saveProfile({
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
    });

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const headerSave =
    tab === "portal" ? savePortal : tab === "hours" ? saveHours : null;

  return (
    <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title="ตั้งค่าที่พัก"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          headerSave ? (
            <button
              type="button"
              disabled={busy}
              onClick={headerSave}
              className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-60"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          ) : null
        }
      />

      <div className="mt-3 space-y-2 sm:hidden">
        <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="hotel-resort-settings-tab">
          กรุณาเลือกหมวดตั้งค่า
        </label>
        <select
          id="hotel-resort-settings-tab"
          className={hotelResortMobileSelectClass}
          value={tab}
          onChange={(e) => selectTab(e.target.value as SettingsTab)}
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 hidden sm:block">
        <nav className={hotelResortPrimaryTabShellClass} role="tablist" aria-label="หมวดตั้งค่า">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`hotel-resort-settings-panel-${t.id}`}
              id={`hotel-resort-settings-tab-${t.id}`}
              className={hotelResortPrimaryTabPillClass(tab === t.id)}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {err ? <div className="mt-3"><HotelResortErrorBanner message={err} /></div> : null}
      {msg ? <p className={cn(hotelResortSuccessBannerClass, "mt-3")}>{msg}</p> : null}

      <div
        className="mt-4"
        role="tabpanel"
        id={`hotel-resort-settings-panel-${tab}`}
        aria-labelledby={`hotel-resort-settings-tab-${tab}`}
      >
        {tab === "basic" ? (
          <div className="space-y-3 text-left">
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
            <button
              type="button"
              disabled={busy}
              onClick={saveBasic}
              className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div className="space-y-3 text-left">
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
              onClick={saveFinance}
              className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        ) : null}

        {tab === "portal" ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
              <p className="text-xs font-bold text-[#4d47b6]">ลิงก์จองลูกค้า</p>
              <p className="break-all text-sm font-semibold text-[#1e1b4b]">{portalPath}</p>
              {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
              <div className="flex flex-wrap gap-2">
                <a
                  href={portalPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-4 text-sm font-bold")}
                >
                  เปิดลิงก์
                </a>
                <button
                  type="button"
                  className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(absoluteUrl(portalPath));
                      setCopyMsg("คัดลอกลิงก์แล้ว");
                    } catch {
                      setCopyMsg("คัดลอกไม่สำเร็จ");
                    }
                  }}
                >
                  คัดลอกลิงก์
                </button>
                <button
                  type="button"
                  className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-4 text-sm font-bold")}
                  onClick={() => selectTab("link")}
                >
                  ไปหน้า QR
                </button>
              </div>
            </div>

            <HotelResortPortalMediaSettings
              embedded
              initialBannerUrl={initialPortalBannerUrl}
              initialGallery={initialPortalGallery}
            />

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/40 p-3 sm:p-4">
              <p className={hotelResortFormLabelClass}>ข้อมูลติดต่อบนหน้าลิงก์</p>
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
            </div>

            <HotelResortBookingPaymentSettings
              portalBookingPaymentMode={form.portalBookingPaymentMode}
              depositAmountBaht={form.depositAmountBaht}
              onPaymentModeChange={(mode) => setForm((f) => ({ ...f, portalBookingPaymentMode: mode }))}
              onDepositAmountChange={(v) => setForm((f) => ({ ...f, depositAmountBaht: v }))}
              disabled={busy}
            />

            <HotelResortReviewsSettings embedded />
          </div>
        ) : null}

        {tab === "hours" ? (
          <div className="grid max-w-lg gap-4 sm:grid-cols-2">
            <div>
              <p className={hotelResortFormLabelClass}>เวลาเช็คอิน</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.checkInTime}
                  onChange={(v) => setForm((f) => ({ ...f, checkInTime: v }))}
                />
              </div>
            </div>
            <div>
              <p className={hotelResortFormLabelClass}>เวลาเช็คเอาต์</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.checkOutTime}
                  onChange={(v) => setForm((f) => ({ ...f, checkOutTime: v }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "link" ? (
          <HotelResortGuestPortalHubClient
            embedded
            ownerId={ownerId}
            trialSessionId={trialSessionId}
            baseUrl={guestPortal.baseUrl}
            hotelLabel={guestPortal.hotelLabel}
            logoUrl={guestPortal.logoUrl}
            trialExportBlocked={guestPortal.trialExportBlocked}
          />
        ) : null}
      </div>
    </AppDashboardSection>
  );
}

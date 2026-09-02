"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppModuleShopPaymentFields,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  AppTime24Input,
  staffDailyPinPatchBody,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { cn } from "@/lib/cn";
import { LaundryPortalMediaSettings } from "@/systems/laundry/components/LaundryPortalMediaSettings";
import { LaundryQrHubClient } from "@/systems/laundry/components/LaundryQrHubClient";
import {
  LAUNDRY_SETTINGS_LINK_HREF,
  type LaundrySettingsTab,
} from "@/systems/laundry/laundry-module-nav";
import {
  DEFAULT_LAUNDRY_PAY_AMOUNT_PRESETS,
  formatLaundryPayAmountPresetsInput,
  parseLaundryPayAmountPresets,
} from "@/systems/laundry/lib/pay-amount-presets";
import {
  normalizeLaundryPortalPaymentMode,
  type LaundryPortalBookingPaymentMode,
} from "@/systems/laundry/lib/portal-booking";
import {
  laundryCompactOutlineButtonClass,
  laundryDashboardSegmentBtnClass,
  laundryHeaderActionShellClass,
  laundryMobileSelectClass,
  laundryPanelClass,
  laundryPanelDividerClass,
  laundryPanelSectionClass,
  laundryPaymentChipActiveClass,
  laundryPaymentChipIdleClass,
  laundrySettingsChoiceBtnClass,
  laundrySettingsChoiceShellClass,
  laundrySettingsHeaderTabShellClass,
  laundrySettingsTabPillClass,
  laundrySubtitleClass,
} from "@/systems/laundry/lib/ui-tokens";

const API_BASE = "/api/laundry/shop-profile";
const LOGO_UPLOAD_URL = "/api/laundry/session/images/upload";

const SETTINGS_TABS: { id: LaundrySettingsTab; label: string; shortLabel: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า", shortLabel: "ลิงก์ลูกค้า" },
  { id: "hours", label: "ตั้งค่าเวลาเปิดร้าน", shortLabel: "เวลาเปิด" },
  { id: "link", label: "ลิงก์ QR", shortLabel: "QR" },
];

const SETTINGS_TAB_DESCRIPTIONS: Record<LaundrySettingsTab, string> = {
  basic: "ชื่อร้าน · โลโก้ · สโลแกน · เบอร์ติดต่อ · ที่อยู่",
  finance: "ชำระเงิน · พร้อมเพย์ · รหัสพนักงาน · ขนาดสลิป · ปุ่มลัดยอดรับชำระ",
  portal: "ลิงก์รับผ้าที่บ้าน · แบนเนอร์ · แกลเลอรี · LINE · แผนที่",
  hours: "เวลาเปิด–ปิดร้าน (เวลาไทย)",
  link: "QR ให้ลูกค้าสแกน · ดาวน์โหลด · พิมพ์",
};

const SETTINGS_TAB_KEYS = new Set<string>(SETTINGS_TABS.map((t) => t.id));

type ShopProfile = {
  displayName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  tagline?: string | null;
  contactLine?: string | null;
  facebookUrl?: string | null;
  mapUrl?: string | null;
  portalBannerUrl?: string | null;
  portalGallery?: string[];
  shopLat?: number | null;
  shopLng?: number | null;
  pickupFeePerKmBaht?: number | null;
  slipPaperSize: AppSlipPaperSize;
  payAmountPresets?: number[];
  payAmountPresetsRaw?: string;
  openTime?: string;
  closeTime?: string;
  portalBookingPaymentMode?: LaundryPortalBookingPaymentMode;
  depositAmountBaht?: number | null;
  promptPayQrImageUrl?: string | null;
  staffDailyPinSet?: boolean;
} & ModuleShopPaymentDto;

function parseSettingsTab(raw: string | null): LaundrySettingsTab {
  if (raw && SETTINGS_TAB_KEYS.has(raw)) return raw as LaundrySettingsTab;
  return "basic";
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function laundryPublicPortalPath(ownerId: string, trialSessionId: string): string {
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `/laundry/${ownerId}${q}`;
}

function laundryPublicPickupPath(ownerId: string, trialSessionId: string): string {
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `/laundry/pickup/${ownerId}${q}`;
}

function LaundryPortalLinkPanel({
  portalPath,
  onGoToQr,
}: {
  portalPath: string;
  onGoToQr?: () => void;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(portalPath));
      setCopyMsg("คัดลอกลิงก์รับผ้าแล้ว");
    } catch {
      setCopyMsg("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm text-[#5f5a8a]">
        ลิงก์สาธารณะให้ลูกค้าขอบริการรับ-ส่งที่บ้าน — ตั้งแบนเนอร์ · แกลเลอรี · LINE · Facebook · แผนที่ด้านล่าง
      </p>
      {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
      <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
        <p className="text-xs font-bold text-[#4d47b6]">ลิงก์รับผ้าที่บ้าน</p>
        <p className="break-all text-sm font-semibold text-[#1e1b4b]">{portalPath}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={portalPath}
            target="_blank"
            rel="noopener noreferrer"
            className={laundryCompactOutlineButtonClass}
          >
            เปิดลิงก์
          </a>
          <button
            type="button"
            onClick={() => void copy()}
            className={cn(laundryDashboardSegmentBtnClass(true), "min-h-8 px-3")}
          >
            คัดลอกลิงก์
          </button>
          {onGoToQr ? (
            <button
              type="button"
              className={laundryCompactOutlineButtonClass}
              onClick={onGoToQr}
            >
              ไปหน้า QR
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LaundrySettingsClient({
  initial,
  ownerUserId,
  trialSessionId,
  linkHub,
}: {
  initial: ShopProfile;
  ownerUserId: string;
  trialSessionId: string;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    isTrialSandbox: boolean;
  };
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.5rem] bg-white/30" aria-busy />}>
      <LaundrySettingsClientInner
        initial={initial}
        ownerUserId={ownerUserId}
        trialSessionId={trialSessionId}
        linkHub={linkHub}
      />
    </Suspense>
  );
}

function LaundrySettingsClientInner({
  initial,
  ownerUserId,
  trialSessionId,
  linkHub,
}: {
  initial: ShopProfile;
  ownerUserId: string;
  trialSessionId: string;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    isTrialSandbox: boolean;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LaundrySettingsTab>(() => parseSettingsTab(searchParams.get("tab")));

  const [form, setForm] = useState({
    ...initial,
    slipPaperSize: initial.slipPaperSize ?? ("SLIP_58" as AppSlipPaperSize),
    tagline: initial.tagline ?? null,
    contactLine: initial.contactLine ?? null,
    facebookUrl: initial.facebookUrl ?? null,
    mapUrl: initial.mapUrl ?? null,
    portalBannerUrl: initial.portalBannerUrl ?? null,
    portalGallery: initial.portalGallery ?? [],
    shopLat: initial.shopLat ?? null,
    shopLng: initial.shopLng ?? null,
    pickupFeePerKmBaht: initial.pickupFeePerKmBaht ?? null,
    openTime: initial.openTime ?? "09:00",
    closeTime: initial.closeTime ?? "20:00",
    portalBookingPaymentMode: normalizeLaundryPortalPaymentMode(initial.portalBookingPaymentMode),
    depositAmountBaht: initial.depositAmountBaht ?? null,
    promptPayQrImageUrl: initial.promptPayQrImageUrl ?? null,
    payAmountPresetsRaw:
      initial.payAmountPresetsRaw ??
      formatLaundryPayAmountPresetsInput(
        (initial.payAmountPresets ?? [...DEFAULT_LAUNDRY_PAY_AMOUNT_PRESETS]).join(","),
      ),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pinSet, setPinSet] = useState(Boolean(initial.staffDailyPinSet));
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);

  const presetPreview = useMemo(
    () => parseLaundryPayAmountPresets(form.payAmountPresetsRaw),
    [form.payAmountPresetsRaw],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "qr") {
      router.replace(LAUNDRY_SETTINGS_LINK_HREF);
      return;
    }
    setTab(parseSettingsTab(raw));
  }, [searchParams, router]);

  const selectTab = (next: LaundrySettingsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  const applyProfile = (profile: ShopProfile) => {
    setForm({
      ...profile,
      slipPaperSize: profile.slipPaperSize ?? "SLIP_58",
      tagline: profile.tagline ?? null,
      contactLine: profile.contactLine ?? null,
      facebookUrl: profile.facebookUrl ?? null,
      mapUrl: profile.mapUrl ?? null,
      portalBannerUrl: profile.portalBannerUrl ?? null,
      portalGallery: profile.portalGallery ?? [],
      shopLat: profile.shopLat ?? null,
      shopLng: profile.shopLng ?? null,
      pickupFeePerKmBaht: profile.pickupFeePerKmBaht ?? null,
      openTime: profile.openTime ?? "09:00",
      closeTime: profile.closeTime ?? "20:00",
      portalBookingPaymentMode: normalizeLaundryPortalPaymentMode(profile.portalBookingPaymentMode),
      depositAmountBaht: profile.depositAmountBaht ?? null,
      promptPayQrImageUrl: profile.promptPayQrImageUrl ?? null,
      payAmountPresetsRaw:
        profile.payAmountPresetsRaw ??
        formatLaundryPayAmountPresetsInput(
          (profile.payAmountPresets ?? [...DEFAULT_LAUNDRY_PAY_AMOUNT_PRESETS]).join(","),
        ),
    });
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = {
        displayName: form.displayName,
        logoUrl: form.logoUrl,
        tagline: form.tagline,
        contactPhone: form.contactPhone,
        contactLine: form.contactLine,
        facebookUrl: form.facebookUrl,
        mapUrl: form.mapUrl,
        address: form.address,
        shopLat: form.shopLat,
        shopLng: form.shopLng,
        portalBannerUrl: form.portalBannerUrl,
        portalGallery: form.portalGallery,
        slipPaperSize: form.slipPaperSize,
        payAmountPresets: form.payAmountPresetsRaw,
        openTime: form.openTime,
        closeTime: form.closeTime,
        portalBookingPaymentMode: form.portalBookingPaymentMode,
        depositAmountBaht:
          form.portalBookingPaymentMode === "DEPOSIT" ? form.depositAmountBaht : null,
        pickupFeePerKmBaht: form.pickupFeePerKmBaht,
        promptPayQrImageUrl: form.promptPayQrImageUrl,
        promptPayPhone: form.promptPayPhone,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName,
        taxId: form.taxId,
      };

      if (tab === "finance") {
        Object.assign(payload, staffDailyPinPatchBody({ pinDraft, clearPin }));
      }

      const res = await fetch(API_BASE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: ShopProfile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        applyProfile(json.profile);
        setPinSet(Boolean(json.profile.staffDailyPinSet));
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

  const portalPath = laundryPublicPortalPath(ownerUserId, trialSessionId);

  return (
    <div className={laundryPanelClass}>
      <div className={laundryPanelSectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#1e1b4b] sm:text-lg">ตั้งค่าร้าน</h2>
            <p className={laundrySubtitleClass}>{SETTINGS_TAB_DESCRIPTIONS[tab]}</p>
            <p className="mt-0.5 text-xs font-medium text-[#66638c] sm:hidden">{SETTINGS_TAB_DESCRIPTIONS[tab]}</p>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1 md:gap-1.5">
            <div className="hidden md:block">
              <nav
                className={laundrySettingsHeaderTabShellClass}
                aria-label="เมนูตั้งค่าร้าน"
                role="tablist"
              >
                {SETTINGS_TABS.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      id={`laundry-settings-tab-${item.id}`}
                      aria-controls={`laundry-settings-panel-${item.id}`}
                      title={item.label}
                      aria-label={item.label}
                      onClick={() => selectTab(item.id)}
                      className={laundrySettingsTabPillClass(active)}
                    >
                      <span className="hidden xl:inline">{item.label}</span>
                      <span className="xl:hidden">{item.shortLabel}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className={laundryHeaderActionShellClass} role="group" aria-label="บันทึกการตั้งค่า">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className={cn(laundryDashboardSegmentBtnClass(true), "disabled:opacity-50")}
                aria-label={busy ? "กำลังบันทึก" : "บันทึกการตั้งค่า"}
                aria-busy={busy}
                title={busy ? "กำลังบันทึก…" : "บันทึก"}
              >
                <IconSave className={cn("h-3.5 w-3.5 shrink-0", busy && "animate-pulse")} />
                <span className="hidden sm:inline">{busy ? "กำลังบันทึก…" : "บันทึก"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 w-full md:hidden">
          <label htmlFor="laundry-settings-menu-mobile" className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="laundry-settings-menu-mobile"
            value={tab}
            onChange={(e) => selectTab(e.target.value as LaundrySettingsTab)}
            className={laundryMobileSelectClass}
            aria-label="กรุณาเลือกหมวดตั้งค่า"
          >
            {SETTINGS_TABS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cn(laundryPanelSectionClass, laundryPanelDividerClass)}>
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

          {tab === "basic" ? (
            <div id="laundry-settings-panel-basic" role="tabpanel" aria-labelledby="laundry-settings-tab-basic" className="space-y-3">
              <AppShopLogoField
                logoUrl={form.logoUrl}
                fallbackLabel={form.displayName ?? "ร้าน"}
                uploadUrl={LOGO_UPLOAD_URL}
                onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
                buttonClassName={laundryCompactOutlineButtonClass}
              />
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้านรับฝากซักผ้า</span>
                <input
                  className="app-input mt-1 w-full rounded-xl"
                  value={form.displayName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">สโลแกน</span>
                <input
                  className="app-input mt-1 w-full rounded-xl"
                  value={form.tagline ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
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
            </div>
          ) : null}

          {tab === "finance" ? (
            <div id="laundry-settings-panel-finance" role="tabpanel" aria-labelledby="laundry-settings-tab-finance" className="space-y-3">
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#4d47b6]">ชำระตอนขอบริการรับ-ส่งจากลิงก์ลูกค้า</p>
                <div
                  className={laundrySettingsChoiceShellClass}
                  role="radiogroup"
                  aria-label="โหมดชำระตอนจอง"
                >
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
                      role="radio"
                      aria-checked={form.portalBookingPaymentMode === opt.value}
                      disabled={busy}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          portalBookingPaymentMode: opt.value,
                        }))
                      }
                      className={laundrySettingsChoiceBtnClass(form.portalBookingPaymentMode === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.portalBookingPaymentMode === "DEPOSIT" ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">จำนวนมัดจำ (บาท)</span>
                    <input
                      type="number"
                      min={1}
                      className="app-input mt-1 w-full rounded-xl"
                      value={form.depositAmountBaht ?? ""}
                      disabled={busy}
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
                      className="h-28 w-28 rounded-xl border border-white object-contain bg-white p-1 shadow-sm"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(laundryCompactOutlineButtonClass, "text-rose-700")}
                      onClick={() => setForm((f) => ({ ...f, promptPayQrImageUrl: null }))}
                    >
                      ลบรูป QR
                    </button>
                  </div>
                ) : null}
                <label className={cn(laundryCompactOutlineButtonClass, "cursor-pointer")}>
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
                          const res = await fetch(LOGO_UPLOAD_URL, { method: "POST", body: fd });
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

              <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-[#4d47b6]">ปุ่มลัดยอดรับชำระ (บาท)</span>
                  <input
                    className="app-input mt-1 w-full rounded-xl font-semibold tabular-nums"
                    value={form.payAmountPresetsRaw}
                    onChange={(e) => setForm((f) => ({ ...f, payAmountPresetsRaw: e.target.value }))}
                    placeholder="80, 100, 120, 150"
                    inputMode="numeric"
                    aria-describedby="laundry-pay-presets-hint"
                  />
                </label>
                <p id="laundry-pay-presets-hint" className="text-[11px] font-semibold text-[#8b87b8]">
                  คั่นด้วยจุลภาค สูงสุด 8 ค่า — ใช้ในฟอร์มรับชำระและยังกรอกยอดเองได้
                </p>
                <div className="flex flex-wrap gap-1.5" aria-label="ตัวอย่างปุ่มลัด">
                  {presetPreview.map((n) => (
                    <span
                      key={n}
                      className={cn(laundryPaymentChipIdleClass, "pointer-events-none tabular-nums")}
                    >
                      ฿{n.toLocaleString("th-TH")}
                    </span>
                  ))}
                  <span className={cn(laundryPaymentChipActiveClass, "pointer-events-none")}>กรอกเอง</span>
                </div>
              </div>

              <AppStaffDailyPinSettingsField
                pinSet={pinSet}
                pinDraft={pinDraft}
                onPinDraftChange={setPinDraft}
                clearPin={clearPin}
                onClearPinChange={setClearPin}
                disabled={busy}
              />

              <AppSlipPaperSizeSettingsField
                value={form.slipPaperSize}
                onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
                disabled={busy}
              />
            </div>
          ) : null}

          {tab === "portal" ? (
            <div
              id="laundry-settings-panel-portal"
              role="tabpanel"
              aria-labelledby="laundry-settings-tab-portal"
              className="space-y-4"
            >
              <LaundryPortalLinkPanel portalPath={portalPath} onGoToQr={() => selectTab("link")} />
              <LaundryPortalMediaSettings
                bannerUrl={form.portalBannerUrl ?? ""}
                gallery={form.portalGallery ?? []}
                facebookUrl={form.facebookUrl ?? ""}
                mapUrl={form.mapUrl ?? ""}
                contactLine={form.contactLine ?? ""}
                shopLat={form.shopLat ?? null}
                shopLng={form.shopLng ?? null}
                pickupFeePerKmBaht={form.pickupFeePerKmBaht ?? null}
                onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url || null }))}
                onGalleryChange={(urls) => setForm((f) => ({ ...f, portalGallery: urls }))}
                onFacebookUrlChange={(url) => setForm((f) => ({ ...f, facebookUrl: url || null }))}
                onMapUrlChange={(url) => setForm((f) => ({ ...f, mapUrl: url || null }))}
                onContactLineChange={(value) => setForm((f) => ({ ...f, contactLine: value || null }))}
                onShopLatChange={(value) => setForm((f) => ({ ...f, shopLat: value }))}
                onShopLngChange={(value) => setForm((f) => ({ ...f, shopLng: value }))}
                onPickupFeePerKmBahtChange={(value) => setForm((f) => ({ ...f, pickupFeePerKmBaht: value }))}
                disabled={busy}
              />
            </div>
          ) : null}

          {tab === "hours" ? (
            <div
              id="laundry-settings-panel-hours"
              role="tabpanel"
              aria-labelledby="laundry-settings-tab-hours"
              className="space-y-4"
            >
              <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <p className="text-xs font-bold text-[#4d47b6]">เวลาเปิด–ปิด (เวลาไทย)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">เปิด</span>
                    <AppTime24Input
                      value={form.openTime}
                      onChange={(openTime) => setForm((f) => ({ ...f, openTime }))}
                      disabled={busy}
                      className="mt-1"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">ปิด</span>
                    <AppTime24Input
                      value={form.closeTime}
                      onChange={(closeTime) => setForm((f) => ({ ...f, closeTime }))}
                      disabled={busy}
                      className="mt-1"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "link" ? (
            <div id="laundry-settings-panel-link" role="tabpanel" aria-labelledby="laundry-settings-tab-link">
              <LaundryQrHubClient
                embedded
                ownerUserId={ownerUserId}
                shopLabel={linkHub.shopLabel}
                logoUrl={linkHub.logoUrl}
                baseUrl={linkHub.baseUrl}
                trialExportBlocked={linkHub.isTrialSandbox}
                isTrialSandbox={linkHub.isTrialSandbox}
                trialSessionId={trialSessionId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

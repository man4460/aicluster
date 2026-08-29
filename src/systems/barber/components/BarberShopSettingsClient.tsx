"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { cn } from "@/lib/cn";
import { barberPublicPortalUrl } from "@/lib/barber/public-url";
import {
  barberDashboardSegmentBtnClass,
  barberDashboardSegmentShellClass,
  barberMobileSelectClass,
  barberPaymentChipActiveClass,
  barberPaymentChipIdleClass,
  barberPrimaryTabPillClass,
  barberPrimaryTabShellClass,
} from "@/systems/barber/components/barber-ui-tokens";
import {
  DEFAULT_BARBER_PAY_AMOUNT_PRESETS,
  formatBarberPayAmountPresetsInput,
  parseBarberPayAmountPresets,
} from "@/systems/barber/lib/pay-amount-presets";
import { BarberPortalMediaSettings } from "@/systems/barber/components/BarberPortalMediaSettings";
import { BarberQrHubClient } from "@/systems/barber/components/BarberQrHubClient";
import { barberNormalizeSlotMinutes } from "@/systems/barber/lib/booking-slots";
import {
  normalizeBarberPortalPaymentMode,
  type BarberPortalBookingPaymentMode,
} from "@/systems/barber/lib/portal-booking";

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
  slipPaperSize: AppSlipPaperSize;
  payAmountPresets?: number[];
  payAmountPresetsRaw?: string;
  staffDailyPinSet?: boolean;
  openTime?: string;
  closeTime?: string;
  slotMinutes?: 30 | 60;
  portalBookingPaymentMode?: BarberPortalBookingPaymentMode;
  depositAmountBaht?: number | null;
  promptPayQrImageUrl?: string | null;
} & ModuleShopPaymentDto;

type SettingsTab = "basic" | "finance" | "portal" | "hours" | "link";

const BARBER_SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "hours", label: "ตั้งค่าเวลาเปิดร้าน" },
  { id: "link", label: "ลิงก์ QR" },
];

const MASSAGE_SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "hours", label: "ตั้งค่าเวลาเปิดร้าน" },
];

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

function parseSettingsTab(raw: string | null, allowed: SettingsTab[]): SettingsTab {
  if (raw && allowed.includes(raw as SettingsTab)) return raw as SettingsTab;
  return "basic";
}

function BarberPortalLinkPanel({
  ownerId,
  trialSessionId,
  onGoToQr,
}: {
  ownerId: string;
  trialSessionId: string;
  onGoToQr?: () => void;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const portalPath = useMemo(
    () => barberPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(portalPath));
      setCopyMsg("คัดลอกลิงก์จองแล้ว");
    } catch {
      setCopyMsg("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm text-[#5f5a8a]">
        ลิงก์สาธารณะให้ลูกค้าจองคิว — ตั้งแบนเนอร์ · แกลเลอรี · LINE · Facebook · แผนที่ด้านล่าง
      </p>
      {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
      <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#4d47b6]">ลิงก์จองลูกค้า</p>
        <p className="break-all text-sm font-semibold text-[#1e1b4b]">{portalPath}</p>
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
            onClick={() => void copy()}
            className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold"
          >
            คัดลอกลิงก์
          </button>
          {onGoToQr ? (
            <button
              type="button"
              className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold")}
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

export function BarberShopSettingsClient({
  initial,
  apiBase,
  ownerId,
  trialSessionId,
  linkHub,
  hoursPanel,
}: {
  initial: ShopProfile;
  apiBase: "/api/barber/shop-profile" | "/api/massage/shop-profile";
  ownerId?: string;
  trialSessionId?: string;
  linkHub?: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
    isTrialSandbox: boolean;
  };
  hoursPanel?: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.5rem] bg-white/30" aria-busy />}>
      <BarberShopSettingsClientInner
        initial={initial}
        apiBase={apiBase}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        linkHub={linkHub}
        hoursPanel={hoursPanel}
      />
    </Suspense>
  );
}

function BarberShopSettingsClientInner({
  initial,
  apiBase,
  ownerId,
  trialSessionId,
  linkHub,
  hoursPanel,
}: {
  initial: ShopProfile;
  apiBase: "/api/barber/shop-profile" | "/api/massage/shop-profile";
  ownerId?: string;
  trialSessionId?: string;
  linkHub?: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
    isTrialSandbox: boolean;
  };
  hoursPanel?: ReactNode;
}) {
  const router = useRouter();
  const isBarber = apiBase === "/api/barber/shop-profile";
  const supportsUploadedPromptPayQr =
    isBarber || apiBase.includes("/api/massage/shop-profile");
  const tabs = isBarber ? BARBER_SETTINGS_TABS : MASSAGE_SETTINGS_TABS;
  const allowed = tabs.map((t) => t.id);
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab"), allowed));

  const [form, setForm] = useState({
    ...initial,
    slipPaperSize: initial.slipPaperSize ?? ("SLIP_58" as AppSlipPaperSize),
    tagline: initial.tagline ?? null,
    contactLine: initial.contactLine ?? null,
    facebookUrl: initial.facebookUrl ?? null,
    mapUrl: initial.mapUrl ?? null,
    portalBannerUrl: initial.portalBannerUrl ?? null,
    portalGallery: initial.portalGallery ?? [],
    openTime: initial.openTime ?? "09:00",
    closeTime: initial.closeTime ?? "20:00",
    slotMinutes: barberNormalizeSlotMinutes(initial.slotMinutes ?? 30),
    portalBookingPaymentMode: normalizeBarberPortalPaymentMode(initial.portalBookingPaymentMode),
    depositAmountBaht: initial.depositAmountBaht ?? null,
    promptPayQrImageUrl: initial.promptPayQrImageUrl ?? null,
    payAmountPresetsRaw:
      initial.payAmountPresetsRaw ??
      formatBarberPayAmountPresetsInput(
        (initial.payAmountPresets ?? [...DEFAULT_BARBER_PAY_AMOUNT_PRESETS]).join(","),
      ),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);
  const [pinSet, setPinSet] = useState(Boolean(initial.staffDailyPinSet));

  const presetPreview = useMemo(
    () => parseBarberPayAmountPresets(form.payAmountPresetsRaw),
    [form.payAmountPresetsRaw],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "qr") {
      router.replace(`${window.location.pathname}?tab=link`);
      return;
    }
    setTab(parseSettingsTab(raw, allowed));
  }, [searchParams, router, allowed]);

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (isBarber) {
        payload.payAmountPresets = form.payAmountPresetsRaw;
        payload.openTime = form.openTime;
        payload.closeTime = form.closeTime;
        payload.slotMinutes = barberNormalizeSlotMinutes(form.slotMinutes);
        payload.portalBookingPaymentMode = form.portalBookingPaymentMode;
        payload.depositAmountBaht =
          form.portalBookingPaymentMode === "DEPOSIT" ? form.depositAmountBaht : null;
        Object.assign(payload, staffDailyPinPatchBody({ pinDraft, clearPin }));
      } else {
        delete payload.payAmountPresets;
        delete payload.payAmountPresetsRaw;
        delete payload.staffDailyPinSet;
        delete payload.tagline;
        delete payload.contactLine;
        delete payload.facebookUrl;
        delete payload.mapUrl;
        delete payload.portalBannerUrl;
        delete payload.portalGallery;
        delete payload.openTime;
        delete payload.closeTime;
        delete payload.slotMinutes;
        delete payload.portalBookingPaymentMode;
        delete payload.depositAmountBaht;
        if (!supportsUploadedPromptPayQr) {
          delete payload.promptPayQrImageUrl;
        }
      }
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { profile?: ShopProfile; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.profile) {
        setForm({
          ...json.profile,
          slipPaperSize: json.profile.slipPaperSize ?? "SLIP_58",
          tagline: json.profile.tagline ?? null,
          contactLine: json.profile.contactLine ?? null,
          facebookUrl: json.profile.facebookUrl ?? null,
          mapUrl: json.profile.mapUrl ?? null,
          portalBannerUrl: json.profile.portalBannerUrl ?? null,
          portalGallery: json.profile.portalGallery ?? [],
          openTime: json.profile.openTime ?? "09:00",
          closeTime: json.profile.closeTime ?? "20:00",
          slotMinutes: barberNormalizeSlotMinutes(json.profile.slotMinutes ?? 30),
          portalBookingPaymentMode: normalizeBarberPortalPaymentMode(
            json.profile.portalBookingPaymentMode,
          ),
          depositAmountBaht: json.profile.depositAmountBaht ?? null,
          promptPayQrImageUrl: json.profile.promptPayQrImageUrl ?? null,
          payAmountPresetsRaw:
            json.profile.payAmountPresetsRaw ??
            formatBarberPayAmountPresetsInput(
              (json.profile.payAmountPresets ?? [...DEFAULT_BARBER_PAY_AMOUNT_PRESETS]).join(","),
            ),
        });
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="min-w-0">
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าร้าน"
          description={
            isBarber
              ? "พื้นฐาน · การเงิน · ลิงก์ลูกค้า · เวลาเปิดร้าน"
              : "พื้นฐาน · การเงิน · เวลาเปิดร้าน"
          }
          className="flex flex-row items-center justify-between gap-2 sm:gap-3"
          actionWrapClassName="shrink-0"
          action={
            tab === "hours" && !isBarber && hoursPanel ? null : (
            <div className={barberDashboardSegmentShellClass} role="group">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className={cn(barberDashboardSegmentBtnClass(true), "disabled:opacity-50")}
                aria-label={busy ? "กำลังบันทึก" : "บันทึกการตั้งค่า"}
                aria-busy={busy}
              >
                <IconSave className={cn("h-3.5 w-3.5 shrink-0", busy && "animate-pulse")} />
                <span className="hidden sm:inline">{busy ? "กำลังบันทึก…" : "บันทึก"}</span>
              </button>
            </div>
            )
          }
        />

        <div className="mt-3 w-full sm:hidden">
          <label htmlFor="barber-settings-menu-mobile" className="mb-1.5 block text-[11px] font-black text-[#4d47b6]">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="barber-settings-menu-mobile"
            value={tab}
            onChange={(e) => selectTab(e.target.value as SettingsTab)}
            className={barberMobileSelectClass}
            aria-label="กรุณาเลือกหมวดตั้งค่า"
          >
            {tabs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 hidden w-full sm:block">
          <nav className={barberPrimaryTabShellClass} aria-label="เมนูตั้งค่า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  id={`barber-settings-tab-${item.id}`}
                  aria-controls={`barber-settings-panel-${item.id}`}
                  onClick={() => selectTab(item.id)}
                  className={cn(barberPrimaryTabPillClass(tab === item.id), "grow-0 basis-auto")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-4 space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

          {tab === "basic" ? (
            <div id="barber-settings-panel-basic" role="tabpanel" aria-labelledby="barber-settings-tab-basic" className="space-y-3">
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
              {isBarber ? (
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-[#4d47b6]">สโลแกน</span>
                  <input
                    className="app-input mt-1 w-full rounded-xl"
                    value={form.tagline ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  />
                </label>
              ) : null}
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
            <div id="barber-settings-panel-finance" role="tabpanel" aria-labelledby="barber-settings-tab-finance" className="space-y-3">
              {isBarber ? (
                <div className="rounded-2xl border border-white/60 bg-white/40 p-3 sm:p-4">
                  <p className="text-xs font-bold text-[#4d47b6]">ชำระตอนจองจากลิงก์ลูกค้า</p>
                  <div
                    className={cn(barberPrimaryTabShellClass, "mt-2 flex flex-wrap gap-1.5")}
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
                        className={barberPrimaryTabPillClass(form.portalBookingPaymentMode === opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.portalBookingPaymentMode === "DEPOSIT" ? (
                    <label className="mt-3 block space-y-1">
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
              ) : null}

              <AppModuleShopPaymentFields
                value={form}
                onChange={(payment) => setForm((f) => ({ ...f, ...payment }))}
              />

              {supportsUploadedPromptPayQr ? (
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
                        className="h-28 w-28 rounded-xl border border-white object-contain bg-white p-1 shadow-sm"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-xs font-bold text-rose-700")}
                        onClick={() => setForm((f) => ({ ...f, promptPayQrImageUrl: null }))}
                      >
                        ลบรูป QR
                      </button>
                    </div>
                  ) : null}
                  <label className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 cursor-pointer items-center rounded-xl px-4 text-sm font-bold")}>
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
                            const res = await fetch(`${apiBase}/upload-promptpay-qr`, {
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

              {isBarber ? (
                <div className="space-y-2 rounded-2xl border border-[#ecebff] bg-[#faf9ff]/80 p-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">ปุ่มลัดยอดรับชำระ (บาท)</span>
                    <input
                      className="app-input mt-1 w-full rounded-xl font-semibold tabular-nums"
                      value={form.payAmountPresetsRaw}
                      onChange={(e) => setForm((f) => ({ ...f, payAmountPresetsRaw: e.target.value }))}
                      placeholder="80, 100, 120, 150"
                      inputMode="numeric"
                      aria-describedby="barber-pay-presets-hint"
                    />
                  </label>
                  <p id="barber-pay-presets-hint" className="text-[11px] font-semibold text-[#8b87b8]">
                    คั่นด้วยจุลภาค สูงสุด 8 ค่า — ใช้ในฟอร์ม «รับชำระ» และยังกรอกยอดเองได้
                  </p>
                  <div className="flex flex-wrap gap-1.5" aria-label="ตัวอย่างปุ่มลัด">
                    {presetPreview.map((n) => (
                      <span
                        key={n}
                        className={cn(barberPaymentChipIdleClass, "pointer-events-none tabular-nums")}
                      >
                        ฿{n.toLocaleString("th-TH")}
                      </span>
                    ))}
                    <span className={cn(barberPaymentChipActiveClass, "pointer-events-none")}>กรอกเอง</span>
                  </div>
                </div>
              ) : null}

              {isBarber ? (
                <AppStaffDailyPinSettingsField
                  pinSet={pinSet}
                  pinDraft={pinDraft}
                  onPinDraftChange={setPinDraft}
                  clearPin={clearPin}
                  onClearPinChange={setClearPin}
                  disabled={busy}
                />
              ) : null}

              <AppSlipPaperSizeSettingsField
                value={form.slipPaperSize}
                onChange={(slipPaperSize) => setForm((f) => ({ ...f, slipPaperSize }))}
                disabled={busy}
              />
            </div>
          ) : null}

          {tab === "portal" && isBarber ? (
            <div
              id="barber-settings-panel-portal"
              role="tabpanel"
              aria-labelledby="barber-settings-tab-portal"
              className="space-y-4"
            >
              {ownerId && trialSessionId ? (
                <BarberPortalLinkPanel
                  ownerId={ownerId}
                  trialSessionId={trialSessionId}
                  onGoToQr={() => selectTab("link")}
                />
              ) : null}
              <BarberPortalMediaSettings
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
                disabled={busy}
              />
            </div>
          ) : null}

          {tab === "hours" && isBarber ? (
            <div
              id="barber-settings-panel-hours"
              role="tabpanel"
              aria-labelledby="barber-settings-tab-hours"
              className="space-y-3 rounded-2xl border border-[#ecebff] bg-[#faf9ff]/80 p-3"
            >
              <p className="text-xs font-bold text-[#4d47b6]">เวลาเปิด–ปิด · สล็อตจอง (เวลาไทย)</p>
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
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ความยาวสล็อต (นาที)</span>
                <select
                  className="app-input mt-1 w-full rounded-xl"
                  value={form.slotMinutes}
                  disabled={busy}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slotMinutes: barberNormalizeSlotMinutes(Number(e.target.value)),
                    }))
                  }
                >
                  <option value={30}>30 นาที</option>
                  <option value={60}>60 นาที</option>
                </select>
              </label>
            </div>
          ) : null}

          {tab === "hours" && !isBarber && hoursPanel ? (
            <div
              id="barber-settings-panel-hours"
              role="tabpanel"
              aria-labelledby="barber-settings-tab-hours"
              className="min-w-0"
            >
              {hoursPanel}
            </div>
          ) : null}

          {tab === "link" && isBarber && ownerId && trialSessionId && linkHub ? (
            <div
              id="barber-settings-panel-link"
              role="tabpanel"
              aria-labelledby="barber-settings-tab-link"
            >
              <BarberQrHubClient
                embedded
                ownerId={ownerId}
                shopLabel={linkHub.shopLabel}
                logoUrl={linkHub.logoUrl}
                baseUrl={linkHub.baseUrl}
                trialExportBlocked={linkHub.trialExportBlocked}
                isTrialSandbox={linkHub.isTrialSandbox}
                trialSessionId={trialSessionId}
              />
            </div>
          ) : null}
        </div>
      </AppDashboardSection>
    </div>
  );
}

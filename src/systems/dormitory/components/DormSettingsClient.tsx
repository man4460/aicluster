"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppModuleShopPaymentFields,
  AppSectionHeader,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  appTemplateOutlineButtonClass,
  staffDailyPinPatchBody,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";
import { dormitoryPublicPortalUrl } from "@/lib/dormitory/public-url";
import { DormGuestPortalHubClient } from "@/systems/dormitory/components/DormGuestPortalHubClient";
import { DormPortalMediaSettings } from "@/systems/dormitory/components/DormPortalMediaSettings";
import {
  dormFieldClass,
  dormFormLabelClass,
  dormMobileSelectClass,
  dormPrimaryTabPillClass,
  dormPrimaryTabShellClass,
  dormSectionRadiusClass,
} from "@/systems/dormitory/lib/ui-tokens";
import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";

export type DormProfileDto = {
  displayName: string | null;
  managerName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  defaultPaperSize: AppSlipPaperSize;
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
  autoGenerateBills?: boolean;
  staffDailyPinSet?: boolean;
};

type SettingsTab = "basic" | "finance" | "portal" | "links";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "links", label: "ลิงก์ / QR" },
];

function parseSettingsTab(raw: string | null): SettingsTab {
  if (raw === "finance" || raw === "portal" || raw === "links") return raw;
  return "basic";
}

function DormPortalLinkPanel({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const portalPath = useMemo(
    () => dormitoryPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(portalPath));
      setCopyMsg("คัดลอกลิงก์เว็บหอพักแล้ว");
    } catch {
      setCopyMsg("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <ModuleQrMonthlyGate moduleSlug={DORMITORY_MODULE_SLUG} title="ตั้งค่าเว็ปลิงค์ลูกค้า">
    <div className="space-y-4 text-left">
      <p className="text-sm text-[#66638c]">
        ลิงก์สาธารณะให้ผู้เช่าดูห้องว่าง · ติดต่อสอบถาม · QR โปสเตอร์ด้านล่าง
      </p>
      {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
      <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#4d47b6]">เว็บหอพัก (ลูกค้า)</p>
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
        </div>
      </div>
    </div>
    </ModuleQrMonthlyGate>
  );
}

export function DormSettingsClient({
  initial,
  ownerId,
  trialSessionId,
  baseUrl,
  dormLabel,
  logoUrl = null,
  trialExportBlocked = false,
}: {
  initial: DormProfileDto;
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  dormLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.5rem] bg-white/30" aria-busy />}>
      <DormSettingsClientInner
        initial={initial}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        baseUrl={baseUrl}
        dormLabel={dormLabel}
        logoUrl={logoUrl}
        trialExportBlocked={trialExportBlocked}
      />
    </Suspense>
  );
}

function DormSettingsClientInner({
  initial,
  ownerId,
  trialSessionId,
  baseUrl,
  dormLabel,
  logoUrl = null,
  trialExportBlocked = false,
}: {
  initial: DormProfileDto;
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  dormLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));
  const [form, setForm] = useState({ ...initial, staffDailyPinSet: initial.staffDailyPinSet ?? false });
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTab(parseSettingsTab(searchParams.get("tab")));
  }, [searchParams]);

  const save = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/dorm/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          portalGallery: form.portalGallery,
          ...staffDailyPinPatchBody({ pinDraft, clearPin }),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { profile?: DormProfileDto; error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      if (j.profile) {
        setForm({ ...j.profile, staffDailyPinSet: j.profile.staffDailyPinSet ?? false });
        setPinDraft("");
        setClearPin(false);
      }
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [form, pinDraft, clearPin]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className={dormSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าหอพัก"
          description="พื้นฐาน · การเงิน · เว็บลูกค้า · ลิงก์ / QR"
        />

        <div className="mt-3 w-full sm:hidden">
          <label htmlFor="dorm-settings-menu-mobile" className="mb-1.5 block text-[11px] font-black text-[#4d47b6]">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="dorm-settings-menu-mobile"
            value={tab}
            onChange={(e) => setTab(e.target.value as SettingsTab)}
            className={dormMobileSelectClass}
            aria-label="กรุณาเลือกหมวดตั้งค่า"
          >
            {SETTINGS_TABS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 hidden w-full sm:block">
          <nav className={dormPrimaryTabShellClass} aria-label="เมนูตั้งค่า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {SETTINGS_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  id={`dorm-settings-tab-${item.id}`}
                  aria-controls={`dorm-settings-panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={cn(dormPrimaryTabPillClass(tab === item.id), "grow-0 basis-auto")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}
        {msg ? <p className="mt-3 text-sm font-semibold text-emerald-700">{msg}</p> : null}

        {tab === "basic" ? (
          <div
            id="dorm-settings-panel-basic"
            role="tabpanel"
            aria-labelledby="dorm-settings-tab-basic"
            className="mt-4 space-y-3 text-left"
          >
            <AppShopLogoField
              logoUrl={form.logoUrl}
              fallbackLabel={form.displayName ?? "หอพัก"}
              uploadUrl="/api/dorm/profile/logo"
              onLogoUrlChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
            />
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>ชื่อหอพัก</span>
              <input
                className={cn(dormFieldClass, "mt-1")}
                value={form.displayName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>ชื่อผู้ดูแล / ผู้จัดการ</span>
              <input
                className={cn(dormFieldClass, "mt-1")}
                value={form.managerName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>คำโปรย (เว็บลูกค้า)</span>
              <input
                className={cn(dormFieldClass, "mt-1")}
                value={form.tagline ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>เบอร์ติดต่อ</span>
              <input
                className={cn(dormFieldClass, "mt-1")}
                value={form.caretakerPhone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, caretakerPhone: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>ที่อยู่</span>
              <textarea
                className={cn(dormFieldClass, "mt-1 min-h-[72px]")}
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>เลขประจำตัวผู้เสียภาษี</span>
              <input
                className={cn(dormFieldClass, "mt-1")}
                value={form.taxId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div
            id="dorm-settings-panel-finance"
            role="tabpanel"
            aria-labelledby="dorm-settings-tab-finance"
            className="mt-4 space-y-4 text-left"
          >
            <AppModuleShopPaymentFields
              value={{
                promptPayPhone: form.promptPayPhone,
                promptPayQrImageUrl: null,
                bankName: form.bankName,
                bankAccountNumber: form.bankAccountNumber,
                bankAccountName: form.bankAccountName,
                taxId: form.taxId,
              }}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  promptPayPhone: next.promptPayPhone ?? null,
                  bankName: next.bankName ?? null,
                  bankAccountNumber: next.bankAccountNumber ?? null,
                  bankAccountName: next.bankAccountName ?? null,
                  taxId: next.taxId ?? null,
                }))
              }
              fieldClassName={dormFieldClass}
            />
            <label className="block space-y-1">
              <span className={dormFormLabelClass}>หมายเหตุช่องทางชำระ (ใบแจ้งหนี้)</span>
              <textarea
                className={cn(dormFieldClass, "min-h-[72px]")}
                value={form.paymentChannelsNote ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, paymentChannelsNote: e.target.value }))}
              />
            </label>
            <AppSlipPaperSizeSettingsField
              fieldClassName={dormFieldClass}
              hint="ใช้ตอนพิมพ์ใบแจ้งหนี้ / ใบเสร็จหอพัก"
              value={form.defaultPaperSize}
              onChange={(next) => setForm((f) => ({ ...f, defaultPaperSize: next }))}
              disabled={busy}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-3 shadow-sm ring-1 ring-emerald-100/80">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4d47b6] focus:ring-[#4d47b6]/30"
                checked={form.autoGenerateBills ?? true}
                onChange={(e) => setForm((f) => ({ ...f, autoGenerateBills: e.target.checked }))}
                disabled={busy}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">สร้างบิลอัตโนมัติ</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                  เมื่อเปิด ระบบจะสร้างบิลเดือนปัจจุบัน (เวลาไทย) ให้ห้องที่มีผู้พัก — พกเลขมิเตอร์จากงวดก่อน
                  (ใช้น้ำไฟ = 0 จนกว่าจะแก้) แล้วแบ่งค่าเช่า · ไม่ทับบิลที่มีอยู่แล้ว · ทำงานตอนเปิดแดชบอร์ด/รายการห้อง และผ่าน cron
                </span>
              </span>
            </label>
            <AppStaffDailyPinSettingsField
              pinDraft={pinDraft}
              clearPin={clearPin}
              pinSet={form.staffDailyPinSet ?? false}
              onPinDraftChange={setPinDraft}
              onClearPinChange={setClearPin}
              fieldClassName={dormFieldClass}
            />
          </div>
        ) : null}

        {tab === "portal" ? (
          <div
            id="dorm-settings-panel-portal"
            role="tabpanel"
            aria-labelledby="dorm-settings-tab-portal"
            className="mt-4 space-y-4 text-left"
          >
            <DormPortalMediaSettings
              bannerUrl={form.portalBannerUrl ?? ""}
              gallery={form.portalGallery ?? []}
              address={form.address ?? ""}
              facebookUrl={form.facebookUrl ?? ""}
              mapUrl={form.mapUrl ?? ""}
              contactLine={form.contactLine ?? ""}
              onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url }))}
              onGalleryChange={(portalGallery) => setForm((f) => ({ ...f, portalGallery }))}
              onAddressChange={(address) => setForm((f) => ({ ...f, address }))}
              onFacebookUrlChange={(facebookUrl) => setForm((f) => ({ ...f, facebookUrl }))}
              onMapUrlChange={(mapUrl) => setForm((f) => ({ ...f, mapUrl }))}
              onContactLineChange={(contactLine) => setForm((f) => ({ ...f, contactLine }))}
              disabled={busy}
            />
          </div>
        ) : null}

        {tab === "links" ? (
          <div
            id="dorm-settings-panel-links"
            role="tabpanel"
            aria-labelledby="dorm-settings-tab-links"
            className="mt-4 space-y-4 text-left"
          >
            <DormPortalLinkPanel ownerId={ownerId} trialSessionId={trialSessionId} />
            <DormGuestPortalHubClient
              ownerId={ownerId}
              trialSessionId={trialSessionId}
              baseUrl={baseUrl}
              dormLabel={dormLabel}
              logoUrl={logoUrl}
              trialExportBlocked={trialExportBlocked}
              initialPortalBannerUrl={form.portalBannerUrl}
              initialPortalGallery={form.portalGallery ?? []}
              initialAddress={form.address ?? ""}
              initialContactLine={form.contactLine ?? ""}
              initialFacebookUrl={form.facebookUrl ?? ""}
              initialMapUrl={form.mapUrl ?? ""}
              embedded
            />
          </div>
        ) : null}

        {tab !== "links" ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className={cn(dormBtnPrimary, "min-h-11 px-5")}
            >
              {busy ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
            </button>
          </div>
        ) : null}
      </AppDashboardSection>
    </div>
  );
}

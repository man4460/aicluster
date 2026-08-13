"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppModuleShopSettingsClient,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import type { ModuleShopBrandingDto } from "@/lib/module-shop/slugs";
import { carWashPublicCheckInUrl, carWashPublicPortalUrl } from "@/lib/car-wash/public-url";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { CarWashShopHoursPanel } from "@/systems/car-wash/CarWashShopHoursPanel";
import { CarWashPortalMediaSettings } from "@/systems/car-wash/CarWashPortalMediaSettings";
import { CarWashBookingPaymentSettings } from "@/systems/car-wash/CarWashBookingPaymentSettings";
import {
  carWashMobileSelectClass,
  carWashPrimaryTabPillClass,
  carWashPrimaryTabShellClass,
} from "@/systems/car-wash/car-wash-ui-tokens";

export type CarWashPortalMediaDto = {
  address: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
};

type SettingsTab = "basic" | "finance" | "portal" | "hours";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "hours", label: "ตั้งค่าเวลาเปิดร้าน" },
];

const SETTINGS_TAB_KEYS = new Set<string>(SETTINGS_TABS.map((t) => t.id));

function parseSettingsTab(raw: string | null): SettingsTab {
  if (raw && SETTINGS_TAB_KEYS.has(raw)) return raw as SettingsTab;
  return "basic";
}

function CarWashPortalLinkPanel({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const portalPath = useMemo(
    () => carWashPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );
  const checkInPath = useMemo(
    () => carWashPublicCheckInUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async (path: string, label: string) => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(path));
      setCopyMsg(`คัดลอก${label}แล้ว`);
    } catch {
      setCopyMsg("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4 text-left">
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
            onClick={() => void copy(portalPath, "ลิงก์จอง")}
            className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold"
          >
            คัดลอกลิงก์
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#4d47b6]">ลิงก์เช็คอิน</p>
        <p className="break-all text-sm font-semibold text-[#1e1b4b]">{checkInPath}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={checkInPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-4 text-sm font-bold")}
          >
            เปิดลิงก์
          </a>
          <button
            type="button"
            onClick={() => void copy(checkInPath, "ลิงก์เช็คอิน")}
            className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold"
          >
            คัดลอกลิงก์
          </button>
        </div>
      </div>

      <Link
        href="/dashboard/car-wash?tab=qr"
        className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold")}
      >
        ไปหน้า QR / โปสเตอร์
      </Link>
    </div>
  );
}

function CarWashPortalMediaPanel({ initial }: { initial: CarWashPortalMediaDto }) {
  const [form, setForm] = useState({
    address: initial.address ?? "",
    contactLine: initial.contactLine ?? "",
    facebookUrl: initial.facebookUrl ?? "",
    mapUrl: initial.mapUrl ?? "",
    portalBannerUrl: initial.portalBannerUrl ?? "",
    portalGallery: initial.portalGallery ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/car-wash/session/portal-media", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address.trim() || null,
          contactLine: form.contactLine.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
          mapUrl: form.mapUrl.trim() || null,
          portalBannerUrl: form.portalBannerUrl.trim() || null,
          portalGallery: form.portalGallery,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        portal?: CarWashPortalMediaDto;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.portal) {
        setForm({
          address: data.portal.address ?? "",
          contactLine: data.portal.contactLine ?? "",
          facebookUrl: data.portal.facebookUrl ?? "",
          mapUrl: data.portal.mapUrl ?? "",
          portalBannerUrl: data.portal.portalBannerUrl ?? "",
          portalGallery: data.portal.portalGallery ?? [],
        });
      }
      setMsg("บันทึกสื่อและลิงก์ลูกค้าแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
      <CarWashPortalMediaSettings
        bannerUrl={form.portalBannerUrl}
        gallery={form.portalGallery}
        address={form.address}
        facebookUrl={form.facebookUrl}
        mapUrl={form.mapUrl}
        contactLine={form.contactLine}
        onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url }))}
        onGalleryChange={(portalGallery) => setForm((f) => ({ ...f, portalGallery }))}
        onAddressChange={(address) => setForm((f) => ({ ...f, address }))}
        onFacebookUrlChange={(facebookUrl) => setForm((f) => ({ ...f, facebookUrl }))}
        onMapUrlChange={(mapUrl) => setForm((f) => ({ ...f, mapUrl }))}
        onContactLineChange={(contactLine) => setForm((f) => ({ ...f, contactLine }))}
        disabled={busy}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
      >
        {busy ? "กำลังบันทึก…" : "บันทึกสื่อและลิงก์"}
      </button>
    </div>
  );
}

export function CarWashSettingsClient({
  initial,
  initialPortal,
  ownerId,
  trialSessionId,
  initialDateKey,
}: {
  initial: ModuleShopBrandingDto;
  initialPortal: CarWashPortalMediaDto;
  ownerId: string;
  trialSessionId: string;
  initialDateKey?: string;
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.5rem] bg-white/30" aria-busy />}>
      <CarWashSettingsClientInner
        initial={initial}
        initialPortal={initialPortal}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        initialDateKey={initialDateKey}
      />
    </Suspense>
  );
}

function CarWashSettingsClientInner({
  initial,
  initialPortal,
  ownerId,
  trialSessionId,
  initialDateKey,
}: {
  initial: ModuleShopBrandingDto;
  initialPortal: CarWashPortalMediaDto;
  ownerId: string;
  trialSessionId: string;
  initialDateKey?: string;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));
  const [branding, setBranding] = useState(initial);
  const hoursDateKey = initialDateKey ?? bangkokDateKey();
  const base = `/api/module-shop/${CAR_WASH_MODULE_SLUG}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="min-w-0">
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าร้าน"
          description="พื้นฐาน · การเงิน · ลิงก์ลูกค้า · เวลาเปิดร้าน"
        />

        <div className="mt-3 w-full sm:hidden">
          <label htmlFor="cw-settings-menu-mobile" className="mb-1.5 block text-[11px] font-black text-[#4d47b6]">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="cw-settings-menu-mobile"
            value={tab}
            onChange={(e) => setTab(e.target.value as SettingsTab)}
            className={carWashMobileSelectClass}
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
          <nav className={carWashPrimaryTabShellClass} aria-label="เมนูตั้งค่า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {SETTINGS_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  id={`cw-settings-tab-${item.id}`}
                  aria-controls={`cw-settings-panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={cn(carWashPrimaryTabPillClass(tab === item.id), "grow-0 basis-auto")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-4 space-y-4">
          {tab === "basic" ? (
            <div id="cw-settings-panel-basic" role="tabpanel" aria-labelledby="cw-settings-tab-basic">
              <AppModuleShopSettingsClient
                embedded
                title="ตั้งค่าพื้นฐาน"
                description="ชื่อร้าน · โลโก้ · คำโปรย · เบอร์ติดต่อ"
                initial={branding}
                profileApiUrl={`${base}/branding`}
                uploadLogoApiUrl={`${base}/upload-logo`}
                displayNameLabel="ชื่อร้านคาร์แคร์"
                showBasicFields
                showPaymentFields={false}
                showSlipPaperSizeSettings={false}
                showStaffDailyPinSettings
                onSaved={setBranding}
              />
            </div>
          ) : null}

          {tab === "finance" ? (
            <div id="cw-settings-panel-finance" role="tabpanel" aria-labelledby="cw-settings-tab-finance" className="space-y-5">
              <CarWashBookingPaymentSettings />
              <AppModuleShopSettingsClient
                embedded
                title="ตั้งค่าเกี่ยวกับการเงิน"
                description="ช่องทางชำระ · ขนาดสลิปใบเสร็จ"
                initial={branding}
                profileApiUrl={`${base}/branding`}
                uploadLogoApiUrl={`${base}/upload-logo`}
                showBasicFields={false}
                showPaymentFields
                showSlipPaperSizeSettings
                onSaved={setBranding}
              />
            </div>
          ) : null}

          {tab === "portal" ? (
            <div
              id="cw-settings-panel-portal"
              role="tabpanel"
              aria-labelledby="cw-settings-tab-portal"
              className="space-y-5"
            >
              <CarWashPortalLinkPanel ownerId={ownerId} trialSessionId={trialSessionId} />
              <CarWashPortalMediaPanel initial={initialPortal} />
            </div>
          ) : null}

          {tab === "hours" ? (
            <div id="cw-settings-panel-hours" role="tabpanel" aria-labelledby="cw-settings-tab-hours">
              <CarWashShopHoursPanel initialDateKey={hoursDateKey} />
            </div>
          ) : null}
        </div>
      </AppDashboardSection>
    </div>
  );
}

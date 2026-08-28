"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  AppTime24Input,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { buildingPosPublicPortalUrl } from "@/lib/building-pos/public-url";
import {
  normalizeBuildingPosPortalPaymentMode,
  type BuildingPosPortalBookingPaymentMode,
} from "@/lib/building-pos/portal-booking";
import type { ModuleShopBrandingDto } from "@/lib/module-shop/slugs";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { BuildingPosDashboardClient } from "@/systems/building-pos/BuildingPosDashboardClient";
import { BuildingPosBookingPaymentSettings } from "@/systems/building-pos/components/BuildingPosBookingPaymentSettings";
import { BuildingPosLoyaltySettingsClient } from "@/systems/building-pos/components/BuildingPosLoyaltySettingsClient";
import { BuildingPosPortalMediaSettings } from "@/systems/building-pos/components/BuildingPosPortalMediaSettings";
import {
  buildingPosMobileSelectClass,
  buildingPosPrimaryTabPillClass,
  buildingPosPrimaryTabShellClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import type { BuildingPosSettingsTab } from "@/systems/building-pos/building-pos-nav";
import { ModuleShopSettingsPanel } from "@/systems/module-shop/ModuleShopSettingsPanel";

type SettingsTab = BuildingPosSettingsTab;

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "hours", label: "ตั้งค่าเวลาเปิดร้าน" },
  { id: "loyalty", label: "สะสมคะแนน" },
  { id: "link", label: "ลิงก์ QR" },
];

type ShopProfileForm = {
  address: string;
  contactLine: string;
  facebookUrl: string;
  mapUrl: string;
  portalBannerUrl: string;
  portalGallery: string[];
  openTime: string;
  closeTime: string;
  portalBookingPaymentMode: BuildingPosPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  depositPercent: number | null;
};

type ReviewRow = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
};

function parseTab(raw: string | null): SettingsTab {
  if (raw && TABS.some((t) => t.id === raw)) return raw as SettingsTab;
  return "basic";
}

export function BuildingPosSettingsClient({
  brandingInitial,
  ownerId,
  trialSessionId,
  isTrialSandbox,
  linkHub,
}: {
  brandingInitial: ModuleShopBrandingDto;
  ownerId: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    paymentChannelsNote: string | null;
  };
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.25rem] bg-white/30" aria-busy />}>
      <BuildingPosSettingsClientInner
        brandingInitial={brandingInitial}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        isTrialSandbox={isTrialSandbox}
        linkHub={linkHub}
      />
    </Suspense>
  );
}

function BuildingPosSettingsClientInner({
  brandingInitial,
  ownerId,
  trialSessionId,
  isTrialSandbox,
  linkHub,
}: {
  brandingInitial: ModuleShopBrandingDto;
  ownerId: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    paymentChannelsNote: string | null;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseTab(searchParams.get("tab")));
  const [form, setForm] = useState<ShopProfileForm>({
    address: "",
    contactLine: "",
    facebookUrl: "",
    mapUrl: "",
    portalBannerUrl: "",
    portalGallery: [],
    openTime: "10:00",
    closeTime: "22:00",
    portalBookingPaymentMode: "NONE",
    depositAmountBaht: null,
    depositPercent: null,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const portalPath = useMemo(
    () => buildingPosPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "qr") {
      router.replace(`${window.location.pathname}?tab=link`);
      return;
    }
    setTab(parseTab(raw));
  }, [searchParams, router]);

  useEffect(() => {
    void fetch("/api/building-pos/session/shop-profile", { credentials: "include" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          profile?: {
            address?: string | null;
            contactLine?: string | null;
            facebookUrl?: string | null;
            mapUrl?: string | null;
            portalBannerUrl?: string | null;
            portalGallery?: string[];
            openTime?: string;
            closeTime?: string;
            portalBookingPaymentMode?: string;
            depositAmountBaht?: number | null;
            depositPercent?: number | null;
          };
        };
        if (!res.ok || !j.profile) return;
        const p = j.profile;
        setForm({
          address: p.address ?? "",
          contactLine: p.contactLine ?? "",
          facebookUrl: p.facebookUrl ?? "",
          mapUrl: p.mapUrl ?? "",
          portalBannerUrl: p.portalBannerUrl ?? "",
          portalGallery: p.portalGallery ?? [],
          openTime: p.openTime ?? "10:00",
          closeTime: p.closeTime ?? "22:00",
          portalBookingPaymentMode: normalizeBuildingPosPortalPaymentMode(p.portalBookingPaymentMode),
          depositAmountBaht: p.depositAmountBaht ?? null,
          depositPercent: p.depositPercent ?? null,
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tab !== "portal") return;
    void fetch("/api/building-pos/session/reviews", { credentials: "include" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as { reviews?: ReviewRow[] };
        if (res.ok && j.reviews) setReviews(j.reviews);
      })
      .catch(() => undefined);
  }, [tab]);

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  const saveProfile = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/building-pos/session/shop-profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address || null,
          contactLine: form.contactLine || null,
          facebookUrl: form.facebookUrl || null,
          mapUrl: form.mapUrl || null,
          portalBannerUrl: form.portalBannerUrl || null,
          portalGallery: form.portalGallery,
          openTime: form.openTime,
          closeTime: form.closeTime,
          portalBookingPaymentMode: form.portalBookingPaymentMode,
          depositAmountBaht: form.depositAmountBaht,
          depositPercent: form.depositPercent,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const toggleReview = async (id: string, isPublished: boolean) => {
    const res = await fetch("/api/building-pos/session/reviews", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished }),
    });
    const j = (await res.json().catch(() => ({}))) as { review?: ReviewRow; error?: string };
    if (!res.ok || !j.review) return;
    setReviews((rows) => rows.map((r) => (r.id === id ? j.review! : r)));
  };

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <AppDashboardSection className="!rounded-[1.25rem]">
      <AppSectionHeader
        title="ตั้งค่าร้าน"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          tab === "portal" || tab === "hours" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveProfile()}
              className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-60"
            >
              บันทึก
            </button>
          ) : null
        }
      />

      <div className="mt-3 space-y-2 sm:hidden">
        <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="bpos-settings-tab">
          กรุณาเลือกหมวดตั้งค่า
        </label>
        <select
          id="bpos-settings-tab"
          className={buildingPosMobileSelectClass}
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
        <nav className={buildingPosPrimaryTabShellClass} role="tablist" aria-label="หมวดตั้งค่า">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={buildingPosPrimaryTabPillClass(tab === t.id)}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {msg ? <p className="mt-3 text-sm font-semibold text-emerald-700">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}

      <div className="mt-4" role="tabpanel">
        {tab === "basic" ? (
          <ModuleShopSettingsPanel
            moduleSlug={BUILDING_POS_MODULE_SLUG}
            initial={brandingInitial}
            embedded
            showBasicFields
            showPaymentFields={false}
            showSlipPaperSizeSettings={false}
            showOrderTicketSlipPaperSize={false}
            showStaffDailyPinSettings={false}
          />
        ) : null}

        {tab === "finance" ? (
          <ModuleShopSettingsPanel
            moduleSlug={BUILDING_POS_MODULE_SLUG}
            initial={brandingInitial}
            embedded
            showBasicFields={false}
            showPaymentFields
            showSlipPaperSizeSettings
            showOrderTicketSlipPaperSize
            showStaffDailyPinSettings
          />
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
                  className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold")}
                  onClick={() => selectTab("link")}
                >
                  ไปหน้า QR
                </button>
              </div>
            </div>

            <BuildingPosBookingPaymentSettings
              portalBookingPaymentMode={form.portalBookingPaymentMode}
              depositAmountBaht={form.depositAmountBaht}
              depositPercent={form.depositPercent}
              onPaymentModeChange={(m) => setForm((f) => ({ ...f, portalBookingPaymentMode: m }))}
              onDepositAmountChange={(v) => setForm((f) => ({ ...f, depositAmountBaht: v }))}
              onDepositPercentChange={(v) => setForm((f) => ({ ...f, depositPercent: v }))}
              disabled={busy}
            />

            <BuildingPosPortalMediaSettings
              bannerUrl={form.portalBannerUrl}
              gallery={form.portalGallery}
              address={form.address}
              facebookUrl={form.facebookUrl}
              mapUrl={form.mapUrl}
              contactLine={form.contactLine}
              onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url }))}
              onGalleryChange={(urls) => setForm((f) => ({ ...f, portalGallery: urls }))}
              onAddressChange={(v) => setForm((f) => ({ ...f, address: v }))}
              onFacebookUrlChange={(v) => setForm((f) => ({ ...f, facebookUrl: v }))}
              onMapUrlChange={(v) => setForm((f) => ({ ...f, mapUrl: v }))}
              onContactLineChange={(v) => setForm((f) => ({ ...f, contactLine: v }))}
              disabled={busy}
            />

            <div className="rounded-2xl border border-[#ecebff] bg-white/70 p-3 sm:p-4">
              <p className="text-xs font-bold text-[#4d47b6]">รีวิว</p>
              <ul className="mt-3 space-y-2">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#ecebff] bg-[#faf9ff]/80 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#1e1b4b]">
                        {r.guestName} · ★{r.rating}
                        {!r.isPublished ? (
                          <span className="ml-2 text-xs font-bold text-amber-700">ซ่อน</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-[#5f5a8a]">{r.comment}</p>
                    </div>
                    <button
                      type="button"
                      className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
                      onClick={() => void toggleReview(r.id, !r.isPublished)}
                    >
                      {r.isPublished ? "ซ่อน" : "เผยแพร่"}
                    </button>
                  </li>
                ))}
                {reviews.length === 0 ? (
                  <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีรีวิว</p>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "hours" ? (
          <div className="grid max-w-lg gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-[#4d47b6]">เปิด</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.openTime}
                  onChange={(v) => setForm((f) => ({ ...f, openTime: v }))}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#4d47b6]">ปิด</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.closeTime}
                  onChange={(v) => setForm((f) => ({ ...f, closeTime: v }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "loyalty" ? <BuildingPosLoyaltySettingsClient /> : null}

        {tab === "link" ? (
          <BuildingPosDashboardClient
            linkOnly
            ownerId={ownerId}
            trialSessionId={trialSessionId}
            isTrialSandbox={isTrialSandbox}
            baseUrl={linkHub.baseUrl}
            shopLabel={linkHub.shopLabel}
            logoUrl={linkHub.logoUrl}
            paymentChannelsNote={linkHub.paymentChannelsNote}
          />
        ) : null}
      </div>
    </AppDashboardSection>
  );
}

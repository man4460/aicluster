"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  AppTime24Input,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { cn } from "@/lib/cn";
import { drinkPosPublicPortalUrl } from "@/lib/drink-pos/public-url";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";
import { DrinkPosLoyaltyHubClient } from "@/systems/drink-pos/components/DrinkPosLoyaltyHubClient";
import { DrinkPosLoyaltySettingsClient } from "@/systems/drink-pos/components/DrinkPosLoyaltySettingsClient";
import { DrinkPosPortalMediaSettings } from "@/systems/drink-pos/components/DrinkPosPortalMediaSettings";
import {
  DrinkPosShopSettingsClient,
  type DrinkPosShopSettingsProfile,
} from "@/systems/drink-pos/components/DrinkPosShopSettingsClient";
import type { DrinkPosSettingsTab } from "@/systems/drink-pos/lib/drink-pos-module-nav";
import {
  drinkPosMobileSelectClass,
  drinkPosPrimaryTabPillClass,
  drinkPosPrimaryTabShellClass,
} from "@/systems/drink-pos/lib/ui-tokens";

type SettingsTab = DrinkPosSettingsTab;

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

export function DrinkPosSettingsClient({
  shopInitial,
  ownerId,
  trialSessionId,
  linkHub,
}: {
  shopInitial: DrinkPosShopSettingsProfile;
  ownerId: string;
  trialSessionId: string;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
    loyaltyEnabled: boolean;
    bahtPerPoint: number;
    pointsPerUnit: number;
  };
}) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.25rem] bg-white/30" aria-busy />}>
      <DrinkPosSettingsClientInner
        shopInitial={shopInitial}
        ownerId={ownerId}
        trialSessionId={trialSessionId}
        linkHub={linkHub}
      />
    </Suspense>
  );
}

function DrinkPosSettingsClientInner({
  shopInitial,
  ownerId,
  trialSessionId,
  linkHub,
}: {
  shopInitial: DrinkPosShopSettingsProfile;
  ownerId: string;
  trialSessionId: string;
  linkHub: {
    baseUrl: string;
    shopLabel: string;
    logoUrl: string | null;
    trialExportBlocked: boolean;
    loyaltyEnabled: boolean;
    bahtPerPoint: number;
    pointsPerUnit: number;
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
    openTime: "08:00",
    closeTime: "20:00",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const portalPath = useMemo(
    () => drinkPosPublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "members") {
      router.replace(`${window.location.pathname}?tab=link`);
      return;
    }
    setTab(parseTab(raw));
  }, [searchParams, router]);

  useEffect(() => {
    void fetch("/api/drink-pos/profile", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          profile?: Partial<ShopProfileForm> & { portalGallery?: string[] };
        };
        const p = j.profile;
        if (!p) return;
        setForm({
          address: p.address ?? "",
          contactLine: p.contactLine ?? "",
          facebookUrl: p.facebookUrl ?? "",
          mapUrl: p.mapUrl ?? "",
          portalBannerUrl: p.portalBannerUrl ?? "",
          portalGallery: Array.isArray(p.portalGallery) ? p.portalGallery : [],
          openTime: p.openTime ?? "08:00",
          closeTime: p.closeTime ?? "20:00",
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tab !== "portal") return;
    void fetch("/api/drink-pos/session/reviews", { credentials: "include", cache: "no-store" })
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
      const res = await fetch("/api/drink-pos/profile", {
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
    const res = await fetch("/api/drink-pos/session/reviews", {
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
          tab === "hours" ? (
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
        <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="drink-pos-settings-tab">
          กรุณาเลือกหมวดตั้งค่า
        </label>
        <select
          id="drink-pos-settings-tab"
          className={drinkPosMobileSelectClass}
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
        <nav className={drinkPosPrimaryTabShellClass} role="tablist" aria-label="หมวดตั้งค่า">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`drink-pos-settings-panel-${t.id}`}
              id={`drink-pos-settings-tab-${t.id}`}
              className={drinkPosPrimaryTabPillClass(tab === t.id)}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {msg ? <p className="mt-3 text-sm font-semibold text-emerald-700">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}

      <div
        className="mt-4"
        role="tabpanel"
        id={`drink-pos-settings-panel-${tab}`}
        aria-labelledby={`drink-pos-settings-tab-${tab}`}
      >
        {tab === "basic" ? (
          <DrinkPosShopSettingsClient
            initial={shopInitial}
            embedded
            showBasicFields
            showPaymentFields={false}
          />
        ) : null}

        {tab === "finance" ? (
          <DrinkPosShopSettingsClient
            initial={shopInitial}
            embedded
            showBasicFields={false}
            showPaymentFields
          />
        ) : null}

        {tab === "portal" ? (
          <ModuleQrMonthlyGate moduleSlug={DRINK_POS_MODULE_SLUG} title="ตั้งค่าเว็ปลิงค์ลูกค้า">
            <div className="space-y-4">
              <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
                <p className="text-xs font-bold text-[#4d47b6]">ลิงก์เว็บลูกค้า</p>
                <p className="text-[11px] font-semibold text-[#8b87b8]">สั่งเครื่องดื่ม</p>
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

              <DrinkPosPortalMediaSettings
                bannerUrl={form.portalBannerUrl}
                gallery={form.portalGallery}
                address={form.address}
                facebookUrl={form.facebookUrl}
                mapUrl={form.mapUrl}
                contactLine={form.contactLine}
                onBannerUrlChange={(portalBannerUrl) => setForm((f) => ({ ...f, portalBannerUrl }))}
                onGalleryChange={(portalGallery) => setForm((f) => ({ ...f, portalGallery }))}
                onAddressChange={(address) => setForm((f) => ({ ...f, address }))}
                onFacebookUrlChange={(facebookUrl) => setForm((f) => ({ ...f, facebookUrl }))}
                onMapUrlChange={(mapUrl) => setForm((f) => ({ ...f, mapUrl }))}
                onContactLineChange={(contactLine) => setForm((f) => ({ ...f, contactLine }))}
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

              <button
                type="button"
                disabled={busy}
                onClick={() => void saveProfile()}
                className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-60"
              >
                {busy ? "กำลังบันทึก…" : "บันทึกเว็ปลิงค์ลูกค้า"}
              </button>
            </div>
          </ModuleQrMonthlyGate>
        ) : null}

        {tab === "hours" ? (
          <div className="grid max-w-lg gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-[#4d47b6]">เปิด (เวลาไทย)</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.openTime}
                  onChange={(openTime) => setForm((f) => ({ ...f, openTime }))}
                  selectClassName="h-11"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#4d47b6]">ปิด (เวลาไทย)</p>
              <div className="mt-1">
                <AppTime24Input
                  value={form.closeTime}
                  onChange={(closeTime) => setForm((f) => ({ ...f, closeTime }))}
                  selectClassName="h-11"
                />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "loyalty" ? <DrinkPosLoyaltySettingsClient embedded /> : null}

        {tab === "link" ? (
          <DrinkPosLoyaltyHubClient
            embedded
            ownerId={ownerId}
            trialSessionId={trialSessionId}
            baseUrl={linkHub.baseUrl}
            shopLabel={linkHub.shopLabel}
            logoUrl={linkHub.logoUrl}
            trialExportBlocked={linkHub.trialExportBlocked}
            loyaltyEnabled={linkHub.loyaltyEnabled}
            bahtPerPoint={linkHub.bahtPerPoint}
            pointsPerUnit={linkHub.pointsPerUnit}
          />
        ) : null}
      </div>
    </AppDashboardSection>
  );
}

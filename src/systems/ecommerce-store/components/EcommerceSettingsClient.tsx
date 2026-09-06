"use client";

import { useEffect, useState } from "react";
import {
  AppModuleShopPaymentFields,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  parseAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import { validateEcommerceCustomDomainInput } from "@/lib/ecommerce/custom-domain";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { EcommercePortalMediaSettings } from "@/systems/ecommerce-store/components/EcommercePortalMediaSettings";
import { EcommerceQrHubClient } from "@/systems/ecommerce-store/components/EcommerceQrHubClient";
import type { EcommerceStoreSettingsTab } from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  ecommerceStoreCompactOutlineButtonClass,
  ecommerceStoreDashboardSegmentBtnClass,
  ecommerceStoreFieldClass,
  ecommerceStoreHeaderActionShellClass,
  ecommerceStoreMobileSelectClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePanelDividerClass,
  ecommerceStorePanelSectionClass,
  ecommerceStoreSettingsHeaderTabShellClass,
  ecommerceStoreSettingsTabPillClass,
  ecommerceStoreSubtitleClass,
  ecommerceStoreTextareaClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Store = {
  id: string;
  storeName: string;
  description: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  logoUrl: string | null;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  taxId: string | null;
  paymentNote: string | null;
  slipPaperSize: AppSlipPaperSize;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  salePageEnabled: boolean;
  featuredProductId: string | null;
  merchantPaused: boolean;
  lowStockThreshold: number;
};

type ProductOption = { id: string; name: string };

const LOGO_UPLOAD_URL = "/api/ecommerce-store/session/upload-logo";

const SETTINGS_TABS: { id: EcommerceStoreSettingsTab; label: string; shortLabel: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { id: "portal", label: "ตั้งค่าเว็บไซต์", shortLabel: "เว็บไซต์" },
  { id: "link", label: "ลิงก์", shortLabel: "ลิงก์" },
];

const SETTINGS_TAB_DESCRIPTIONS: Record<EcommerceStoreSettingsTab, string> = {
  basic: "ชื่อร้าน · โลโก้ · สโลแกน · เบอร์ติดต่อ · ที่อยู่ · สต๊อก",
  finance: "ชำระเงิน · พร้อมเพย์ · ขนาดสลิป · หมายเหตุชำระ",
  portal: "LINE · Facebook · แผนที่ · โดเมน · Sale Page — ไม่มีลิงก์คัดลอก (อยู่แท็บลิงก์)",
  link: "ลิงก์เว็บไซต์ + พนักงาน — บล็อกสายรายวันทีเดียว",
};

const SETTINGS_TAB_KEYS = new Set<string>(SETTINGS_TABS.map((t) => t.id));

function parseSettingsTab(raw: string | null): EcommerceStoreSettingsTab {
  /** `staff` เดิมรวมเข้าแท็บลิงก์ */
  if (raw === "staff") return "link";
  if (raw && SETTINGS_TAB_KEYS.has(raw)) return raw as EcommerceStoreSettingsTab;
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

export function EcommerceSettingsClient() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState("");
  const [cnameTarget, setCnameTarget] = useState("app.ma-well.com");
  const [tab, setTab] = useState<EcommerceStoreSettingsTab>("basic");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTab(parseSettingsTab(params.get("tab")));
  }, []);

  useEffect(() => {
    void Promise.all([
      fetch("/api/ecommerce-store/session/store").then((r) => r.json()),
      fetch("/api/ecommerce-store/session/products").then((r) => r.json()),
    ]).then(([storeJ, prodJ]) => {
      const s = storeJ.store as Store | undefined;
      if (typeof storeJ.cnameTarget === "string" && storeJ.cnameTarget.trim()) {
        setCnameTarget(storeJ.cnameTarget.trim());
      }
      if (s) {
        setStore({
          ...s,
          slipPaperSize: parseAppSlipPaperSize(s.slipPaperSize),
          tagline: s.tagline ?? null,
          contactPhone: s.contactPhone ?? null,
          address: s.address ?? null,
          taxId: s.taxId ?? null,
          promptPayQrImageUrl: s.promptPayQrImageUrl ?? null,
          contactLine: s.contactLine ?? null,
          facebookUrl: s.facebookUrl ?? null,
          mapUrl: s.mapUrl ?? null,
        });
        setShopUrl(ecommercePublicShopUrl(s.id));
      }
      const list = (prodJ.products ?? []) as { id: string; name: string }[];
      setProducts(list.map((p) => ({ id: p.id, name: p.name })));
    });
  }, []);

  useEffect(() => {
    if (!store?.id) return;
    setShopUrl(ecommercePublicShopUrl(store.id, window.location.origin));
  }, [store?.id]);

  const selectTab = (next: EcommerceStoreSettingsTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  };

  const paymentValue: ModuleShopPaymentDto | null = store
    ? {
        promptPayPhone: store.promptPayPhone,
        promptPayQrImageUrl: store.promptPayQrImageUrl,
        bankName: store.bankName,
        bankAccountNumber: store.bankAccountNumber,
        bankAccountName: store.bankAccountName,
        taxId: store.taxId,
      }
    : null;

  async function save() {
    if (!store) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/ecommerce-store/session/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      const j = (await res.json().catch(() => ({}))) as { store?: Store; error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      if (j.store) {
        setStore({
          ...j.store,
          slipPaperSize: parseAppSlipPaperSize(j.store.slipPaperSize),
        });
      }
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    if (!store) return;
    const domainErr = validateEcommerceCustomDomainInput(store.customDomain ?? "");
    if (domainErr) {
      setErr(domainErr);
      return;
    }
    setVerifying(true);
    setMsg(null);
    setErr(null);
    try {
      const saveRes = await fetch("/api/ecommerce-store/session/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      const saveJ = (await saveRes.json().catch(() => ({}))) as { store?: Store; error?: string };
      if (!saveRes.ok) {
        setErr(saveJ.error ?? "บันทึกโดเมนไม่สำเร็จ — ลองกดบันทึกการตั้งค่าก่อน");
        return;
      }
      if (saveJ.store) {
        setStore({
          ...saveJ.store,
          slipPaperSize: parseAppSlipPaperSize(saveJ.store.slipPaperSize),
        });
      }

      const res = await fetch("/api/ecommerce-store/session/store/verify-domain", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { store?: Store; error?: string };
      if (res.ok && j.store) {
        setStore({
          ...j.store,
          slipPaperSize: parseAppSlipPaperSize(j.store.slipPaperSize),
        });
        setMsg("ยืนยันโดเมนแล้ว — ลูกค้าเข้า https://" + (j.store.customDomain ?? ""));
      } else {
        setErr(j.error ?? "ยืนยันไม่สำเร็จ");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function uploadPromptPayQr(file: File) {
    if (!store) return;
    setSaving(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(LOGO_UPLOAD_URL, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !json.imageUrl) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      setStore({ ...store, promptPayQrImageUrl: json.imageUrl });
      setMsg("อัปโหลด QR พร้อมเพย์แล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (!store || !paymentValue) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-100" aria-hidden />;
  }

  const customUrl =
    store.customDomainVerified && store.customDomain ? `https://${store.customDomain}` : null;
  const domainValidationErr = store.customDomain?.trim()
    ? validateEcommerceCustomDomainInput(store.customDomain)
    : null;

  return (
    <div className={ecommerceStorePanelClass}>
      <div className={ecommerceStorePanelSectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#1e1b4b] sm:text-lg">ตั้งค่าร้าน</h2>
            <p className={ecommerceStoreSubtitleClass}>{SETTINGS_TAB_DESCRIPTIONS[tab]}</p>
            <p className="mt-0.5 text-xs font-medium text-[#66638c] sm:hidden">
              {SETTINGS_TAB_DESCRIPTIONS[tab]}
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1 md:gap-1.5">
            <div className="hidden md:block">
              <nav
                className={ecommerceStoreSettingsHeaderTabShellClass}
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
                      id={`ecommerce-settings-tab-${item.id}`}
                      aria-controls={`ecommerce-settings-panel-${item.id}`}
                      title={item.label}
                      aria-label={item.label}
                      onClick={() => selectTab(item.id)}
                      className={ecommerceStoreSettingsTabPillClass(active)}
                    >
                      <span className="hidden xl:inline">{item.label}</span>
                      <span className="xl:hidden">{item.shortLabel}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className={ecommerceStoreHeaderActionShellClass} role="group" aria-label="บันทึกการตั้งค่า">
              {tab !== "link" ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className={cn(ecommerceStoreDashboardSegmentBtnClass(true), "disabled:opacity-50")}
                  aria-label={saving ? "กำลังบันทึก" : "บันทึกการตั้งค่า"}
                  aria-busy={saving}
                  title={saving ? "กำลังบันทึก…" : "บันทึก"}
                >
                  <IconSave className={cn("h-3.5 w-3.5 shrink-0", saving && "animate-pulse")} />
                  <span className="hidden sm:inline">{saving ? "กำลังบันทึก…" : "บันทึก"}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 w-full md:hidden">
          <label
            htmlFor="ecommerce-settings-menu-mobile"
            className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]"
          >
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="ecommerce-settings-menu-mobile"
            value={tab}
            onChange={(e) => selectTab(e.target.value as EcommerceStoreSettingsTab)}
            className={ecommerceStoreMobileSelectClass}
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

      <div className={cn(ecommerceStorePanelSectionClass, ecommerceStorePanelDividerClass)}>
        <div className="space-y-3 text-left">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

          {tab === "basic" ? (
            <div
              id="ecommerce-settings-panel-basic"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-basic"
              className="space-y-3"
            >
              <AppShopLogoField
                logoUrl={store.logoUrl}
                fallbackLabel={store.storeName || "ร้าน"}
                uploadUrl={LOGO_UPLOAD_URL}
                onLogoUrlChange={(url) => setStore({ ...store, logoUrl: url })}
                buttonClassName={ecommerceStoreCompactOutlineButtonClass}
              />
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้านออนไลน์</span>
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.storeName}
                  onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">สโลแกน</span>
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.tagline ?? ""}
                  onChange={(e) => setStore({ ...store, tagline: e.target.value })}
                  placeholder="สั้น ๆ ใต้ชื่อร้าน"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">เบอร์ติดต่อร้าน</span>
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.contactPhone ?? ""}
                  onChange={(e) => setStore({ ...store, contactPhone: e.target.value })}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ที่อยู่</span>
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.address ?? ""}
                  onChange={(e) => setStore({ ...store, address: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">รายละเอียดร้าน</span>
                <textarea
                  className={cn(ecommerceStoreTextareaClass, "mt-1")}
                  value={store.description ?? ""}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                  rows={3}
                />
              </label>

              <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <p className="text-xs font-bold text-[#4d47b6]">การดำเนินงานร้าน</p>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-[#4d47b6]">แจ้งเตือนสต๊อกต่ำกว่า</span>
                  <input
                    type="number"
                    min={0}
                    className={cn(ecommerceStoreFieldClass, "mt-1")}
                    value={store.lowStockThreshold}
                    onChange={(e) =>
                      setStore({ ...store, lowStockThreshold: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                  <input
                    type="checkbox"
                    checked={store.merchantPaused}
                    onChange={(e) => setStore({ ...store, merchantPaused: e.target.checked })}
                  />
                  ปิดรับออเดอร์ชั่วคราว
                </label>
              </div>
            </div>
          ) : null}

          {tab === "finance" ? (
            <div
              id="ecommerce-settings-panel-finance"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-finance"
              className="space-y-3"
            >
              <AppModuleShopPaymentFields
                value={paymentValue}
                onChange={(payment) =>
                  setStore({
                    ...store,
                    promptPayPhone: payment.promptPayPhone,
                    promptPayQrImageUrl: payment.promptPayQrImageUrl,
                    bankName: payment.bankName,
                    bankAccountNumber: payment.bankAccountNumber,
                    bankAccountName: payment.bankAccountName,
                    taxId: payment.taxId,
                  })
                }
                fieldClassName={cn(ecommerceStoreFieldClass, "mt-1")}
              />

              <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <p className="text-xs font-black text-[#4d47b6]">QR พร้อมเพย์ (อัปโหลดรูป)</p>
                <p className="text-[11px] font-semibold text-[#8b87b8]">
                  ทางเลือก — อัปโหลดภาพ QR จากแอปธนาคาร ถ้ามีรูปนี้ระบบจะแสดงรูปนี้แทนการสร้างจากเบอร์
                </p>
                {store.promptPayQrImageUrl ? (
                  <div className="flex flex-wrap items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={store.promptPayQrImageUrl}
                      alt="QR พร้อมเพย์ที่อัปโหลด"
                      className="h-28 w-28 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      className={cn(ecommerceStoreCompactOutlineButtonClass, "text-rose-700")}
                      onClick={() => setStore({ ...store, promptPayQrImageUrl: null })}
                    >
                      ลบรูป QR
                    </button>
                  </div>
                ) : null}
                <label className={cn(ecommerceStoreCompactOutlineButtonClass, "cursor-pointer")}>
                  {store.promptPayQrImageUrl ? "เปลี่ยนภาพ QR" : "เลือกภาพ QR พร้อมเพย์"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={saving}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void uploadPromptPayQr(f);
                    }}
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุชำระเงิน</span>
                <textarea
                  className={cn(ecommerceStoreTextareaClass, "mt-1")}
                  value={store.paymentNote ?? ""}
                  onChange={(e) => setStore({ ...store, paymentNote: e.target.value })}
                  rows={2}
                />
              </label>

              <AppSlipPaperSizeSettingsField
                value={store.slipPaperSize}
                onChange={(slipPaperSize) => setStore({ ...store, slipPaperSize })}
                disabled={saving}
                fieldClassName={cn(ecommerceStoreFieldClass, "mt-1")}
                className="rounded-lg border-slate-200/90 bg-slate-50/80 ring-0"
              />
            </div>
          ) : null}

          {tab === "portal" ? (
            <div
              id="ecommerce-settings-panel-portal"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-portal"
              className="space-y-4"
            >
              <p className="text-sm text-[#5f5a8a]">
                ตั้งค่าเนื้อหาเว็บไซต์ร้าน — ลิงก์คัดลอก/QR อยู่แท็บ «ลิงก์»
              </p>
              <EcommercePortalMediaSettings
                contactLine={store.contactLine ?? ""}
                facebookUrl={store.facebookUrl ?? ""}
                mapUrl={store.mapUrl ?? ""}
                onContactLineChange={(value) => setStore({ ...store, contactLine: value || null })}
                onFacebookUrlChange={(url) => setStore({ ...store, facebookUrl: url || null })}
                onMapUrlChange={(url) => setStore({ ...store, mapUrl: url || null })}
                disabled={saving}
              />

              <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <p className="text-sm font-bold text-[#1e1b4b]">Custom Domain</p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-[#66638c]">
                  <li>ใส่โดเมนของคุณเอง (เช่น shop.mybrand.com) — ไม่ใช้ *.ma-well.com</li>
                  <li>
                    ที่ DNS: สร้าง CNAME ชี้มา{" "}
                    <span className="font-semibold text-[#4d47b6]">{cnameTarget}</span>
                  </li>
                  <li>เมื่อ DNS พร้อม กด «ยืนยันโดเมน»</li>
                </ol>
                <input
                  className={ecommerceStoreFieldClass}
                  placeholder="shop.mybrand.com"
                  value={store.customDomain ?? ""}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      customDomain: e.target.value,
                      customDomainVerified: false,
                    })
                  }
                />
                {domainValidationErr ? (
                  <p className="text-xs text-rose-700">{domainValidationErr}</p>
                ) : store.customDomainVerified ? (
                  <p className="text-xs font-semibold text-emerald-700">
                    ยืนยันแล้ว — ลูกค้าเข้า {customUrl ?? store.customDomain}
                  </p>
                ) : store.customDomain?.trim() ? (
                  <p className="text-xs text-amber-700">
                    บันทึกโดเมนในช่องแล้ว — กด «ยืนยันโดเมน» เมื่อตั้ง CNAME แล้ว
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">ยังไม่ใส่โดเมน — ใช้ลิงก์ MAWELL ที่แท็บลิงก์ได้</p>
                )}
                <button
                  type="button"
                  disabled={verifying || !store.customDomain?.trim() || !!domainValidationErr}
                  onClick={() => void verifyDomain()}
                  className={ecommerceStoreOutlineButtonClass}
                >
                  {verifying ? "กำลังยืนยัน..." : "ยืนยันโดเมน"}
                </button>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4d47b6]">
                  <input
                    type="checkbox"
                    checked={store.salePageEnabled}
                    onChange={(e) => setStore({ ...store, salePageEnabled: e.target.checked })}
                  />
                  เปิดโหมด Sale Page (หน้าเดียว — เหมาะ TikTok/FB)
                </label>
                {store.salePageEnabled ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">สินค้าเด่น (Sale Page)</span>
                    <select
                      className={cn(ecommerceStoreFieldClass, "mt-1")}
                      value={store.featuredProductId ?? ""}
                      onChange={(e) =>
                        setStore({ ...store, featuredProductId: e.target.value || null })
                      }
                    >
                      <option value="">— เลือกสินค้า —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "link" ? (
            <div
              id="ecommerce-settings-panel-link"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-link"
              className="space-y-4"
            >
              <EcommerceQrHubClient
                shopUrl={shopUrl}
                storeId={store.id}
                storeName={store.storeName}
                logoUrl={store.logoUrl}
                salePageEnabled={store.salePageEnabled}
                featuredProductId={store.featuredProductId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

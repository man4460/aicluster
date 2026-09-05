"use client";

import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AppImagePickCameraButtons,
  prepareImageFileForUpload,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import { validateEcommerceCustomDomainInput } from "@/lib/ecommerce/custom-domain";
import { IconCopy } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import type { EcommerceStoreSettingsTab } from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
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
  logoUrl: string | null;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  paymentNote: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  salePageEnabled: boolean;
  featuredProductId: string | null;
  merchantPaused: boolean;
  lowStockThreshold: number;
};

type ProductOption = { id: string; name: string };

const SETTINGS_TABS: { id: EcommerceStoreSettingsTab; label: string; shortLabel: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า", shortLabel: "ลิงก์ลูกค้า" },
];

const SETTINGS_TAB_DESCRIPTIONS: Record<EcommerceStoreSettingsTab, string> = {
  basic: "ชื่อร้าน · โลโก้ · รายละเอียด · สต๊อก · ปิดรับออเดอร์",
  finance: "พร้อมเพย์ · บัญชีธนาคาร · หมายเหตุชำระเงิน",
  portal: "ลิงก์แชร์ · โดเมนส่วนตัว · Sale Page",
};

const SETTINGS_TAB_KEYS = new Set<string>(SETTINGS_TABS.map((t) => t.id));

function parseSettingsTab(raw: string | null): EcommerceStoreSettingsTab {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-[#4d47b6]">{label}</span>
      {children}
    </label>
  );
}

export function EcommerceSettingsClient() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState("");
  const [cnameTarget, setCnameTarget] = useState("app.ma-well.com");
  const [tab, setTab] = useState<EcommerceStoreSettingsTab>("basic");
  const logoGalleryRef = useRef<HTMLInputElement>(null);
  const logoCameraRef = useRef<HTMLInputElement>(null);

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
        setStore(s);
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

  async function save() {
    if (!store) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/ecommerce-store/session/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });
    setSaving(false);
    if (res.ok) {
      const j = await res.json();
      setStore(j.store);
      setMsg("บันทึกแล้ว");
    } else setMsg("บันทึกไม่สำเร็จ");
  }

  async function verifyDomain() {
    if (!store) return;
    const domainErr = validateEcommerceCustomDomainInput(store.customDomain ?? "");
    if (domainErr) {
      setMsg(domainErr);
      return;
    }
    setVerifying(true);
    setMsg(null);
    try {
      const saveRes = await fetch("/api/ecommerce-store/session/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      const saveJ = await saveRes.json();
      if (!saveRes.ok) {
        setMsg(saveJ.error ?? "บันทึกโดเมนไม่สำเร็จ — ลองกดบันทึกการตั้งค่าก่อน");
        return;
      }
      setStore(saveJ.store);

      const res = await fetch("/api/ecommerce-store/session/store/verify-domain", { method: "POST" });
      const j = await res.json();
      if (res.ok) {
        setStore(j.store);
        setMsg("ยืนยันโดเมนแล้ว — ลูกค้าเข้า https://" + (j.store.customDomain ?? ""));
      } else {
        setMsg(j.error ?? "ยืนยันไม่สำเร็จ");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    setMsg(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch("/api/ecommerce-store/session/upload-logo", { method: "POST", body: fd });
      const j = await res.json();
      if (res.ok && store) setStore({ ...store, logoUrl: j.imageUrl });
      else setMsg(j.error ?? "อัปโหลดโลโก้ไม่สำเร็จ");
    } catch {
      setMsg("อัปโหลดโลโก้ไม่สำเร็จ");
    } finally {
      setUploadingLogo(false);
    }
  }

  if (!store) {
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
          {msg ? (
            <p
              className={cn(
                "text-sm font-semibold",
                /^(บันทึกแล้ว|ยืนยันโดเมนแล้ว)/.test(msg) ? "text-emerald-700" : "text-rose-600",
              )}
            >
              {msg}
            </p>
          ) : null}

          {tab === "basic" ? (
            <div
              id="ecommerce-settings-panel-basic"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-basic"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-4">
                {store.logoUrl ? (
                  <EcommerceRemoteImg
                    src={store.logoUrl}
                    className="h-[72px] w-[72px] rounded-lg object-cover ring-1 ring-slate-200"
                    fallback={
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-slate-100 text-lg font-black text-[#4d47b6]">
                        {store.storeName.slice(0, 1)}
                      </div>
                    }
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-slate-100 text-lg font-black text-[#4d47b6]">
                    {store.storeName.slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#1e1b4b]">โลโก้ร้าน</p>
                  <input
                    ref={logoGalleryRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadLogo(f);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={logoCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadLogo(f);
                      e.target.value = "";
                    }}
                  />
                  <AppImagePickCameraButtons
                    className="mt-2 justify-start"
                    busy={uploadingLogo}
                    onPickGallery={() => logoGalleryRef.current?.click()}
                    onPickCamera={() => logoCameraRef.current?.click()}
                    labels={{ gallery: "เลือกโลโก้", camera: "ถ่ายโลโก้" }}
                  />
                </div>
              </div>

              <Field label="ชื่อร้าน">
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.storeName}
                  onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                />
              </Field>
              <Field label="รายละเอียดร้าน">
                <textarea
                  className={cn(ecommerceStoreTextareaClass, "mt-1")}
                  value={store.description ?? ""}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                />
              </Field>
              <Field label="แจ้งเตือนสต๊อกต่ำกว่า">
                <input
                  type="number"
                  min={0}
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.lowStockThreshold}
                  onChange={(e) => setStore({ ...store, lowStockThreshold: Number(e.target.value) })}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                <input
                  type="checkbox"
                  checked={store.merchantPaused}
                  onChange={(e) => setStore({ ...store, merchantPaused: e.target.checked })}
                />
                ปิดรับออเดอร์ชั่วคราว
              </label>
            </div>
          ) : null}

          {tab === "finance" ? (
            <div
              id="ecommerce-settings-panel-finance"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-finance"
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="พร้อมเพย์ (เบอร์)">
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.promptPayPhone ?? ""}
                  onChange={(e) => setStore({ ...store, promptPayPhone: e.target.value })}
                />
              </Field>
              <Field label="ธนาคาร">
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.bankName ?? ""}
                  onChange={(e) => setStore({ ...store, bankName: e.target.value })}
                />
              </Field>
              <Field label="ชื่อบัญชี">
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.bankAccountName ?? ""}
                  onChange={(e) => setStore({ ...store, bankAccountName: e.target.value })}
                />
              </Field>
              <Field label="เลขบัญชี">
                <input
                  className={cn(ecommerceStoreFieldClass, "mt-1")}
                  value={store.bankAccountNumber ?? ""}
                  onChange={(e) => setStore({ ...store, bankAccountNumber: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="หมายเหตุชำระเงิน">
                  <textarea
                    className={cn(ecommerceStoreTextareaClass, "mt-1")}
                    value={store.paymentNote ?? ""}
                    onChange={(e) => setStore({ ...store, paymentNote: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {tab === "portal" ? (
            <div
              id="ecommerce-settings-panel-portal"
              role="tabpanel"
              aria-labelledby="ecommerce-settings-tab-portal"
              className="space-y-4"
            >
              <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
                <p className="text-sm font-bold text-[#1e1b4b]">ลิงก์ร้าน (แชร์ Facebook / TikTok)</p>
                <p className="break-all text-xs text-[#66638c]">{shopUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(ecommerceStoreDashboardSegmentBtnClass(true), "min-h-8 px-3")}
                    onClick={() => void navigator.clipboard.writeText(shopUrl)}
                  >
                    <IconCopy className="h-3.5 w-3.5" aria-hidden />
                    คัดลอกลิงก์
                  </button>
                  <Link
                    href={ecommercePublicShopUrl(store.id)}
                    target="_blank"
                    className={ecommerceStoreOutlineButtonClass}
                  >
                    เปิดหน้าร้อง
                  </Link>
                  {store.salePageEnabled && store.featuredProductId ? (
                    <Link
                      href={`/shop/${store.id}/sale`}
                      target="_blank"
                      className={ecommerceStoreOutlineButtonClass}
                    >
                      Sale Page
                    </Link>
                  ) : null}
                </div>
              </div>

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
                  <p className="text-xs text-amber-700">ยังไม่ใส่โดเมน — ใช้ลิงก์ MAWELL ด้านบนได้</p>
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
                  <Field label="สินค้าเด่น (Sale Page)">
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
                  </Field>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

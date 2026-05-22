"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppImagePickCameraButtons,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import { validateEcommerceCustomDomainInput } from "@/lib/ecommerce/custom-domain";
import { IconCopy } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import { ecommerceSettingsPanelClass } from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

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

export function EcommerceSettingsClient() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState("");
  const [cnameTarget, setCnameTarget] = useState("app.ma-well.com");
  const logoGalleryRef = useRef<HTMLInputElement>(null);
  const logoCameraRef = useRef<HTMLInputElement>(null);

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
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/ecommerce-store/session/upload-logo", { method: "POST", body: fd });
    setUploadingLogo(false);
    const j = await res.json();
    if (res.ok && store) setStore({ ...store, logoUrl: j.imageUrl });
    else setMsg(j.error ?? "อัปโหลดโลโก้ไม่สำเร็จ");
  }

  if (!store) {
    return <div className="h-32 animate-pulse rounded-[2rem] bg-white/30" aria-hidden />;
  }

  const customUrl = store.customDomainVerified && store.customDomain
    ? `https://${store.customDomain}`
    : null;
  const domainValidationErr = store.customDomain?.trim()
    ? validateEcommerceCustomDomainInput(store.customDomain)
    : null;

  return (
    <AppDashboardSection className="appDashboardSectionVioletClass space-y-4">
      <AppSectionHeader title="ตั้งค่าร้าน" description="ชื่อร้าน · ช่องทางรับเงิน · ลิงก์แชร์ · โดเมนส่วนตัว" />

      <div className={cn("flex flex-wrap items-center gap-4", ecommerceSettingsPanelClass)}>
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#ede9ff] text-lg font-black text-[#4d47b6]">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อร้าน">
          <input
            className="app-input w-full rounded-xl"
            value={store.storeName}
            onChange={(e) => setStore({ ...store, storeName: e.target.value })}
          />
        </Field>
        <Field label="พร้อมเพย์ (เบอร์)">
          <input
            className="app-input w-full rounded-xl"
            value={store.promptPayPhone ?? ""}
            onChange={(e) => setStore({ ...store, promptPayPhone: e.target.value })}
          />
        </Field>
        <Field label="ธนาคาร">
          <input
            className="app-input w-full rounded-xl"
            value={store.bankName ?? ""}
            onChange={(e) => setStore({ ...store, bankName: e.target.value })}
          />
        </Field>
        <Field label="ชื่อบัญชี">
          <input
            className="app-input w-full rounded-xl"
            value={store.bankAccountName ?? ""}
            onChange={(e) => setStore({ ...store, bankAccountName: e.target.value })}
          />
        </Field>
        <Field label="เลขบัญชี">
          <input
            className="app-input w-full rounded-xl"
            value={store.bankAccountNumber ?? ""}
            onChange={(e) => setStore({ ...store, bankAccountNumber: e.target.value })}
          />
        </Field>
        <Field label="แจ้งเตือนสต๊อกต่ำกว่า">
          <input
            type="number"
            min={0}
            className="app-input w-full rounded-xl"
            value={store.lowStockThreshold}
            onChange={(e) => setStore({ ...store, lowStockThreshold: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="รายละเอียดร้าน">
        <textarea
          className="app-input min-h-[80px] w-full rounded-xl"
          value={store.description ?? ""}
          onChange={(e) => setStore({ ...store, description: e.target.value })}
        />
      </Field>

      <div className={ecommerceSettingsPanelClass}>
        <p className="text-sm font-bold text-[#1e1b4b]">ลิงก์ร้าน (แชร์ Facebook / TikTok)</p>
        <p className="mt-1 break-all text-xs text-[#66638c]">{shopUrl}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="app-btn-primary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-sm font-bold"
            onClick={() => void navigator.clipboard.writeText(shopUrl)}
          >
            <IconCopy className="h-4 w-4" aria-hidden />
            คัดลอกลิงก์
          </button>
          <Link
            href={ecommercePublicShopUrl(store.id)}
            target="_blank"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-white/60 bg-white/80 px-4 text-sm font-semibold text-[#4d47b6]"
          >
            เปิดหน้าร้อง
          </Link>
          {store.salePageEnabled && store.featuredProductId ? (
            <Link
              href={`/shop/${store.id}/sale`}
              target="_blank"
              className="inline-flex min-h-[40px] items-center rounded-xl border border-white/60 px-4 text-sm font-semibold text-[#66638c]"
            >
              Sale Page
            </Link>
          ) : null}
        </div>
      </div>

      <div className={cn(ecommerceSettingsPanelClass, "space-y-3")}>
        <p className="text-sm font-bold text-[#1e1b4b]">Custom Domain</p>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#66638c]">
          <li>ใส่โดเมนของคุณเอง (เช่น shop.mybrand.com) — ไม่ใช้ *.ma-well.com</li>
          <li>
            ที่ DNS: สร้าง CNAME ชี้มา <span className="font-semibold text-[#4d47b6]">{cnameTarget}</span>
          </li>
          <li>เมื่อ DNS พร้อม กด «ยืนยันโดเมน» (ระบบบันทึกโดเมนให้อัตโนมัติ)</li>
        </ol>
        <p className="text-xs text-[#8b87b8]">
          ข้อความสีส้มด้านล่างจะหายเมื่อกด «ยืนยันโดเมน» สำเร็จ — แค่พิมพ์ในช่องอย่างเดียวยังไม่ถือว่ายืนยัน
        </p>
        <input
          className="app-input w-full rounded-xl"
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
            บันทึกโดเมนในช่องแล้ว — กด «ยืนยันโดเมน» เมื่อตั้ง CNAME แล้ว (หน้าร้องยังใช้ลิงก์ MAWELL ได้จนกว่าจะยืนยัน)
          </p>
        ) : (
          <p className="text-xs text-amber-700">ยังไม่ใส่โดเมน — ใช้ลิงก์ MAWELL ด้านบนแชร์ลูกค้าได้</p>
        )}
        <button
          type="button"
          disabled={verifying || !store.customDomain?.trim() || !!domainValidationErr}
          onClick={() => void verifyDomain()}
          className="min-h-[40px] rounded-xl border border-[#4d47b6]/30 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
        >
          {verifying ? "กำลังยืนยัน..." : "ยืนยันโดเมน"}
        </button>
      </div>

      <div className={cn(ecommerceSettingsPanelClass, "space-y-3")}>
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
              className="app-input w-full rounded-xl"
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

      <label className="flex items-center gap-2 text-sm font-semibold text-rose-600">
        <input
          type="checkbox"
          checked={store.merchantPaused}
          onChange={(e) => setStore({ ...store, merchantPaused: e.target.checked })}
        />
        ปิดรับออเดอร์ชั่วคราว
      </label>

      {msg ? <p className="text-sm text-[#4d47b6]">{msg}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="app-btn-primary min-h-[44px] rounded-2xl px-6 font-bold"
      >
        {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </AppDashboardSection>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[#8b87b8]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

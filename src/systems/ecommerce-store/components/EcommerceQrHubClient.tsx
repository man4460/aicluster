"use client";

import Link from "next/link";
import { useState } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import {
  ecommerceStoreCompactOutlineButtonClass,
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

function qrHubCardClass(tone: "web" | "staff") {
  return cn(
    "group w-full rounded-[1.25rem] border border-slate-200/90 bg-white p-4 text-left shadow-sm transition",
    "hover:bg-slate-50/80 hover:shadow-md",
    tone === "web"
      ? "hover:border-[#5b61ff]/35 focus-visible:outline-[#5b61ff]"
      : "hover:border-amber-300/80 focus-visible:outline-amber-600",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "sm:p-5",
  );
}

function qrHubIconShellClass(tone: "web" | "staff") {
  return cn(
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-14 sm:w-14",
    tone === "web" ? "bg-indigo-50 text-[#5b61ff] ring-indigo-100" : "bg-amber-50 text-amber-700 ring-amber-100",
  );
}

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <div className={ecommerceStoreInlineSubNavShellClass} role="group">
        <button
          type="button"
          onClick={onClose}
          className={ecommerceStoreInlineSubNavBtnClass(true)}
          aria-label="ปิด"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span className="hidden sm:inline">ปิด</span>
        </button>
      </div>
    </div>
  );
}

function ShopWebLinkModalBody({
  shopUrl,
  storeId,
  storeName,
  logoUrl,
  salePageEnabled,
  featuredProductId,
}: {
  shopUrl: string;
  storeId: string;
  storeName: string;
  logoUrl: string | null;
  salePageEnabled: boolean;
  featuredProductId: string | null;
}) {
  return (
    <div className="space-y-3 text-left">
      <ModulePublicLinkQrPanel
        moduleSlug={ECOMMERCE_STORE_MODULE_SLUG}
        planGateAllowed
        pageUrl={shopUrl}
        shopLabel={storeName || "ร้านออนไลน์"}
        logoUrl={logoUrl}
        tagline="สแกนเพื่อเข้าหน้าร้านออนไลน์"
        openLabel="เปิดเว็บ"
        posterTintClass="shadow-lg shadow-indigo-950/10"
        posterAlt="โปสเตอร์ QR ร้านออนไลน์"
        downloadFilePrefix={`ecommerce-shop-qr-${storeId.slice(0, 8)}`}
      />
      {salePageEnabled && featuredProductId ? (
        <Link href={`/shop/${storeId}/sale`} target="_blank" className={ecommerceStoreCompactOutlineButtonClass}>
          Sale Page
        </Link>
      ) : null}
    </div>
  );
}

/**
 * ศูนย์ลิงก์ — ลิงก์เว็บไซต์ + พนักงาน
 * ห่อ `ModuleQrMonthlyGate` ครั้งเดียว เพื่อบล็อกสายรายวันทั้งคู่
 */
export function EcommerceQrHubClient({
  shopUrl,
  storeId,
  storeName,
  logoUrl,
  salePageEnabled,
  featuredProductId,
}: {
  shopUrl: string;
  storeId: string;
  storeName: string;
  logoUrl: string | null;
  salePageEnabled: boolean;
  featuredProductId: string | null;
}) {
  const [showWebModal, setShowWebModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  return (
    <ModuleQrMonthlyGate moduleSlug={ECOMMERCE_STORE_MODULE_SLUG} title="ลิงก์">
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-[#5f5a8a]">
          ลิงก์เว็บไซต์ลูกค้าและลิงก์พนักงาน — สายรายวันถูกจำกัดสิทธิ์ที่นี่ทีเดียว
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setShowStaffModal(false);
              setShowWebModal(true);
            }}
            className={qrHubCardClass("web")}
            aria-label="เปิดจัดการลิงก์เว็บไซต์"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className={qrHubIconShellClass("web")}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-[#1e1b4b] sm:text-base">ลิงก์เว็บไซต์</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#66638c] sm:text-sm">
                  เปิด · คัดลอกลิงก์ร้านออนไลน์ให้ลูกค้าสั่งซื้อ
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b61ff] sm:mt-4 sm:text-[11px]">
                  <span>คลิกเพื่อเปิด</span>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowWebModal(false);
              setShowStaffModal(true);
            }}
            className={qrHubCardClass("staff")}
            aria-label="เปิดจัดการลิงก์พนักงาน"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className={qrHubIconShellClass("staff")}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-[#1e1b4b] sm:text-base">พนักงาน</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#66638c] sm:text-sm">
                  QR / ลิงก์ — แดชบอร์ด + เว็บร้าน (ไม่เปิดการเงิน/จัดการ/ตั้งค่า)
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 sm:mt-4 sm:text-[11px]">
                  <span>คลิกเพื่อเปิด</span>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </p>
              </div>
            </div>
          </button>
        </div>

        <FormModal
          open={showWebModal}
          size="lg"
          appearance="glass"
          glassTint="violet"
          mobileCentered
          onClose={() => setShowWebModal(false)}
          title="ลิงก์เว็บไซต์"
          footer={<ModalCloseFooter onClose={() => setShowWebModal(false)} />}
        >
          <ShopWebLinkModalBody
            shopUrl={shopUrl}
            storeId={storeId}
            storeName={storeName}
            logoUrl={logoUrl}
            salePageEnabled={salePageEnabled}
            featuredProductId={featuredProductId}
          />
        </FormModal>

        <FormModal
          open={showStaffModal}
          size="full"
          appearance="glass"
          glassTint="amber"
          mobileCentered
          onClose={() => setShowStaffModal(false)}
          title="QR พนักงาน"
          description="เมนูพนักงาน = ภาพรวม · ออเดอร์ · POS · เว็บร้าน"
          footer={<ModalCloseFooter onClose={() => setShowStaffModal(false)} />}
        >
          <ModuleStaffTokenQrPanel
            moduleSlug={ECOMMERCE_STORE_MODULE_SLUG}
            planGateAllowed
            staffLinkApiPath="/api/ecommerce-store/session/staff-link"
            shopLabel={storeName || "ร้านออนไลน์"}
            logoUrl={logoUrl}
            tagline="สแกนเข้าหน้าพนักงาน — เมนูแดชบอร์ด + เว็บร้าน"
            mobileBannerText=""
            openPrimaryLabel="เปิดหน้าพนักงาน"
          />
        </FormModal>
      </div>
    </ModuleQrMonthlyGate>
  );
}

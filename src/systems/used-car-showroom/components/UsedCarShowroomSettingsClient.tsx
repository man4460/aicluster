"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppModuleShopPaymentFields,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  AppTime24Input,
  staffDailyPinPatchBody,
  useAppNoticePopup,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { UsedCarPortalMediaSettings } from "@/systems/used-car-showroom/components/UsedCarPortalMediaSettings";
import { UsedCarShowroomPageSubNav } from "@/systems/used-car-showroom/components/UsedCarShowroomPageSubNav";
import {
  parseUsedCarShowroomSettingsTab,
  usedCarShowroomSettingsHref,
  USED_CAR_SHOWROOM_SETTINGS_TAB_ITEMS,
  type UsedCarShowroomSettingsTab,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";
import {
  usedCarShowroomPageTitleIcon,
  usedCarShowroomPageTitleTone,
  usedCarShowroomSettingsTabIcon,
} from "@/systems/used-car-showroom/lib/page-menu-icons";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import {
  usedCarShowroomFieldClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomPageStackClass,
  usedCarShowroomPrimaryButtonClass,
  usedCarShowroomTextareaClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";

const LOGO_UPLOAD_URL = "/api/used-car-showroom/session/upload";

function asSlipSize(raw: string | null | undefined): AppSlipPaperSize {
  if (raw === "SLIP_80" || raw === "A4" || raw === "SLIP_58") return raw;
  return "SLIP_58";
}

export function UsedCarShowroomSettingsClient({ initialShop }: { initialShop: UsedCarShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = useAppNoticePopup();
  const tab = parseUsedCarShowroomSettingsTab(searchParams.get("tab"));
  const [shop, setShop] = useState(initialShop);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [pinSet, setPinSet] = useState(Boolean(initialShop.staffDailyPinSet));
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setPinSet(Boolean(shop.staffDailyPinSet));
  }, [shop.staffDailyPinSet]);

  const setTab = (key: UsedCarShowroomSettingsTab) => {
    router.replace(usedCarShowroomSettingsHref(key), { scroll: false });
  };

  const paymentValue: ModuleShopPaymentDto = {
    promptPayPhone: shop.promptPayPhone,
    promptPayQrImageUrl: shop.promptPayQrImageUrl,
    bankName: shop.bankName,
    bankAccountNumber: shop.bankAccountNumber,
    bankAccountName: shop.bankAccountName,
    taxId: shop.taxId,
  };

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: shop.displayName,
        logoUrl: shop.logoUrl,
        tagline: shop.tagline,
        contactPhone: shop.contactPhone,
        contactLine: shop.contactLine,
        address: shop.address,
        facebookUrl: shop.facebookUrl,
        mapUrl: shop.mapUrl,
        openTimeHm: shop.openTimeHm,
        closeTimeHm: shop.closeTimeHm,
        portalBannerUrl: shop.portalBannerUrl,
        portalGallery: shop.portalGallery,
        slug: shop.slug,
        portalEnabled: shop.portalEnabled,
        portalBookingPaymentMode: shop.portalBookingPaymentMode,
        depositAmountBaht: shop.depositAmountBaht,
        promptPayPhone: shop.promptPayPhone,
        promptPayQrImageUrl: shop.promptPayQrImageUrl,
        bankName: shop.bankName,
        bankAccountNumber: shop.bankAccountNumber,
        bankAccountName: shop.bankAccountName,
        taxId: shop.taxId,
        slipPaperSize: shop.slipPaperSize,
      };
      if (tab === "finance") {
        Object.assign(payload, staffDailyPinPatchBody({ pinDraft, clearPin }));
      }
      const res = await fetch("/api/used-car-showroom/session/shop", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      if (data.shop) {
        setShop(data.shop as UsedCarShopDto);
        setPinSet(Boolean((data.shop as UsedCarShopDto).staffDailyPinSet));
        setPinDraft("");
        setClearPin(false);
      }
      notice.success("บันทึกตั้งค่าแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [shop, notice, tab, pinDraft, clearPin]);

  const portalUrl = origin ? `${origin}/car/${shop.slug}` : `/car/${shop.slug}`;

  const showSave = tab !== "link";

  return (
    <div className={usedCarShowroomPageStackClass}>
      {notice.popup}
      <UsedCarShowroomPageSubNav
        title="ตั้งค่า"
        titleIcon={usedCarShowroomPageTitleIcon("settings")}
        titleTone={usedCarShowroomPageTitleTone("settings")}
        items={USED_CAR_SHOWROOM_SETTINGS_TAB_ITEMS.map((t) => ({
          key: t.key,
          label: t.shortLabel ?? t.label,
          icon: usedCarShowroomSettingsTabIcon(t.key),
        }))}
        activeKey={tab}
        onSelect={(k) => setTab(k as UsedCarShowroomSettingsTab)}
        ariaLabel="เมนูตั้งค่าร้าน"
        action={
          showSave ? (
            <button
              type="button"
              className={usedCarShowroomPrimaryButtonClass}
              disabled={busy}
              onClick={() => void save()}
            >
              บันทึก
            </button>
          ) : null
        }
      >
        {tab === "basic" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
              ชื่อเต็นท์
              <input
                className={usedCarShowroomFieldClass}
                value={shop.displayName}
                onChange={(e) => setShop((s) => ({ ...s, displayName: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <AppShopLogoField
                logoUrl={shop.logoUrl}
                fallbackLabel={shop.displayName || "เต็นท์"}
                uploadUrl={LOGO_UPLOAD_URL}
                onLogoUrlChange={(url) => setShop((s) => ({ ...s, logoUrl: url }))}
                buttonClassName={usedCarShowroomOutlineButtonClass}
              />
            </div>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
              คำโปรย / สโลแกน
              <input
                className={usedCarShowroomFieldClass}
                value={shop.tagline ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, tagline: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์โทร
              <input
                className={usedCarShowroomFieldClass}
                value={shop.contactPhone ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, contactPhone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              LINE
              <input
                className={usedCarShowroomFieldClass}
                value={shop.contactLine ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, contactLine: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
              ที่อยู่
              <textarea
                className={usedCarShowroomTextareaClass}
                value={shop.address ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, address: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div className="space-y-4">
            <AppModuleShopPaymentFields
              value={paymentValue}
              fieldClassName={usedCarShowroomFieldClass}
              onChange={(next) =>
                setShop((s) => ({
                  ...s,
                  promptPayPhone: next.promptPayPhone,
                  promptPayQrImageUrl: next.promptPayQrImageUrl,
                  bankName: next.bankName,
                  bankAccountNumber: next.bankAccountNumber,
                  bankAccountName: next.bankAccountName,
                  taxId: next.taxId,
                }))
              }
            />
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ยอดมัดจำจอง (บาท)
              <input
                className={usedCarShowroomFieldClass}
                inputMode="numeric"
                value={String(shop.depositAmountBaht)}
                onChange={(e) =>
                  setShop((s) => ({ ...s, depositAmountBaht: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              โหมดจองพอร์ทัล (จองกันคัน)
              <select
                className={usedCarShowroomFieldClass}
                value={shop.portalBookingPaymentMode}
                onChange={(e) =>
                  setShop((s) => ({
                    ...s,
                    portalBookingPaymentMode: e.target.value as UsedCarShopDto["portalBookingPaymentMode"],
                  }))
                }
              >
                <option value="DEPOSIT">มัดจำ + สลิป (แนะนำ · มาตรฐานเต็นท์)</option>
                <option value="FULL">ชำระเต็ม + สลิป</option>
                <option value="NONE">ปิดจองออนไลน์ — รับแค่นัดดูรถ</option>
              </select>
              <span className="mt-1 block text-[11px] font-medium text-[#66638c]">
                จองรถ = มัดจำ+สลิป · นัดดูรถ/ทดลองขับ = ฟอร์มอย่างเดียว ไม่มัดจำ
              </span>
            </label>
            <AppStaffDailyPinSettingsField
              fieldClassName={usedCarShowroomFieldClass}
              pinSet={pinSet}
              pinDraft={pinDraft}
              onPinDraftChange={setPinDraft}
              clearPin={clearPin}
              onClearPinChange={setClearPin}
              disabled={busy}
            />
            <AppSlipPaperSizeSettingsField
              fieldClassName={usedCarShowroomFieldClass}
              value={asSlipSize(shop.slipPaperSize)}
              onChange={(next) => setShop((s) => ({ ...s, slipPaperSize: next }))}
              disabled={busy}
            />
          </div>
        ) : null}

        {tab === "portal" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                slug เว็บ (/car/…)
                <input
                  className={usedCarShowroomFieldClass}
                  value={shop.slug}
                  onChange={(e) =>
                    setShop((s) => ({
                      ...s,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 80),
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                เปิดเว็บลูกค้า
                <select
                  className={usedCarShowroomFieldClass}
                  value={shop.portalEnabled ? "1" : "0"}
                  onChange={(e) => setShop((s) => ({ ...s, portalEnabled: e.target.value === "1" }))}
                >
                  <option value="1">เปิด</option>
                  <option value="0">ปิด</option>
                </select>
              </label>
            </div>
            <UsedCarPortalMediaSettings
              bannerUrl={shop.portalBannerUrl ?? ""}
              gallery={shop.portalGallery ?? []}
              facebookUrl={shop.facebookUrl ?? ""}
              mapUrl={shop.mapUrl ?? ""}
              onBannerUrlChange={(url) => setShop((s) => ({ ...s, portalBannerUrl: url || null }))}
              onGalleryChange={(urls) => setShop((s) => ({ ...s, portalGallery: urls }))}
              onFacebookUrlChange={(url) => setShop((s) => ({ ...s, facebookUrl: url || null }))}
              onMapUrlChange={(url) => setShop((s) => ({ ...s, mapUrl: url || null }))}
              disabled={busy}
            />
            <p className="text-xs text-[#66638c]">ลิงก์พอร์ทัล: {portalUrl} — คัดลอก/QR อยู่แท็บลิงก์</p>
          </div>
        ) : null}

        {tab === "hours" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              เวลาเปิด (เวลาไทย)
              <AppTime24Input
                value={shop.openTimeHm ?? "09:00"}
                onChange={(v) => setShop((s) => ({ ...s, openTimeHm: v }))}
                disabled={busy}
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              เวลาปิด (เวลาไทย)
              <AppTime24Input
                value={shop.closeTimeHm ?? "18:00"}
                onChange={(v) => setShop((s) => ({ ...s, closeTimeHm: v }))}
                disabled={busy}
              />
            </label>
          </div>
        ) : null}

        {tab === "link" ? (
          <ModuleQrMonthlyGate
            moduleSlug={USED_CAR_SHOWROOM_MODULE_SLUG}
            title="ลิงก์ / QR โชว์รูม"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#66638c]">
                ลิงก์สาธารณะใช้ได้เฉพาะแพ็กรายเดือน — สายรายวันสร้าง/เปิดไม่ได้ (กันคัดลอกลิงก์แล้วดาวน์เกรด)
              </p>
              <ModulePublicLinkQrPanel
                moduleSlug={USED_CAR_SHOWROOM_MODULE_SLUG}
                planGateAllowed
                pageUrl={portalUrl}
                shopLabel={shop.displayName}
                logoUrl={shop.logoUrl}
                tagline="สแกนเพื่อเข้าโชว์รูมออนไลน์"
                openLabel="เปิดเว็บลูกค้า"
              />
            </div>
          </ModuleQrMonthlyGate>
        ) : null}
      </UsedCarShowroomPageSubNav>
    </div>
  );
}

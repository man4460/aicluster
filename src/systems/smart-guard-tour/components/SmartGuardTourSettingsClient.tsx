"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppModuleShopPaymentFields,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  AppTime24Input,
  prepareImageFileForUpload,
  staffDailyPinPatchBody,
  useAppNoticePopup,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { cn } from "@/lib/cn";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { SMART_GUARD_TOUR_MODULE_SLUG } from "@/lib/modules/config";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  parseSmartGuardTourSettingsTab,
  smartGuardTourSettingsHref,
  SMART_GUARD_TOUR_SETTINGS_TAB_ITEMS,
  type SmartGuardTourSettingsTab,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import {
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
  smartGuardTourSettingsTabIcon,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourFieldClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourPageStackClass,
  smartGuardTourPrimaryButtonClass,
  smartGuardTourTextareaClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

const UPLOAD_URL = "/api/smart-guard-tour/session/upload";

function asSlipSize(raw: string | null | undefined): AppSlipPaperSize {
  if (raw === "SLIP_80" || raw === "A4" || raw === "SLIP_58") return raw;
  return "SLIP_58";
}

export function SmartGuardTourSettingsClient({ initialShop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = useAppNoticePopup();
  const tab = parseSmartGuardTourSettingsTab(searchParams.get("tab"));
  const [shop, setShop] = useState(initialShop);
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
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

  const setTab = (key: SmartGuardTourSettingsTab) => {
    router.replace(smartGuardTourSettingsHref(key), { scroll: false });
  };

  const paymentValue: ModuleShopPaymentDto = {
    promptPayPhone: shop.promptPayPhone,
    promptPayQrImageUrl: shop.promptPayQrImageUrl,
    bankName: shop.bankName,
    bankAccountNumber: shop.bankAccountNumber,
    bankAccountName: shop.bankAccountName,
    taxId: shop.taxId,
  };

  const fetchDeviceCoords = () => {
    if (!navigator.geolocation) {
      notice.error("เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShop((s) => ({
          ...s,
          shopLat: pos.coords.latitude,
          shopLng: pos.coords.longitude,
        }));
        setGeoBusy(false);
        notice.success("ดึงพิกัดจากเครื่องแล้ว — กดบันทึกเพื่อเก็บ");
      },
      () => {
        setGeoBusy(false);
        notice.error("ดึงพิกัดไม่ได้ — อนุญาตการเข้าถึงตำแหน่ง หรือกรอกเอง");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  async function uploadPromptPayQr(file: File) {
    setBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      fd.set("kind", "promptpay-qr");
      const res = await fetch(UPLOAD_URL, { method: "POST", credentials: "include", body: fd });
      const json = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !json.imageUrl) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      setShop((s) => ({ ...s, promptPayQrImageUrl: json.imageUrl! }));
      notice.success("อัปโหลด QR พร้อมเพย์แล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: shop.displayName,
        logoUrl: shop.logoUrl,
        contactPhone: shop.contactPhone,
        emergencyPhone: shop.emergencyPhone,
        contactLine: shop.contactLine,
        lineNotifyToken: shop.lineNotifyToken,
        address: shop.address,
        facebookUrl: shop.facebookUrl,
        mapUrl: shop.mapUrl,
        shopLat: shop.shopLat,
        shopLng: shop.shopLng,
        openTimeHm: shop.openTimeHm,
        closeTimeHm: shop.closeTimeHm,
        portalBannerUrl: shop.portalBannerUrl,
        portalGallery: shop.portalGallery,
        slug: shop.slug,
        portalEnabled: shop.portalEnabled,
        portalSosEnabled: shop.portalSosEnabled,
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
      const res = await fetch("/api/smart-guard-tour/session/shop", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      if (data.shop) {
        setShop(data.shop as SmartGuardShopDto);
        setPinSet(Boolean((data.shop as SmartGuardShopDto).staffDailyPinSet));
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

  const portalUrl = origin ? `${origin}/guard/${shop.slug}` : `/guard/${shop.slug}`;
  const showSave = tab !== "link";

  return (
    <div className={smartGuardTourPageStackClass}>
      {notice.popup}
      <SmartGuardTourPageSubNav
        title="ตั้งค่า"
        titleIcon={smartGuardTourPageTitleIcon("settings")}
        titleTone={smartGuardTourPageTitleTone("settings")}
        items={SMART_GUARD_TOUR_SETTINGS_TAB_ITEMS.map((t) => ({
          key: t.key,
          label: t.shortLabel ?? t.label,
          icon: smartGuardTourSettingsTabIcon(t.key),
        }))}
        activeKey={tab}
        onSelect={(k) => setTab(k as SmartGuardTourSettingsTab)}
        ariaLabel="เมนูตั้งค่าร้าน"
        action={
          showSave ? (
            <button
              type="button"
              className={smartGuardTourPrimaryButtonClass}
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
              ชื่อหน่วยงาน / ไซต์
              <input
                className={smartGuardTourFieldClass}
                value={shop.displayName}
                onChange={(e) => setShop((s) => ({ ...s, displayName: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <AppShopLogoField
                logoUrl={shop.logoUrl}
                fallbackLabel={shop.displayName || "รปภ."}
                uploadUrl={UPLOAD_URL}
                onLogoUrlChange={(url) => setShop((s) => ({ ...s, logoUrl: url }))}
                buttonClassName={smartGuardTourOutlineButtonClass}
              />
            </div>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์โทร
              <input
                className={smartGuardTourFieldClass}
                value={shop.contactPhone ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, contactPhone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์ฉุกเฉิน
              <input
                className={smartGuardTourFieldClass}
                value={shop.emergencyPhone ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, emergencyPhone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
              ที่อยู่
              <textarea
                className={smartGuardTourTextareaClass}
                value={shop.address ?? ""}
                onChange={(e) => setShop((s) => ({ ...s, address: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ละติจูด
              <input
                type="number"
                step="any"
                className={smartGuardTourFieldClass}
                value={shop.shopLat ?? ""}
                onChange={(e) =>
                  setShop((s) => ({
                    ...s,
                    shopLat: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                placeholder="13.7563"
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ลองจิจูด
              <input
                type="number"
                step="any"
                className={smartGuardTourFieldClass}
                value={shop.shopLng ?? ""}
                onChange={(e) =>
                  setShop((s) => ({
                    ...s,
                    shopLng: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                placeholder="100.5018"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="button"
                className={smartGuardTourOutlineButtonClass}
                disabled={busy || geoBusy}
                onClick={fetchDeviceCoords}
              >
                {geoBusy ? "กำลังดึงพิกัด…" : "ดึงพิกัดจากเครื่อง"}
              </button>
              <p className="mt-1 text-[11px] font-medium text-[#66638c]">
                ใช้เป็นจุดอ้างอิงไซต์ / แผนที่ — กดบันทึกหลังดึงพิกัด
              </p>
            </div>
          </div>
        ) : null}

        {tab === "finance" ? (
          <div className="space-y-4">
            <AppModuleShopPaymentFields
              value={paymentValue}
              fieldClassName={smartGuardTourFieldClass}
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
            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
              <p className="text-xs font-black text-[#4d47b6]">QR พร้อมเพย์ (อัปโหลดรูป)</p>
              <p className="text-[11px] font-semibold text-[#8b87b8]">
                ทางเลือก — อัปโหลดภาพ QR จากแอปธนาคาร ถ้ามีรูปนี้ระบบจะแสดงรูปนี้แทนการสร้างจากเบอร์
              </p>
              {shop.promptPayQrImageUrl ? (
                <div className="flex flex-wrap items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shop.promptPayQrImageUrl}
                    alt="QR พร้อมเพย์ที่อัปโหลด"
                    className="h-28 w-28 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    className={cn(smartGuardTourOutlineButtonClass, "text-rose-700")}
                    onClick={() => setShop((s) => ({ ...s, promptPayQrImageUrl: null }))}
                  >
                    ลบรูป QR
                  </button>
                </div>
              ) : null}
              <label className={cn(smartGuardTourOutlineButtonClass, "inline-flex cursor-pointer")}>
                {shop.promptPayQrImageUrl ? "เปลี่ยนภาพ QR" : "เลือกภาพ QR พร้อมเพย์"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadPromptPayQr(f);
                  }}
                />
              </label>
            </div>
            <AppStaffDailyPinSettingsField
              fieldClassName={smartGuardTourFieldClass}
              pinSet={pinSet}
              pinDraft={pinDraft}
              onPinDraftChange={setPinDraft}
              clearPin={clearPin}
              onClearPinChange={setClearPin}
              disabled={busy}
            />
            <AppSlipPaperSizeSettingsField
              fieldClassName={smartGuardTourFieldClass}
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
                slug เว็บ (/guard/…)
                <input
                  className={smartGuardTourFieldClass}
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
                เปิดเว็บลูกค้า / พนักงาน
                <select
                  className={smartGuardTourFieldClass}
                  value={shop.portalEnabled ? "1" : "0"}
                  onChange={(e) => setShop((s) => ({ ...s, portalEnabled: e.target.value === "1" }))}
                >
                  <option value="1">เปิด</option>
                  <option value="0">ปิด</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                ปุ่ม SOS บนพอร์ทัล
                <select
                  className={smartGuardTourFieldClass}
                  value={shop.portalSosEnabled ? "1" : "0"}
                  onChange={(e) =>
                    setShop((s) => ({ ...s, portalSosEnabled: e.target.value === "1" }))
                  }
                >
                  <option value="1">เปิด</option>
                  <option value="0">ปิด</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                LINE ID / ลิงก์
                <input
                  className={smartGuardTourFieldClass}
                  value={shop.contactLine ?? ""}
                  onChange={(e) => setShop((s) => ({ ...s, contactLine: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                Facebook URL
                <input
                  className={smartGuardTourFieldClass}
                  value={shop.facebookUrl ?? ""}
                  onChange={(e) => setShop((s) => ({ ...s, facebookUrl: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
                ลิงก์แผนที่
                <input
                  className={smartGuardTourFieldClass}
                  value={shop.mapUrl ?? ""}
                  onChange={(e) => setShop((s) => ({ ...s, mapUrl: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
                LINE Notify Token (เฟสถัดไป)
                <input
                  className={smartGuardTourFieldClass}
                  value={shop.lineNotifyToken ?? ""}
                  onChange={(e) => setShop((s) => ({ ...s, lineNotifyToken: e.target.value }))}
                  placeholder="เก็บไว้ก่อน — แจ้งเตือนจริงเปิดภายหลัง"
                />
              </label>
            </div>
            <p className="text-xs text-[#66638c]">
              แบนเนอร์/แกลเลอรีสื่อ — เฟสถัดไป · ลิงก์พอร์ทัล: {portalUrl} — คัดลอก/QR อยู่แท็บลิงก์
            </p>
          </div>
        ) : null}

        {tab === "hours" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              เวลาเปิด (เวลาไทย)
              <AppTime24Input
                value={shop.openTimeHm ?? "08:00"}
                onChange={(v) => setShop((s) => ({ ...s, openTimeHm: v }))}
                disabled={busy}
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              เวลาปิด (เวลาไทย)
              <AppTime24Input
                value={shop.closeTimeHm ?? "20:00"}
                onChange={(v) => setShop((s) => ({ ...s, closeTimeHm: v }))}
                disabled={busy}
              />
            </label>
          </div>
        ) : null}

        {tab === "link" ? (
          <ModuleQrMonthlyGate moduleSlug={SMART_GUARD_TOUR_MODULE_SLUG} title="ลิงก์ / QR จุดตรวจ รปภ.">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#66638c]">
                ลิงก์สาธารณะใช้ได้เฉพาะแพ็กรายเดือน — สายรายวันสร้าง/เปิดไม่ได้ (กันคัดลอกลิงก์แล้วดาวน์เกรด)
              </p>
              <ModulePublicLinkQrPanel
                moduleSlug={SMART_GUARD_TOUR_MODULE_SLUG}
                planGateAllowed
                pageUrl={portalUrl}
                shopLabel={shop.displayName}
                logoUrl={shop.logoUrl}
                tagline="สแกนเพื่อเข้าหน้าจุดตรวจ / พนักงาน"
                openLabel="เปิดเว็บ /guard"
              />
            </div>
          </ModuleQrMonthlyGate>
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}

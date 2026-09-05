"use client";



import { Suspense, useCallback, useEffect, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {

  AppDashboardSection,

  AppSectionHeader,
  AppShopLogoField,
  AppStaffDailyPinSettingsField,
  staffDailyPinPatchBody,

} from "@/components/app-templates";

import { ParkingSiteSettingsForm } from "@/systems/parking/components/ParkingSiteSettingsForm";
import {
  ParkingBookingPaymentSettings,
  ParkingLoyaltySettings,
  ParkingPaymentAccountForm,
} from "@/systems/parking/components/ParkingAdvancedSettingsForms";

import {
  type ParkingQrLotRow,
  type ParkingQrSpotRow,
} from "@/systems/parking/components/ParkingCustomerQrHubClient";
import { ParkingPortalHubClient } from "@/systems/parking/components/ParkingPortalHubClient";
import { ParkingPortalMediaSettings } from "@/systems/parking/components/ParkingPortalMediaSettings";
import { ParkingReviewsSettings } from "@/systems/parking/components/ParkingReviewsSettings";
import { parkingPublicPortalUrl } from "@/lib/parking/public-url";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";

import {

  parkingCardLargeRadiusClass,

  parkingMobileSelectClass,

  parkingPrimaryTabPillClass,

  parkingPrimaryTabShellClass,

} from "@/systems/parking/parking-ui-tokens";



type SettingsTab = "basic" | "finance" | "booking" | "portal" | "loyalty" | "links";



const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [

  { id: "basic", label: "ตั้งค่าพื้นฐาน" },

  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "booking", label: "การจอง" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "loyalty", label: "สะสมคะแนน" },

  { id: "links", label: "ลิงก์ / QR" },

];



function parseSettingsTab(raw: string | null): SettingsTab {

  if (raw === "finance" || raw === "booking" || raw === "portal" || raw === "loyalty" || raw === "links") return raw;

  return "basic";

}



export type ParkingSettingsClientProps = {

  initialName: string;

  initialMode: "HOURLY" | "DAILY" | "MONTHLY";

  initialHourly: number | null;

  initialDaily: number | null;

  initialMonthly?: number | null;

  qrLots: ParkingQrLotRow[];

  qrSpots: ParkingQrSpotRow[];

  businessName: string | null;

  logoUrl: string | null;

  baseUrl: string;
  loyaltyEnabled: boolean;
  loyaltyBahtPerPoint: number;
  loyaltyPointsPerUnit: number;
  bookingPaymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositPercent: number | null;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  contactPhone: string | null;
  tagline: string | null;
  address: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  staffDailyPinSet: boolean;
  ownerId: string;
  trialSessionId: string;
  portalBannerUrl: string | null;
  portalGallery: string[];

};



function ParkingSettingsInner({

  initialName,

  initialMode,

  initialHourly,

  initialDaily,

  initialMonthly = null,

  qrLots,

  qrSpots,

  businessName,

  logoUrl,

  baseUrl,
  loyaltyEnabled,
  loyaltyBahtPerPoint,
  loyaltyPointsPerUnit,
  bookingPaymentMode,
  depositPercent,
  promptPayPhone,
  bankName,
  bankAccountNumber,
  bankAccountName,
  contactPhone,
  tagline,
  address,
  lineId,
  facebookUrl,
  mapUrl,
  staffDailyPinSet,
  ownerId,
  trialSessionId,
  portalBannerUrl,
  portalGallery,

}: ParkingSettingsClientProps) {

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));
  const [profile, setProfile] = useState({
    name: initialName,
    logoUrl,
    contactPhone,
    tagline,
    address,
    lineId,
    facebookUrl,
    mapUrl,
  });
  const [pinDraft, setPinDraft] = useState("");
  const [clearPin, setClearPin] = useState(false);
  const [pinIsSet, setPinIsSet] = useState(staffDailyPinSet);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publicPortalUrl = parkingPublicPortalUrl(baseUrl, ownerId, trialSessionId);



  useEffect(() => {

    setTab(parseSettingsTab(searchParams.get("tab")));

  }, [searchParams]);



  const selectTab = useCallback(

    (next: SettingsTab) => {

      setTab(next);

      const q = new URLSearchParams(searchParams.toString());

      if (next === "basic") q.delete("tab");

      else q.set("tab", next);

      const qs = q.toString();

      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    },

    [pathname, router, searchParams],

  );

  async function saveSite(fields: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/parking/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        site?: typeof profile & { staffDailyPinSet?: boolean };
      };
      if (!response.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.site) {
        setProfile((current) => ({ ...current, ...data.site }));
        setPinIsSet(Boolean(data.site.staffDailyPinSet));
      }
      setPinDraft("");
      setClearPin(false);
      setMessage("บันทึกแล้ว");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }



  return (

    <AppDashboardSection tone="violet" className={parkingCardLargeRadiusClass}>

      <AppSectionHeader

        tone="violet"

        title="ตั้งค่าลานจอด"

        description="พื้นฐาน · การเงิน · การจองเหมารายวัน · สะสมคะแนน · ลิงก์ / QR"

      />



      <div className="mt-3 w-full sm:hidden">

        <label htmlFor="parking-settings-menu-mobile" className="mb-1.5 block text-[11px] font-black text-[#4d47b6]">

          กรุณาเลือกหมวดตั้งค่า

        </label>

        <select

          id="parking-settings-menu-mobile"

          className={parkingMobileSelectClass}

          value={tab}

          onChange={(e) => selectTab(parseSettingsTab(e.target.value))}

        >

          {SETTINGS_TABS.map((t) => (

            <option key={t.id} value={t.id}>

              {t.label}

            </option>

          ))}

        </select>

      </div>



      <div className="mt-3 hidden sm:block">

        <nav className={parkingPrimaryTabShellClass} role="tablist" aria-label="หมวดตั้งค่าลานจอด">

          {SETTINGS_TABS.map((t) => {

            const active = tab === t.id;

            return (

              <button

                key={t.id}

                type="button"

                role="tab"

                id={`parking-settings-tab-${t.id}`}

                aria-selected={active}

                aria-controls={`parking-settings-panel-${t.id}`}

                className={parkingPrimaryTabPillClass(active)}

                onClick={() => selectTab(t.id)}

              >

                {t.label}

              </button>

            );

          })}

        </nav>

      </div>

      {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}



      {tab === "basic" ? (

        <div

          id="parking-settings-panel-basic"

          role="tabpanel"

          aria-labelledby="parking-settings-tab-basic"

          className="mt-4 space-y-3 text-left"

        >

          <AppShopLogoField
            logoUrl={profile.logoUrl}
            fallbackLabel={profile.name}
            uploadUrl="/api/parking/upload-logo"
            onLogoUrlChange={(url) => setProfile((current) => ({ ...current, logoUrl: url }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อร้าน / ลานจอด</span>
              <input className={parkingField} value={profile.name} maxLength={120} onChange={(e) => setProfile((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">เบอร์ติดต่อ</span>
              <input className={parkingField} value={profile.contactPhone ?? ""} onChange={(e) => setProfile((f) => ({ ...f, contactPhone: e.target.value }))} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คำโปรย / หมายเหตุ</span>
            <input className={parkingField} value={profile.tagline ?? ""} onChange={(e) => setProfile((f) => ({ ...f, tagline: e.target.value }))} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ที่อยู่ (ไม่บังคับ)</span>
            <textarea className={`${parkingField} min-h-[84px]`} value={profile.address ?? ""} onChange={(e) => setProfile((f) => ({ ...f, address: e.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">LINE ID</span>
              <input className={parkingField} value={profile.lineId ?? ""} onChange={(e) => setProfile((f) => ({ ...f, lineId: e.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">Facebook URL</span>
              <input className={parkingField} value={profile.facebookUrl ?? ""} onChange={(e) => setProfile((f) => ({ ...f, facebookUrl: e.target.value }))} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ลิงก์แผนที่</span>
            <input className={parkingField} value={profile.mapUrl ?? ""} onChange={(e) => setProfile((f) => ({ ...f, mapUrl: e.target.value }))} />
          </label>
          <button type="button" className={parkingBtnPrimary} disabled={saving || !profile.name.trim()} onClick={() => void saveSite(profile)}>
            {saving ? "กำลังบันทึก…" : "บันทึกข้อมูลร้าน"}
          </button>
        </div>

      ) : null}

      {tab === "booking" ? (
        <div id="parking-settings-panel-booking" role="tabpanel" aria-labelledby="parking-settings-tab-booking" className="mt-4 text-left">
          <ParkingBookingPaymentSettings initialMode={bookingPaymentMode} initialPercent={depositPercent} />
        </div>
      ) : null}

      {tab === "portal" ? (
        <div id="parking-settings-panel-portal" role="tabpanel" aria-labelledby="parking-settings-tab-portal" className="mt-4 space-y-4 text-left">
          <ModuleQrMonthlyGate moduleSlug={PARKING_MODULE_SLUG} title="ตั้งค่าเว็ปลิงค์ลูกค้า">
          <div className="rounded-2xl border border-white/60 bg-white/45 p-4">
            <p className="text-xs font-black text-[#4d47b6]">ลิงก์เว็บไซต์จองลูกค้า</p>
            <p className="mt-2 break-all rounded-xl bg-white/75 p-3 text-xs font-semibold text-[#66638c]">{publicPortalUrl}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-xl border border-white/70 bg-white/80 px-4 text-xs font-black text-[#4d47b6]" onClick={() => void navigator.clipboard.writeText(publicPortalUrl)}>คัดลอกลิงก์</button>
              <a href={publicPortalUrl} target="_blank" rel="noreferrer" className="app-btn-primary inline-flex min-h-11 items-center rounded-xl px-4 text-xs font-black">เปิดเว็บไซต์จอง</a>
            </div>
          </div>
          <ParkingPortalMediaSettings initialBannerUrl={portalBannerUrl} initialGallery={portalGallery} />
          <ParkingReviewsSettings />
          <ParkingBookingPaymentSettings initialMode={bookingPaymentMode} initialPercent={depositPercent} />
          </ModuleQrMonthlyGate>
        </div>
      ) : null}

      {tab === "loyalty" ? (
        <div id="parking-settings-panel-loyalty" role="tabpanel" aria-labelledby="parking-settings-tab-loyalty" className="mt-4 text-left">
          <ParkingLoyaltySettings
            initialEnabled={loyaltyEnabled}
            initialBahtPerPoint={loyaltyBahtPerPoint}
            initialPointsPerUnit={loyaltyPointsPerUnit}
          />
        </div>
      ) : null}



      {tab === "finance" ? (

        <div

          id="parking-settings-panel-finance"

          role="tabpanel"

          aria-labelledby="parking-settings-tab-finance"

          className="mt-4 space-y-3 text-left"

        >

          <p className="text-sm text-[#66638c]">โหมดคิดเงินและอัตรา — ใช้ตั้งแต่เช็คอินรอบถัดไป</p>

          <ParkingSiteSettingsForm

            initialName={initialName}

            initialMode={initialMode}

            initialHourly={initialHourly}

            initialDaily={initialDaily}

            initialMonthly={initialMonthly}

            showName={false}

          />
          <ParkingPaymentAccountForm initial={{ promptPayPhone, bankName, bankAccountNumber, bankAccountName }} />
          <AppStaffDailyPinSettingsField
            fieldClassName={parkingField}
            pinSet={pinIsSet}
            pinDraft={pinDraft}
            onPinDraftChange={setPinDraft}
            clearPin={clearPin}
            onClearPinChange={setClearPin}
            disabled={saving}
          />
          <button type="button" className={parkingBtnPrimary} disabled={saving} onClick={() => void saveSite(staffDailyPinPatchBody({ pinDraft, clearPin }))}>
            {saving ? "กำลังบันทึก…" : "บันทึกรหัสพนักงาน"}
          </button>

        </div>

      ) : null}



      {tab === "links" ? (

        <div

          id="parking-settings-panel-links"

          role="tabpanel"

          aria-labelledby="parking-settings-tab-links"

          className="mt-4 text-left"

        >

          <ParkingPortalHubClient

            lots={qrLots}

            spots={qrSpots}

            businessName={profile.name || businessName}

            logoUrl={profile.logoUrl}

            baseUrl={baseUrl}
            ownerId={ownerId}
            trialSessionId={trialSessionId}

          />

        </div>

      ) : null}

    </AppDashboardSection>

  );

}



export function ParkingSettingsClient(props: ParkingSettingsClientProps) {

  return (

    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.5rem] bg-white/30" aria-busy />}>

      <ParkingSettingsInner {...props} />

    </Suspense>

  );

}


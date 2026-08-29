"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingSiteSettingsForm } from "@/systems/parking/components/ParkingSiteSettingsForm";
import { PARKING_SPOTS_HREF } from "@/systems/parking/parking-module-nav";
import {
  parkingCardLargeRadiusClass,
  parkingMobileSelectClass,
  parkingPrimaryTabPillClass,
  parkingPrimaryTabShellClass,
} from "@/systems/parking/parking-ui-tokens";

type SettingsTab = "basic" | "finance" | "links";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน" },
  { id: "links", label: "ลิงก์ / QR" },
];

function parseSettingsTab(raw: string | null): SettingsTab {
  if (raw === "finance" || raw === "links") return raw;
  return "basic";
}

export type ParkingSettingsClientProps = {
  initialName: string;
  initialMode: "HOURLY" | "DAILY";
  initialHourly: number | null;
  initialDaily: number | null;
};

function ParkingSettingsInner({
  initialName,
  initialMode,
  initialHourly,
  initialDaily,
}: ParkingSettingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));

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

  return (
    <AppDashboardSection tone="violet" className={parkingCardLargeRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title="ตั้งค่าลานจอด"
        description="พื้นฐาน · การเงิน (อัตราค่าจอด) · ลิงก์ / QR เช็คอิน"
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

      {tab === "basic" ? (
        <div
          id="parking-settings-panel-basic"
          role="tabpanel"
          aria-labelledby="parking-settings-tab-basic"
          className="mt-4 space-y-3 text-left"
        >
          <p className="text-sm text-[#66638c]">ชื่อลานจอดที่แสดงบนแดชบอร์ดและเอกสาร</p>
          <ParkingSiteSettingsForm
            initialName={initialName}
            initialMode={initialMode}
            initialHourly={initialHourly}
            initialDaily={initialDaily}
            showPricing={false}
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
            showName={false}
          />
        </div>
      ) : null}

      {tab === "links" ? (
        <div
          id="parking-settings-panel-links"
          role="tabpanel"
          aria-labelledby="parking-settings-tab-links"
          className="mt-4 space-y-4 text-left"
        >
          <p className="text-sm text-[#66638c]">
            แต่ละช่องจอดมีลิงก์ / QR เช็คอินของตัวเอง — จัดการและพิมพ์ได้ที่หน้าการจัดการ
          </p>
          <Link
            href={PARKING_SPOTS_HREF}
            className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold")}
          >
            ไปหน้าการจัดการช่องจอด
          </Link>
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

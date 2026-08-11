"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LoyaltyStampQrHubCard } from "@/systems/loyalty-stamp/components/LoyaltyStampQrHubCard";
import { LoyaltyStampSettingsClient } from "@/systems/loyalty-stamp/components/LoyaltyStampSettingsClient";
import { LoyaltyStampStampPanelClient } from "@/systems/loyalty-stamp/components/LoyaltyStampStampPanelClient";
import { LoyaltyStampStatCard } from "@/systems/loyalty-stamp/components/LoyaltyStampStatCard";
import type { LoyaltyStampDashboardDto } from "@/systems/loyalty-stamp/lib/load-dashboard";
import { lsListRowCardClass, lsSectionFirstClass, lsSectionNextClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type HubProps = {
  ownerId: string;
  trialSessionId: string;
  initial: LoyaltyStampDashboardDto;
  baseUrl: string;
  trialExportBlocked: boolean;
  qrLogoUrl?: string | null;
  qrShopLabel?: string;
  settingsInitial: React.ComponentProps<typeof LoyaltyStampSettingsClient>["initial"];
  children: React.ReactNode;
};

function HubTabs({
  ownerId,
  trialSessionId,
  initial,
  baseUrl,
  trialExportBlocked,
  qrLogoUrl = null,
  qrShopLabel,
  settingsInitial,
  children,
}: HubProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const shopLabel = qrShopLabel?.trim() || initial.profile.displayName?.trim() || "สะสมแต้มดิจิทัล";

  return (
    <>
      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "stamp" ? <LoyaltyStampStampPanelClient shopName={shopLabel} /> : null}
      {tab === "qr" ? (
        <section className={lsSectionFirstClass}>
          <LoyaltyStampQrHubCard
            ownerId={ownerId}
            shopLabel={shopLabel}
            logoUrl={qrLogoUrl}
            baseUrl={baseUrl}
            trialSessionId={trialSessionId}
            trialExportBlocked={trialExportBlocked}
          />
        </section>
      ) : null}
      {tab === "settings" ? (
        <LoyaltyStampSettingsClient initial={settingsInitial} />
      ) : null}
    </>
  );
}

export function LoyaltyStampDashboardHubClient(props: HubProps) {
  return (
    <Suspense fallback={<div className="h-16 animate-pulse rounded-[2rem] bg-white/30" aria-busy />}>
      <HubTabs {...props} />
    </Suspense>
  );
}

export function LoyaltyStampOverviewSections({
  ownerId,
  trialSessionId,
  initial,
  baseUrl,
  trialExportBlocked,
}: Omit<HubProps, "children" | "settingsInitial">) {
  const shopLabel = initial.profile.displayName?.trim() || "สะสมแต้มดิจิทัล";

  return (
    <>
      <section className={lsSectionFirstClass} aria-label="สถิติ">
        <h2 className="text-left text-lg font-bold text-[#2e2a58]">ภาพรวมวันนี้</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LoyaltyStampStatCard title="สมาชิกทั้งหมด" value={initial.stats.members} tone="indigo" />
          <LoyaltyStampStatCard title="เพิ่มแต้มวันนี้" value={initial.stats.stampsToday} tone="violet" />
          <LoyaltyStampStatCard title="แลกรางวัลวันนี้" value={initial.stats.redemptionsToday} tone="emerald" />
          <LoyaltyStampStatCard
            title="พร้อมแลก"
            value={initial.stats.readyToRedeem}
            tone="amber"
            colSpanMobile
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      <section className={lsSectionNextClass}>
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="เพิ่มแต้มด่วน"
            description="ไปหน้าเพิ่มแต้มเต็มรูปแบบ"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <Link
                href="/dashboard/loyalty-stamp?tab=stamp"
                aria-label="ไปหน้าเพิ่มแต้ม"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl sm:min-w-0 sm:px-4",
                )}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <polygon points="12 2 15 8.5 22 9.3 17 14.5 18.2 22 12 18.8 5.8 22 7 14.5 2 9.3 9 8.5 12 2" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">เพิ่มแต้ม</span>
              </Link>
            }
          />
          {initial.recentMembers.length === 0 ? (
            <p className="text-left text-sm text-[#66638c]">ยังไม่มีสมาชิก — แชร์ QR ให้ลูกค้าเปิดการ์ด</p>
          ) : (
            <ul className="space-y-2">
              {initial.recentMembers.map((m) => (
                <li key={m.id} className={lsListRowCardClass}>
                  <p className="font-bold text-[#1e1b4b]">
                    {m.customerName || "ลูกค้า"} · {m.phone}
                  </p>
                  <p className="text-sm text-[#66638c]">
                    {m.currentStamps}/{m.stampsPerReward} แต้ม
                    {m.readyToRedeem ? " · พร้อมแลก" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      </section>

    </>
  );
}

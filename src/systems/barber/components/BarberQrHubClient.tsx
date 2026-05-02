"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { BarberQrPosterClient } from "@/systems/barber/components/BarberQrPosterClient";
import { BarberStaffQrDashboardSection } from "@/systems/barber/components/BarberStaffQrDashboardSection";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";

export type BarberQrHubTab = "customer" | "staff";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialExportBlocked: boolean;
  isTrialSandbox: boolean;
  trialSessionId: string;
};

function TabIconCustomer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TabIconStaff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

export function BarberQrHubClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked,
  isTrialSandbox,
  trialSessionId,
}: Props) {
  const [tab, setTab] = useState<BarberQrHubTab>("customer");

  const tabBtn = (active: boolean) =>
    cn(
      `flex min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2 ${barberCardSurfaceRadiusClass} px-3 text-sm font-black transition-all sm:min-h-[46px]`,
      active ?
        "bg-white text-[#5b61ff] shadow-[0_12px_28px_-16px_rgba(91,97,255,0.55)] ring-1 ring-white/95"
      : "text-[#5f5a8a] hover:bg-white/55 hover:text-[#1e1b4b] active:scale-[0.99]",
    );

  return (
    <div className="min-w-0 space-y-6">
      <div
        className={cn(
          barberCardSurfaceRadiusClass,
          "flex gap-1 border border-white/55 bg-white/30 p-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] ring-1 ring-inset ring-white/45 backdrop-blur-md",
        )}
        role="tablist"
        aria-label="สลับประเภท QR"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "customer"}
          id="barber-qr-tab-customer"
          className={tabBtn(tab === "customer")}
          onClick={() => setTab("customer")}
        >
          <TabIconCustomer className="h-4 w-4 shrink-0 opacity-90" />
          <span>ลูกค้า</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "staff"}
          id="barber-qr-tab-staff"
          className={tabBtn(tab === "staff")}
          onClick={() => setTab("staff")}
        >
          <TabIconStaff className="h-4 w-4 shrink-0 opacity-90" />
          <span>พนักงาน</span>
        </button>
      </div>

      <div
        className="min-w-0"
        role="tabpanel"
        aria-labelledby={tab === "customer" ? "barber-qr-tab-customer" : "barber-qr-tab-staff"}
      >
        {tab === "customer" ?
          <BarberQrPosterClient
            ownerId={ownerId}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            trialExportBlocked={trialExportBlocked}
            embedded
          />
        : <BarberStaffQrDashboardSection
            ownerId={ownerId}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            trialExportBlocked={trialExportBlocked}
            isTrialSandbox={isTrialSandbox}
            trialSessionId={trialSessionId}
            hideDashboardBackLink
          />
        }
      </div>
    </div>
  );
}

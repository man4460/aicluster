"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { parseLaundryDashboardTab } from "@/systems/laundry/laundry-module-nav";
import { laundryPageStackClass } from "@/systems/laundry/lib/ui-tokens";

function LaundryDashboardHubTabs({
  children,
  ordersPanel,
  onlinePanel,
}: {
  children: React.ReactNode;
  ordersPanel: React.ReactNode;
  onlinePanel: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseLaundryDashboardTab(searchParams.get("tab")), [searchParams]);
  return (
    <div className={laundryPageStackClass}>
      {tab === "overview" ? children : null}
      {tab === "orders" ? ordersPanel : null}
      {tab === "online" ? onlinePanel : null}
    </div>
  );
}

export function LaundryDashboardHubClient({
  children,
  ordersPanel,
  onlinePanel,
}: {
  children: React.ReactNode;
  ordersPanel: React.ReactNode;
  onlinePanel: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className={cn(laundryPageStackClass)} aria-busy />}>
      <LaundryDashboardHubTabs ordersPanel={ordersPanel} onlinePanel={onlinePanel}>
        {children}
      </LaundryDashboardHubTabs>
    </Suspense>
  );
}
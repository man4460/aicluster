"use client";

import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { UsedCarShowroomModuleChrome } from "@/systems/used-car-showroom/components/UsedCarShowroomModuleChrome";

export function UsedCarShowroomModuleShell({
  children,
  shopName,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  shopName?: string;
  trialExpiresLabel?: string | null;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 sm:gap-6")}>
      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      ) : null}
      <UsedCarShowroomModuleChrome shopName={shopName}>{children}</UsedCarShowroomModuleChrome>
    </div>
  );
}

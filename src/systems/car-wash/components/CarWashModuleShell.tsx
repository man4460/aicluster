"use client";

import { usePathname } from "next/navigation";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { isCarWashSettingsActive } from "@/systems/car-wash/car-wash-module-nav";
import { CarWashModuleChrome } from "@/systems/car-wash/components/CarWashModuleChrome";

export function CarWashModuleShell({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const onSettings = isCarWashSettingsActive(pathname);

  const content = onSettings ? <CarWashModuleChrome>{children}</CarWashModuleChrome> : children;

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6")}>
      {trialExpiresLabel ?
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      : null}
      {content}
    </div>
  );
}

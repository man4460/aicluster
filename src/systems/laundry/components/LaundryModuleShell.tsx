"use client";

import { usePathname } from "next/navigation";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { LaundryModuleChrome } from "@/systems/laundry/components/LaundryModuleChrome";
import { LAUNDRY_STAFF_PATH } from "@/systems/laundry/laundry-module-nav";

export function LaundryModuleShell({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const staffKiosk = pathname === LAUNDRY_STAFF_PATH;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 sm:gap-6", staffKiosk && "max-w-none !p-0")}>
      {trialExpiresLabel ?
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      : null}
      {staffKiosk ? children : <LaundryModuleChrome>{children}</LaundryModuleChrome>}
    </div>
  );
}

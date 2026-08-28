"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LaundryLayoutChrome } from "@/systems/laundry/components/LaundryLayoutChrome";

const LAUNDRY_STAFF_KIOSK_PATH = "/dashboard/laundry/staff";

export function LaundryModuleShell({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = usePathname() ?? "";
  const staffKiosk = pathname === LAUNDRY_STAFF_KIOSK_PATH;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        staffKiosk && "max-w-none !p-0",
      )}
    >
      <LaundryLayoutChrome trialExpiresLabel={trialExpiresLabel}>{children}</LaundryLayoutChrome>
    </div>
  );
}

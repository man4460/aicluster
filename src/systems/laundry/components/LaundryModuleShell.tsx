"use client";

import { usePathname } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
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
    <PageContainer
      size={staffKiosk ? "full" : "default"}
      className={cn(
        "!px-0 !pb-0",
        staffKiosk && "max-w-none flex min-h-0 flex-1 flex-col !p-0",
      )}
    >
      <LaundryLayoutChrome trialExpiresLabel={trialExpiresLabel}>{children}</LaundryLayoutChrome>
    </PageContainer>
  );
}

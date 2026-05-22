"use client";

import { usePathname } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/cn";
import { MassageLayoutChrome } from "@/systems/massage/components/MassageLayoutChrome";

/** หน้าพนักงานจาก QR — เต็มความกว้าง ลดขอบซ้ำกับโหมด kiosk */
const BARBER_STAFF_KIOSK_PATH = "/dashboard/massage/staff";

export function MassageModuleShell({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = usePathname() ?? "";
  const staffKiosk = pathname === BARBER_STAFF_KIOSK_PATH;

  return (
    <PageContainer
      size={staffKiosk ? "full" : "default"}
      className={cn(
        "!px-0",
        staffKiosk && "max-w-none flex min-h-0 flex-1 flex-col !p-0",
      )}
    >
      <MassageLayoutChrome trialExpiresLabel={trialExpiresLabel}>{children}</MassageLayoutChrome>
    </PageContainer>
  );
}

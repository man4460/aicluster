"use client";

import { usePathname } from "next/navigation";
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
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        staffKiosk && "max-w-none !p-0",
      )}
    >
      <MassageLayoutChrome trialExpiresLabel={trialExpiresLabel}>{children}</MassageLayoutChrome>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { BARBER_STAFF_KIOSK_PATH } from "@/systems/barber/barber-module-nav";
import { BarberLayoutChrome } from "@/systems/barber/components/BarberLayoutChrome";

export function BarberModuleShell({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = usePathname() ?? "";
  const staffKiosk = pathname === BARBER_STAFF_KIOSK_PATH;

  return (
    <div className={cn("min-w-0", staffKiosk && "flex h-full min-h-0 flex-1 flex-col")}>
      <BarberLayoutChrome trialExpiresLabel={staffKiosk ? null : trialExpiresLabel}>{children}</BarberLayoutChrome>
    </div>
  );
}

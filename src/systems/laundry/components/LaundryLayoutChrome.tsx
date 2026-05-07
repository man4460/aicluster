"use client";

import { usePathname } from "next/navigation";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";

const LAUNDRY_STAFF_KIOSK_PATH = "/dashboard/laundry/staff";

/** Chrome ชั้นโมดูล — แถบทดลอง + เว้นที่ dock มือถือ (โหมดเต็มเท่านั้น) */
export function LaundryLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel: string | null;
}) {
  const pathname = usePathname() ?? "";
  const staffKiosk = pathname === LAUNDRY_STAFF_KIOSK_PATH;

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", !staffKiosk && "max-md:pb-20 md:pb-0")}>
      {trialExpiresLabel ?
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      : null}
      {children}
    </div>
  );
}

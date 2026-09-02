"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { LaundryCheckInModal } from "@/systems/laundry/components/LaundryCheckInModal";
import { LaundryDashboardSubNavInline } from "@/systems/laundry/components/LaundryDashboardSubNavInline";
import { LaundrySellPackageModal } from "@/systems/laundry/components/LaundrySellPackageModal";
import { laundryHeaderActionBtnClass } from "@/systems/laundry/lib/ui-tokens";

function IconDeduct({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPackageSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.5 4.21 9 5.19M7.5 19.79V14.6L3 12M21 12l-4.5 2.6v5.19M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** แท็บย่อย + ปุ่มหักแพ็ก/ขายแพ็ก — มุมขวาบนในการ์ดแดชบอร์ด */
export function LaundryDashboardHeaderToolbar({ className }: { className?: string }) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <>
      <div className={cn("flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5", className)}>
        <LaundryDashboardSubNavInline />
        <span className="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />
        <button
          type="button"
          onClick={() => setCheckInOpen(true)}
          className={laundryHeaderActionBtnClass("deduct")}
          aria-label="หักแพ็กสมาชิก"
          title="หักแพ็ก"
        >
          <IconDeduct className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">หักแพ็ก</span>
        </button>
        <button
          type="button"
          onClick={() => setSellOpen(true)}
          className={laundryHeaderActionBtnClass("sell")}
          aria-label="ขายแพ็กเหมา"
          title="ขายแพ็ก"
        >
          <IconPackageSpark className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">ขายแพ็ก</span>
        </button>
      </div>

      <LaundryCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onRequestSell={() => {
          setCheckInOpen(false);
          setSellOpen(true);
        }}
      />
      <LaundrySellPackageModal open={sellOpen} onClose={() => setSellOpen(false)} />
    </>
  );
}

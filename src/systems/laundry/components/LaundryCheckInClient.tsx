"use client";

import { type ReactNode, useState } from "react";
import { AppDashboardSection } from "@/components/app-templates";
import { LaundryCheckInForm } from "@/systems/laundry/components/LaundryCheckInForm";
import { LaundrySellPackageModal } from "@/systems/laundry/components/LaundrySellPackageModal";
import {
  laundryPageStackClass,
  laundrySectionNextClass,
  laundrySubtitleClass,
} from "@/systems/laundry/lib/ui-tokens";

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

export function LaundryCheckInClient({
  headerToolbar = null,
}: {
  headerToolbar?: ReactNode;
} = {}) {
  const [sellModalOpen, setSellModalOpen] = useState(false);

  return (
    <AppDashboardSection tone="slate">
      <div className={laundryPageStackClass}>
        {headerToolbar ? (
          <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h2 className="shrink-0 text-base font-black leading-none tracking-tight text-[#1e1b4b] sm:text-lg">
              รับผ้า / หักแพ็ก
            </h2>
            <div className="flex w-full justify-end sm:w-auto">{headerToolbar}</div>
          </div>
        ) : null}

        <LaundryCheckInForm variant="page" onRequestSell={() => setSellModalOpen(true)} />

        <section className={laundrySectionNextClass} aria-label="บันทึกด่วน">
          <div className="relative overflow-hidden rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-[#f5f3ff] p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold tracking-tight text-[#2e2a58]">บันทึกด่วน</h2>
            <p className={laundrySubtitleClass}>เปิดแพ็กเหมาให้ลูกค้า</p>
            <button
              type="button"
              onClick={() => setSellModalOpen(true)}
              className="app-btn-primary mt-4 flex min-h-[3.75rem] w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:brightness-[1.05] active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/25 text-white">
                <IconPackageSpark className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">ขายแพ็กเหมา</span>
                <span className="mt-0.5 block text-xs font-medium text-white/90">เลือกแพ็ก · เบอร์ · ชำระเงิน</span>
              </span>
            </button>
          </div>
        </section>

        <LaundrySellPackageModal
          open={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          onSuccess={() => setSellModalOpen(false)}
        />
      </div>
    </AppDashboardSection>
  );
}

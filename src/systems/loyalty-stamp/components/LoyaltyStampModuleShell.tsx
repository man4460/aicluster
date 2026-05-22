"use client";

import { Suspense } from "react";
import { cn } from "@/lib/cn";
import {
  LoyaltyStampModuleDesktopNav,
  LoyaltyStampModuleMobileDock,
} from "@/systems/loyalty-stamp/components/LoyaltyStampModuleHeader";
import { lsModuleHeaderShellClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

export function LoyaltyStampModuleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-full space-y-4 pb-20 sm:space-y-6 md:pb-0">
      <header className={cn(lsModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#f06dc8] text-white shadow-lg shadow-indigo-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M8 9h8M8 13h5" strokeLinecap="round" />
                  <circle cx="17" cy="9" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">สะสมแต้มดิจิทัล</h1>
                <p className="hidden text-xs font-bold text-slate-500 md:block">
                  ร้านกดเพิ่มแต้ม · ลูกค้าเปิดลิงก์ดูการ์ด — ไม่ต้องโหลดแอป
                </p>
              </div>
            </div>
          </div>
        </div>
        <Suspense fallback={null}>
          <LoyaltyStampModuleDesktopNav />
        </Suspense>
      </header>
      {children}
      <Suspense fallback={null}>
        <LoyaltyStampModuleMobileDock />
      </Suspense>
    </div>
  );
}

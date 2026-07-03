"use client";

import { Suspense } from "react";
import { cn } from "@/lib/cn";
import {
  AppointmentQueueModuleDesktopNav,
  AppointmentQueueModuleMobileDock,
} from "@/systems/appointment-queue/components/AppointmentQueueModuleHeader";
import { aqIconBadgeClass, aqModuleHeaderShellClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

export function AppointmentQueueModuleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 lg:pb-0">
      <header className={cn(aqModuleHeaderShellClass, "print:hidden")}>
        <div className="flex items-start gap-3">
          <div className={aqIconBadgeClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 11h18" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">จองคิวอัจฉริยะ</h1>
            <p className="mt-1 hidden max-w-2xl text-sm text-[#66638c] md:block">
              ลูกค้าสแกน QR จองเวลา · ตั้งตารางเปิดร้าน · บอร์ดคิวลากสถานะ
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <AppointmentQueueModuleDesktopNav />
        </Suspense>
      </header>
      {children}
      <Suspense fallback={null}>
        <AppointmentQueueModuleMobileDock />
      </Suspense>
    </div>
  );
}

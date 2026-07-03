"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppMobileDockShell, AppUsageGuideModal, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { parkingValetHeaderShellClass } from "@/systems/parking/parking-valet-ui";

function dockLinkClass(active: boolean) {
  return cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" strokeLinecap="round" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .65.37 1.25.97 1.55z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV: { href: string; label: string; icon: typeof IconHome }[] = [
  { href: "/dashboard/wait-queue", label: "คิววันนี้", icon: IconHome },
  { href: "/dashboard/wait-queue/settings", label: "ตั้งค่า", icon: IconGear },
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/wait-queue") {
    return pathname === "/dashboard/wait-queue";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const guideSections = [
  {
    title: "ภาพรวม",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>พนักงานลงคิวลูกค้า walk-in พร้อมจำนวนคนและชื่อเรียก (ถ้ามี)</li>
        <li>กดเรียกคิวถัดไป หรือเรียกจากแถวรายการ — แถบด้านบนจะแสดงเลขคิวที่ถึงคิวและข้อความเชิญเข้าร้าน</li>
      </ul>
    ),
  },
  {
    title: "สถานะ",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-bold text-[#1e1b4b]">กำลังรอ</strong> → เรียกแล้วจะเป็น{' '}
          <strong className="font-bold text-[#1e1b4b]">เรียกแล้ว</strong>
        </li>
        <li>
          ยืนยันเมื่อลูกค้าเข้าร้าน → <strong className="font-bold text-[#1e1b4b]">เข้าร้านแล้ว</strong> หรือข้ามถ้าไม่มา
        </li>
      </ul>
    ),
  },
];

export function WaitQueueShell({
  siteName,
  children,
}: {
  siteName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 pb-24 sm:gap-6 lg:pb-0">
        <div className={parkingValetHeaderShellClass}>
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#f06dc8] text-white shadow-lg shadow-indigo-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                      <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">คิวหน้าร้าน</p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">จัดการคิว Walk-in</h1>
                    <p className="mt-0.5 truncate text-xs font-bold text-slate-500">{siteName}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setGuideOpen(true)}
                className="flex h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
                aria-label="เปิดคู่มือการใช้งาน"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือ</span>
              </button>
            </div>
          </header>

          <nav aria-label="เมนูคิวหน้าร้าน" className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden">
            <ul className="flex gap-1">
              {NAV.map((item) => {
                const active = navActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-sm font-black transition-all",
                        active
                          ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
                          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>

      <AppMobileDockShell ariaLabel="เมนูล่างคิวหน้าร้าน">
        <ul className={cn(appMobileDockGridClass, "grid-cols-2")}>
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={dockLinkClass(active)}
                  title={item.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือการใช้งาน — คิวหน้าร้าน"
        subtitle="ลงคิว · เรียกคิว · เข้าร้าน"
        sections={guideSections}
      />
    </div>
  );
}

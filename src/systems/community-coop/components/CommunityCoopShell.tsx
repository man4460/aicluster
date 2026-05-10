"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { parkingValetHeaderShellClass } from "@/systems/parking/parking-valet-ui";

const dockShellClass = cn(
  "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
  "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-white/55 via-amber-50/30 to-orange-50/25",
  "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
);

function dockLinkClass(active: boolean) {
  return cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/85 text-amber-800 shadow-md ring-1 ring-amber-200/90 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" strokeLinecap="round" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .65.37 1.25.97 1.55z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV: { href: string; label: string; icon: typeof IconHome }[] = [
  { href: "/dashboard/community-coop", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/community-coop/members", label: "สมาชิก", icon: IconUsers },
  { href: "/dashboard/community-coop/settings", label: "ตั้งค่า", icon: IconGear },
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/community-coop") {
    return pathname === "/dashboard/community-coop";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const guideSections = [
  {
    title: "ภาพรวม",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-amber-700">
        <li>ติดตามยอดเงินรวม หน่วยหุ้น และสมาชิก</li>
        <li>ฝาก ถอน หรือบันทึกปันผลจำลองได้จากปุ่มทำรายการ</li>
      </ul>
    ),
  },
  {
    title: "สมาชิก",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-amber-700">
        <li>ลงทะเบียนสมาชิกด้วยรหัสและชื่อ — ระบุกลุ่ม/หมู่บ้านและจำนวนหุ้น</li>
      </ul>
    ),
  },
];

export function CommunityCoopShell({
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 pb-24 sm:gap-6 md:pb-0">
        <div className={parkingValetHeaderShellClass}>
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/90">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5" aria-hidden>
                      <circle cx="9" cy="12" r="4" />
                      <path d="M15 8l6 4-6 4v-2H9V10h6V8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">สหกรณ์ชุมชน</p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ออมทรัพย์ชุมชน</h1>
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
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือ</span>
              </button>
            </div>
          </header>

          <nav aria-label="เมนูสหกรณ์ชุมชน" className="mt-5 hidden border-t border-white/40 pt-5 md:block print:hidden">
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
                          ? "bg-white/75 text-amber-800 shadow-md ring-1 ring-white/80 backdrop-blur-sm"
                          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-amber-700" : "text-slate-400")} />
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

      <nav className={dockShellClass} aria-label="เมนูล่างสหกรณ์ชุมชน">
        <ul className="grid grid-cols-3 gap-1">
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
      </nav>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือ — สหกรณ์ชุมชน"
        subtitle="สมาชิก · หุ้น · ฝาก–ถอน · ปันผล"
        sections={guideSections}
      />
    </div>
  );
}

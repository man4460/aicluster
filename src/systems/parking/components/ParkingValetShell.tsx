"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  parkingValetDesktopNavClass,
  parkingValetDockClass,
  parkingValetGlassShellClass,
  parkingValetNavBtnActive,
  parkingValetNavBtnIdle,
} from "@/systems/parking/parking-valet-ui";

const NAV: { href: string; label: string; short: string }[] = [
  { href: "/dashboard/parking", label: "แดชบอร์ด", short: "หน้าหลัก" },
  { href: "/dashboard/parking/check-in", label: "รับฝากรถ", short: "รับฝาก" },
  { href: "/dashboard/parking/check-out", label: "คืนรถ", short: "คืนรถ" },
  { href: "/dashboard/parking/map", label: "แผนผังที่จอด", short: "แผนที่" },
  { href: "/dashboard/parking/members", label: "สมาชิกรายเดือน", short: "สมาชิก" },
  { href: "/dashboard/parking/finance", label: "การเงิน", short: "การเงิน" },
  { href: "/dashboard/parking/staff", label: "พนักงาน / QR", short: "พนักงาน" },
  { href: "/dashboard/parking/settings", label: "ตั้งค่า", short: "ตั้งค่า" },
];

const DOCK_HREFS = [
  "/dashboard/parking",
  "/dashboard/parking/check-in",
  "/dashboard/parking/check-out",
  "/dashboard/parking/map",
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/parking") {
    return pathname === "/dashboard/parking";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ParkingValetShell({
  siteName,
  children,
}: {
  siteName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [moreOpen, setMoreOpen] = useState(false);

  const overflowNav = NAV.filter((n) => !DOCK_HREFS.includes(n.href as (typeof DOCK_HREFS)[number]));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 max-md:pb-24 md:pb-0">
        <header className={cn("p-4 sm:p-6", parkingValetGlassShellClass)}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/90">
                โมดูลจอดรถ
              </p>
              <h1 className="mt-1 bg-gradient-to-r from-emerald-800 to-sky-700 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
                บริการรับฝากจอดรถ
              </h1>
              <p className="mt-1 text-xs font-medium text-[#66638c] sm:text-sm">{siteName}</p>
            </div>
          </div>

          <nav className={cn(parkingValetDesktopNavClass)} aria-label="เมนูโมดูลที่จอดรถ">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                  navActive(pathname, item.href) ? parkingValetNavBtnActive : parkingValetNavBtnIdle,
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>

      <nav className={parkingValetDockClass} aria-label="เมนูล่างที่จอดรถ">
        {DOCK_HREFS.map((href) => {
          const meta = NAV.find((n) => n.href === href)!;
          const active = navActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-bold leading-tight",
                active ? parkingValetNavBtnActive : parkingValetNavBtnIdle,
              )}
            >
              <span className="line-clamp-2 text-center">{meta.short}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-label="เมนูเพิ่มเติม"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-bold leading-tight",
            moreOpen ? parkingValetNavBtnActive : parkingValetNavBtnIdle,
          )}
          onClick={() => setMoreOpen((o) => !o)}
        >
          เพิ่มเติม
        </button>
      </nav>

      {moreOpen ? (
        <>
          <button
            type="button"
            aria-label="ปิดเมนูเพิ่มเติม"
            className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[5.5rem] left-4 right-4 z-40 max-h-[min(50vh,320px)] overflow-y-auto rounded-[2rem] border border-emerald-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
            <ul className="space-y-1">
              {overflowNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-emerald-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

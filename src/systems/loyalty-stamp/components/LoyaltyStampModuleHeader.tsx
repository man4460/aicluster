"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  loyaltyStampTabIcon,
  type LoyaltyStampTabKey,
} from "@/systems/loyalty-stamp/loyalty-stamp-tab-icons";

const NAV: { key: LoyaltyStampTabKey; label: string; href: string }[] = [
  { key: "overview", label: "ภาพรวม", href: "/dashboard/loyalty-stamp" },
  { key: "stamp", label: "เพิ่มแต้ม", href: "/dashboard/loyalty-stamp?tab=stamp" },
  { key: "qr", label: "QR", href: "/dashboard/loyalty-stamp?tab=qr" },
  { key: "settings", label: "ตั้งค่า", href: "/dashboard/loyalty-stamp?tab=settings" },
];

function isActive(pathname: string, tab: string | null, key: LoyaltyStampTabKey) {
  if (key === "overview") return pathname.startsWith("/dashboard/loyalty-stamp") && (!tab || tab === "overview");
  return tab === key;
}

function tabLinkClass(active: boolean) {
  return cn(
    "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );
}

function dockLinkClass(active: boolean) {
  return cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );
}

export function LoyaltyStampModuleDesktopNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <nav
      aria-label="เมนูสะสมแต้ม"
      className="mt-5 hidden border-t border-white/40 pt-5 md:block print:hidden"
    >
      <ul className="flex gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, tab, item.key);
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                className={tabLinkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className={cn("h-4 w-4", active ? "text-[#5b61ff]" : "text-slate-400")}
                  aria-hidden
                >
                  {loyaltyStampTabIcon(item.key)}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LoyaltyStampModuleMobileDock() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <nav
      className={cn(
        "fixed inset-x-4 bottom-6 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
      )}
      aria-label="เมนูล่างสะสมแต้ม"
    >
      <ul className="grid grid-cols-4 gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, tab, item.key);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={dockLinkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5"
                  aria-hidden
                >
                  {loyaltyStampTabIcon(item.key)}
                </svg>
                <span className="text-[9px] font-black">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  IconSpCase,
  IconSpHome,
  IconSpReport,
  IconSpSettings,
  IconSpTemplate,
} from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceMainKeyFromPathname,
  smartPoliceMainMenuItems,
  type SmartPoliceMainKey,
} from "@/systems/smart-police/smart-police-nav";

function dockIcon(key: SmartPoliceMainKey) {
  if (key === "overview") return IconSpHome;
  if (key === "cases") return IconSpCase;
  if (key === "templates") return IconSpTemplate;
  if (key === "reports") return IconSpReport;
  return IconSpSettings;
}

function isActive(pathname: string, href: string, includes?: readonly string[]) {
  if (href === "/dashboard/smart-police") return pathname === href;
  if (includes?.some((p) => pathname.startsWith(p))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SmartPoliceMobileDock() {
  const pathname = usePathname() ?? "";
  const activeMain = smartPoliceMainKeyFromPathname(pathname);

  return (
    <nav
      className={cn(
        "fixed inset-x-4 z-40 grid grid-cols-5 gap-1 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
        "pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label="เมนูล่าง Smart Police"
    >
      {smartPoliceMainMenuItems.map((item) => {
        const active = activeMain === item.key || isActive(pathname, item.href, item.includes);
        const Icon = dockIcon(item.key);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-center transition-all active:scale-90",
              active
                ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20"
                : "text-slate-500 hover:bg-white/45",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[8px] font-black leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

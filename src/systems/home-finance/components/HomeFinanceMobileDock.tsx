"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";
import {
  hfDockItemActiveClass,
  hfDockItemIdleClass,
} from "@/systems/home-finance/components/home-finance-ui-tokens";

const items = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "ภาพรวม", icon: IconDashboard },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ", icon: IconHistory },
  { href: "/dashboard/home-finance/categories", section: "categories", label: "หมวด", icon: IconCategories },
  { href: "/dashboard/home-finance/documents", section: "documents", label: "เอกสาร", icon: IconDocuments },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "เตือน", icon: IconReminder },
] as const;

export function HomeFinanceMobileDock() {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);

  return (
    <AppMobileDockShell ariaLabel="เมนูล่างระบบรายรับรายจ่าย">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {items.map((item) => {
          const active = section === item.section;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 text-center transition-all active:scale-90",
                  active ? hfDockItemActiveClass : hfDockItemIdleClass,
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="text-[8px] font-black leading-none sm:text-[9px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCategories({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
    </svg>
  );
}

function IconDocuments({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h6M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

function IconReminder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

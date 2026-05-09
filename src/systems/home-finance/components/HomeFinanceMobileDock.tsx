"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";

type HomeFinanceDockItem = {
  href: string;
  section: "dashboard" | "history" | "manage" | "reminders";
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly ("categories" | "utilities" | "vehicles")[];
};

const items: readonly HomeFinanceDockItem[] = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "ภาพรวม", icon: IconDashboard },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ", icon: IconHistory },
  {
    href: "/dashboard/home-finance/categories",
    section: "manage",
    label: "จัดการ",
    icon: IconCategories,
    includes: ["categories", "utilities", "vehicles"] as const,
  },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "เตือน", icon: IconReminder },
] as const;

export function HomeFinanceMobileDock() {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);

  return (
    <nav
      aria-label="เมนูล่างระบบรายรับรายจ่าย"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/45 bg-gradient-to-r from-white/80 via-white/70 to-[#eef2ff]/75 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-4 gap-1 rounded-[2rem] border border-white/60 bg-white/65 p-1.5 shadow-[0_12px_38px_-18px_rgba(76,70,178,0.55)] ring-1 ring-white/65">
        {items.map((item) => {
          const active = section === item.section || Boolean(item.includes?.some((s) => s === section));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold tracking-tight transition",
                  active
                    ? "bg-gradient-to-b from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_10px_20px_-12px_rgba(77,71,182,0.9)]"
                    : "text-[#66638c] hover:bg-white/70",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCategories({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
    </svg>
  );
}

function IconReminder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}


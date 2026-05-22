"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  docDockItemActiveClass,
  docDockItemIdleClass,
  docMobileDockShellClass,
} from "@/systems/doc-transmission/doc-ui-tokens";

type DockItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const items: readonly DockItem[] = [
  { href: "/dashboard/doc-transmission", label: "ภาพรวม", icon: IconHome },
  {
    href: "/dashboard/doc-transmission/records/orders",
    label: "เอกสาร",
    icon: IconDoc,
    includes: ["/dashboard/doc-transmission/records"] as const,
  },
  {
    href: "/dashboard/doc-transmission/master",
    label: "ข้อมูลหลัก",
    icon: IconStack,
    includes: ["/dashboard/doc-transmission/settings"] as const,
  },
  { href: "/dashboard/doc-transmission/reports", label: "รายงาน", icon: IconReport },
] as const;

function isActive(pathname: string, href: string, includes?: readonly string[]) {
  if (href === "/dashboard/doc-transmission") return pathname === href;
  if (includes?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DocMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูล่าง สารบรรณดิจิทัล" className={docMobileDockShellClass}>
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.includes);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                  active ? docDockItemActiveClass : docDockItemIdleClass,
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  mrDockItemActiveClass,
  mrDockItemIdleClass,
  mrMobileDockShellClass,
} from "@/systems/media-registry/components/media-registry-ui-tokens";

type DockItem = { href: string; label: string; icon: (p: { className?: string }) => React.ReactNode };

const items: DockItem[] = [
  { href: "/dashboard/media-registry", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/media-registry/items", label: "ทะเบียน", icon: IconClipboard },
  { href: "/dashboard/media-registry/borrow", label: "ยืม", icon: IconSwap },
  { href: "/dashboard/media-registry/issues", label: "บันทึก", icon: IconAlert },
  { href: "/dashboard/media-registry/master", label: "หลัก", icon: IconDb },
];

function active(path: string, href: string) {
  if (href === "/dashboard/media-registry") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function MediaRegistryMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูล่าง ทะเบียนคุมสื่อ" className={mrMobileDockShellClass}>
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const on = active(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 text-center transition-all active:scale-90",
                  on ? mrDockItemActiveClass : mrDockItemIdleClass,
                )}
                aria-current={on ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", on ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="text-[9px] font-black leading-none">{item.label}</span>
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

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 4h6l1 3H8L9 4z" strokeLinejoin="round" />
      <path d="M8 7h8v13a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSwap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M7 8h11M7 8l3-3M7 8l3 3M17 16H6M17 16l-3 3M17 16l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 7v6M12 17h.01M10.3 4.2h3.4l8 14H2.3l8-14z" strokeLinejoin="round" />
    </svg>
  );
}

function IconDb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type DockItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const items: readonly DockItem[] = [
  { href: "/dashboard/attendance", label: "ภาพรวม", icon: IconHome },
  {
    href: "/dashboard/attendance/settings",
    label: "จัดการ",
    icon: IconSettings,
    includes: ["/dashboard/attendance/roster", "/dashboard/attendance/check"] as const,
  },
  { href: "/dashboard/attendance/logs", label: "รายงาน", icon: IconReport },
  { href: "/dashboard/attendance/qr", label: "QR", icon: IconQr },
] as const;

function isActive(pathname: string, href: string, includes?: readonly string[]) {
  if (href === "/dashboard/attendance") return pathname === href;
  if (includes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AttendanceMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="เมนูล่างเช็คอินอัจฉริยะ"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/45 bg-gradient-to-r from-white/80 via-white/70 to-[#eef2ff]/75 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-4 gap-1 rounded-[2rem] border border-white/60 bg-white/65 p-1.5 shadow-[0_12px_38px_-18px_rgba(76,70,178,0.55)] ring-1 ring-white/65">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.includes);
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

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconQr({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v7h-3M14 20h3" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.2 1.2 0 0 0 .24 1.32l.04.04a1.5 1.5 0 0 1 0 2.12 1.5 1.5 0 0 1-2.12 0l-.04-.04A1.2 1.2 0 0 0 16.2 18a1.2 1.2 0 0 0-1 .7 1.2 1.2 0 0 0-.1.5V19a1.5 1.5 0 1 1-3 0v-.08a1.2 1.2 0 0 0-.7-1.1 1.2 1.2 0 0 0-1.33.24l-.04.04a1.5 1.5 0 1 1-2.12-2.12l.04-.04A1.2 1.2 0 0 0 7 14.8a1.2 1.2 0 0 0-.5-.1H6.4a1.5 1.5 0 1 1 0-3h.08a1.2 1.2 0 0 0 1.1-.7 1.2 1.2 0 0 0-.24-1.33l-.04-.04A1.5 1.5 0 1 1 9.42 7.5l.04.04A1.2 1.2 0 0 0 10.8 7a1.2 1.2 0 0 0 .1-.5V6.4a1.5 1.5 0 1 1 3 0v.08a1.2 1.2 0 0 0 .7 1.1 1.2 1.2 0 0 0 1.33-.24l.04-.04a1.5 1.5 0 1 1 2.12 2.12l-.04.04A1.2 1.2 0 0 0 17 10.8c0 .17.03.34.1.5.18.43.6.7 1.06.7h.08a1.5 1.5 0 1 1 0 3h-.08a1.2 1.2 0 0 0-1.1.7Z" />
    </svg>
  );
}


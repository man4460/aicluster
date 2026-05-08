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
  { href: "/dashboard/educare", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/educare/check", label: "เช็ค", icon: IconCheck },
  {
    href: "/dashboard/educare/students",
    label: "จัดการ",
    icon: IconStack,
    includes: [
      "/dashboard/educare/classrooms",
      "/dashboard/educare/settings",
    ] as const,
  },
  { href: "/dashboard/educare/reports", label: "รายงาน", icon: IconReport },
] as const;

function isActive(pathname: string, href: string, includes?: readonly string[]) {
  if (href === "/dashboard/educare") return pathname === href;
  if (includes?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EducareMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="เมนูล่าง EduCare"
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
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

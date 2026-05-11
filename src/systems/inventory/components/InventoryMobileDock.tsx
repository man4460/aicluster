"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type DockItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

const items: readonly DockItem[] = [
  { href: "/dashboard/inventory", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/inventory/items", label: "สินค้า", icon: IconBox },
  { href: "/dashboard/inventory/warehouses", label: "คลัง", icon: IconWarehouse },
  { href: "/dashboard/inventory/movements", label: "เคลื่อนไหว", icon: IconArrows },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/inventory") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InventoryMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="เมนูล่าง คลังสต๊อกสินค้า"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/45 bg-gradient-to-r from-white/80 via-white/70 to-[#eef2ff]/75 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-4 gap-1 rounded-[2rem] border border-white/60 bg-white/65 p-1.5 shadow-[0_12px_38px_-18px_rgba(13,148,136,0.45)] ring-1 ring-white/65">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold tracking-tight transition",
                  active
                    ? "bg-gradient-to-b from-teal-500 to-emerald-600 text-white shadow-[0_10px_20px_-12px_rgba(13,148,136,0.85)]"
                    : "text-[#3f3a6a] hover:bg-white/70",
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

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconWarehouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 9 12 4l9 5v11H3z" strokeLinejoin="round" />
      <path d="M7 20v-7h10v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-3h4v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

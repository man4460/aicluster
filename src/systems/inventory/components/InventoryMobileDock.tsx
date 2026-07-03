"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockItemActiveClass,
  appMobileDockItemIdleClass,
} from "@/components/app-templates";
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
    <AppMobileDockShell ariaLabel="เมนูล่าง คลังสต๊อกสินค้า">
      <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                  active ? appMobileDockItemActiveClass : appMobileDockItemIdleClass,
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
    </AppMobileDockShell>
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

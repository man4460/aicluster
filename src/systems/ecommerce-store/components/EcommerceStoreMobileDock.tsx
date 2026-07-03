"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { deriveEcommerceSection } from "@/systems/ecommerce-store/ecommerce-nav";
import {
  ecommerceDockItemActiveClass,
  ecommerceDockItemIdleClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  IconClipboard,
  IconPackage,
  IconSettings,
  IconStore,
  IconUsers,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

const items = [
  { href: "/dashboard/ecommerce-store", section: "dashboard" as const, label: "ภาพรวม", Icon: IconStore },
  { href: "/dashboard/ecommerce-store/products", section: "products" as const, label: "สินค้า", Icon: IconPackage },
  { href: "/dashboard/ecommerce-store/orders", section: "orders" as const, label: "ออเดอร์", Icon: IconClipboard },
  { href: "/dashboard/ecommerce-store/customers", section: "customers" as const, label: "ลูกค้า", Icon: IconUsers },
  { href: "/dashboard/ecommerce-store/settings", section: "settings" as const, label: "ตั้งค่า", Icon: IconSettings },
];

export function EcommerceStoreMobileDock() {
  const pathname = usePathname() ?? "";
  const section = deriveEcommerceSection(pathname);

  return (
    <AppMobileDockShell ariaLabel="เมนูล่างร้านออนไลน์">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {items.map(({ href, section: sec, label, Icon }) => {
          const active = section === sec;
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 text-center transition-all active:scale-90",
                  active ? ecommerceDockItemActiveClass : ecommerceDockItemIdleClass,
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="text-[9px] font-black leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

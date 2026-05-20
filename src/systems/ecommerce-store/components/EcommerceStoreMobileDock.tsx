"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { deriveEcommerceSection } from "@/systems/ecommerce-store/ecommerce-nav";
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
    <nav
      aria-label="เมนูล่างร้านออนไลน์"
      className={cn(
        "fixed inset-x-3 z-40 md:hidden print:hidden",
        "bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        "rounded-[2.5rem] border border-white/50 p-1.5",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
      )}
    >
      <ul className="grid grid-cols-5 gap-0.5">
        {items.map(({ href, section: sec, label, Icon }) => {
          const active = section === sec;
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-center transition active:scale-95",
                  active
                    ? "bg-white/85 text-[#4d47b6] shadow-md ring-1 ring-[#4d47b6]/20"
                    : "text-[#66638c] hover:bg-white/50",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[9px] font-bold leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { dormFilterChipClass, dormSegmentShellClass } from "@/systems/dormitory/dorm-ui-tokens";

const items = [
  { href: "/dashboard/dormitory/history", label: "ประวัติรับชำระ" },
  { href: "/dashboard/dormitory/costs", label: "ต้นทุน / รายจ่าย" },
] as const;

export function DormFinanceQuickTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูย่อยการเงินหอพัก" className={dormSegmentShellClass}>
      <ul className="grid w-full grid-cols-2 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold sm:text-sm",
                  dormFilterChipClass(active),
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

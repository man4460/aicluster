"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard/dormitory/history", label: "ประวัติรับชำระ" },
  { href: "/dashboard/dormitory/costs", label: "ต้นทุน / รายจ่าย" },
] as const;

export function DormFinanceQuickTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="เมนูย่อยการเงินหอพัก"
      className="rounded-2xl border border-white/65 bg-gradient-to-r from-white/80 via-indigo-50/35 to-violet-50/45 p-1.5 shadow-sm ring-1 ring-white/55"
    >
      <ul className="grid grid-cols-2 gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold transition sm:text-sm",
                  active
                    ? "bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_8px_18px_-12px_rgba(77,71,182,0.8)]"
                    : "bg-white/85 text-[#66638c] ring-1 ring-slate-200/80 hover:bg-white",
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


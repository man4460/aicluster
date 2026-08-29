"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { villageFilterChipClass, villageSegmentShellClass } from "@/systems/village/village-ui-tokens";

const housingItems = [
  { href: "/dashboard/village/residents", label: "บ้าน" },
  { href: "/dashboard/village/fees", label: "ค่าส่วนกลาง" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VillageHousingQuickTabs() {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex w-full md:justify-end">
      <nav aria-label="เมนูย่อยจัดการบ้าน" className={cn(villageSegmentShellClass, "md:min-w-[20rem]")}>
        <ul className="grid w-full grid-cols-2 gap-1">
          {housingItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-bold leading-tight sm:text-xs",
                    villageFilterChipClass(active),
                  )}
                  aria-current={active ? "page" : undefined}
                  aria-label={`เปิดเมนู ${item.label}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

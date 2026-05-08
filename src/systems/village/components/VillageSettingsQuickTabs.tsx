"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const settingItems = [
  { href: "/dashboard/village/settings", label: "ตั้งค่า" },
  { href: "/dashboard/village/reports", label: "ส่งออก" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VillageSettingsQuickTabs() {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex w-full justify-end">
      <nav
        aria-label="เมนูย่อยตั้งค่า"
        className={cn(
          "w-full rounded-2xl border border-white/70 bg-gradient-to-r from-white/62 via-white/46 to-indigo-50/35 p-1.5 sm:w-auto",
          "shadow-[0_14px_30px_-20px_rgba(91,97,255,0.4),inset_0_1px_0_0_rgba(255,255,255,0.82)] backdrop-blur-sm",
          "sm:min-w-[16rem]",
        )}
      >
        <ul className="grid grid-cols-2 gap-1.5">
          {settingItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-[38px] w-full items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-bold leading-tight transition-all",
                    active
                      ? "border border-[#5b61ff]/35 bg-gradient-to-r from-[#eef0ff] to-[#e8ebff] text-[#3f3ac7] shadow-[0_10px_18px_-12px_rgba(91,97,255,0.8)] ring-1 ring-[#5b61ff]/20"
                      : "border border-transparent bg-white/55 text-slate-600 hover:bg-white/80",
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

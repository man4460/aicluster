"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/village", label: "แดชบอร์ด" },
  { href: "/dashboard/village/residents", label: "จัดการลูกบ้าน" },
  { href: "/dashboard/village/fees", label: "ค่าส่วนกลางรายบ้าน" },
  { href: "/dashboard/village/slips", label: "ตรวจสอบสลิป" },
  { href: "/dashboard/village/annual", label: "สรุปรายปี" },
  { href: "/dashboard/village/reports", label: "ส่งออก CSV" },
  { href: "/dashboard/village/settings", label: "ตั้งค่า" },
] as const;

export function VillageModuleHeader() {
  const pathname = usePathname() ?? "";
  return (
    <div className="mb-6 border-b border-slate-200/90 pb-6">
      <nav className="flex flex-wrap gap-2" aria-label="เมนูหมู่บ้าน">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/village"
              ? pathname === "/dashboard/village"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[#0000BF]/10 text-[#0000BF]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

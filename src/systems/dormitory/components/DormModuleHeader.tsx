import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/dormitory", label: "แดชบอร์ด" },
  { href: "/dashboard/dormitory/rooms", label: "ห้องพัก" },
  { href: "/dashboard/dormitory/history", label: "รายการประวัติ" },
  { href: "/dashboard/dormitory/settings", label: "ตั้งค่าหอพัก" },
] as const;

export function DormModuleHeader({ pathname }: { pathname: string }) {
  return (
    <div className="mb-6 border-b border-slate-200/90 pb-6">
      <nav className="flex flex-wrap gap-2" aria-label="เมนูหอพัก">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/dormitory"
              ? pathname === "/dashboard/dormitory"
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

import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/attendance", label: "แดชบอร์ด" },
  { href: "/dashboard/attendance/settings", label: "ตั้งค่า" },
  { href: "/dashboard/attendance/logs", label: "รายงาน" },
  { href: "/dashboard/attendance/roster", label: "รายชื่อพนักงาน" },
  { href: "/dashboard/attendance/qr", label: "QR จุดเช็คอิน" },
] as const;

export function AttendanceModuleHeader({ pathname }: { pathname: string }) {
  return (
    <div className="mb-6 border-b border-slate-200/90 pb-5">
      <div className="mb-2 px-1">
        <p className="text-sm font-semibold text-slate-800">ระบบเช็คชื่ออัจฉริยะ</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="เมนูระบบเช็คชื่ออัจฉริยะ">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/attendance"
              ? pathname === "/dashboard/attendance"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "min-h-[40px] rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                active
                  ? "bg-[#0000BF]/12 text-[#0000BF] ring-1 ring-[#0000BF]/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
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

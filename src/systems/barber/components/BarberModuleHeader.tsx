import Link from "next/link";
import { cn } from "@/lib/cn";
import { barberNavItemBase } from "./barber-ui-tokens";

const links = [
  { href: "/dashboard/barber", label: "แดชบอร์ด" },
  { href: "/dashboard/barber/history", label: "ยอดขาย" },
  { href: "/dashboard/barber/costs", label: "ต้นทุน / รายจ่าย" },
  { href: "/dashboard/barber/bookings", label: "จัดการคิว" },
  { href: "/dashboard/barber/check-in", label: "เช็กอิน" },
  { href: "/dashboard/barber/packages", label: "แพ็กเกจ" },
  { href: "/dashboard/barber/stylists", label: "ช่าง" },
  { href: "/dashboard/barber/purchases", label: "สมาชิกแพ็กเกจ" },
  { href: "/dashboard/barber/qr-poster", label: "QR ลูกค้า" },
  { href: "/dashboard/barber/staff-qr", label: "QR พนักงาน" },
] as const;

export function BarberModuleHeader({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="เมนูร้านตัดผม"
      className="app-surface rounded-2xl p-3 sm:p-4 print:hidden"
    >
      <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
      <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/barber"
              ? pathname === "/dashboard/barber"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href} className="min-w-0 sm:w-auto">
              <Link
                href={l.href}
                className={cn(
                  barberNavItemBase,
                  "w-full sm:w-auto",
                  active
                    ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                    : "app-btn-soft text-[#66638c]",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

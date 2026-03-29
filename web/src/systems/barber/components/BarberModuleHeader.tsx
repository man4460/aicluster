import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/barber", label: "แดชบอร์ด" },
  { href: "/dashboard/barber/bookings", label: "จองคิว" },
  { href: "/dashboard/barber/check-in", label: "เช็คอิน" },
  { href: "/dashboard/barber/packages", label: "แพ็กเกจ" },
  { href: "/dashboard/barber/stylists", label: "ช่าง" },
  { href: "/dashboard/barber/purchases", label: "ผู้ซื้อแพ็ก" },
  { href: "/dashboard/barber/history", label: "ประวัติ" },
  { href: "/dashboard/barber/settings", label: "ตั้งค่าร้าน" },
  { href: "/dashboard/barber/qr-poster", label: "QR หน้าร้าน" },
] as const;

export function BarberModuleHeader({ pathname }: { pathname: string }) {
  return (
    <div className="mb-6 border-b border-slate-200/90 pb-6">
      <nav className="flex flex-wrap gap-2" aria-label="เมนูร้านตัดผม">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/barber"
              ? pathname === "/dashboard/barber"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "min-h-[44px] min-w-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:min-h-0 sm:min-w-0",
                active
                  ? "bg-[#0000BF]/12 text-[#0000BF] ring-1 ring-[#0000BF]/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
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

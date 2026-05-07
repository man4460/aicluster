import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/barber", label: "แดชบอร์ด" },
  { href: "/dashboard/barber/finance", label: "การเงิน" },
  { href: "/dashboard/barber/packages", label: "แพ็กเกจ" },
  { href: "/dashboard/barber/qr", label: "QR" },
] as const;

function isBarberLinkActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/barber") return pathname === "/dashboard/barber";
  if (href === "/dashboard/barber/finance") {
    return pathname === "/dashboard/barber/finance" || pathname.startsWith("/dashboard/barber/finance/");
  }
  if (href === "/dashboard/barber/packages") {
    return pathname === "/dashboard/barber/packages" || pathname.startsWith("/dashboard/barber/packages/");
  }
  if (href === "/dashboard/barber/qr") {
    return pathname === "/dashboard/barber/qr" || pathname.startsWith("/dashboard/barber/qr/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function barberNavIcon(href: string) {
  switch (href) {
    case "/dashboard/barber":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "/dashboard/barber/finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "/dashboard/barber/packages":
      return <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />;
    case "/dashboard/barber/qr":
      return (
        <g>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

function barberNavLinkClass(active: boolean) {
  return cn(
    /* เทียบแท็บคาร์แคร์ — rounded-xl */
    "flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-black transition-all sm:min-h-0 sm:text-sm",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-600 hover:bg-white/45 hover:text-slate-800",
  );
}

/** เมนูหลักโมดูล — เดสก์ท็อปเท่านั้น (อยู่ในการ์ดหัว) */
export function BarberModuleDesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="เมนูร้านตัดผม"
      className="mt-5 hidden border-t border-white/40 pt-5 md:block print:hidden"
    >
      <ul className="flex gap-1">
        {links.map((l) => {
          const active = isBarberLinkActive(pathname, l.href);
          return (
            <li key={l.href} className="min-w-0 flex-1">
              <Link
                href={l.href}
                className={cn(barberNavLinkClass(active), "gap-2")}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")}
                  aria-hidden
                >
                  {barberNavIcon(l.href)}
                </svg>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * แถบนำทางมือถือ — ลอย inset-x / bottom โค้ง 2.5rem เหมือนเมนูล่างคาร์แคร์
 */
export function BarberModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <nav
      className={cn(
        "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
      )}
      aria-label="เมนูล่างร้านตัดผม"
    >
      <ul className="grid grid-cols-4 gap-1">
        {links.map((l) => {
          const active = isBarberLinkActive(pathname, l.href);
          return (
            <li key={l.href} className="min-w-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
                  active
                    ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
                    : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5 shrink-0"
                  aria-hidden
                >
                  {barberNavIcon(l.href)}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {l.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

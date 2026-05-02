import Link from "next/link";
import { cn } from "@/lib/cn";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";

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
    `flex min-h-[44px] w-full touch-manipulation items-center justify-center ${barberCardSurfaceRadiusClass} px-3 py-2.5 text-center text-xs font-black transition-all sm:min-h-0 sm:text-sm`,
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
 * แถบนำทางมือถือ — ติดขอบล่างจอ (อยู่นอกการ์ดหัว เพื่อไม่ถูก overflow/transform บัง)
 */
export function BarberModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] md:hidden print:hidden",
        "border-t border-white/50 bg-gradient-to-t from-white/95 via-white/90 to-white/82 backdrop-blur-xl",
        "pt-1.5 shadow-[0_-10px_40px_-14px_rgba(30,27,75,0.18)]",
        "pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label="เมนูล่างร้านตัดผม"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-0.5 px-2">
        {links.map((l) => {
          const active = isBarberLinkActive(pathname, l.href);
          return (
            <li key={l.href} className="min-w-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 transition-all active:scale-[0.97]",
                  active
                    ? "text-[#5b61ff]"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-800",
                )}
              >
                <span
                  className={cn(
                    `flex h-10 w-10 items-center justify-center ${barberCardSurfaceRadiusClass} transition-colors`,
                    active ? "bg-[#5b61ff]/12 ring-1 ring-[#5b61ff]/25" : "bg-transparent",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="h-5 w-5"
                    aria-hidden
                  >
                    {barberNavIcon(l.href)}
                  </svg>
                </span>
                <span className="max-w-full truncate px-0.5 text-center text-[10px] font-black leading-none">
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

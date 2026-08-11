import Link from "next/link";
import { AppMobileDockUnifiedBar, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  BARBER_NAV_ITEMS,
  barberModuleNavIcon,
  isBarberModuleNavItemActive,
} from "@/systems/barber/barber-module-nav";
import {
  barberDockPillClass,
  barberNavActiveClass,
  barberNavIdleClass,
} from "@/systems/barber/components/barber-ui-tokens";

function barberNavLinkClass(active: boolean) {
  return cn(
    "flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-black transition-all sm:min-h-0 sm:text-sm",
    active ? barberNavActiveClass : barberNavIdleClass,
  );
}

/** เมนูหลักโมดูล — เดสก์ท็อปเท่านั้น (อยู่ในการ์ดหัว) */
export function BarberModuleDesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="เมนูร้านตัดผม"
      className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden"
    >
      <ul className="flex gap-1">
        {BARBER_NAV_ITEMS.map((item) => {
          const active = isBarberModuleNavItemActive(pathname, item.key);
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(barberNavLinkClass(active), "gap-2")}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("h-4 w-4 shrink-0", active ? "text-white/95" : "text-slate-400")}
                  aria-hidden
                >
                  {barberModuleNavIcon(item.key)}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** แถบนำทางมือถือ — dock pill §9 Surface 1.5rem แบบโรงแรม */
export function BarberModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่างร้านตัดผม" pillClassName={barberDockPillClass}>
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {BARBER_NAV_ITEMS.map((item) => {
          const active = isBarberModuleNavItemActive(pathname, item.key);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
                  active ? barberNavActiveClass : barberNavIdleClass,
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("h-5 w-5 shrink-0", active ? "text-white/95" : "text-slate-400")}
                  aria-hidden
                >
                  {barberModuleNavIcon(item.key)}
                </svg>
                <span
                  className={cn(
                    "max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none",
                    active ? "text-white" : "",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockUnifiedBar>
  );
}

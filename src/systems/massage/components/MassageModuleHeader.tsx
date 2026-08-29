import Link from "next/link";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  MASSAGE_NAV_ITEMS,
  isMassageModuleNavItemActive,
  massageModuleNavIcon,
} from "@/systems/massage/massage-module-nav";

function massageNavLinkClass(active: boolean) {
  return cn(
    /* เทียบแท็บคาร์แคร์ — rounded-xl */
    "flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-black transition-all sm:min-h-0 sm:text-sm",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-600 hover:bg-white/45 hover:text-slate-800",
  );
}

/** เมนูหลักโมดูล — เดสก์ท็อปเท่านั้น (อยู่ในการ์ดหัว) */
export function MassageModuleDesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="เมนูร้านนวด"
      className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden"
    >
      <ul className="flex gap-1">
        {MASSAGE_NAV_ITEMS.map((item) => {
          const active = isMassageModuleNavItemActive(pathname, item.key);
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(massageNavLinkClass(active), "gap-2")}
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
                  {massageModuleNavIcon(item.key)}
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

/**
 * แถบนำทางมือถือ — ลอย inset-x / bottom โค้ง 2.5rem เหมือนเมนูล่างคาร์แคร์
 */
export function MassageModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <AppMobileDockShell ariaLabel="เมนูล่างร้านนวด">
      <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
        {MASSAGE_NAV_ITEMS.map((item) => {
          const active = isMassageModuleNavItemActive(pathname, item.key);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
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
                  {massageModuleNavIcon(item.key)}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

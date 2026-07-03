import Link from "next/link";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/massage", label: "แดชบอร์ด" },
  { href: "/dashboard/massage/finance", label: "การเงิน" },
  { href: "/dashboard/massage/packages", label: "แพ็กเกจ" },
  { href: "/dashboard/massage/qr", label: "QR" },
  { href: "/dashboard/massage/settings", label: "ตั้งค่าร้าน" },
] as const;

function isMassageLinkActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/massage") return pathname === "/dashboard/massage";
  if (href === "/dashboard/massage/finance") {
    return pathname === "/dashboard/massage/finance" || pathname.startsWith("/dashboard/massage/finance/");
  }
  if (href === "/dashboard/massage/packages") {
    return pathname === "/dashboard/massage/packages" || pathname.startsWith("/dashboard/massage/packages/");
  }
  if (href === "/dashboard/massage/qr") {
    return pathname === "/dashboard/massage/qr" || pathname.startsWith("/dashboard/massage/qr/");
  }
  if (href === "/dashboard/massage/settings") {
    return pathname === "/dashboard/massage/settings";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function massageNavIcon(href: string) {
  switch (href) {
    case "/dashboard/massage":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "/dashboard/massage/finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "/dashboard/massage/packages":
      return <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />;
    case "/dashboard/massage/qr":
      return (
        <g>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </g>
      );
    case "/dashboard/massage/settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            strokeLinecap="round"
          />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

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
        {links.map((l) => {
          const active = isMassageLinkActive(pathname, l.href);
          return (
            <li key={l.href} className="min-w-0 flex-1">
              <Link
                href={l.href}
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
                  {massageNavIcon(l.href)}
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
export function MassageModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <AppMobileDockShell ariaLabel="เมนูล่างร้านนวด">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {links.map((l) => {
          const active = isMassageLinkActive(pathname, l.href);
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
                  {massageNavIcon(l.href)}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {l.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { appMobileDockLinkClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";

export const MODULE_SHOP_SETTINGS_SHORT_LABEL = "ตั้งค่า";

export function IconModuleShopSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ModuleShopSettingsDockLink({
  href,
  active,
  shortLabel = MODULE_SHOP_SETTINGS_SHORT_LABEL,
}: {
  href: string;
  active: boolean;
  shortLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={appMobileDockLinkClass(active)}
      aria-current={active ? "page" : undefined}
      aria-label="ตั้งค่าร้าน"
      title="ตั้งค่าร้าน"
    >
      <IconModuleShopSettings className="h-5 w-5 shrink-0" />
      <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{shortLabel}</span>
    </Link>
  );
}

export function ModuleShopSettingsDesktopNavLink({
  href,
  active,
  label = "ตั้งค่าร้าน",
  className,
}: {
  href: string;
  active: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active
          ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      <IconModuleShopSettings
        className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")}
      />
      {label}
    </Link>
  );
}

export function moduleShopSettingsDesktopNavItem(children: ReactNode) {
  return <li className="min-w-0 flex-1">{children}</li>;
}

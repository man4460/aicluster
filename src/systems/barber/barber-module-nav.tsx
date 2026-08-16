import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const BARBER_MODULE_DISPLAY_NAME = "ร้านตัดผม";

export const BARBER_HEADER_COLLAPSE_KEY = "mawell-barber-module-header-collapsed";
export const BARBER_HEADER_COLLAPSE_EVENT = "mawell-barber-header-collapse";

export const BARBER_MODULE_PATH_PREFIX = "/dashboard/barber";
export const BARBER_STAFF_KIOSK_PATH = "/dashboard/barber/staff";

export function isBarberModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === BARBER_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${BARBER_MODULE_PATH_PREFIX}/`)
  );
}

export function barberPathFlags(pathname: string) {
  const onBarber = isBarberModulePath(pathname);
  const onStaff = pathname === BARBER_STAFF_KIOSK_PATH;
  const onFinance =
    onBarber &&
    (pathname === "/dashboard/barber/finance" || pathname.startsWith("/dashboard/barber/finance/"));
  const onPackages =
    onBarber &&
    (pathname === "/dashboard/barber/packages" || pathname.startsWith("/dashboard/barber/packages/"));
  const onQr =
    onBarber &&
    (pathname === "/dashboard/barber/qr" || pathname.startsWith("/dashboard/barber/qr/"));
  const onSettings = pathname === "/dashboard/barber/settings";
  /** การเงิน · QR · ตั้งค่า มีการ์ดเนื้อหาเอง — ไม่ห่อ barberModuleContentShell ซ้ำ */
  const plainInner = onStaff || onFinance || onQr || onSettings;
  return {
    onBarber,
    onStaff,
    onFinance,
    onPackages,
    onQr,
    onSettings,
    plainInner,
  };
}

export type BarberModuleNavKey = "dashboard" | "finance" | "packages" | "qr" | "settings";

export type BarberNavItem = {
  key: BarberModuleNavKey;
  label: string;
  href: string;
};

export const BARBER_NAV_ITEMS: BarberNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", href: "/dashboard/barber" },
  { key: "finance", label: "การเงิน", href: "/dashboard/barber/finance" },
  { key: "packages", label: "แพ็กเกจ", href: "/dashboard/barber/packages" },
  { key: "qr", label: "ลิงก์", href: "/dashboard/barber/qr" },
  { key: "settings", label: MODULE_SHOP_SETTINGS_SHORT_LABEL, href: "/dashboard/barber/settings" },
];

export function isBarberModuleNavItemActive(pathname: string, key: BarberModuleNavKey): boolean {
  switch (key) {
    case "dashboard":
      return pathname === "/dashboard/barber";
    case "finance":
      return (
        pathname === "/dashboard/barber/finance" || pathname.startsWith("/dashboard/barber/finance/")
      );
    case "packages":
      return (
        pathname === "/dashboard/barber/packages" ||
        pathname.startsWith("/dashboard/barber/packages/")
      );
    case "qr":
      return pathname === "/dashboard/barber/qr" || pathname.startsWith("/dashboard/barber/qr/");
    case "settings":
      return pathname === "/dashboard/barber/settings";
    default:
      return false;
  }
}

export function barberModuleNavIcon(key: BarberModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "packages":
      return (
        <>
          <path d="M4 7h16v4H4z" />
          <path d="M6 11v8h12v-8" />
          <path d="M9 7V5h6v2" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function readBarberHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BARBER_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBarberHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BARBER_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(BARBER_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

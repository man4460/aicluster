import type { ReactElement } from "react";

export const PRO_RESUME_BASE = "/dashboard/pro-resume";
export const PRO_RESUME_PROFILE_PATH = `${PRO_RESUME_BASE}/profile`;
export const PRO_RESUME_PORTFOLIO_PATH = `${PRO_RESUME_BASE}/portfolio`;
export const PRO_RESUME_SETTINGS_PATH = `${PRO_RESUME_BASE}/settings`;

export const PRO_RESUME_MODULE_DISPLAY_NAME = "Pro Resume";
export const PRO_RESUME_HEADER_COLLAPSE_KEY = "mawell-pro-resume-module-header-collapsed";
export const PRO_RESUME_HEADER_COLLAPSE_EVENT = "mawell-pro-resume-header-collapse";

export type ProResumeModuleNavKey = "dashboard" | "profile" | "portfolio" | "settings";

export type ProResumeNavItem = {
  key: ProResumeModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const PRO_RESUME_NAV_ITEMS: ProResumeNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: PRO_RESUME_BASE },
  { key: "profile", label: "โปรไฟล์", shortLabel: "โปร", href: PRO_RESUME_PROFILE_PATH },
  { key: "portfolio", label: "ผลงาน", shortLabel: "ผลงาน", href: PRO_RESUME_PORTFOLIO_PATH },
  {
    key: "settings",
    label: "ตั้งค่า",
    shortLabel: "ตั้งค่า",
    href: PRO_RESUME_SETTINGS_PATH,
  },
];

export function isProResumeModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === PRO_RESUME_BASE || pathname.startsWith(`${PRO_RESUME_BASE}/`);
}

export function isProResumeModuleNavItemActive(pathname: string, key: ProResumeModuleNavKey): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === PRO_RESUME_BASE;
    case "profile":
      return norm === PRO_RESUME_PROFILE_PATH || norm.startsWith(`${PRO_RESUME_PROFILE_PATH}/`);
    case "portfolio":
      return norm === PRO_RESUME_PORTFOLIO_PATH || norm.startsWith(`${PRO_RESUME_PORTFOLIO_PATH}/`);
    case "settings":
      return norm === PRO_RESUME_SETTINGS_PATH || norm.startsWith(`${PRO_RESUME_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

export function proResumePublicPath(slug: string, trialParam?: string | null): string {
  const base = `/resume/${encodeURIComponent(slug)}`;
  if (trialParam && trialParam !== "prod") return `${base}?t=${encodeURIComponent(trialParam)}`;
  return base;
}

export function proResumeModuleNavIcon(key: ProResumeModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "profile":
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
        </>
      );
    case "portfolio":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M8 15h3" />
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

export function readProResumeHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PRO_RESUME_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeProResumeHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRO_RESUME_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(PRO_RESUME_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

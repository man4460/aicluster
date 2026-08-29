export const MEDIA_REGISTRY_BASE = "/dashboard/media-registry";

export const MEDIA_REGISTRY_MODULE_DISPLAY_NAME = "ทะเบียนคุมสื่อ";

export const MEDIA_REGISTRY_HEADER_COLLAPSE_KEY = "mawell-media-registry-module-header-collapsed";

export const MEDIA_REGISTRY_HEADER_COLLAPSE_EVENT = "mawell-media-registry-header-collapse";

export type MediaRegistryNavKey = "overview" | "items" | "borrow" | "issues" | "master";

export type MediaRegistryNavItem = {
  key: MediaRegistryNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const MEDIA_REGISTRY_NAV_ITEMS: MediaRegistryNavItem[] = [
  { key: "overview", href: MEDIA_REGISTRY_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  {
    key: "items",
    href: `${MEDIA_REGISTRY_BASE}/items`,
    label: "ทะเบียนสื่อ",
    shortLabel: "ทะเบียน",
  },
  {
    key: "borrow",
    href: `${MEDIA_REGISTRY_BASE}/borrow`,
    label: "ยืม-คืน",
    shortLabel: "ยืม-คืน",
  },
  {
    key: "issues",
    href: `${MEDIA_REGISTRY_BASE}/issues`,
    label: "ชำรุด/ซ่อม",
    shortLabel: "บันทึก",
  },
  {
    key: "master",
    href: `${MEDIA_REGISTRY_BASE}/master`,
    label: "ข้อมูลหลัก",
    shortLabel: "หลัก",
  },
];

export function isMediaRegistryModulePath(pathname: string): boolean {
  return pathname === MEDIA_REGISTRY_BASE || pathname.startsWith(`${MEDIA_REGISTRY_BASE}/`);
}

export function mediaRegistryNavActive(pathname: string, href: string): boolean {
  if (href === MEDIA_REGISTRY_BASE) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMediaRegistryNavItemActive(pathname: string, key: MediaRegistryNavKey): boolean {
  const item = MEDIA_REGISTRY_NAV_ITEMS.find((n) => n.key === key);
  if (!item) return false;
  return mediaRegistryNavActive(pathname, item.href);
}

export function readMediaRegistryHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MEDIA_REGISTRY_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeMediaRegistryHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MEDIA_REGISTRY_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(MEDIA_REGISTRY_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

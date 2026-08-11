export const VAULT_BASE = "/dashboard/vault";

export const VAULT_SETTINGS_HREF = `${VAULT_BASE}/settings`;

export const VAULT_MODULE_DISPLAY_NAME = "คลังรหัสผ่าน";

export const VAULT_HEADER_COLLAPSE_KEY = "mawell-vault-module-header-collapsed";

export const VAULT_HEADER_COLLAPSE_EVENT = "mawell-vault-header-collapse";

export type VaultNavKey = "dashboard" | "settings";

export type VaultNavItem = {
  key: VaultNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const VAULT_NAV_ITEMS: VaultNavItem[] = [
  { key: "dashboard", href: VAULT_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "settings", href: VAULT_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isVaultModulePath(pathname: string): boolean {
  return pathname === VAULT_BASE || pathname.startsWith(`${VAULT_BASE}/`);
}

export function vaultPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isVaultModulePath(pathname);
  const isSettings = pathNorm === VAULT_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isSettings;
  return { onModule, isDashboard, isSettings };
}

export function isVaultNavItemActive(pathname: string, key: VaultNavKey): boolean {
  const f = vaultPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readVaultHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VAULT_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVaultHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VAULT_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(VAULT_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const SMART_GUARD_TOUR_BASE = "/dashboard/smart-guard-tour";
export const SMART_GUARD_TOUR_FINANCE_PATH = `${SMART_GUARD_TOUR_BASE}/finance`;
export const SMART_GUARD_TOUR_MANAGE_PATH = `${SMART_GUARD_TOUR_BASE}/manage`;
export const SMART_GUARD_TOUR_SETTINGS_PATH = `${SMART_GUARD_TOUR_BASE}/settings`;

export const SMART_GUARD_TOUR_MODULE_DISPLAY_NAME = "ธุรกิจ รปภ.";
export const SMART_GUARD_TOUR_HEADER_COLLAPSE_KEY = "mawell-smart-guard-tour-module-header-collapsed";
export const SMART_GUARD_TOUR_HEADER_COLLAPSE_EVENT = "mawell-smart-guard-tour-header-collapse";

export type SmartGuardTourModuleNavKey = "dashboard" | "manage" | "finance" | "settings";

export type SmartGuardTourDashboardTabKey =
  | "overview"
  | "posts"
  | "checkpoints"
  | "tour-logs"
  | "incidents"
  | "shifts"
  | "map-view";

export type SmartGuardTourManageLeafKey =
  | "checkpoints"
  | "posts"
  | "duties"
  | "schedules"
  | "staff"
  | "contacts"
  | "assets";

/** @deprecated ใช้ SmartGuardTourManageLeafKey — เก็บ alias ชั่วคราว */
export type SmartGuardTourManageTabKey = SmartGuardTourManageLeafKey;

export type SmartGuardTourManageGroupKey = "sites" | "roster" | "staff" | "misc";

export type SmartGuardTourSettingsTab = "basic" | "finance" | "portal" | "hours" | "link" | "integrations";

export type SmartGuardTourManageSubItem = {
  key: SmartGuardTourManageLeafKey;
  label: string;
  shortLabel?: string;
};

export type SmartGuardTourManageGroup = {
  key: SmartGuardTourManageGroupKey;
  label: string;
  shortLabel: string;
  /** ว่าง = ไม่มีแท็บรอง (เช่น พนักงาน) */
  subs: SmartGuardTourManageSubItem[];
};

/** แท็บหลักการจัดการ (B) — เหตุการณ์อยู่แดชบอร์ดเท่านั้น */
export const SMART_GUARD_TOUR_MANAGE_GROUPS: SmartGuardTourManageGroup[] = [
  {
    key: "sites",
    label: "จุด",
    shortLabel: "จุด",
    subs: [
      { key: "checkpoints", label: "จุดตรวจ", shortLabel: "จุดตรวจ" },
      { key: "posts", label: "ประจำจุด", shortLabel: "ประจำจุด" },
    ],
  },
  {
    key: "roster",
    label: "เวร / ตาราง",
    shortLabel: "เวร",
    subs: [
      { key: "duties", label: "จัดเวร", shortLabel: "จัดเวร" },
      { key: "schedules", label: "ตารางตรวจ", shortLabel: "ตาราง" },
    ],
  },
  {
    key: "staff",
    label: "พนักงาน",
    shortLabel: "พนักงาน",
    subs: [],
  },
  {
    key: "misc",
    label: "อื่นๆ",
    shortLabel: "อื่นๆ",
    subs: [
      { key: "contacts", label: "ผู้ติดต่อ", shortLabel: "ติดต่อ" },
      { key: "assets", label: "อุปกรณ์", shortLabel: "อุปกรณ์" },
    ],
  },
];

/** @deprecated ใช้ SMART_GUARD_TOUR_MANAGE_GROUPS */
export const SMART_GUARD_TOUR_MANAGE_TAB_ITEMS: {
  key: SmartGuardTourManageTabKey;
  label: string;
  shortLabel?: string;
}[] = SMART_GUARD_TOUR_MANAGE_GROUPS.flatMap((g) =>
  g.subs.length > 0
    ? g.subs.map((s) => ({ key: s.key, label: s.label, shortLabel: s.shortLabel }))
    : [{ key: "staff" as const, label: g.label, shortLabel: g.shortLabel }],
);

const MANAGE_LEAF_TO_GROUP: Record<SmartGuardTourManageLeafKey, SmartGuardTourManageGroupKey> = {
  checkpoints: "sites",
  posts: "sites",
  duties: "roster",
  schedules: "roster",
  staff: "staff",
  contacts: "misc",
  assets: "misc",
};

const MANAGE_GROUP_DEFAULT_LEAF: Record<SmartGuardTourManageGroupKey, SmartGuardTourManageLeafKey> = {
  sites: "checkpoints",
  roster: "duties",
  staff: "staff",
  misc: "contacts",
};

export function smartGuardTourManageGroupForLeaf(
  leaf: SmartGuardTourManageLeafKey,
): SmartGuardTourManageGroupKey {
  return MANAGE_LEAF_TO_GROUP[leaf];
}

export function smartGuardTourManageDefaultLeaf(
  group: SmartGuardTourManageGroupKey,
): SmartGuardTourManageLeafKey {
  return MANAGE_GROUP_DEFAULT_LEAF[group];
}

export function parseSmartGuardTourManageLeaf(
  tabRaw: string | null | undefined,
  subRaw?: string | null | undefined,
): SmartGuardTourManageLeafKey {
  const asLeaf = (v: string | null | undefined): SmartGuardTourManageLeafKey | null => {
    if (
      v === "checkpoints" ||
      v === "posts" ||
      v === "duties" ||
      v === "schedules" ||
      v === "staff" ||
      v === "contacts" ||
      v === "assets"
    ) {
      return v;
    }
    return null;
  };

  const leafFromSub = asLeaf(subRaw);
  if (leafFromSub) return leafFromSub;

  const leafFromTab = asLeaf(tabRaw);
  if (leafFromTab) return leafFromTab;

  if (tabRaw === "sites" || tabRaw === "roster" || tabRaw === "misc" || tabRaw === "staff") {
    const group = tabRaw as SmartGuardTourManageGroupKey;
    const subLeaf = asLeaf(subRaw);
    if (subLeaf && MANAGE_LEAF_TO_GROUP[subLeaf] === group) return subLeaf;
    return MANAGE_GROUP_DEFAULT_LEAF[group];
  }

  return "checkpoints";
}

/** true = ลิงก์เก่า tab=incidents ควรเด้งไปแดชบอร์ด */
export function isSmartGuardTourManageIncidentsLegacyTab(raw: string | null | undefined): boolean {
  return raw === "incidents";
}

export function parseSmartGuardTourManageTab(
  raw: string | null | undefined,
): SmartGuardTourManageTabKey {
  return parseSmartGuardTourManageLeaf(raw, null);
}

export function smartGuardTourManageHref(
  leafOrGroup?: SmartGuardTourManageLeafKey | SmartGuardTourManageGroupKey,
  sub?: SmartGuardTourManageLeafKey,
): string {
  if (!leafOrGroup) return SMART_GUARD_TOUR_MANAGE_PATH;

  if (leafOrGroup === "sites" || leafOrGroup === "roster" || leafOrGroup === "misc" || leafOrGroup === "staff") {
    const group = leafOrGroup;
    const leaf = sub ?? MANAGE_GROUP_DEFAULT_LEAF[group];
    if (group === "staff") return `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=staff`;
    if (leaf === MANAGE_GROUP_DEFAULT_LEAF[group]) {
      return `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=${group}`;
    }
    return `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=${group}&sub=${leaf}`;
  }

  const leaf = leafOrGroup as SmartGuardTourManageLeafKey;
  const group = MANAGE_LEAF_TO_GROUP[leaf];
  if (group === "staff") return `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=staff`;
  if (leaf === MANAGE_GROUP_DEFAULT_LEAF[group]) {
    return leaf === "checkpoints" ? SMART_GUARD_TOUR_MANAGE_PATH : `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=${group}`;
  }
  return `${SMART_GUARD_TOUR_MANAGE_PATH}?tab=${group}&sub=${leaf}`;
}

export type SmartGuardTourNavItem = {
  key: SmartGuardTourModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const SMART_GUARD_TOUR_NAV_ITEMS: SmartGuardTourNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: SMART_GUARD_TOUR_BASE },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: SMART_GUARD_TOUR_MANAGE_PATH },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: SMART_GUARD_TOUR_FINANCE_PATH },
  {
    key: "settings",
    label: MODULE_SHOP_SETTINGS_SHORT_LABEL,
    shortLabel: "ตั้งค่า",
    href: SMART_GUARD_TOUR_SETTINGS_PATH,
  },
];

export const SMART_GUARD_TOUR_DASHBOARD_TAB_ITEMS: {
  key: SmartGuardTourDashboardTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "posts", label: "ประจำจุดวันนี้", shortLabel: "ประจำจุด" },
  { key: "checkpoints", label: "จุดตรวจ", shortLabel: "จุดตรวจ" },
  { key: "tour-logs", label: "บันทึกสายตรวจ", shortLabel: "สายตรวจ" },
  { key: "incidents", label: "เหตุการณ์", shortLabel: "เหตุการณ์" },
  { key: "shifts", label: "กะ / ค่าแรง", shortLabel: "กะ" },
  { key: "map-view", label: "แผนที่", shortLabel: "แผนที่" },
];

export const SMART_GUARD_TOUR_SETTINGS_TAB_ITEMS: {
  key: SmartGuardTourSettingsTab;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { key: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { key: "portal", label: "ตั้งค่าเว็บไซต์", shortLabel: "เว็บ" },
  { key: "hours", label: "ตั้งค่าเวลาเปิดร้าน", shortLabel: "เวลาเปิด" },
  { key: "link", label: "ลิงก์", shortLabel: "ลิงก์" },
  { key: "integrations", label: "เชื่อมระบบ", shortLabel: "เชื่อมระบบ" },
];

export function isSmartGuardTourModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === SMART_GUARD_TOUR_BASE || pathname.startsWith(`${SMART_GUARD_TOUR_BASE}/`);
}

export function isSmartGuardTourModuleNavItemActive(
  pathname: string,
  key: SmartGuardTourModuleNavKey,
): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === SMART_GUARD_TOUR_BASE;
    case "manage":
      return norm === SMART_GUARD_TOUR_MANAGE_PATH || norm.startsWith(`${SMART_GUARD_TOUR_MANAGE_PATH}/`);
    case "finance":
      return norm === SMART_GUARD_TOUR_FINANCE_PATH || norm.startsWith(`${SMART_GUARD_TOUR_FINANCE_PATH}/`);
    case "settings":
      return norm === SMART_GUARD_TOUR_SETTINGS_PATH || norm.startsWith(`${SMART_GUARD_TOUR_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

export function parseSmartGuardTourDashboardTab(
  raw: string | null | undefined,
): SmartGuardTourDashboardTabKey {
  if (
    raw === "checkpoints" ||
    raw === "posts" ||
    raw === "tour-logs" ||
    raw === "incidents" ||
    raw === "shifts" ||
    raw === "map-view"
  ) {
    return raw;
  }
  return "overview";
}

export function smartGuardTourDashboardTabHref(tab: SmartGuardTourDashboardTabKey): string {
  if (tab === "overview") return SMART_GUARD_TOUR_BASE;
  return `${SMART_GUARD_TOUR_BASE}?tab=${tab}`;
}

export function parseSmartGuardTourSettingsTab(
  raw: string | null | undefined,
): SmartGuardTourSettingsTab {
  if (
    raw === "finance" ||
    raw === "portal" ||
    raw === "hours" ||
    raw === "link" ||
    raw === "integrations"
  ) {
    return raw;
  }
  if (raw === "links") return "link";
  if (raw === "staff") return "link";
  return "basic";
}

export function smartGuardTourSettingsHref(tab?: SmartGuardTourSettingsTab): string {
  if (!tab || tab === "basic") return SMART_GUARD_TOUR_SETTINGS_PATH;
  return `${SMART_GUARD_TOUR_SETTINGS_PATH}?tab=${tab}`;
}

export function smartGuardTourModuleNavIcon(key: SmartGuardTourModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "manage":
      return (
        <>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          <path d="M9 12h6M9 16h4" />
        </>
      );
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
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

export function readSmartGuardTourHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SMART_GUARD_TOUR_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSmartGuardTourHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SMART_GUARD_TOUR_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(SMART_GUARD_TOUR_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

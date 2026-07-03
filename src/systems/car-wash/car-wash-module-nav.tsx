import type { ReactNode } from "react";

export const CAR_WASH_BASE = "/dashboard/car-wash";
export const CAR_WASH_SETTINGS_PATH = `${CAR_WASH_BASE}/settings`;

export type CarWashTabKey = "overview" | "finance" | "offers" | "qr";

export const CAR_WASH_TAB_ITEMS: { key: CarWashTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "offers", label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", label: "QR", shortLabel: "QR" },
];

export function parseCarWashTab(value: string | null | undefined): CarWashTabKey {
  if (value === "finance" || value === "offers" || value === "qr") return value;
  return "overview";
}

export function carWashTabHref(tab: CarWashTabKey): string {
  if (tab === "overview") return CAR_WASH_BASE;
  return `${CAR_WASH_BASE}?tab=${tab}`;
}

export function isCarWashTabActive(pathname: string, tab: CarWashTabKey, tabParam: string | null): boolean {
  const norm = pathname.replace(/\/+$/, "");
  if (norm !== CAR_WASH_BASE) return false;
  if (tab === "overview") {
    return !tabParam || tabParam === "overview" || tabParam === "queue" || tabParam === "schedule";
  }
  return parseCarWashTab(tabParam) === tab;
}

export function isCarWashSettingsActive(pathname: string): boolean {
  return pathname.replace(/\/+$/, "") === CAR_WASH_SETTINGS_PATH;
}

export function carWashTabIcon(key: CarWashTabKey): ReactNode {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
    case "offers":
      return (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

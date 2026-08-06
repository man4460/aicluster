/**
 * นำทาง POS ร้านอาหาร — แท็บหลัก (query hub) + หน้าออร์เดอร์/คิว (route แยก แบบ drink-pos)
 */

export type BuildingPosMainTab = "order" | "orders" | "overview" | "qr" | "finance" | "menu";

export type BuildingPosQrSub = "customer" | "staff";

export type BuildingPosFinanceSub = "sales" | "costs";

export type BuildingPosMenuSub = "items" | "categories";

export type BuildingPosNavState = {
  main: BuildingPosMainTab;
  qr: BuildingPosQrSub;
  finance: BuildingPosFinanceSub;
  menu: BuildingPosMenuSub;
};

export const BUILDING_POS_BASE = "/dashboard/building-pos";
export const BUILDING_POS_ORDER_HREF = `${BUILDING_POS_BASE}/order`;
export const BUILDING_POS_ORDERS_HREF = `${BUILDING_POS_BASE}/orders`;
export const BUILDING_POS_SETTINGS_HREF = `${BUILDING_POS_BASE}/settings`;
export const BUILDING_POS_DISPLAY_NAME = "POS ร้านอาหาร";

export const BUILDING_POS_HEADER_COLLAPSE_KEY = "mawell-building-pos-module-header-collapsed";
export const BUILDING_POS_HEADER_COLLAPSE_EVENT = "mawell-building-pos-header-collapse";

export const BUILDING_POS_MAIN_TABS: { key: BuildingPosMainTab; label: string }[] = [
  { key: "overview", label: "แดชบอร์ด" },
  { key: "order", label: "ออร์เดอร์" },
  { key: "orders", label: "คิวออเดอร์" },
  { key: "finance", label: "การเงิน" },
  { key: "menu", label: "เมนู" },
  { key: "qr", label: "QR" },
];

/** แท็บที่อยู่บน hub query (`/dashboard/building-pos?tab=…`) */
export const BUILDING_POS_HUB_TABS: BuildingPosMainTab[] = ["overview", "finance", "menu", "qr"];

export function isBuildingPosModulePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || pathname;
  return p === BUILDING_POS_BASE || p.startsWith(`${BUILDING_POS_BASE}/`);
}

export function buildingPosPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const isOrder = pathNorm === BUILDING_POS_ORDER_HREF || pathNorm.endsWith("/order");
  const isOrdersBoard = pathNorm === BUILDING_POS_ORDERS_HREF || pathNorm.endsWith("/orders");
  const isSettings = pathNorm === BUILDING_POS_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isHub =
    pathNorm === BUILDING_POS_BASE ||
    pathNorm.endsWith("/sales") ||
    pathNorm.endsWith("/costs") ||
    pathNorm.endsWith("/staff-link");
  return { isOrder, isOrdersBoard, isSettings, isHub, onModule: isBuildingPosModulePath(pathname) };
}

export function readBuildingPosHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BUILDING_POS_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuildingPosHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BUILDING_POS_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(BUILDING_POS_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

/** อ่านสถานะจาก query — รองรับ URL เดิม (tab=orders | tab=categories) */
export function parseBuildingPosNav(searchParams: URLSearchParams): BuildingPosNavState {
  const rawTab = searchParams.get("tab");
  let main: BuildingPosMainTab = "overview";

  if (rawTab === "qr" || rawTab === "finance" || rawTab === "menu") {
    main = rawTab;
  } else if (rawTab === "orders") {
    /* URL เก่า tab=orders = QR ลูกค้า — หน้าคิวใหม่คือ /orders */
    main = "qr";
  } else if (rawTab === "categories") {
    main = "menu";
  }

  const qr: BuildingPosQrSub =
    rawTab === "orders"
      ? "customer"
      : main === "qr" && searchParams.get("qr") === "staff"
        ? "staff"
        : "customer";

  const finance: BuildingPosFinanceSub =
    main === "finance" && searchParams.get("fin") === "costs" ? "costs" : "sales";

  const menu: BuildingPosMenuSub = "items";

  return {
    main,
    qr: main === "qr" ? qr : "customer",
    finance: main === "finance" ? finance : "sales",
    menu: main === "menu" ? menu : "items",
  };
}

/** สร้าง path พร้อม query — ค่าเริ่มต้นไม่ใส่พารามิเตอร์ซ้ำ */
export function buildingPosHubUrl(state: BuildingPosNavState): string {
  if (state.main === "order") return BUILDING_POS_ORDER_HREF;
  if (state.main === "orders") return BUILDING_POS_ORDERS_HREF;

  const q = new URLSearchParams();
  if (state.main !== "overview") q.set("tab", state.main);
  if (state.main === "qr" && state.qr !== "customer") q.set("qr", state.qr);
  if (state.main === "finance" && state.finance !== "sales") q.set("fin", state.finance);
  if (state.main === "menu" && state.menu !== "items") q.set("menu", state.menu);
  const qs = q.toString();
  return qs ? `${BUILDING_POS_BASE}?${qs}` : BUILDING_POS_BASE;
}

export function buildingPosHubUrlMerge(
  current: BuildingPosNavState,
  patch: Partial<BuildingPosNavState>,
): string {
  return buildingPosHubUrl({ ...current, ...patch });
}

/** ลิงก์ไปแท็บหลัก — คงแท็บย่อยเมื่ออยู่ในกลุ่มเดิม ไม่เช่นนั้นใช้ค่าเริ่มต้นของกลุ่ม */
export function buildingPosMainTabHref(current: BuildingPosNavState, target: BuildingPosMainTab): string {
  if (target === "order") return BUILDING_POS_ORDER_HREF;
  if (target === "orders") return BUILDING_POS_ORDERS_HREF;
  if (target === "overview") return BUILDING_POS_BASE;
  return buildingPosHubUrl({
    main: target,
    qr: target === "qr" ? (current.main === "qr" ? current.qr : "customer") : "customer",
    finance: target === "finance" ? (current.main === "finance" ? current.finance : "sales") : "sales",
    menu: target === "menu" ? (current.main === "menu" ? current.menu : "items") : "items",
  });
}

/** แท็บไหน active จาก pathname + query (รองรับหน้า /order · /orders) */
export function isBuildingPosNavItemActive(
  pathname: string,
  searchParams: URLSearchParams,
  key: BuildingPosMainTab | "settings",
): boolean {
  const f = buildingPosPathFlags(pathname);
  if (key === "settings") return f.isSettings;
  if (key === "order") return f.isOrder;
  if (key === "orders") return f.isOrdersBoard;
  if (f.isOrder || f.isOrdersBoard || f.isSettings) return false;
  const nav = parseBuildingPosNav(searchParams);
  return nav.main === key;
}

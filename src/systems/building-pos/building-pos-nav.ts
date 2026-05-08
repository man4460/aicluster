/**
 * นำทาง POS ร้านอาหาร — โครงเดียวกับคาร์แคร์ (แท็บหลัก + แท็บย่อยในกลุ่ม)
 */

export type BuildingPosMainTab = "overview" | "qr" | "finance" | "menu";

export type BuildingPosQrSub = "customer" | "staff";

export type BuildingPosFinanceSub = "sales" | "costs";

export type BuildingPosMenuSub = "items" | "categories";

export type BuildingPosNavState = {
  main: BuildingPosMainTab;
  qr: BuildingPosQrSub;
  finance: BuildingPosFinanceSub;
  menu: BuildingPosMenuSub;
};

/** อ่านสถานะจาก query — รองรับ URL เดิม (tab=orders | tab=categories) */
export function parseBuildingPosNav(searchParams: URLSearchParams): BuildingPosNavState {
  const rawTab = searchParams.get("tab");
  let main: BuildingPosMainTab = "overview";

  if (rawTab === "qr" || rawTab === "finance" || rawTab === "menu") {
    main = rawTab;
  } else if (rawTab === "orders") {
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

  const menu: BuildingPosMenuSub =
    rawTab === "categories" || (main === "menu" && searchParams.get("menu") === "categories")
      ? "categories"
      : "items";

  return {
    main,
    qr: main === "qr" ? qr : "customer",
    finance: main === "finance" ? finance : "sales",
    menu: main === "menu" ? menu : "items",
  };
}

/** สร้าง path พร้อม query — ค่าเริ่มต้นไม่ใส่พารามิเตอร์ซ้ำ */
export function buildingPosHubUrl(state: BuildingPosNavState): string {
  const q = new URLSearchParams();
  if (state.main !== "overview") q.set("tab", state.main);
  if (state.main === "qr" && state.qr !== "customer") q.set("qr", state.qr);
  if (state.main === "finance" && state.finance !== "sales") q.set("fin", state.finance);
  if (state.main === "menu" && state.menu !== "items") q.set("menu", state.menu);
  const qs = q.toString();
  return qs ? `/dashboard/building-pos?${qs}` : "/dashboard/building-pos";
}

export function buildingPosHubUrlMerge(
  current: BuildingPosNavState,
  patch: Partial<BuildingPosNavState>,
): string {
  return buildingPosHubUrl({ ...current, ...patch });
}

/** ลิงก์ไปแท็บหลัก — คงแท็บย่อยเมื่ออยู่ในกลุ่มเดิม ไม่เช่นนั้นใช้ค่าเริ่มต้นของกลุ่ม */
export function buildingPosMainTabHref(current: BuildingPosNavState, target: BuildingPosMainTab): string {
  if (target === "overview") return "/dashboard/building-pos";
  return buildingPosHubUrl({
    main: target,
    qr: target === "qr" ? (current.main === "qr" ? current.qr : "customer") : "customer",
    finance: target === "finance" ? (current.main === "finance" ? current.finance : "sales") : "sales",
    menu: target === "menu" ? (current.main === "menu" ? current.menu : "items") : "items",
  });
}

/** สถานะออเดอร์ทั้งสายครัว → เสิร์ฟ → ชำระ */
export const BUILDING_POS_ORDER_STATUSES = [
  "NEW",
  "PREPARING",
  "SERVED",
  "SERVING",
  "DELIVERED",
  "PAID",
] as const;
export type BuildingPosOrderStatus = (typeof BUILDING_POS_ORDER_STATUSES)[number];

/** คอลัมน์กระดานครัว: รับออเดอร์ · กำลังทำ · ทำเสร็จแล้ว */
export const BUILDING_POS_KITCHEN_STATUSES = ["NEW", "PREPARING", "SERVED"] as const;
export type BuildingPosKitchenStatus = (typeof BUILDING_POS_KITCHEN_STATUSES)[number];

/** คอลัมน์กระดานเสิร์ฟ: ทำเสร็จแล้ว · กำลังเสิร์ฟ · เสิร์ฟเรียบร้อย */
export const BUILDING_POS_SERVE_STATUSES = ["SERVED", "SERVING", "DELIVERED"] as const;
export type BuildingPosServeStatus = (typeof BUILDING_POS_SERVE_STATUSES)[number];

/**
 * คอลัมน์คิวออเดอร์ในแดชบอร์ด (4 ขั้น)
 * รับออเดอร์ · ครัวกำลังทำ · กำลังเสิร์ฟ (SERVED+SERVING) · เสร็จแล้ว
 */
export const BUILDING_POS_DASHBOARD_QUEUE_COLUMNS = [
  {
    key: "NEW",
    statuses: ["NEW"] as const,
    label: "รับออเดอร์",
    hint: "ออเดอร์ใหม่ — รอครัวรับงาน",
  },
  {
    key: "PREPARING",
    statuses: ["PREPARING"] as const,
    label: "ครัวกำลังทำ",
    hint: "ครัวกำลังเตรียมอาหาร",
  },
  {
    key: "SERVING",
    statuses: ["SERVED", "SERVING"] as const,
    label: "กำลังเสิร์ฟ",
    hint: "ทำเสร็จแล้ว / กำลังนำไปเสิร์ฟที่โต๊ะ",
  },
  {
    key: "DELIVERED",
    statuses: ["DELIVERED"] as const,
    label: "เสร็จแล้ว",
    hint: "เสิร์ฟเรียบร้อย — รอเก็บเงิน",
  },
] as const;

export type BuildingPosDashboardQueueColumnKey =
  (typeof BUILDING_POS_DASHBOARD_QUEUE_COLUMNS)[number]["key"];

/** สถานะที่แสดงบนกระดานแผนก (ยังไม่ชำระ) */
export const BUILDING_POS_STATION_BOARD_STATUSES = [
  "NEW",
  "PREPARING",
  "SERVED",
  "SERVING",
  "DELIVERED",
] as const;
export type BuildingPosStationStatus = (typeof BUILDING_POS_STATION_BOARD_STATUSES)[number];

/** @deprecated ใช้ BUILDING_POS_KITCHEN_STATUSES / BUILDING_POS_STATION_BOARD_STATUSES */
export const BUILDING_POS_STATION_STATUSES = BUILDING_POS_KITCHEN_STATUSES;

/** kitchen/serve = ลิงก์แผนก · queue = หน้าคิวออเดอร์ในแดชบอร์ด */
export type BuildingPosStationRole = "kitchen" | "serve" | "queue";

export function isBuildingPosOrderStatus(value: string): value is BuildingPosOrderStatus {
  return (BUILDING_POS_ORDER_STATUSES as readonly string[]).includes(value);
}

export function isBuildingPosStationStatus(value: string): value is BuildingPosStationStatus {
  return (BUILDING_POS_STATION_BOARD_STATUSES as readonly string[]).includes(value);
}

export function buildingPosColumnStatusesForRole(
  role: BuildingPosStationRole,
): readonly BuildingPosStationStatus[] {
  if (role === "serve") return BUILDING_POS_SERVE_STATUSES;
  if (role === "queue") return BUILDING_POS_STATION_BOARD_STATUSES;
  return BUILDING_POS_KITCHEN_STATUSES;
}

/**
 * ป้ายสถานะ / แบดจ์
 * queue (แดชบอร์ด): รับออเดอร์ · ครัวกำลังทำ · กำลังเสิร์ฟ · เสร็จแล้ว
 */
export function buildingPosStationStatusLabel(
  status: string | null | undefined,
  role: BuildingPosStationRole = "kitchen",
): string {
  if (role === "queue") {
    switch (status) {
      case "PREPARING":
        return "ครัวกำลังทำ";
      case "SERVED":
        return "รอเสิร์ฟ";
      case "SERVING":
        return "กำลังเสิร์ฟ";
      case "DELIVERED":
        return "เสร็จแล้ว";
      case "PAID":
        return "ชำระแล้ว";
      case "NEW":
      default:
        return "รับออเดอร์";
    }
  }
  switch (status) {
    case "PREPARING":
      return "กำลังทำ";
    case "SERVED":
      return "ทำเสร็จแล้ว";
    case "SERVING":
      return "กำลังเสิร์ฟ";
    case "DELIVERED":
      return "เสิร์ฟเรียบร้อย";
    case "PAID":
      return "ชำระแล้ว";
    case "NEW":
    default:
      return "รับออเดอร์";
  }
}

/** คำอธิบายสั้นใต้หัวคอลัมน์ */
export function buildingPosStationColumnHint(
  status: BuildingPosStationStatus,
  role: BuildingPosStationRole,
): string | null {
  if (role === "queue") {
    const col = BUILDING_POS_DASHBOARD_QUEUE_COLUMNS.find((c) =>
      (c.statuses as readonly string[]).includes(status),
    );
    return col?.hint ?? null;
  }
  if (role === "kitchen" && status === "SERVED") {
    return "อยู่ระหว่างรอเสิร์ฟ · ส่งต่อแผนกเสิร์ฟ";
  }
  if (role === "serve" && status === "SERVED") {
    return "ครัวทำเสร็จแล้ว — รอเริ่มเสิร์ฟ";
  }
  if (role === "serve" && status === "SERVING") {
    return "กำลังนำไปเสิร์ฟที่โต๊ะ";
  }
  if (role === "serve" && status === "DELIVERED") {
    return "เสิร์ฟครบแล้ว — รอเก็บเงินที่โต๊ะ";
  }
  return null;
}

export function buildingPosStationStatusTone(status: string | null | undefined): {
  card: string;
  badge: string;
  nextLabel: string | null;
  nextStatus: BuildingPosStationStatus | null;
} {
  switch (status) {
    case "PREPARING":
      return {
        card: "border-amber-300/70 bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-white/80",
        badge: "bg-amber-500 text-white",
        nextLabel: "ทำเสร็จแล้ว · ส่งต่อแผนกเสิร์ฟ",
        nextStatus: "SERVED",
      };
    case "SERVED":
      return {
        card: "border-emerald-300/70 bg-gradient-to-br from-emerald-50/95 via-teal-50/60 to-white/80",
        badge: "bg-emerald-600 text-white",
        // ครัวจบที่นี่; เสิร์ฟ/คิวแดชบอร์ดกดต่อไป SERVING เองในการ์ด
        nextLabel: null,
        nextStatus: null,
      };
    case "SERVING":
      return {
        card: "border-sky-300/70 bg-gradient-to-br from-sky-50/95 via-cyan-50/60 to-white/80",
        badge: "bg-sky-600 text-white",
        nextLabel: "เสร็จแล้ว",
        nextStatus: "DELIVERED",
      };
    case "DELIVERED":
      return {
        card: "border-violet-300/70 bg-gradient-to-br from-violet-50/95 via-fuchsia-50/50 to-white/80",
        badge: "bg-violet-600 text-white",
        nextLabel: null,
        nextStatus: null,
      };
    case "NEW":
    default:
      return {
        card: "border-sky-300/70 bg-gradient-to-br from-sky-50/95 via-indigo-50/60 to-white/80",
        badge: "bg-sky-600 text-white",
        nextLabel: "เริ่มทำ",
        nextStatus: "PREPARING",
      };
  }
}

/** โทนคอลัมน์คิวแดชบอร์ด (รวม SERVED+SERVING ในคอลัมน์กำลังเสิร์ฟ) */
export function buildingPosDashboardQueueColumnTone(columnKey: BuildingPosDashboardQueueColumnKey): {
  card: string;
  badge: string;
} {
  switch (columnKey) {
    case "PREPARING":
      return {
        card: "border-amber-300/70 bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-white/80",
        badge: "bg-amber-500 text-white",
      };
    case "SERVING":
      return {
        card: "border-emerald-300/70 bg-gradient-to-br from-emerald-50/95 via-teal-50/55 to-cyan-50/50",
        badge: "bg-emerald-600 text-white",
      };
    case "DELIVERED":
      return {
        card: "border-violet-300/70 bg-gradient-to-br from-violet-50/95 via-fuchsia-50/50 to-white/80",
        badge: "bg-violet-600 text-white",
      };
    case "NEW":
    default:
      return {
        card: "border-sky-300/70 bg-gradient-to-br from-sky-50/95 via-indigo-50/60 to-white/80",
        badge: "bg-sky-600 text-white",
      };
  }
}

export function buildingPosStationPublicPath(
  role: Exclude<BuildingPosStationRole, "queue">,
  ownerId: string,
): string {
  return `/building-pos/${role}/${encodeURIComponent(ownerId)}`;
}

export function buildingPosStationPublicUrl(
  baseUrl: string,
  role: Exclude<BuildingPosStationRole, "queue">,
  ownerId: string,
  trialSessionId?: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = buildingPosStationPublicPath(role, ownerId);
  if (trialSessionId && trialSessionId !== "prod") {
    return `${base}${path}?t=${encodeURIComponent(trialSessionId)}`;
  }
  return `${base}${path}`;
}

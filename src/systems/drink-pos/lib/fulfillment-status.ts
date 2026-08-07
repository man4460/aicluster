export const DRINK_POS_FULFILLMENT_STATUSES = ["RECEIVED", "MAKING", "DONE", "SERVED"] as const;
export type DrinkPosFulfillmentStatus = (typeof DRINK_POS_FULFILLMENT_STATUSES)[number];

/** สถานะที่ยังแสดงบนกระดานคิว (ยังไม่ส่งมอบ) */
export const DRINK_POS_BOARD_FULFILLMENT_STATUSES = ["RECEIVED", "MAKING", "DONE"] as const;

export type DrinkPosStationRole = "kitchen" | "serve";

export function isDrinkPosFulfillmentStatus(value: string): value is DrinkPosFulfillmentStatus {
  return (DRINK_POS_FULFILLMENT_STATUSES as readonly string[]).includes(value);
}

export function drinkPosFulfillmentLabel(status: string | null | undefined): string {
  switch (status) {
    case "MAKING":
      return "กำลังทำ";
    case "DONE":
      return "พร้อมรับ";
    case "SERVED":
      return "ส่งมอบแล้ว";
    case "RECEIVED":
    default:
      return "รับออเดอร์";
  }
}

/** สีการ์ด / แถบสถานะ */
export function drinkPosFulfillmentTone(status: string | null | undefined): {
  card: string;
  badge: string;
  bar: string;
  nextLabel: string | null;
  nextStatus: DrinkPosFulfillmentStatus | null;
} {
  switch (status) {
    case "MAKING":
      return {
        card: "border-amber-300/70 bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-white/80",
        badge: "bg-amber-500 text-white",
        bar: "bg-amber-400",
        nextLabel: "พร้อมรับ",
        nextStatus: "DONE",
      };
    case "DONE":
      return {
        card: "border-emerald-300/70 bg-gradient-to-br from-emerald-50/95 via-teal-50/60 to-white/80",
        badge: "bg-emerald-600 text-white",
        bar: "bg-emerald-500",
        nextLabel: "ส่งมอบแล้ว",
        nextStatus: "SERVED",
      };
    case "SERVED":
      return {
        card: "border-slate-200/80 bg-gradient-to-br from-slate-50/95 via-white to-white/80",
        badge: "bg-slate-600 text-white",
        bar: "bg-slate-400",
        nextLabel: null,
        nextStatus: null,
      };
    case "RECEIVED":
    default:
      return {
        card: "border-sky-300/70 bg-gradient-to-br from-sky-50/95 via-indigo-50/60 to-white/80",
        badge: "bg-sky-600 text-white",
        bar: "bg-sky-500",
        nextLabel: "เริ่มทำ",
        nextStatus: "MAKING",
      };
  }
}

export function drinkPosOrderTicketLabel(id: string, createdAt: string | Date): string {
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const hh = Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
  const short = id.slice(-4).toUpperCase();
  return `#${short} · ${hh}`;
}

export function drinkPosStationPublicPath(role: DrinkPosStationRole, ownerId: string): string {
  return `/drink-pos/${role}/${encodeURIComponent(ownerId)}`;
}

export function drinkPosStationPublicUrl(
  baseUrl: string,
  role: DrinkPosStationRole,
  ownerId: string,
  trialSessionId?: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = drinkPosStationPublicPath(role, ownerId);
  if (trialSessionId && trialSessionId !== "prod") {
    return `${base}${path}?t=${encodeURIComponent(trialSessionId)}`;
  }
  return `${base}${path}`;
}

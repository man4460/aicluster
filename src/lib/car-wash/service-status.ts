import { z } from "zod";

/** ขั้นตอนลานล้าง — ลำดับใน CAR_WASH_LANE_FLOW (PAID = ปิดคิว / ออกจากลาน) */
export const CAR_WASH_SERVICE_STATUSES = ["QUEUED", "WASHING", "VACUUMING", "WAXING", "COMPLETED", "PAID"] as const;
export type CarWashServiceStatus = (typeof CAR_WASH_SERVICE_STATUSES)[number];

export const carWashServiceStatusZod = z.enum(CAR_WASH_SERVICE_STATUSES);

export const CAR_WASH_LANE_FLOW: CarWashServiceStatus[] = [
  "QUEUED",
  "WASHING",
  "VACUUMING",
  "WAXING",
  "COMPLETED",
  "PAID",
];

export function carWashStatusLabelTh(s: string): string {
  switch (s) {
    case "QUEUED":
      return "รอคิว";
    case "WASHING":
      return "กำลังล้าง";
    case "VACUUMING":
      return "กำลังดูดฝุ่น";
    case "WAXING":
      return "กำลังขัดเคลือบ";
    case "COMPLETED":
      return "เสร็จแล้ว";
    case "PAID":
      return "ชำระแล้ว";
    case "IN_PROGRESS":
      return "กำลังล้าง";
    default:
      return s;
  }
}

export function carWashNextStatus(s: CarWashServiceStatus): CarWashServiceStatus | null {
  const i = CAR_WASH_LANE_FLOW.indexOf(s);
  if (i < 0 || i >= CAR_WASH_LANE_FLOW.length - 1) return null;
  return CAR_WASH_LANE_FLOW[i + 1]!;
}

export function carWashPrevStatus(s: CarWashServiceStatus): CarWashServiceStatus | null {
  const i = CAR_WASH_LANE_FLOW.indexOf(s);
  if (i <= 0) return null;
  return CAR_WASH_LANE_FLOW[i - 1]!;
}

/** รองรับข้อมูลเก่า IN_PROGRESS → WASHING */
export function normalizeCarWashServiceStatus(raw: string): CarWashServiceStatus {
  if (raw === "IN_PROGRESS") return "WASHING";
  if ((CAR_WASH_SERVICE_STATUSES as readonly string[]).includes(raw)) return raw as CarWashServiceStatus;
  return "COMPLETED";
}

/** ป้ายในรายการบันทึก — ไม่ใช้กับ COMPLETED */
export function carWashLaneListBadgeClass(s: CarWashServiceStatus): string {
  switch (s) {
    case "QUEUED":
      return "bg-amber-100 text-amber-900";
    case "WASHING":
      return "bg-sky-100 text-sky-900";
    case "VACUUMING":
      return "bg-violet-100 text-violet-900";
    case "WAXING":
      return "bg-teal-100 text-teal-900";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900";
    case "PAID":
      return "bg-emerald-200 text-emerald-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

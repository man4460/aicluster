import { bangkokDateKey } from "@/lib/time/bangkok";
import type { SmartPoliceCasePriority } from "@/generated/prisma/enums";

/** จำนวนวันปฏิทินนับจากวันรับคดี (Asia/Bangkok) · null ถ้ายังไม่มี receivedAt */
export function smartPoliceDaysSinceReceived(
  receivedAt: Date | string | null | undefined,
  now = new Date(),
): number | null {
  if (!receivedAt) return null;
  const d = typeof receivedAt === "string" ? new Date(receivedAt) : receivedAt;
  if (Number.isNaN(d.getTime())) return null;
  const startKey = bangkokDateKey(d);
  const todayKey = bangkokDateKey(now);
  const start = new Date(`${startKey}T12:00:00+07:00`).getTime();
  const end = new Date(`${todayKey}T12:00:00+07:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** เกินกำหนดเชิงปฏิบัติ (ไม่ใช่กฎหมาย) — NORMAL ≥7 · HIGH ≥5 · URGENT ≥3 · LOW ≥14 */
export function smartPoliceIsOverdue(
  priority: SmartPoliceCasePriority,
  days: number | null,
): boolean {
  if (days == null) return false;
  if (priority === "URGENT") return days >= 3;
  if (priority === "HIGH") return days >= 5;
  if (priority === "LOW") return days >= 14;
  return days >= 7;
}

export const SMART_POLICE_PRIORITY_LABEL: Record<SmartPoliceCasePriority, string> = {
  LOW: "ต่ำ",
  NORMAL: "ปกติ",
  HIGH: "สูง",
  URGENT: "ด่วน",
};

import type { PosOrderItem } from "@/systems/building-pos/building-pos-service";

export function mapBuildingPosOrderRow(r: {
  id: number;
  createdAt: Date;
  customerName: string;
  tableNo: string;
  customerSessionId?: string | null;
  status: string;
  itemsJson: unknown;
  totalAmount: number;
  note: string;
  paymentSlipUrl?: string | null;
  memberPhone?: string | null;
  pointsEarned?: number | null;
  pointsRedeemed?: number | null;
}) {
  const slip = typeof r.paymentSlipUrl === "string" ? r.paymentSlipUrl.trim() : "";
  const createdAt =
    r.createdAt instanceof Date && !Number.isNaN(r.createdAt.getTime()) ?
      r.createdAt.toISOString()
    : new Date().toISOString();
  return {
    id: r.id,
    created_at: createdAt,
    customer_name: r.customerName,
    table_no: r.tableNo,
    customer_session_id: (r.customerSessionId ?? "").trim(),
    status: r.status as "NEW" | "PREPARING" | "SERVED" | "SERVING" | "DELIVERED" | "PAID",
    items: Array.isArray(r.itemsJson) ? (r.itemsJson as PosOrderItem[]) : [],
    total_amount: r.totalAmount,
    note: r.note,
    payment_slip_url: slip,
    member_phone: typeof r.memberPhone === "string" ? r.memberPhone.trim() : "",
    points_earned: typeof r.pointsEarned === "number" ? r.pointsEarned : 0,
    points_redeemed: typeof r.pointsRedeemed === "number" ? r.pointsRedeemed : 0,
  };
}

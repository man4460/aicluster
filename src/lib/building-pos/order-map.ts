import type { PosOrderItem } from "@/systems/building-pos/building-pos-service";

export function mapBuildingPosOrderRow(r: {
  id: number;
  createdAt: Date;
  customerName: string;
  tableNo: string;
  status: string;
  itemsJson: unknown;
  totalAmount: number;
  note: string;
  paymentSlipUrl?: string | null;
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
    status: r.status as "NEW" | "PREPARING" | "SERVED" | "PAID",
    items: Array.isArray(r.itemsJson) ? (r.itemsJson as PosOrderItem[]) : [],
    total_amount: r.totalAmount,
    note: r.note,
    payment_slip_url: slip,
  };
}

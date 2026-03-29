import { cn } from "@/lib/cn";
import type { RoomBillingUiStatus } from "@/systems/dormitory/lib/compute";

const LABEL: Record<RoomBillingUiStatus, string> = {
  vacant: "ว่าง",
  overdue: "ค้างชำระ (งวดเก่า)",
  paid_complete: "ชำระครบ",
  payment_pending: "ค้างชำระ",
  meter_needed: "รอบันทึกมิเตอร์",
};

const STYLE: Record<RoomBillingUiStatus, string> = {
  vacant: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  overdue: "bg-red-50 text-red-800 ring-red-200",
  paid_complete: "bg-emerald-50 text-emerald-900 ring-emerald-300",
  payment_pending: "bg-amber-50 text-amber-900 ring-amber-200",
  meter_needed: "bg-sky-50 text-sky-900 ring-sky-200",
};

export function RoomBillingStatusBadge({ status }: { status: RoomBillingUiStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STYLE[status],
      )}
    >
      {LABEL[status]}
    </span>
  );
}

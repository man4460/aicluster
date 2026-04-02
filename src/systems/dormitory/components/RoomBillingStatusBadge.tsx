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

const SIZE: Record<"default" | "compact" | "compactWide", string> = {
  default: "rounded-full px-2.5 py-0.5 text-xs font-semibold",
  /** ผังห้อง — จำกัดความกว้าง จัดกลางการ์ด */
  compact: "mx-auto max-w-[11rem] rounded-lg px-2 py-1 text-[10px] font-semibold leading-snug text-center",
  /** การ์ดรายการห้อง — เต็มคอลัมน์ขวา */
  compactWide: "w-full rounded-lg px-2 py-1 text-[10px] font-semibold leading-snug text-center",
};

export function RoomBillingStatusBadge({
  status,
  size = "default",
  className,
}: {
  status: RoomBillingUiStatus;
  size?: "default" | "compact" | "compactWide";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center ring-1 ring-inset",
        SIZE[size],
        STYLE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}

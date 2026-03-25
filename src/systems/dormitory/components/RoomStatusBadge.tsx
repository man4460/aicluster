import { cn } from "@/lib/cn";
import type { RoomStatusKind } from "@/systems/dormitory/lib/compute";

const LABEL: Record<RoomStatusKind, string> = {
  vacant: "ว่าง",
  partial: "มีผู้เข้าพัก",
  full: "เต็ม",
  overdue: "ค้างชำระ",
};

const STYLE: Record<RoomStatusKind, string> = {
  vacant: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  partial: "bg-amber-50 text-amber-900 ring-amber-200",
  full: "bg-slate-100 text-slate-800 ring-slate-200",
  overdue: "bg-red-50 text-red-800 ring-red-200",
};

export function RoomStatusBadge({ kind }: { kind: RoomStatusKind }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STYLE[kind],
      )}
    >
      {LABEL[kind]}
    </span>
  );
}

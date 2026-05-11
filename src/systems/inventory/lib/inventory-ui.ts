import { cn } from "@/lib/cn";

/** การ์ดสถิติแดชบอร์ด — โทน teal/emerald สำหรับโมดูล inventory */
export function inventoryStatCardClass(
  tone: "teal" | "emerald" | "amber" | "rose",
) {
  const toneStyles = {
    teal:
      "border-white/60 bg-gradient-to-br from-white/65 via-teal-50/45 to-emerald-100/35 text-teal-900 shadow-[0_18px_38px_-26px_rgba(13,148,136,0.4)] backdrop-blur-xl",
    emerald:
      "border-white/60 bg-gradient-to-br from-white/65 via-emerald-50/45 to-emerald-100/30 text-emerald-900 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl",
    amber:
      "border-white/60 bg-gradient-to-br from-white/65 via-amber-50/40 to-orange-100/28 text-amber-900 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.32)] backdrop-blur-xl",
    rose:
      "border-white/60 bg-gradient-to-br from-white/65 via-rose-50/40 to-rose-100/30 text-rose-900 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.32)] backdrop-blur-xl",
  };
  return cn(
    "relative overflow-hidden rounded-[2rem] border p-3 shadow-[0_16px_34px_-24px_rgba(13,148,136,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(13,148,136,0.4)] sm:p-5",
    toneStyles[tone],
  );
}

/** ปุ่ม row action — แก้ไข (โทนกลาง) */
export const inventoryRowEditIconButtonClass =
  "inline-flex h-9 w-9 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/65 bg-white/85 text-teal-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900";

/** ปุ่ม row action — ลบ (โทนเตือน) */
export const inventoryRowRemoveIconButtonClass =
  "inline-flex h-9 w-9 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100";

/** input class กลาง — โทน teal */
export const inventoryInputClass =
  "min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1f2937] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-200";

/** ปุ่มหลัก — gradient teal-emerald */
export const inventoryPrimaryButtonClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 px-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 sm:min-w-0 sm:px-4";

/** chip / filter pill — toggle */
export function inventoryChipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
    active
      ? "border-teal-500 bg-teal-600 text-white shadow-md"
      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
  );
}

/** ป้ายประเภทการเคลื่อนไหว — สีสันแยกชัด */
export const INVENTORY_MOVEMENT_LABEL: Record<
  "IN" | "OUT" | "TRANSFER" | "ADJUST",
  { label: string; toneClass: string }
> = {
  IN: {
    label: "รับเข้า",
    toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  OUT: {
    label: "เบิกออก",
    toneClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
  TRANSFER: {
    label: "โอนระหว่างคลัง",
    toneClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  ADJUST: {
    label: "ปรับยอด",
    toneClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

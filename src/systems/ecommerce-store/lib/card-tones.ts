import { cn } from "@/lib/cn";

/** โทนสีการ์ดรายการร้านออนไลน์ — เส้นซ้าย + พื้นอ่อน + ไอคอน (แม่แบบชมรม/ซักผ้า) */
export type EcommerceStoreCardTone =
  | "sky"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "indigo"
  | "slate";

export type EcommerceStoreCardToneClasses = {
  leftBorder: string;
  bg: string;
  iconBg: string;
  iconText: string;
  hoverShadow: string;
  label: string;
};

const TONES: Record<EcommerceStoreCardTone, EcommerceStoreCardToneClasses> = {
  sky: {
    leftBorder: "border-l-sky-500",
    bg: "bg-sky-50/55",
    iconBg: "bg-sky-100/90 ring-sky-200/80",
    iconText: "text-sky-700",
    hoverShadow: "hover:shadow-md hover:shadow-sky-100/80",
    label: "text-sky-800/80",
  },
  violet: {
    leftBorder: "border-l-violet-500",
    bg: "bg-violet-50/50",
    iconBg: "bg-violet-100/90 ring-violet-200/80",
    iconText: "text-violet-700",
    hoverShadow: "hover:shadow-md hover:shadow-violet-100/80",
    label: "text-violet-800/80",
  },
  emerald: {
    leftBorder: "border-l-emerald-500",
    bg: "bg-emerald-50/50",
    iconBg: "bg-emerald-100/90 ring-emerald-200/80",
    iconText: "text-emerald-700",
    hoverShadow: "hover:shadow-md hover:shadow-emerald-100/80",
    label: "text-emerald-800/80",
  },
  rose: {
    leftBorder: "border-l-rose-500",
    bg: "bg-rose-50/45",
    iconBg: "bg-rose-100/90 ring-rose-200/80",
    iconText: "text-rose-700",
    hoverShadow: "hover:shadow-md hover:shadow-rose-100/80",
    label: "text-rose-800/80",
  },
  amber: {
    leftBorder: "border-l-amber-500",
    bg: "bg-amber-50/55",
    iconBg: "bg-amber-100/90 ring-amber-200/80",
    iconText: "text-amber-800",
    hoverShadow: "hover:shadow-md hover:shadow-amber-100/80",
    label: "text-amber-900/80",
  },
  cyan: {
    leftBorder: "border-l-cyan-500",
    bg: "bg-cyan-50/45",
    iconBg: "bg-cyan-100/90 ring-cyan-200/80",
    iconText: "text-cyan-700",
    hoverShadow: "hover:shadow-md hover:shadow-cyan-100/80",
    label: "text-cyan-800/80",
  },
  indigo: {
    leftBorder: "border-l-indigo-500",
    bg: "bg-indigo-50/50",
    iconBg: "bg-indigo-100/90 ring-indigo-200/80",
    iconText: "text-indigo-700",
    hoverShadow: "hover:shadow-md hover:shadow-indigo-100/80",
    label: "text-indigo-800/80",
  },
  slate: {
    leftBorder: "border-l-slate-400",
    bg: "bg-slate-50/80",
    iconBg: "bg-slate-100/90 ring-slate-200/80",
    iconText: "text-slate-600",
    hoverShadow: "hover:shadow-md",
    label: "text-slate-600",
  },
};

export function ecommerceStoreCardToneClasses(tone: EcommerceStoreCardTone): EcommerceStoreCardToneClasses {
  return TONES[tone];
}

/** เปลือกการ์ดรายการ — เส้นซ้าย + พื้นโทน */
export function ecommerceStoreTonedRowCardClass(tone: EcommerceStoreCardTone): string {
  const t = ecommerceStoreCardToneClasses(tone);
  return cn(
    "flex flex-row items-start justify-between gap-3 rounded-lg border border-slate-200/70 border-l-[3px] p-3 shadow-sm transition sm:items-center sm:p-4",
    t.leftBorder,
    t.bg,
    t.hoverShadow,
  );
}

/** กล่องไอคอนมุมซ้ายการ์ด */
export function ecommerceStoreCardIconTileClass(
  tone: EcommerceStoreCardTone,
  size: "md" | "lg" = "md",
): string {
  const t = ecommerceStoreCardToneClasses(tone);
  return cn(
    "flex shrink-0 items-center justify-center rounded-xl ring-1",
    size === "lg" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-10 w-10",
    t.iconBg,
    t.iconText,
  );
}

/** โทนตามระดับลูกค้า / อันดับยอดใช้จ่าย */
export function ecommerceStoreCustomerRowTone(opts: {
  spendBaht: number;
  isTopRank?: boolean;
}): EcommerceStoreCardTone {
  if (opts.isTopRank) return "amber";
  if (opts.spendBaht >= 20000) return "rose";
  if (opts.spendBaht >= 5000) return "amber";
  if (opts.spendBaht >= 1000) return "emerald";
  if (opts.spendBaht > 0) return "violet";
  return "slate";
}

/** โทนแถวสินค้าตามสถานะสต๊อก / เปิดขาย */
export function ecommerceStoreProductRowTone(opts: {
  isActive: boolean;
  lowStock: boolean;
  isRecommended?: boolean;
  isBestseller?: boolean;
}): EcommerceStoreCardTone {
  if (!opts.isActive) return "slate";
  if (opts.lowStock) return "amber";
  if (opts.isRecommended || opts.isBestseller) return "rose";
  return "violet";
}

/** โทนแถวออเดอร์ออนไลน์ตามสถานะ */
export function ecommerceStoreOrderRowTone(
  status: "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED",
): EcommerceStoreCardTone {
  switch (status) {
    case "PENDING_SLIP":
      return "amber";
    case "VERIFYING":
      return "sky";
    case "PREPARING":
      return "violet";
    case "SHIPPED":
      return "emerald";
  }
}

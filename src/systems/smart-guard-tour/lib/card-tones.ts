import { cn } from "@/lib/cn";

/** โทนสีการ์ดรายการ — จุดตรวจ รปภ. (blue-orange security) */
export type SmartGuardTourCardTone =
  | "emerald"
  | "rose"
  | "amber"
  | "sky"
  | "slate"
  | "orange"
  | "violet"
  | "indigo";

export type SmartGuardTourCardToneClasses = {
  leftBorder: string;
  bg: string;
  iconBg: string;
  iconText: string;
  hoverShadow: string;
  label: string;
};

const TONES: Record<SmartGuardTourCardTone, SmartGuardTourCardToneClasses> = {
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
  sky: {
    leftBorder: "border-l-sky-500",
    bg: "bg-sky-50/55",
    iconBg: "bg-sky-100/90 ring-sky-200/80",
    iconText: "text-sky-700",
    hoverShadow: "hover:shadow-md hover:shadow-sky-100/80",
    label: "text-sky-800/80",
  },
  slate: {
    leftBorder: "border-l-slate-400",
    bg: "bg-slate-50/80",
    iconBg: "bg-slate-100/90 ring-slate-200/80",
    iconText: "text-slate-600",
    hoverShadow: "hover:shadow-md",
    label: "text-slate-600",
  },
  orange: {
    leftBorder: "border-l-orange-500",
    bg: "bg-orange-50/50",
    iconBg: "bg-orange-100/90 ring-orange-200/80",
    iconText: "text-orange-700",
    hoverShadow: "hover:shadow-md hover:shadow-orange-100/80",
    label: "text-orange-900/80",
  },
  violet: {
    leftBorder: "border-l-violet-500",
    bg: "bg-violet-50/50",
    iconBg: "bg-violet-100/90 ring-violet-200/80",
    iconText: "text-violet-700",
    hoverShadow: "hover:shadow-md hover:shadow-violet-100/80",
    label: "text-violet-800/80",
  },
  indigo: {
    leftBorder: "border-l-indigo-500",
    bg: "bg-indigo-50/50",
    iconBg: "bg-indigo-100/90 ring-indigo-200/80",
    iconText: "text-indigo-700",
    hoverShadow: "hover:shadow-md hover:shadow-indigo-100/80",
    label: "text-indigo-800/80",
  },
};

export function smartGuardTourCardToneClasses(tone: SmartGuardTourCardTone): SmartGuardTourCardToneClasses {
  return TONES[tone];
}

export function smartGuardTourTonedRowCardClass(tone: SmartGuardTourCardTone): string {
  const t = smartGuardTourCardToneClasses(tone);
  return cn(
    "flex flex-col gap-3 rounded-lg border border-slate-200/70 border-l-[3px] p-3 shadow-sm transition sm:flex-row sm:items-center sm:justify-between sm:p-4",
    t.leftBorder,
    t.bg,
    t.hoverShadow,
  );
}

export function smartGuardTourTonedGridCardClass(tone: SmartGuardTourCardTone): string {
  const t = smartGuardTourCardToneClasses(tone);
  return cn(
    "flex h-full min-w-0 flex-col gap-2 rounded-lg border border-slate-200/70 border-l-[3px] p-3 shadow-sm transition",
    t.leftBorder,
    t.bg,
    t.hoverShadow,
  );
}

export function smartGuardTourCardIconTileClass(
  tone: SmartGuardTourCardTone,
  size: "md" | "lg" = "md",
): string {
  const t = smartGuardTourCardToneClasses(tone);
  return cn(
    "flex shrink-0 items-center justify-center rounded-xl ring-1",
    size === "lg" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-10 w-10",
    t.iconBg,
    t.iconText,
  );
}

import { cn } from "@/lib/cn";

/** โทนสี tile หัวข้อ / การ์ด LMS */
export type LmsCardTone =
  | "sky"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "indigo"
  | "slate";

type ToneClasses = {
  iconBg: string;
  iconText: string;
};

const TONES: Record<LmsCardTone, ToneClasses> = {
  sky: { iconBg: "bg-sky-100/90 ring-sky-200/80", iconText: "text-sky-700" },
  violet: { iconBg: "bg-violet-100/90 ring-violet-200/80", iconText: "text-violet-700" },
  emerald: { iconBg: "bg-emerald-100/90 ring-emerald-200/80", iconText: "text-emerald-700" },
  rose: { iconBg: "bg-rose-100/90 ring-rose-200/80", iconText: "text-rose-700" },
  amber: { iconBg: "bg-amber-100/90 ring-amber-200/80", iconText: "text-amber-800" },
  indigo: { iconBg: "bg-indigo-100/90 ring-indigo-200/80", iconText: "text-indigo-700" },
  slate: { iconBg: "bg-slate-100/90 ring-slate-200/80", iconText: "text-slate-700" },
};

/** กล่องไอคอนหัวข้อหน้า — h-9 ตามแม่แบบเมนู */
export function lmsPageTitleIconTileClass(tone: LmsCardTone = "sky"): string {
  const t = TONES[tone];
  return cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
    t.iconBg,
    t.iconText,
  );
}

/** กล่องไอคอนบล็อกย่อย */
export function lmsBlockTitleIconTileClass(tone: LmsCardTone = "slate"): string {
  const t = TONES[tone];
  return cn(
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
    t.iconBg,
    t.iconText,
  );
}

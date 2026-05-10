import { cn } from "@/lib/cn";

/** เปลือกการ์ดหัวโมดูล — เทียบ CarWashDashboard (เงา + inset ไฮไลต์) */
export const parkingValetHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6 print:hidden";

/** การ์ดตัวเลขหัวข้อสถิติ — โทนเดียวกับ CarWashStat */
export function parkingStatCardClass(tone: "indigo" | "slate" | "emerald" | "amber") {
  const toneStyles = {
    indigo:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.4)] backdrop-blur-xl",
    slate:
      "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-800 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)] backdrop-blur-xl",
    emerald:
      "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-800 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl",
    amber:
      "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/40 to-orange-100/28 text-amber-900 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.32)] backdrop-blur-xl",
  };
  return cn(
    "relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5",
    toneStyles[tone],
  );
}

export const parkingValetCardClass =
  "rounded-[2rem] border border-white/55 bg-white/45 p-4 shadow-sm backdrop-blur-sm ring-1 ring-white/70 sm:p-5";

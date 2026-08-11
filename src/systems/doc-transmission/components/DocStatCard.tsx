import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "violet" | "emerald" | "amber" | "indigo" | "rose";

function toneGradientClass(tone: Tone): string {
  switch (tone) {
    case "violet":
      return "from-[#7c3aed] via-[#a855f7] to-[#c026d3]";
    case "indigo":
      return "from-[#4338ca] via-[#5b61ff] to-[#6366f1]";
    case "emerald":
      return "from-emerald-500 via-teal-500 to-[#0d9488]";
    case "amber":
      return "from-amber-500 via-orange-500 to-rose-500";
    case "rose":
      return "from-rose-500 via-pink-500 to-fuchsia-500";
  }
}

function toneBubbleClass(tone: Tone): string {
  switch (tone) {
    case "violet":
      return "from-violet-300/40 via-fuchsia-200/30 to-transparent";
    case "indigo":
      return "from-indigo-100/60 via-indigo-200/30 to-transparent";
    case "emerald":
      return "from-emerald-300/45 via-teal-200/30 to-transparent";
    case "amber":
      return "from-amber-300/45 via-orange-200/30 to-transparent";
    case "rose":
      return "from-fuchsia-300/40 via-pink-200/30 to-transparent";
  }
}

export function DocStatCard({
  title,
  value,
  subtitle,
  tone = "violet",
  icon,
  className,
  colSpanMobile,
}: {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  colSpanMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-[#e8e6f4]/80 bg-white p-4 shadow-sm",
        colSpanMobile && "col-span-2 sm:col-span-1",
        className,
      )}
    >
      <div aria-hidden className={cn("pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br blur-xl", toneBubbleClass(tone))} />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">{title}</p>
          {icon ? <div className="opacity-60">{icon}</div> : null}
        </div>
        <p
          className={cn(
            "mt-1 bg-gradient-to-br bg-clip-text font-black tabular-nums leading-none text-transparent",
            toneGradientClass(tone),
            typeof value === "number" ? "text-2xl sm:text-[1.8rem]" : "text-2xl sm:text-[1.8rem]",
          )}
        >
          {value}
        </p>
        {subtitle ? <p className="mt-1 text-xs font-semibold text-[#8b87ad]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

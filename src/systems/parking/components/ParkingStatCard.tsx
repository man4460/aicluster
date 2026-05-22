import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parkingStatCardClass } from "@/systems/parking/parking-ui-tokens";

/** เทียบ CarWashStat — การ์ดตัวเลข + ไอคอน */
export function ParkingStatCard({
  title,
  value,
  tone,
  icon,
  className,
}: {
  title: string;
  value: string;
  tone: "indigo" | "slate" | "emerald" | "amber" | "violet";
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(parkingStatCardClass(tone), "min-w-0", className)}>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-2">
          <p className="min-w-0 text-[9px] font-black uppercase leading-tight tracking-widest opacity-60 sm:text-[10px]">
            {title}
          </p>
          {icon ? <div className="shrink-0 opacity-40">{icon}</div> : null}
        </div>
        <p className="mt-3 text-xl font-black tabular-nums tracking-tight sm:mt-4 sm:text-2xl md:text-3xl">{value}</p>
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}

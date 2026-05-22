import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { aqStatCardClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

export function AppointmentQueueStatCard({
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
  tone?: "violet" | "emerald" | "amber" | "indigo" | "rose";
  icon?: ReactNode;
  className?: string;
  colSpanMobile?: boolean;
}) {
  return (
    <div className={cn(aqStatCardClass(tone), colSpanMobile && "col-span-2 sm:col-span-1", className)}>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
          {icon ? <div className="opacity-40">{icon}</div> : null}
        </div>
        <p className="mt-2 text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl">{value}</p>
        {subtitle ? <p className="mt-1 text-xs font-medium opacity-70">{subtitle}</p> : null}
      </div>
    </div>
  );
}

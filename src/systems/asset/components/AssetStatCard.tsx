import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { assetStatCardClass } from "@/systems/asset/asset-ui-tokens";

export function AssetStatCard({
  title,
  value,
  subtitle,
  tone = "violet",
  icon,
  className,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: "violet" | "slate" | "amber" | "emerald" | "rose" | "indigo";
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(assetStatCardClass(tone), className)}>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
          {icon ? <div className="opacity-40">{icon}</div> : null}
        </div>
        <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{value}</p>
        {subtitle ? <p className="mt-1 text-[11px] font-medium opacity-80">{subtitle}</p> : null}
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}

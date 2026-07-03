import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { educareStatCardClass } from "@/systems/educare/educare-ui-tokens";



export function EducareStatCard({

  title,

  value,

  subtitle,

  tone = "violet",

  unit,

  delta,

  icon,

  className,

}: {

  title: string;

  value: React.ReactNode;

  subtitle?: React.ReactNode;

  tone?: "violet" | "slate" | "amber" | "emerald" | "rose" | "indigo";

  unit?: string;

  delta?: number;

  icon?: ReactNode;

  className?: string;

}) {

  return (

    <div className={cn(educareStatCardClass(tone), className)}>

      <div className="relative z-10 flex h-full flex-col justify-between">

        <div className="flex items-center justify-between gap-2">

          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>

          {icon ? <div className="opacity-40">{icon}</div> : null}

        </div>

        <p className="mt-3 flex items-baseline gap-1 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">

          <span>{value}</span>

          {unit ? <span className="text-base font-semibold opacity-70">{unit}</span> : null}

          {typeof delta === "number" && delta !== 0 ? (

            <span

              className={cn(

                "ml-1 self-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",

                delta > 0 ? "bg-emerald-100/80 text-emerald-700" : "bg-rose-100/80 text-rose-700",

              )}

            >

              {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}

            </span>

          ) : null}

        </p>

        {subtitle ? <p className="mt-1 text-[11px] font-medium opacity-80">{subtitle}</p> : null}

      </div>

      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />

    </div>

  );

}



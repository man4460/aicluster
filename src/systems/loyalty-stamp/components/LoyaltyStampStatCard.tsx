import { cn } from "@/lib/cn";
import { lsStatCardClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type Tone = "violet" | "emerald" | "amber" | "indigo" | "rose";

export function LoyaltyStampStatCard({
  title,
  value,
  tone,
  colSpanMobile,
  className,
}: {
  title: string;
  value: number | string;
  tone: Tone;
  colSpanMobile?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(lsStatCardClass(tone), colSpanMobile && "col-span-2 sm:col-span-1", className)}>
      <p className="text-xs font-bold text-[#66638c]">{title}</p>
      <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

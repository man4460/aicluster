"use client";

import { cn } from "@/lib/cn";
import { lsStampCardClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type Props = {
  shopName: string;
  stampEmoji: string;
  slots: boolean[];
  stampsPerReward: number;
  currentStamps: number;
  rewardTitle: string;
  rewardDescription?: string | null;
  customerLabel?: string;
  readyToRedeem?: boolean;
  compact?: boolean;
};

export function LoyaltyStampCardVisual({
  shopName,
  stampEmoji,
  slots,
  stampsPerReward,
  currentStamps,
  rewardTitle,
  rewardDescription,
  customerLabel,
  readyToRedeem,
  compact,
}: Props) {
  const cols = stampsPerReward <= 5 ? stampsPerReward : stampsPerReward <= 10 ? 5 : 6;

  return (
    <div className={cn(lsStampCardClass, compact && "p-4 sm:p-5")}>
      <div className="text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5b61ff]">บัตรสะสมแต้ม</p>
        <h3 className="mt-1 font-black tracking-tight text-[#1e1b4b] sm:text-lg">{shopName}</h3>
        {customerLabel ? (
          <p className="mt-0.5 text-sm font-semibold text-[#66638c]">{customerLabel}</p>
        ) : null}
      </div>

      <div
        className="mt-4 grid gap-2 sm:gap-2.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        aria-label={`สะสมแล้ว ${currentStamps} จาก ${stampsPerReward} แต้ม`}
      >
        {slots.map((filled, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square min-h-[44px] items-center justify-center rounded-2xl border text-xl transition-all sm:min-h-[52px] sm:text-2xl",
              filled
                ? "border-[#5b61ff]/35 bg-gradient-to-br from-[#eef0ff] to-white shadow-sm ring-2 ring-[#5b61ff]/15"
                : "border-dashed border-[#dcd8f0] bg-white/50 text-[#c5c2e0]",
            )}
            aria-hidden
          >
            {filled ? stampEmoji : ""}
          </div>
        ))}
      </div>

      <p className="mt-3 text-left text-sm font-bold text-[#4d47b6]">
        {currentStamps}/{stampsPerReward} แต้ม
      </p>

      <div className="mt-3 rounded-2xl border border-white/60 bg-white/50 px-3 py-2.5 text-left">
        <p className="text-xs font-bold text-[#5b61ff]">ของรางวัล</p>
        <p className="font-bold text-[#1e1b4b]">{rewardTitle}</p>
        {rewardDescription ? (
          <p className="mt-0.5 text-xs text-[#66638c]">{rewardDescription}</p>
        ) : null}
      </div>

      {readyToRedeem ? (
        <p className="mt-3 rounded-xl bg-emerald-100/90 px-3 py-2 text-center text-sm font-black text-emerald-800">
          พร้อมแลกของรางวัลแล้ว
        </p>
      ) : null}
    </div>
  );
}

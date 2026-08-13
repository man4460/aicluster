"use client";

import {
  normalizeBuildingPosPortalPaymentMode,
  type BuildingPosPortalBookingPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { cn } from "@/lib/cn";
import {
  buildingPosFieldClass,
  buildingPosPrimaryTabPillClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

const MODES: { value: BuildingPosPortalBookingPaymentMode; label: string }[] = [
  { value: "NONE", label: "ไม่เก็บเงิน" },
  { value: "DEPOSIT", label: "มัดจำ" },
  { value: "FULL", label: "ชำระเต็ม" },
];

type Props = {
  portalBookingPaymentMode: BuildingPosPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  depositPercent: number | null;
  onPaymentModeChange: (mode: BuildingPosPortalBookingPaymentMode) => void;
  onDepositAmountChange: (baht: number | null) => void;
  onDepositPercentChange: (percent: number | null) => void;
  disabled?: boolean;
};

export function BuildingPosBookingPaymentSettings({
  portalBookingPaymentMode,
  depositAmountBaht,
  depositPercent,
  onPaymentModeChange,
  onDepositAmountChange,
  onDepositPercentChange,
  disabled = false,
}: Props) {
  const mode = normalizeBuildingPosPortalPaymentMode(portalBookingPaymentMode);

  return (
    <div className="space-y-4 rounded-2xl border border-[#ecebff] bg-[#faf9ff]/80 p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">ชำระตอนจองจากเว็บ</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="โหมดชำระตอนจอง">
        {MODES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={mode === opt.value}
            disabled={disabled}
            onClick={() => onPaymentModeChange(opt.value)}
            className={buildingPosPrimaryTabPillClass(mode === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "DEPOSIT" || mode === "FULL" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#4d47b6]">
            ยอดคงที่ (บาท)
            <input
              type="number"
              min={0}
              disabled={disabled}
              className={cn(buildingPosFieldClass, "mt-1")}
              value={depositAmountBaht ?? ""}
              onChange={(e) =>
                onDepositAmountChange(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))
              }
            />
          </label>
          {mode === "DEPOSIT" ? (
            <label className="block text-xs font-bold text-[#4d47b6]">
              % จากยอดพรีออเดอร์
              <input
                type="number"
                min={1}
                max={100}
                disabled={disabled}
                className={cn(buildingPosFieldClass, "mt-1")}
                value={depositPercent ?? ""}
                onChange={(e) =>
                  onDepositPercentChange(
                    e.target.value === ""
                      ? null
                      : Math.min(100, Math.max(1, Math.round(Number(e.target.value)))),
                  )
                }
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

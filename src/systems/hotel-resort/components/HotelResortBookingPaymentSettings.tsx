"use client";

import { cn } from "@/lib/cn";
import type { HotelPortalBookingPaymentMode } from "@/systems/hotel-resort/lib/portal-booking";
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortPrimaryTabPillClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

const MODES: { value: HotelPortalBookingPaymentMode; label: string }[] = [
  { value: "NONE", label: "ไม่ต้องชำระ" },
  { value: "DEPOSIT", label: "มัดจำ" },
  { value: "FULL", label: "ชำระเต็มยอด" },
];

type Props = {
  portalBookingPaymentMode: HotelPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  onPaymentModeChange: (mode: HotelPortalBookingPaymentMode) => void;
  onDepositAmountChange: (baht: number | null) => void;
  disabled?: boolean;
};

export function HotelResortBookingPaymentSettings({
  portalBookingPaymentMode,
  depositAmountBaht,
  onPaymentModeChange,
  onDepositAmountChange,
  disabled = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 p-3 sm:p-4">
      <p className={hotelResortFormLabelClass}>ชำระตอนจองจากลิงก์ลูกค้า</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="โหมดชำระตอนจอง">
        {MODES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={portalBookingPaymentMode === opt.value}
            disabled={disabled}
            onClick={() => onPaymentModeChange(opt.value)}
            className={hotelResortPrimaryTabPillClass(portalBookingPaymentMode === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {portalBookingPaymentMode === "DEPOSIT" ? (
        <label className="mt-3 block space-y-1">
          <span className={hotelResortFormLabelClass}>จำนวนมัดจำ (บาท)</span>
          <input
            type="number"
            min={0}
            disabled={disabled}
            className={cn(hotelResortFieldClass, "mt-1")}
            value={depositAmountBaht ?? ""}
            onChange={(e) =>
              onDepositAmountChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))
            }
          />
        </label>
      ) : null}
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { digitsOnlyTaxId, isValidThaiId13 } from "@/lib/thai-tax-id";
import { laundryCardSurfaceRadiusClass } from "@/systems/laundry/lib/ui-tokens";

export type LaundryTaxInvoiceFormValue = {
  taxInvoiceEnabled: boolean;
  billingName: string;
  taxId: string;
  taxAddress: string;
  taxBranch: string;
};

export function emptyLaundryTaxInvoiceForm(): LaundryTaxInvoiceFormValue {
  return {
    taxInvoiceEnabled: false,
    billingName: "",
    taxId: "",
    taxAddress: "",
    taxBranch: "",
  };
}

const fieldClass =
  "app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm font-semibold text-[#1e1b4b]";

type Props = {
  value: LaundryTaxInvoiceFormValue;
  onChange: (next: LaundryTaxInvoiceFormValue) => void;
  fallbackName?: string;
  disabled?: boolean;
  className?: string;
};

export function LaundryTaxInvoiceFields({
  value,
  onChange,
  fallbackName = "",
  disabled,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-2.5 rounded-[1.25rem] border px-3 py-2.5 text-sm font-bold transition",
          value.taxInvoiceEnabled
            ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
            : "border-[#e8e6f4]/90 bg-white/70 text-slate-700 hover:bg-white",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
          checked={value.taxInvoiceEnabled}
          disabled={disabled}
          onChange={(e) => {
            const enabled = e.target.checked;
            onChange({
              ...value,
              taxInvoiceEnabled: enabled,
              billingName:
                enabled && !value.billingName.trim() ? fallbackName.trim() : value.billingName,
            });
          }}
        />
        <span>ออกใบกำกับภาษี</span>
      </label>
      {value.taxInvoiceEnabled ? (
        <div className={cn(laundryCardSurfaceRadiusClass, "space-y-2 border border-[#ecebff] bg-[#faf9ff]/90 p-3")}>
          <label className="block text-xs font-semibold text-[#4d47b6]">
            ชื่อในใบกำกับ
            <input
              className={fieldClass}
              value={value.billingName}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, billingName: e.target.value.slice(0, 160) })}
            />
          </label>
          <label className="block text-xs font-semibold text-[#4d47b6]">
            เลขผู้เสียภาษี (13 หลัก)
            <input
              className={fieldClass}
              inputMode="numeric"
              value={value.taxId}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...value, taxId: digitsOnlyTaxId(e.target.value).slice(0, 13) })
              }
            />
            {value.taxId.length === 13 && !isValidThaiId13(value.taxId) ? (
              <span className="mt-1 block text-[11px] text-rose-600">เลขไม่ถูกต้อง</span>
            ) : null}
          </label>
          <label className="block text-xs font-semibold text-[#4d47b6]">
            ที่อยู่ในใบกำกับ
            <textarea
              className={cn(fieldClass, "min-h-[4.5rem] resize-y")}
              rows={2}
              value={value.taxAddress}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, taxAddress: e.target.value.slice(0, 1000) })}
            />
          </label>
          <label className="block text-xs font-semibold text-[#4d47b6]">
            สาขา (ไม่บังคับ)
            <input
              className={fieldClass}
              value={value.taxBranch}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, taxBranch: e.target.value.slice(0, 120) })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

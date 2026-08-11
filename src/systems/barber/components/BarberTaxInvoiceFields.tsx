"use client";

import { cn } from "@/lib/cn";
import { digitsOnlyTaxId, isValidThaiId13 } from "@/lib/thai-tax-id";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";

export type BarberTaxInvoiceFormValue = {
  taxInvoiceEnabled: boolean;
  billingName: string;
  taxId: string;
  taxAddress: string;
  taxBranch: string;
};

const fieldClass =
  "app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm font-semibold text-[#1e1b4b]";

type Props = {
  value: BarberTaxInvoiceFormValue;
  onChange: (next: BarberTaxInvoiceFormValue) => void;
  /** ชื่อลูกค้า — เติม billingName อัตโนมัติเมื่อติ๊กครั้งแรก */
  fallbackName?: string;
  disabled?: boolean;
  className?: string;
};

export function BarberTaxInvoiceFields({
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
                enabled && !value.billingName.trim()
                  ? fallbackName.trim()
                  : value.billingName,
            });
          }}
        />
        <span>
          <span className="block">ต้องการใบกำกับภาษี</span>
          <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
            ติ๊กแล้วกรอกชื่อ · เลขผู้เสียภาษี · ที่อยู่ — ใช้ตอนพิมพ์อัตโนมัติ
          </span>
        </span>
      </label>

      {value.taxInvoiceEnabled ? (
        <div
          className={cn(
            barberCardSurfaceRadiusClass,
            "space-y-3 border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3",
          )}
        >
          <label className="block text-xs font-bold text-[#4d47b6]">
            ชื่อ / ชื่อบริษัทในใบกำกับ
            <input
              className={fieldClass}
              value={value.billingName}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, billingName: e.target.value.slice(0, 160) })}
              placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
            />
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
            <input
              className={fieldClass}
              value={value.taxId}
              disabled={disabled}
              inputMode="numeric"
              maxLength={13}
              onChange={(e) => onChange({ ...value, taxId: digitsOnlyTaxId(e.target.value) })}
              placeholder="1234567890123"
            />
            {value.taxId.trim() && !isValidThaiId13(value.taxId) ? (
              <span className="mt-1 block font-semibold text-rose-600">เลข 13 หลักไม่ถูกต้อง</span>
            ) : null}
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            ที่อยู่
            <textarea
              className={cn(fieldClass, "min-h-[88px]")}
              value={value.taxAddress}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, taxAddress: e.target.value.slice(0, 1000) })}
              placeholder="บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์"
            />
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            สาขา (ถ้ามี)
            <input
              className={fieldClass}
              value={value.taxBranch}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, taxBranch: e.target.value.slice(0, 120) })}
              placeholder="เช่น สำนักงานใหญ่ / สาขา 00000"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export const emptyBarberTaxInvoiceForm = (): BarberTaxInvoiceFormValue => ({
  taxInvoiceEnabled: false,
  billingName: "",
  taxId: "",
  taxAddress: "",
  taxBranch: "",
});

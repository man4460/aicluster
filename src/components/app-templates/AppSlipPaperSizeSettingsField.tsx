"use client";

import { cn } from "@/lib/cn";
import {
  APP_SLIP_PAPER_SIZE_OPTIONS,
  DEFAULT_APP_SLIP_PAPER_SIZE,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

export type AppSlipPaperSizeSettingsFieldProps = {
  className?: string;
  fieldClassName?: string;
  label?: string;
  /** คำอธิบายสั้น — ค่าว่าง = ซ่อน */
  hint?: string | null;
  /** ค่าที่ควบคุมจากฟอร์มตั้งค่าโมดูล */
  value: AppSlipPaperSize;
  onChange: (next: AppSlipPaperSize) => void;
  disabled?: boolean;
};

/**
 * ตั้งค่าขนาดสลิปใบเสร็จของโมดูล — บันทึกร่วมกับฟอร์มตั้งค่าร้าน (ไม่ใช้โปรไฟล์กลาง)
 * 58mm = เลย์เอาต์กึ่งกลาง · 80mm/A4 = ชิดซ้ายแบบใบเสร็จทางการ
 */
export function AppSlipPaperSizeSettingsField({
  className,
  fieldClassName = "app-input mt-1 w-full rounded-xl",
  label = "ขนาดสลิปใบเสร็จ",
  hint = "ใช้เฉพาะโมดูลนี้ · 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย",
  value,
  onChange,
  disabled,
}: AppSlipPaperSizeSettingsFieldProps) {
  const current = value || DEFAULT_APP_SLIP_PAPER_SIZE;
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-[#0000BF]/15 bg-white/70 p-3 ring-1 ring-[#0000BF]/10",
        className,
      )}
    >
      <label className="block space-y-1">
        <span className="text-xs font-bold text-[#4d47b6]">{label}</span>
        {hint ? <span className="block text-[11px] font-medium text-[#66638c]">{hint}</span> : null}
        <select
          className={fieldClassName}
          value={current}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => onChange(e.target.value as AppSlipPaperSize)}
        >
          {APP_SLIP_PAPER_SIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.value === "A4" ? " (เอกสารเต็มแผ่น)" : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

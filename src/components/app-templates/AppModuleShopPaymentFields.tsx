import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";

export function AppModuleShopPaymentFields({
  value,
  onChange,
  fieldClassName = "app-input mt-1 w-full rounded-xl",
}: {
  value: ModuleShopPaymentDto;
  onChange: (next: ModuleShopPaymentDto) => void;
  fieldClassName?: string;
}) {
  const set = <K extends keyof ModuleShopPaymentDto>(key: K, v: ModuleShopPaymentDto[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-3 border-t border-white/40 pt-3">
      <p className="text-xs font-black uppercase tracking-wider text-[#4d47b6]">ช่องทางรับชำระ</p>
      <label className="block space-y-1">
        <span className="text-xs font-bold text-[#4d47b6]">เบอร์พร้อมเพย์</span>
        <input
          className={fieldClassName}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812345678"
          value={value.promptPayPhone ?? ""}
          onChange={(e) => set("promptPayPhone", e.target.value)}
        />
        <span className="text-[11px] text-slate-500">ใช้สร้าง QR ชำระในโมดูลนี้</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ชื่อธนาคาร</span>
          <input
            className={fieldClassName}
            placeholder="เช่น กสิกรไทย"
            value={value.bankName ?? ""}
            onChange={(e) => set("bankName", e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">เลขบัญชี</span>
          <input
            className={fieldClassName}
            inputMode="numeric"
            placeholder="xxx-x-xxxxx-x"
            value={value.bankAccountNumber ?? ""}
            onChange={(e) => set("bankAccountNumber", e.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-bold text-[#4d47b6]">ชื่อบัญชี</span>
        <input
          className={fieldClassName}
          value={value.bankAccountName ?? ""}
          onChange={(e) => set("bankAccountName", e.target.value)}
        />
        <span className="text-[11px] text-slate-500">แสดงบนบิล/หน้าชำระ — ลูกค้าโอนแล้วแนบสลิปตามขั้นตอนของโมดูล</span>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-bold text-[#4d47b6]">เลขประจำตัวผู้เสียภาษี (ถ้ามี)</span>
        <input
          className={fieldClassName}
          value={value.taxId ?? ""}
          onChange={(e) => set("taxId", e.target.value)}
        />
      </label>
    </div>
  );
}

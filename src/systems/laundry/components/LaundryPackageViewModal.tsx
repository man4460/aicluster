"use client";

import type { ReactNode } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { formatLaundryDurationHoursTh } from "@/systems/laundry/laundry-duration-hours";
import type { LaundryPackage } from "@/systems/laundry/laundry-service";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-2 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}

export function LaundryPackageViewModal({
  pkg,
  onClose,
}: {
  pkg: LaundryPackage | null;
  onClose: () => void;
}) {
  const open = pkg != null;
  const p = pkg;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={p ? p.name : "แพ็กเกจ"}
      description="ข้อมูลราคาและตะกร้า"
      mobileCentered
      size="sm"
      footer={
        <button type="button" className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold" onClick={onClose}>
          ปิด
        </button>
      }
    >
      {p ?
        <div className="space-y-1 px-1">
          <Row label="โมเดลราคา" value={p.pricing_model} />
          <Row label="ราคาฐาน" value={`฿${p.base_price.toLocaleString("th-TH")}`} />
          <Row label="เวลาประมาณ (ชม.)" value={formatLaundryDurationHoursTh(p.duration_hours)} />
          <Row label="คำอธิบาย" value={p.description} />
          <Row label="ใช้งาน" value={p.is_active ? "เปิด" : "ปิด"} />
          {p.basket_tiers?.filter((t) => t.label?.trim()).length ?
            <div className="border-b border-slate-100 py-2 last:border-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ตะกร้า × ราคา</p>
              <ul className="mt-2 list-none space-y-1.5 p-0" aria-label="ราคาตามขนาดตะกร้า">
                {p.basket_tiers
                  .filter((t) => t.label?.trim())
                  .map((t, i) => (
                    <li
                      key={`${t.label}-${t.price}-${i}`}
                      className="flex items-baseline justify-between gap-3 text-sm text-slate-800"
                    >
                      <span className="min-w-0 truncate font-medium">{t.label.trim()}</span>
                      <span className="shrink-0 tabular-nums font-semibold">฿{t.price.toLocaleString("th-TH")}</span>
                    </li>
                  ))}
              </ul>
            </div>
          : <Row label="ตะกร้า × ราคา" value="-" />}
          <Row label="รูป" value={p.image_url?.trim() ? "มีรูป (ดูที่การ์ด)" : "ไม่มี"} />
        </div>
      : null}
    </FormModal>
  );
}

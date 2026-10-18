"use client";

import { useCallback, useEffect, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { SmartPoliceChargeDto } from "@/lib/smart-police/types";
import {
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceMutedTextClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (charge: SmartPoliceChargeDto) => void;
};

export function SmartPoliceChargePickerModal({ open, onClose, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [charges, setCharges] = useState<SmartPoliceChargeDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const res = await fetch(`/api/smart-police/charges?${params}`, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as {
      charges: SmartPoliceChargeDto[];
      categories: string[];
    };
    setCharges(data.charges);
    setCategories(data.categories);
  }, [q, category]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    void load();
  }, [open, load]);

  const selected = charges.find((c) => c.id === selectedId) ?? null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="เลือกข้อหาจากคลัง"
      description="ค้นหาแล้วเลือก — จะใส่ข้อหาและตัวบทกฎหมายให้อัตโนมัติ"
      size="lg"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() => {
            if (!selected) return;
            onSelect(selected);
            onClose();
          }}
          submitLabel="ใช้ข้อหานี้"
          submitDisabled={!selected}
        />
      }
    >
      <div className="flex min-h-0 flex-col gap-3 text-left">
        <input
          className={smartPoliceFieldClass}
          placeholder="ค้นหา เช่น ลักทรัพย์ · ม.334 · ยาบ้า · เมาแล้วขับ"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="ค้นหาข้อหา"
        />
        <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองหมวดข้อหา">
          <button
            type="button"
            role="tab"
            aria-selected={!category}
            className={smartPoliceFilterTextClass(!category)}
            onClick={() => setCategory("")}
          >
            ทั้งหมด
          </button>
          {categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-x-2">
              <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
              <button
                type="button"
                role="tab"
                aria-selected={category === c}
                className={smartPoliceFilterTextClass(category === c)}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            </span>
          ))}
        </div>
        {loading ? (
          <p className={smartPoliceMutedTextClass}>กำลังโหลดคลังข้อหา…</p>
        ) : charges.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-[#66638c]">
            ไม่พบข้อหา — ลองเปลี่ยนคำค้น หรือเพิ่มในตั้งค่า → คลังข้อหา
          </p>
        ) : (
          <ul className={cn(smartPoliceScrollListClass, "max-h-[min(48vh,28rem)] space-y-1.5")}>
            {charges.map((c) => {
              const active = selectedId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition",
                      active
                        ? "border-[#5b61ff] bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/25"
                        : "border-slate-200/90 bg-white hover:border-indigo-200 hover:bg-indigo-50/30",
                    )}
                    onClick={() => setSelectedId(c.id)}
                    onDoubleClick={() => {
                      onSelect(c);
                      onClose();
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#4d47b6]">
                      {c.category}
                      {c.isBuiltin ? " · ระบบ" : " · สถานี"}
                    </p>
                    <p className="text-sm font-semibold text-[#1e1b4b]">{c.chargeText}</p>
                    {c.lawRefs ? (
                      <p className="mt-0.5 text-xs leading-snug text-[#66638c]">{c.lawRefs}</p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="shrink-0 text-[11px] text-[#66638c]">
          ดับเบิลคลิกเลือกได้ทันที · แสดง {charges.length} รายการ
        </p>
      </div>
    </FormModal>
  );
}

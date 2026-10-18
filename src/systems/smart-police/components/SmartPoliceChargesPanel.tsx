"use client";

import { useCallback, useEffect, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_CHARGE_CATEGORIES,
  type SmartPoliceChargeDto,
} from "@/lib/smart-police/types";
import {
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceLabelClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
  smartPoliceRowIconButtonClass,
  smartPoliceRowRemoveIconButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

const emptyForm = {
  category: "ทั่วไป",
  chargeText: "",
  lawRefs: "",
  keywords: "",
};

type Props = {
  onToast?: (msg: string) => void;
  /** ซ่อนปุ่มเพิ่มในแผง — ให้หัวหน้าตั้งค่าเรียกแทน */
  hideAddButton?: boolean;
  registerOpenAdd?: (open: () => void) => void;
};

export function SmartPoliceChargesPanel({ onToast, hideAddButton, registerOpenAdd }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [charges, setCharges] = useState<SmartPoliceChargeDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ active: "0" });
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
    setCategories(data.categories.length ? data.categories : [...SMART_POLICE_CHARGE_CATEGORIES]);
  }, [q, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    registerOpenAdd?.(openAdd);
  }, [openAdd, registerOpenAdd]);

  function openEdit(c: SmartPoliceChargeDto) {
    if (!c.isOwnerCustom) return;
    setEditingId(c.id);
    setForm({
      category: c.category,
      chargeText: c.chargeText,
      lawRefs: c.lawRefs ?? "",
      keywords: c.keywords ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.chargeText.trim()) return;
    setSaving(true);
    const url = editingId ? `/api/smart-police/charges/${editingId}` : "/api/smart-police/charges";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      onToast?.(err.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setModalOpen(false);
    onToast?.("บันทึกข้อหาแล้ว");
    await load();
  }

  async function remove(c: SmartPoliceChargeDto) {
    if (!c.isOwnerCustom) return;
    if (!window.confirm(`ลบข้อหา «${c.chargeText}»?`)) return;
    await fetch(`/api/smart-police/charges/${c.id}`, { method: "DELETE" });
    onToast?.("ลบแล้ว");
    await load();
  }

  return (
    <div className="space-y-3">
      {!hideAddButton ? (
        <div className="flex justify-end">
          <button type="button" className={cn(smartPolicePrimaryButtonClass, "shrink-0")} onClick={openAdd}>
            + เพิ่มข้อหาสถานี
          </button>
        </div>
      ) : null}

      <input
        className={smartPoliceFieldClass}
        placeholder="ค้นหาข้อหา / กฎหมาย / คำค้น"
        value={q}
        onChange={(e) => setQ(e.target.value)}
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
        <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
      ) : charges.length === 0 ? (
        <AppEmptyState tone="violet">ไม่พบข้อหา</AppEmptyState>
      ) : (
        <ul className="min-h-0 space-y-2 md:max-h-none">
          {charges.map((c) => (
            <li key={c.id} className={smartPoliceListRowAccentClass("sky")}>
              <div className="min-w-0 flex-1 text-left text-sm">
                <p className="text-[10px] font-bold text-[#4d47b6]">
                  {c.category}
                  {c.isBuiltin ? " · ระบบ" : " · สถานี"}
                  {!c.isActive ? " · ปิด" : ""}
                </p>
                <p className="font-semibold text-[#1e1b4b]">{c.chargeText}</p>
                {c.lawRefs ? <p className="text-xs text-[#66638c]">{c.lawRefs}</p> : null}
              </div>
              {c.isOwnerCustom ? (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className={smartPoliceRowIconButtonClass}
                    aria-label={`แก้ไข ${c.chargeText}`}
                    onClick={() => openEdit(c)}
                  >
                    <IconRowEdit className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={smartPoliceRowRemoveIconButtonClass}
                    aria-label={`ลบ ${c.chargeText}`}
                    onClick={() => void remove(c)}
                  >
                    <IconRowRemove className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <span
                  className={cn(
                    smartPoliceOutlineButtonClass,
                    "pointer-events-none px-2 text-[10px]",
                  )}
                >
                  ระบบ
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-[#66638c]">แสดง {charges.length} ข้อหา</p>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "แก้ไขข้อหา" : "เพิ่มข้อหาสถานี"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void save()}
            submitLabel="บันทึก"
            submitDisabled={!form.chargeText.trim()}
            loading={saving}
          />
        }
      >
        <div className="space-y-3 text-left">
          <label className={smartPoliceLabelClass}>
            หมวด
            <select
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {SMART_POLICE_CHARGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={smartPoliceLabelClass}>
            ข้อความข้อหา *
            <textarea
              className={cn(smartPoliceTextareaClass, "mt-1 min-h-[5rem]")}
              value={form.chargeText}
              onChange={(e) => setForm((f) => ({ ...f, chargeText: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            กฎหมายที่อ้าง
            <textarea
              className={cn(smartPoliceTextareaClass, "mt-1 min-h-[4rem]")}
              value={form.lawRefs}
              onChange={(e) => setForm((f) => ({ ...f, lawRefs: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            คำค้น (ช่วยค้นหา)
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}

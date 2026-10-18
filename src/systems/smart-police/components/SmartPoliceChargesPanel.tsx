"use client";

import { useCallback, useEffect, useState } from "react";
import { AppEmptyState, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_CHARGE_CATEGORIES,
  type SmartPoliceChargeDto,
} from "@/lib/smart-police/types";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

const emptyForm = {
  category: "ทั่วไป",
  chargeText: "",
  lawRefs: "",
  keywords: "",
};

export function SmartPoliceChargesPanel({ onToast }: { onToast?: (msg: string) => void }) {
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

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#66638c]">
          คลังข้อหาระบบ + ข้อหาที่สถานีเพิ่มเอง · ใช้เลือกตอนกรอกข้อมูลคดี
        </p>
        <button
          type="button"
          className="app-btn-primary min-h-[40px] shrink-0 rounded-xl px-4 text-sm"
          onClick={openAdd}
        >
          + เพิ่มข้อหาสถานี
        </button>
      </div>

      <input
        className="app-input min-h-[44px] w-full rounded-xl"
        placeholder="ค้นหาข้อหา / กฎหมาย / คำค้น"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={cn(
            "min-h-8 rounded-lg px-2.5 text-[11px] font-semibold",
            !category
              ? "bg-gradient-to-r from-[#4f2f9a] to-[#5b61ff] text-white"
              : "border border-white/60 bg-white/70 text-[#4d47b6]",
          )}
          onClick={() => setCategory("")}
        >
          ทั้งหมด
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              "min-h-8 rounded-lg px-2.5 text-[11px] font-semibold",
              category === c
                ? "bg-gradient-to-r from-[#4f2f9a] to-[#5b61ff] text-white"
                : "border border-white/60 bg-white/70 text-[#4d47b6]",
            )}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : charges.length === 0 ? (
        <AppEmptyState tone="violet">ไม่พบข้อหา</AppEmptyState>
      ) : (
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto">
          {charges.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-l-[3px] border-sky-200 border-l-sky-500 bg-sky-50/40 px-3 py-2"
            >
              <div className="min-w-0 text-left text-sm">
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
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${c.chargeText}`}
                    onClick={() => openEdit(c)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${c.chargeText}`}
                    onClick={() => void remove(c)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <span className={cn(appTemplateOutlineButtonClass, "pointer-events-none rounded-lg px-2 py-1 text-[10px]")}>
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
          <label className="block text-sm">
            หมวด
            <select
              className="app-input mt-1 w-full rounded-xl"
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
          <label className="block text-sm">
            ข้อความข้อหา *
            <textarea
              className="app-input mt-1 min-h-[80px] w-full rounded-xl"
              value={form.chargeText}
              onChange={(e) => setForm((f) => ({ ...f, chargeText: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            กฎหมายที่อ้าง
            <textarea
              className="app-input mt-1 min-h-[64px] w-full rounded-xl"
              value={form.lawRefs}
              onChange={(e) => setForm((f) => ({ ...f, lawRefs: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            คำค้น (ช่วยค้นหา)
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}

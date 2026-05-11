"use client";

import { useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { inventoryInputClass } from "@/systems/inventory/lib/inventory-ui";
import type {
  InventoryCategoryRow,
  InventoryItemRow,
} from "@/systems/inventory/components/types";

export type InventoryItemSubmitInput = {
  sku: string;
  name: string;
  categoryId: number | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  imageUrl: string | null;
  note: string | null;
};

type FormState = {
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  costPrice: string;
  salePrice: string;
  minStock: string;
  imageUrl: string;
  note: string;
};

function buildInitial(mode: "create" | "edit", target: InventoryItemRow | null): FormState {
  if (mode === "edit" && target) {
    return {
      sku: target.sku,
      name: target.name,
      categoryId: target.categoryId ? String(target.categoryId) : "",
      unit: target.unit || "ชิ้น",
      costPrice: String(target.costPrice ?? 0),
      salePrice: String(target.salePrice ?? 0),
      minStock: String(target.minStock ?? 0),
      imageUrl: target.imageUrl ?? "",
      note: target.note ?? "",
    };
  }
  return {
    sku: "",
    name: "",
    categoryId: "",
    unit: "ชิ้น",
    costPrice: "",
    salePrice: "",
    minStock: "0",
    imageUrl: "",
    note: "",
  };
}

export function InventoryItemFormModal({
  open,
  onClose,
  mode,
  target,
  categories,
  onSubmit,
  busy,
  error,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  target: InventoryItemRow | null;
  categories: InventoryCategoryRow[];
  onSubmit: (input: InventoryItemSubmitInput) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  // Use a render key tied to (open + target.id) so the inner body remounts
  // on each open — fresh initial state without setState-in-effect lint smell.
  const renderKey = `${open ? "o" : "c"}-${target?.id ?? "new"}-${mode}`;
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "เพิ่มสินค้า" : "แก้ไขสินค้า"}
      description={
        mode === "create" ? "กรอก SKU ชื่อ และข้อมูลพื้นฐาน" : `แก้ไข ${target?.name ?? ""}`
      }
      size="md"
      footer={null}
    >
      <InventoryItemFormBody
        key={renderKey}
        mode={mode}
        target={target}
        categories={categories}
        onSubmit={onSubmit}
        onClose={onClose}
        busy={busy}
        error={error}
      />
    </FormModal>
  );
}

function InventoryItemFormBody({
  mode,
  target,
  categories,
  onSubmit,
  onClose,
  busy,
  error,
}: {
  mode: "create" | "edit";
  target: InventoryItemRow | null;
  categories: InventoryCategoryRow[];
  onSubmit: (input: InventoryItemSubmitInput) => Promise<void>;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState<FormState>(() => buildInitial(mode, target));

  const valid = form.sku.trim().length > 0 && form.name.trim().length > 0;

  async function handleSubmit() {
    if (!valid) return;
    await onSubmit({
      sku: form.sku.trim(),
      name: form.name.trim(),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      unit: form.unit.trim() || "ชิ้น",
      costPrice: Number(form.costPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      minStock: Math.max(0, Math.trunc(Number(form.minStock) || 0)),
      imageUrl: form.imageUrl.trim() || null,
      note: form.note.trim() || null,
    });
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
        >
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU" required>
          <input
            suppressHydrationWarning
            value={form.sku}
            onChange={(e) => patch("sku", e.target.value)}
            placeholder="เช่น A-001"
            className={inventoryInputClass}
            maxLength={64}
          />
        </Field>
        <Field label="หน่วย">
          <input
            suppressHydrationWarning
            value={form.unit}
            onChange={(e) => patch("unit", e.target.value)}
            placeholder="ชิ้น / กล่อง / กก."
            className={inventoryInputClass}
            maxLength={24}
          />
        </Field>
      </div>
      <Field label="ชื่อสินค้า" required>
        <input
          suppressHydrationWarning
          value={form.name}
          onChange={(e) => patch("name", e.target.value)}
          placeholder="ชื่อสินค้า"
          className={inventoryInputClass}
          maxLength={160}
        />
      </Field>
      <Field label="หมวดสินค้า">
        <select
          suppressHydrationWarning
          value={form.categoryId}
          onChange={(e) => patch("categoryId", e.target.value)}
          className={inventoryInputClass}
        >
          <option value="">— ไม่ระบุ —</option>
          {categories
            .filter((c) => c.isActive || String(c.id) === form.categoryId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ราคาทุน (บาท)">
          <input
            suppressHydrationWarning
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.costPrice}
            onChange={(e) => patch("costPrice", e.target.value)}
            placeholder="0.00"
            className={inventoryInputClass}
          />
        </Field>
        <Field label="ราคาขาย (บาท)">
          <input
            suppressHydrationWarning
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.salePrice}
            onChange={(e) => patch("salePrice", e.target.value)}
            placeholder="0.00"
            className={inventoryInputClass}
          />
        </Field>
      </div>
      <Field label="จุดสั่งซื้อ (แจ้งเมื่อต่ำกว่า)">
        <input
          suppressHydrationWarning
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={form.minStock}
          onChange={(e) => patch("minStock", e.target.value)}
          placeholder="0 = ไม่แจ้ง"
          className={inventoryInputClass}
        />
      </Field>
      <Field label="ลิงก์รูปภาพ (ถ้ามี)">
        <input
          suppressHydrationWarning
          value={form.imageUrl}
          onChange={(e) => patch("imageUrl", e.target.value)}
          placeholder="https://…"
          className={inventoryInputClass}
          maxLength={500}
        />
      </Field>
      <Field label="หมายเหตุ">
        <textarea
          suppressHydrationWarning
          value={form.note}
          onChange={(e) => patch("note", e.target.value)}
          rows={2}
          placeholder="รายละเอียดเพิ่ม"
          className={inventoryInputClass}
          maxLength={2000}
        />
      </Field>

      <div className="pt-2">
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel={mode === "create" ? "บันทึก" : "บันทึกการแก้ไข"}
          submitDisabled={!valid}
          loading={busy}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

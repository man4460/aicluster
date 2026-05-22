"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  ASSET_CONDITION_LABEL,
  ASSET_STATUS_LABEL,
  ASSET_STATUS_TONE,
  formatTHB,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { assetFieldClass, assetListRowCardClass } from "@/systems/asset/asset-ui-tokens";
import type {
  AssetCondition,
  AssetStatus,
} from "@/generated/prisma/enums";

type Master = { id: number; code: string; name: string; isActive?: boolean };
type AssetRow = {
  id: number;
  assetCode: string;
  assetName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  purchasePrice: string | null;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  depreciationYears: number;
  holderName: string | null;
  imageUrl: string | null;
  qrCode: string | null;
  note: string | null;
  description: string | null;
  category: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
  location: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
};

type AssetForm = {
  id: number | null;
  assetCode: string;
  assetName: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseDate: string;
  purchasePrice: string;
  supplierId: string;
  warrantyUntil: string;
  depreciationYears: string;
  status: AssetStatus;
  condition: AssetCondition;
  locationId: string;
  departmentId: string;
  holderName: string;
  imageUrl: string;
  note: string;
};

const STATUS_OPTIONS: AssetStatus[] = ["AVAILABLE", "IN_USE", "BORROWED", "IN_REPAIR", "DISPOSED"];
const CONDITION_OPTIONS: AssetCondition[] = ["GOOD", "FAIR", "POOR", "BROKEN"];

const inputCls = assetFieldClass;

function emptyForm(): AssetForm {
  return {
    id: null,
    assetCode: "",
    assetName: "",
    categoryId: "",
    brand: "",
    model: "",
    serialNumber: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    supplierId: "",
    warrantyUntil: "",
    depreciationYears: "5",
    status: "AVAILABLE",
    condition: "GOOD",
    locationId: "",
    departmentId: "",
    holderName: "",
    imageUrl: "",
    note: "",
  };
}

export function AssetAssetsClient() {
  const [items, setItems] = useState<AssetRow[]>([]);
  const [categories, setCategories] = useState<Master[]>([]);
  const [departments, setDepartments] = useState<Master[]>([]);
  const [locations, setLocations] = useState<Master[]>([]);
  const [suppliers, setSuppliers] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm());
  const [filter, setFilter] = useState({ status: "", condition: "", categoryId: "", departmentId: "", q: "" });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.q) params.set("q", filter.q);
      if (filter.status) params.set("status", filter.status);
      if (filter.condition) params.set("condition", filter.condition);
      if (filter.categoryId) params.set("categoryId", filter.categoryId);
      if (filter.departmentId) params.set("departmentId", filter.departmentId);
      const r = await fetch(`/api/asset/assets?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as AssetRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refreshMaster = useCallback(async () => {
    const [c, d, l, s] = await Promise.all([
      fetch("/api/asset/categories", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/asset/departments", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/asset/locations", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/asset/suppliers", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setCategories(((c.items as Master[]) ?? []).filter((x) => x.isActive !== false));
    setDepartments(((d.items as Master[]) ?? []).filter((x) => x.isActive !== false));
    setLocations(((l.items as Master[]) ?? []).filter((x) => x.isActive !== false));
    setSuppliers(((s.items as Master[]) ?? []).filter((x) => x.isActive !== false));
  }, []);

  useEffect(() => {
    void refreshMaster();
  }, [refreshMaster]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredCount = items.length;
  const hasActiveFilter =
    filter.q !== "" ||
    filter.status !== "" ||
    filter.condition !== "" ||
    filter.categoryId !== "" ||
    filter.departmentId !== "";

  const startCreate = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const startEdit = (it: AssetRow) => {
    setForm({
      id: it.id,
      assetCode: it.assetCode,
      assetName: it.assetName,
      categoryId: it.category?.id ? String(it.category.id) : "",
      brand: it.brand ?? "",
      model: it.model ?? "",
      serialNumber: it.serialNumber ?? "",
      description: it.description ?? "",
      purchaseDate: it.purchaseDate ? it.purchaseDate.slice(0, 10) : "",
      purchasePrice: it.purchasePrice ?? "",
      supplierId: it.supplier?.id ? String(it.supplier.id) : "",
      warrantyUntil: it.warrantyUntil ? it.warrantyUntil.slice(0, 10) : "",
      depreciationYears: String(it.depreciationYears ?? 5),
      status: it.status,
      condition: it.condition,
      locationId: it.location?.id ? String(it.location.id) : "",
      departmentId: it.department?.id ? String(it.department.id) : "",
      holderName: it.holderName ?? "",
      imageUrl: it.imageUrl ?? "",
      note: it.note ?? "",
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.assetName.trim()) {
      alert("กรุณาระบุชื่อทรัพย์สิน");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        assetCode: form.assetCode.trim() || undefined,
        assetName: form.assetName.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        serialNumber: form.serialNumber.trim() || null,
        description: form.description.trim() || null,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        warrantyUntil: form.warrantyUntil || null,
        depreciationYears: form.depreciationYears ? Number(form.depreciationYears) : 5,
        status: form.status,
        condition: form.condition,
        locationId: form.locationId ? Number(form.locationId) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        holderName: form.holderName.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        note: form.note.trim() || null,
      };
      if (form.id) body.id = form.id;
      const r = await fetch("/api/asset/assets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const removeItem = async (it: AssetRow) => {
    if (!confirm(`ลบทรัพย์สิน "${it.assetName}"?`)) return;
    const r = await fetch(`/api/asset/assets/${it.id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j?.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  };

  return (
    <AppDashboardSection tone="slate">
      <AppSectionHeader
        tone="slate"
        title="ทรัพย์สิน"
        description={`พบ ${filteredCount.toLocaleString("th-TH")} รายการ${hasActiveFilter ? " (กรองอยู่)" : ""}`}
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileFilterOpen((v) => !v)}
              className={cn(
                "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border sm:hidden",
                hasActiveFilter
                  ? "border-[#5b61ff]/40 bg-white/80 text-[#5b61ff] ring-2 ring-[#5b61ff]/25"
                  : "border-white/55 bg-white/75 text-[#5b61ff]",
              )}
              aria-label="เปิดตัวกรอง"
              aria-expanded={mobileFilterOpen}
              aria-controls="asset-filter-mobile"
            >
              <FilterIcon className="h-4 w-4" />
              {hasActiveFilter ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#5b61ff]" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={startCreate}
              aria-label="เพิ่มทรัพย์สิน"
              className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-3.5"
            >
              <IconPlus className="h-5 w-5 shrink-0 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มทรัพย์สิน</span>
            </button>
          </div>
        }
      />

      {/* Mobile filter panel */}
      {mobileFilterOpen ? (
        <div
          id="asset-filter-mobile"
          className={cn(appDashboardSectionSlateClass, "mt-3 space-y-2 !py-3 sm:hidden")}
        >
          <input
            type="search"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder="ค้นหา รหัส/ชื่อ/SN/ยี่ห้อ"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              className={inputCls}
              aria-label="สถานะ"
            >
              <option value="">ทุกสถานะ</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ASSET_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              value={filter.condition}
              onChange={(e) => setFilter((f) => ({ ...f, condition: e.target.value }))}
              className={inputCls}
              aria-label="สภาพ"
            >
              <option value="">ทุกสภาพ</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {ASSET_CONDITION_LABEL[c]}
                </option>
              ))}
            </select>
            <select
              value={filter.categoryId}
              onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}
              className={inputCls}
              aria-label="หมวด"
            >
              <option value="">ทุกหมวด</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filter.departmentId}
              onChange={(e) => setFilter((f) => ({ ...f, departmentId: e.target.value }))}
              className={inputCls}
              aria-label="แผนก"
            >
              <option value="">ทุกแผนก</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setFilter({ status: "", condition: "", categoryId: "", departmentId: "", q: "" })
              }
              className="text-xs font-semibold text-[#5b61ff]"
            >
              ล้างตัวกรอง
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#66638c]"
            >
              ปิด
            </button>
          </div>
        </div>
      ) : null}

      {/* Desktop filter */}
      <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-5">
        <input
          type="search"
          value={filter.q}
          onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          placeholder="ค้นหา..."
          className={inputCls}
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className={inputCls}
        >
          <option value="">ทุกสถานะ</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ASSET_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={filter.condition}
          onChange={(e) => setFilter((f) => ({ ...f, condition: e.target.value }))}
          className={inputCls}
        >
          <option value="">ทุกสภาพ</option>
          {CONDITION_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {ASSET_CONDITION_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          value={filter.categoryId}
          onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}
          className={inputCls}
        >
          <option value="">ทุกหมวด</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filter.departmentId}
          onChange={(e) => setFilter((f) => ({ ...f, departmentId: e.target.value }))}
          className={inputCls}
        >
          <option value="">ทุกแผนก</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>
            ยังไม่พบทรัพย์สิน — กด "+ เพิ่มทรัพย์สิน" เพื่อเริ่มต้น
          </AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className={cn(assetListRowCardClass, "flex flex-wrap items-start justify-between gap-3")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.assetCode}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        ASSET_STATUS_TONE[it.status],
                      )}
                    >
                      {ASSET_STATUS_LABEL[it.status]}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                      {ASSET_CONDITION_LABEL[it.condition]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#2e2a58]">{it.assetName}</p>
                  <p className="text-xs text-[#66638c]">
                    {[
                      it.brand,
                      it.model,
                      it.serialNumber ? `SN ${it.serialNumber}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    {[
                      it.category?.name,
                      it.department?.name,
                      it.location?.name,
                      it.holderName ? `ผู้ครอง: ${it.holderName}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    ราคา {formatTHB(Number(it.purchasePrice ?? 0))} บาท ·{" "}
                    {it.purchaseDate ? `ซื้อ ${formatThaiDateShort(it.purchaseDate)}` : "ไม่มีวันที่ซื้อ"}
                    {it.warrantyUntil ? ` · ประกันถึง ${formatThaiDateShort(it.warrantyUntil)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(it)}
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${it.assetName}`}
                    title="แก้ไข"
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(it)}
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${it.assetName}`}
                    title="ลบ"
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => (submitting ? null : setModalOpen(false))}
        title={form.id ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"}
        description={form.id ? `รหัส ${form.assetCode}` : "กรอกข้อมูลและกดบันทึก"}
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={submit}
            submitLabel={form.id ? "บันทึกการแก้ไข" : "บันทึก"}
            loading={submitting}
            submitDisabled={!form.assetName.trim()}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="ชื่อทรัพย์สิน *">
            <input
              type="text"
              value={form.assetName}
              onChange={(e) => setForm((f) => ({ ...f, assetName: e.target.value }))}
              className={inputCls}
              required
            />
          </Field>
          <Field label="รหัสทรัพย์สิน (เว้นว่างให้ระบบสร้าง)">
            <input
              type="text"
              value={form.assetCode}
              onChange={(e) => setForm((f) => ({ ...f, assetCode: e.target.value }))}
              className={inputCls}
              placeholder="AST-2026-00001"
            />
          </Field>
          <Field label="หมวดหมู่">
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className={inputCls}
            >
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ผู้ขาย">
            <select
              value={form.supplierId}
              onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
              className={inputCls}
            >
              <option value="">— ไม่ระบุ —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ยี่ห้อ">
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="รุ่น">
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="หมายเลขซีเรียล">
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="ปีอายุการใช้งาน">
            <input
              type="number"
              min={0}
              max={50}
              value={form.depreciationYears}
              onChange={(e) => setForm((f) => ({ ...f, depreciationYears: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="วันที่ซื้อ">
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="ราคาซื้อ (บาท)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePrice}
              onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="ประกันถึง">
            <input
              type="date"
              value={form.warrantyUntil}
              onChange={(e) => setForm((f) => ({ ...f, warrantyUntil: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="สถานที่">
            <select
              value={form.locationId}
              onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
              className={inputCls}
            >
              <option value="">— ไม่ระบุ —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="แผนก">
            <select
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
              className={inputCls}
            >
              <option value="">— ไม่ระบุ —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ผู้ครอบครอง">
            <input
              type="text"
              value={form.holderName}
              onChange={(e) => setForm((f) => ({ ...f, holderName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="สถานะ">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as AssetStatus }))
              }
              className={inputCls}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ASSET_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="สภาพ">
            <select
              value={form.condition}
              onChange={(e) =>
                setForm((f) => ({ ...f, condition: e.target.value as AssetCondition }))
              }
              className={inputCls}
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {ASSET_CONDITION_LABEL[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Field label="คำอธิบาย">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={cn(inputCls, "min-h-[60px]")}
              rows={2}
            />
          </Field>
          <Field label="หมายเหตุ">
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={cn(inputCls, "min-h-[60px]")}
              rows={2}
            />
          </Field>
        </div>
      </FormModal>
    </AppDashboardSection>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#66638c]">{label}</span>
      {children}
    </label>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

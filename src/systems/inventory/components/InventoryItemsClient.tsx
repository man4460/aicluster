"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  inventoryChipClass,
  inventoryInputClass,
  inventoryPrimaryButtonClass,
  inventoryRowEditIconButtonClass,
  inventoryRowRemoveIconButtonClass,
  inventoryStatCardClass,
} from "@/systems/inventory/lib/inventory-ui";
import {
  fetchInventoryCategories,
  fetchInventoryItems,
  formatThb,
  inventoryFetchErrorMessage,
} from "@/systems/inventory/lib/inventory-client-data";
import {
  IconBox,
  IconCash,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTag,
  IconTrash,
} from "@/systems/inventory/components/InventoryIcons";
import {
  InventoryItemFormModal,
  type InventoryItemSubmitInput,
} from "@/systems/inventory/components/InventoryItemFormModal";
import type {
  InventoryCategoryRow,
  InventoryItemRow,
} from "@/systems/inventory/components/types";

type FilterCategory = "all" | "low" | string; // string = category id

export function InventoryItemsClient() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formTarget, setFormTarget] = useState<InventoryItemRow | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<InventoryItemRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [r1, r2] = await Promise.all([fetchInventoryItems(), fetchInventoryCategories()]);
      if (!r1.ok) {
        setError(r1.error);
        return;
      }
      setItems(r1.items);
      if (r2.ok) setCategories(r2.categories);
    } catch (e) {
      setError(inventoryFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => {
    const activeItems = items.filter((it) => it.isActive);
    const totalValue = items.reduce((acc, it) => acc + it.totalStock * it.costPrice, 0);
    const lowStock = items.filter(
      (it) => it.isActive && it.minStock > 0 && it.totalStock < it.minStock,
    ).length;
    return {
      total: activeItems.length,
      totalValue,
      lowStock,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === "low" && !(it.minStock > 0 && it.totalStock < it.minStock)) return false;
      if (filter !== "all" && filter !== "low" && String(it.categoryId ?? "") !== filter)
        return false;
      if (!q) return true;
      return (
        it.sku.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        (it.categoryName ?? "").toLowerCase().includes(q) ||
        (it.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, filter]);

  function openCreate() {
    setFormMode("create");
    setFormTarget(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItemRow) {
    setFormMode("edit");
    setFormTarget(item);
    setFormError(null);
    setFormOpen(true);
  }

  async function submitForm(input: InventoryItemSubmitInput) {
    setFormBusy(true);
    setFormError(null);
    try {
      const url =
        formMode === "create"
          ? "/api/inventory/items"
          : `/api/inventory/items/${formTarget?.id}`;
      const method = formMode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(j.error?.trim() || `บันทึกไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setFormOpen(false);
      await reload();
    } catch (e) {
      setFormError(inventoryFetchErrorMessage(e));
    } finally {
      setFormBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/inventory/items/${deleteTarget.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteError(j.error?.trim() || `ลบไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      setDeleteError(inventoryFetchErrorMessage(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader
          title="สินค้าทั้งหมด"
          tone="violet"
          description={<span>ทะเบียน SKU · ราคาทุน · ราคาขาย · จุดสั่งซื้อ</span>}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              suppressHydrationWarning
              onClick={openCreate}
              aria-label="เพิ่มสินค้า"
              className={inventoryPrimaryButtonClass}
            >
              <IconPlus className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มสินค้า</span>
            </button>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SmallStat
            tone="teal"
            icon={<IconBox className="h-4 w-4" />}
            label="ทั้งหมด"
            value={stats.total.toLocaleString("th-TH")}
            suffix="รายการ"
          />
          <SmallStat
            tone="emerald"
            icon={<IconCash className="h-4 w-4" />}
            label="มูลค่ารวม"
            value={formatThb(stats.totalValue)}
            suffix="บาท"
          />
          <SmallStat
            tone="amber"
            icon={<IconTag className="h-4 w-4" />}
            label="ใกล้หมด"
            value={stats.lowStock.toLocaleString("th-TH")}
            suffix="รายการ"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <div className="space-y-3">
          <div className="relative">
            {!search ? (
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <IconSearch className="h-5 w-5" />
              </span>
            ) : null}
            <input
              suppressHydrationWarning
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา ชื่อ / SKU / หมวด"
              className={cn(inventoryInputClass, search ? "pl-3.5" : "pl-10")}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setFilter("all")}
              className={inventoryChipClass(filter === "all")}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setFilter("low")}
              className={inventoryChipClass(filter === "low")}
            >
              ใกล้หมด
            </button>
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilter(String(c.id))}
                  className={inventoryChipClass(filter === String(c.id))}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-sm text-slate-500">กำลังโหลดข้อมูล…</p>
        ) : filtered.length === 0 ? (
          <AppEmptyState tone="slate">
            {items.length === 0
              ? "ยังไม่มีสินค้า — เริ่มกดปุ่ม «เพิ่มสินค้า»"
              : "ไม่พบรายการตามคำค้น/ตัวกรอง"}
          </AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onEdit={() => openEdit(it)}
                onDelete={() => {
                  setDeleteError(null);
                  setDeleteTarget(it);
                }}
              />
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <InventoryItemFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        target={formTarget}
        categories={categories}
        onSubmit={submitForm}
        busy={formBusy}
        error={formError}
      />

      <FormModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="ยืนยันการลบสินค้า"
        description={deleteTarget?.name ?? ""}
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setDeleteTarget(null)}
            onSubmit={confirmDelete}
            submitLabel="ลบสินค้า"
            danger
            loading={deleteBusy}
          />
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            ลบ <strong>{deleteTarget?.name ?? ""}</strong> (SKU {deleteTarget?.sku}) ออกจากระบบ —
            ประวัติเคลื่อนไหวจะถูกลบไปด้วย
          </p>
          {deleteError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {deleteError}
            </p>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}

function SmallStat({
  tone,
  icon,
  label,
  value,
  suffix,
  className,
}: {
  tone: "teal" | "emerald" | "amber" | "rose";
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn(inventoryStatCardClass(tone), className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/55 ring-1 ring-white/60">
          {icon}
        </span>
      </div>
      <p className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
        {value}
        {suffix ? <span className="ml-1 text-[10px] font-bold opacity-70">{suffix}</span> : null}
      </p>
    </div>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItemRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLow = item.minStock > 0 && item.totalStock < item.minStock;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3.5 shadow-sm backdrop-blur transition hover:border-teal-300 hover:shadow-md sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {item.sku}
            </span>
            {item.categoryName ? (
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                {item.categoryName}
              </span>
            ) : null}
            {!item.isActive ? (
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                ปิดใช้งาน
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 text-base font-black text-slate-900 line-clamp-2">{item.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            suppressHydrationWarning
            onClick={onEdit}
            className={inventoryRowEditIconButtonClass}
            aria-label={`แก้ไข ${item.name}`}
            title="แก้ไข"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onDelete}
            className={inventoryRowRemoveIconButtonClass}
            aria-label={`ลบ ${item.name}`}
            title="ลบ"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 px-2 py-1.5">
          <p className="text-[10px] font-bold uppercase text-slate-500">ทุน</p>
          <p className="text-sm font-black tabular-nums text-slate-800">
            {formatThb(item.costPrice)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-2 py-1.5">
          <p className="text-[10px] font-bold uppercase text-emerald-700">ขาย</p>
          <p className="text-sm font-black tabular-nums text-emerald-800">
            {formatThb(item.salePrice)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl px-2 py-1.5",
            isLow ? "bg-rose-50" : "bg-teal-50",
          )}
        >
          <p
            className={cn(
              "text-[10px] font-bold uppercase",
              isLow ? "text-rose-700" : "text-teal-700",
            )}
          >
            คงเหลือ
          </p>
          <p
            className={cn(
              "text-sm font-black tabular-nums",
              isLow ? "text-rose-700" : "text-teal-800",
            )}
          >
            {item.totalStock}
            <span className="ml-0.5 text-[10px] opacity-70">{item.unit}</span>
          </p>
        </div>
      </div>

      {item.stocks.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {item.stocks.map((s) => (
            <li
              key={s.warehouseId}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title={s.warehouseName}
            >
              {s.warehouseCode}: <span className="font-black">{s.quantity}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-slate-400">ยังไม่มีในคลังใด — เพิ่มด้วย «รับเข้า»</p>
      )}

      {item.minStock > 0 ? (
        <p className="text-[11px] text-slate-500">
          จุดสั่งซื้อ: <strong className="text-slate-700">{item.minStock}</strong> {item.unit}
        </p>
      ) : null}
    </li>
  );
}

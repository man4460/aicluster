"use client";

import { Package, Plus, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreTonedRowCardClass,
  type EcommerceStoreCardTone,
} from "@/systems/ecommerce-store/lib/card-tones";
import {
  ecommerceStoreFieldClass,
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreRowIconButtonClass,
  ecommerceStoreSectionHeadingClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type StockItem = {
  id: string;
  name: string;
  sku: string | null;
  priceBaht: string;
  stockBalance: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
  soldOnlineQty: number;
  soldInStoreQty: number;
  soldTotalQty: number;
  lowStock: boolean;
  outOfStock: boolean;
};

type Category = { id: string; name: string; isActive: boolean; productCount?: number };

export type EcommerceStockEmbeddedToolbarApi = {
  filterOpen: boolean;
  hasActiveFilters: boolean;
  loading: boolean;
  toggleFilter: () => void;
  openAdd: () => void;
  openCategories: () => void;
  reload: () => void;
  downloadTemplate: () => void;
  downloadExport: () => void;
  triggerImport: () => void;
  importBusy: boolean;
};

type Props = {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: EcommerceStockEmbeddedToolbarApi | null) => void;
};

type FilterKey = "all" | "low" | "out" | "inactive";

function stockTone(item: StockItem): EcommerceStoreCardTone {
  if (item.outOfStock) return "rose";
  if (item.lowStock) return "amber";
  if (!item.isActive) return "slate";
  return "emerald";
}

export function EcommerceStockClient({ embedded, onEmbeddedToolbar }: Props) {
  const notice = useAppNoticePopup();
  const importRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formStock, setFormStock] = useState("0");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catBusy, setCatBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, catRes] = await Promise.all([
        fetch("/api/ecommerce-store/session/stock"),
        fetch("/api/ecommerce-store/session/categories"),
      ]);
      const stockJ = await stockRes.json();
      const catJ = await catRes.json();
      if (!stockRes.ok) throw new Error(stockJ.error ?? "โหลดสต๊อกไม่สำเร็จ");
      setItems((stockJ.items ?? []) as StockItem[]);
      setThreshold(Number(stockJ.lowStockThreshold) || 5);
      setLowStockCount(Number(stockJ.lowStockCount) || 0);
      setOutOfStockCount(Number(stockJ.outOfStockCount) || 0);
      setCategories((catJ.categories ?? []) as Category[]);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดสต๊อกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notice stable enough for load
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const hasActiveFilters = filter !== "all" || Boolean(categoryId) || Boolean(keyword.trim());

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((p) => {
      if (filter === "low" && !(p.lowStock || p.outOfStock)) return false;
      if (filter === "out" && !p.outOfStock) return false;
      if (filter === "inactive" && p.isActive) return false;
      if (categoryId && p.category?.id !== categoryId) return false;
      if (!kw) return true;
      return (
        p.name.toLowerCase().includes(kw) ||
        (p.sku ?? "").toLowerCase().includes(kw) ||
        (p.category?.name ?? "").toLowerCase().includes(kw)
      );
    });
  }, [items, filter, categoryId, keyword]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setFormName("");
    setFormSku("");
    setFormPrice("0");
    setFormStock("0");
    setFormCategoryId("");
    setFormActive(true);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((p: StockItem) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormSku(p.sku ?? "");
    setFormPrice(p.priceBaht);
    setFormStock(String(p.stockBalance));
    setFormCategoryId(p.category?.id ?? "");
    setFormActive(p.isActive);
    setModalOpen(true);
  }, []);

  const downloadExcel = useCallback(
    async (mode: "template" | "export") => {
      try {
        const q = mode === "export" ? "?mode=export" : "";
        const res = await fetch(`/api/ecommerce-store/session/stock/excel${q}`);
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "ดาวน์โหลดไม่สำเร็จ");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          mode === "export"
            ? `ecommerce-stock-${new Date().toISOString().slice(0, 10)}.xls`
            : "ecommerce-stock-template.xls";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        notice.success(mode === "export" ? "ส่งออกสต๊อกแล้ว" : "ดาวน์โหลดแบบฟอร์มแล้ว");
      } catch (e) {
        notice.error(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ");
      }
    },
    [notice],
  );

  const importExcel = useCallback(
    async (file: File) => {
      setImportBusy(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/ecommerce-store/session/stock/import", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json()) as {
          error?: string;
          created?: number;
          updated?: number;
          errors?: string[];
        };
        if (!res.ok) throw new Error(data.error ?? "นำเข้าไม่สำเร็จ");
        const extra =
          data.errors && data.errors.length > 0 ? ` · คำเตือน ${data.errors.length} รายการ` : "";
        notice.success(`นำเข้าแล้ว สร้าง ${data.created ?? 0} · อัปเดต ${data.updated ?? 0}${extra}`);
        await reload();
      } catch (e) {
        notice.error(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      } finally {
        setImportBusy(false);
      }
    },
    [notice, reload],
  );

  const openCategories = useCallback(() => {
    setCatFormOpen(false);
    setCatEditingId(null);
    setCatName("");
    setCatModalOpen(true);
  }, []);

  useEffect(() => {
    if (!onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      filterOpen,
      hasActiveFilters,
      loading,
      toggleFilter: () => setFilterOpen((o) => !o),
      openAdd,
      openCategories,
      reload: () => void reload(),
      downloadTemplate: () => void downloadExcel("template"),
      downloadExport: () => void downloadExcel("export"),
      triggerImport: () => importRef.current?.click(),
      importBusy,
    });
    return () => onEmbeddedToolbar(null);
  }, [
    onEmbeddedToolbar,
    filterOpen,
    hasActiveFilters,
    loading,
    openAdd,
    openCategories,
    reload,
    downloadExcel,
    importBusy,
  ]);

  async function saveProduct() {
    const name = formName.trim();
    if (!name) {
      notice.error("กรอกชื่อสินค้า");
      return;
    }
    const price = Number(formPrice);
    const stock = Number(formStock);
    if (!Number.isFinite(price) || price < 0) {
      notice.error("ราคาไม่ถูกต้อง");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      notice.error("จำนวนสต๊อกไม่ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name,
        sku: formSku.trim() || null,
        priceBaht: price,
        stockBalance: Math.floor(stock),
        categoryId: formCategoryId || null,
        isActive: formActive,
      };
      const res = await fetch("/api/ecommerce-store/session/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      notice.success(editingId ? "อัปเดตสต๊อกแล้ว" : "เพิ่มรายการสต๊อกแล้ว");
      setModalOpen(false);
      await reload();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(p: StockItem) {
    const ok = window.confirm(`ลบ «${p.name}» ออกจากสต๊อก?`);
    if (!ok) return;
    const res = await fetch(`/api/ecommerce-store/session/products?id=${encodeURIComponent(p.id)}`, {
      method: "DELETE",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      notice.error((j as { error?: string }).error ?? "ลบไม่สำเร็จ");
      return;
    }
    notice.success("ลบแล้ว");
    await reload();
  }

  async function adjustStock(p: StockItem, delta: number) {
    const res = await fetch("/api/ecommerce-store/session/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, stockDelta: delta }),
    });
    const j = await res.json();
    if (!res.ok) {
      notice.error(j.error ?? "ปรับสต๊อกไม่สำเร็จ");
      return;
    }
    await reload();
  }

  async function saveCategory() {
    const name = catName.trim();
    if (!name) {
      notice.error("กรอกชื่อหมวดหมู่");
      return;
    }
    setCatBusy(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/categories", {
        method: catEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catEditingId ? { id: catEditingId, name } : { name }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "บันทึกหมวดไม่สำเร็จ");
      notice.success(catEditingId ? "แก้ไขหมวดแล้ว" : "เพิ่มหมวดแล้ว");
      setCatFormOpen(false);
      setCatEditingId(null);
      setCatName("");
      await reload();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setCatBusy(false);
    }
  }

  async function deleteCategory(c: Category) {
    const ok = window.confirm(`ลบหมวด «${c.name}»?`);
    if (!ok) return;
    const res = await fetch(`/api/ecommerce-store/session/categories?id=${encodeURIComponent(c.id)}`, {
      method: "DELETE",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      notice.error((j as { error?: string }).error ?? "ลบหมวดไม่สำเร็จ");
      return;
    }
    notice.success("ลบหมวดแล้ว");
    await reload();
  }

  const filterPanel = (
    <div
      id="ecommerce-stock-filter-panel"
      className={cn("space-y-3", filterOpen ? "block" : "hidden")}
    >
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="กรองสต๊อก">
        {(
          [
            ["all", `ทั้งหมด (${items.length})`],
            ["low", `ใกล้หมด (${lowStockCount + outOfStockCount})`],
            ["out", `หมด (${outOfStockCount})`],
            ["inactive", "ปิดใช้"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={ecommerceFilterChipClass(filter === key)}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ค้นหาชื่อ · SKU · หมวด"
          className={cn(ecommerceFieldClass, "flex-1")}
          aria-label="ค้นหาสต๊อก"
        />
        <select
          className={cn(ecommerceFieldClass, "sm:max-w-[14rem]")}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="กรองหมวดหมู่"
        >
          <option value="">ทุกหมวด</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {hasActiveFilters ? (
        <button
          type="button"
          className={ecommerceStoreOutlineButtonClass}
          onClick={() => {
            setFilter("all");
            setCategoryId("");
            setKeyword("");
          }}
        >
          ล้างกรอง
        </button>
      ) : null}
      <p className="text-[11px] font-semibold text-[#66638c]">
        แสดง {visible.length}/{items.length} · เกณฑ์ใกล้หมด ≤ {threshold} ชิ้น · สต๊อกถูกหักอัตโนมัติจากขายหน้าร้านและเว็บลูกค้า
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {notice.popup}
      <input
        ref={importRef}
        type="file"
        accept=".xls,.csv,text/csv,application/vnd.ms-excel,text/plain"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importExcel(f);
        }}
      />

      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={ecommerceStoreSectionHeadingClass}>
              <Warehouse className="h-4 w-4" aria-hidden />
              สต๊อกสินค้า
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
              หักจากการขาย · แจ้งเตือนใกล้หมด · Excel
            </p>
          </div>
          <div className={ecommerceStoreInlineSubNavShellClass}>
            <button
              type="button"
              className={ecommerceStoreInlineSubNavBtnClass(filterOpen)}
              onClick={() => setFilterOpen((o) => !o)}
            >
              {filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
            </button>
            <button type="button" className={ecommerceStoreInlineSubNavBtnClass(false)} onClick={openCategories}>
              หมวด
            </button>
            <button
              type="button"
              className={ecommerceStoreInlineSubNavBtnClass(false)}
              onClick={() => void downloadExcel("template")}
            >
              แบบฟอร์ม
            </button>
            <button
              type="button"
              className={ecommerceStoreInlineSubNavBtnClass(false)}
              onClick={() => importRef.current?.click()}
              disabled={importBusy}
            >
              นำเข้า
            </button>
            <button
              type="button"
              className={ecommerceStoreInlineSubNavBtnClass(false)}
              onClick={() => void downloadExcel("export")}
            >
              ส่งออก
            </button>
            <button type="button" className={ecommerceStorePrimaryButtonClass} onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              เพิ่ม
            </button>
          </div>
        </div>
      ) : null}

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs font-semibold text-amber-950">
          แจ้งเตือนสต๊อก
          {outOfStockCount > 0 ? ` · หมดสต๊อก ${outOfStockCount} รายการ` : ""}
          {lowStockCount > 0 ? ` · ใกล้หมด ${lowStockCount} รายการ` : ""}
          {" "}— เกณฑ์ ≤ {threshold} ชิ้น (ตั้งค่าได้ที่ตั้งค่าร้าน)
        </div>
      )}

      {filterPanel}

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-slate-100/80" aria-hidden />
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm font-semibold text-[#66638c]">
          {items.length === 0 ? "ยังไม่มีรายการสต๊อก — เพิ่มหรือนำเข้า Excel" : "ไม่พบรายการตามตัวกรอง"}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((p) => {
            const tone = stockTone(p);
            return (
              <li key={p.id} className={cn(ecommerceStoreTonedRowCardClass(tone), "p-3")}>
                <div className="flex items-start gap-3">
                  <span className={ecommerceStoreCardIconTileClass(tone)}>
                    <Package className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black text-[#1e1b4b]">{p.name}</p>
                      {p.outOfStock ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                          หมด
                        </span>
                      ) : p.lowStock ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          ใกล้หมด
                        </span>
                      ) : null}
                      {!p.isActive ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                          ปิดใช้
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
                      {p.sku ? `SKU ${p.sku} · ` : ""}
                      {p.category?.name ?? "ไม่มีหมวด"} · ฿{Number(p.priceBaht).toLocaleString("th-TH")}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#5f5a8a]">
                      ขายหักแล้ว {p.soldTotalQty.toLocaleString("th-TH")} ชิ้น
                      {p.soldTotalQty > 0
                        ? ` (ออนไลน์ ${p.soldOnlineQty} · หน้าร้าน ${p.soldInStoreQty})`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={ecommerceStoreRowIconButtonClass}
                        aria-label={`ลดสต๊อก ${p.name}`}
                        onClick={() => void adjustStock(p, -1)}
                      >
                        −
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                        {p.stockBalance}
                      </span>
                      <button
                        type="button"
                        className={ecommerceStoreRowIconButtonClass}
                        aria-label={`เพิ่มสต๊อก ${p.name}`}
                        onClick={() => void adjustStock(p, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${p.name}`}
                        title="แก้ไข"
                        onClick={() => openEdit(p)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${p.name}`}
                        title="ลบ"
                        onClick={() => void deleteProduct(p)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "แก้ไขสต๊อก" : "เพิ่มสต๊อก"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void saveProduct()}
            submitLabel={editingId ? "บันทึก" : "เพิ่ม"}
            loading={saving}
          />
        }
      >
        <div className="space-y-3 p-1">
          <label className="block text-sm font-semibold text-[#1e1b4b]">
            ชื่อสินค้า
            <input className={cn(ecommerceStoreFieldClass, "mt-1.5")} value={formName} onChange={(e) => setFormName(e.target.value)} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#1e1b4b]">
              รหัสสินค้า (SKU)
              <input className={cn(ecommerceStoreFieldClass, "mt-1.5")} value={formSku} onChange={(e) => setFormSku(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-[#1e1b4b]">
              ราคา
              <input
                className={cn(ecommerceStoreFieldClass, "mt-1.5")}
                type="number"
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-[#1e1b4b]">
              จำนวนสต๊อก
              <input
                className={cn(ecommerceStoreFieldClass, "mt-1.5")}
                type="number"
                min={0}
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-[#1e1b4b]">
              หมวดหมู่
              <select
                className={cn(ecommerceStoreFieldClass, "mt-1.5")}
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
              >
                <option value="">— ไม่ระบุ —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
            เปิดใช้งาน
          </label>
        </div>
      </FormModal>

      <FormModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="หมวดหมู่สต๊อก"
        mobileCentered
        footer={
          catFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                setCatFormOpen(false);
                setCatEditingId(null);
                setCatName("");
              }}
              onSubmit={() => void saveCategory()}
              submitLabel={catEditingId ? "บันทึก" : "เพิ่มหมวด"}
              loading={catBusy}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button type="button" className={ecommerceStorePrimaryButtonClass} onClick={() => {
                setCatEditingId(null);
                setCatName("");
                setCatFormOpen(true);
              }}>
                + เพิ่มหมวด
              </button>
              <button type="button" className={ecommerceStoreOutlineButtonClass} onClick={() => setCatModalOpen(false)}>
                ปิด
              </button>
            </div>
          )
        }
      >
        {catFormOpen ? (
          <label className="block text-sm font-semibold text-[#1e1b4b]">
            ชื่อหมวดหมู่
            <input
              className={cn(ecommerceStoreFieldClass, "mt-1.5")}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              autoFocus
            />
          </label>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-[#66638c]">ยังไม่มีหมวดหมู่</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1e1b4b]">{c.name}</p>
                  {typeof c.productCount === "number" ? (
                    <p className="text-[10px] font-semibold text-[#66638c]">{c.productCount} สินค้า</p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    onClick={() => {
                      setCatEditingId(c.id);
                      setCatName(c.name);
                      setCatFormOpen(true);
                    }}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    onClick={() => void deleteCategory(c)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>
    </div>
  );
}


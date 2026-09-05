"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Package } from "lucide-react";
import {
  AppDashboardSection,
  AppImagePickCameraButtons,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceGradientPriceClass,
  ecommerceListStackClass,
  ecommerceProductTagClass,
  ecommerceStockButtonClass,
  ecommerceStockPillClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreProductRowTone,
  ecommerceStoreTonedRowCardClass,
} from "@/systems/ecommerce-store/lib/card-tones";
import {
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStoreNavDividerClass,
  ecommerceStoreRowIconButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Category = {
  id: string;
  name: string;
  productCount: number;
};

type Product = {
  id: string;
  name: string;
  priceBaht: string;
  stockBalance: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  isRecommended: boolean;
  isBestseller: boolean;
};

export type EcommerceProductsEmbeddedToolbarApi = {
  filterOpen: boolean;
  hasActiveFilters: boolean;
  toggleFilter: () => void;
  openAddProduct: () => void;
  openAddCategory: () => void;
  downloadTemplate: () => void;
  downloadExport: () => void;
  triggerImport: () => void;
  importBusy: boolean;
  reload: () => void;
  loading: boolean;
};

export function EcommerceProductsClient({
  embedded = false,
  onEmbeddedToolbar,
}: {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: EcommerceProductsEmbeddedToolbarApi | null) => void;
} = {}) {
  const notice = useAppNoticePopup();
  const noticeErrorRef = useRef(notice.error);
  noticeErrorRef.current = notice.error;
  const noticeSuccessRef = useRef(notice.success);
  noticeSuccessRef.current = notice.success;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [importBusy, setImportBusy] = useState(false);
  const stockInflightRef = useRef<Set<string>>(new Set());
  const importRef = useRef<HTMLInputElement>(null);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [productBusy, setProductBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [productErr, setProductErr] = useState<string | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [categoryErr, setCategoryErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newRecommended, setNewRecommended] = useState(false);
  const [newBestseller, setNewBestseller] = useState(false);

  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [editSku, setEditSku] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFeatured, setEditFeatured] = useState(false);
  const [editRecommended, setEditRecommended] = useState(false);
  const [editBestseller, setEditBestseller] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [uploading, setUploading] = useState(false);
  const lb = useAppImageLightbox();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const editCameraRef = useRef<HTMLInputElement>(null);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "inactive">("all");
  const [filterOpen, setFilterOpen] = useState(true);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);

  function resetProductForm() {
    setName("");
    setPrice("");
    setStock("0");
    setNewCategoryId("");
    setNewImageUrl(null);
    setNewRecommended(false);
    setNewBestseller(false);
    setProductErr(null);
  }

  function resetEditForm() {
    setEditId("");
    setEditName("");
    setEditPrice("");
    setEditStock("0");
    setEditSku("");
    setEditCategoryId("");
    setEditImageUrl(null);
    setEditIsActive(true);
    setEditFeatured(false);
    setEditRecommended(false);
    setEditBestseller(false);
    setEditErr(null);
  }

  function resetCategoryForm() {
    setCategoryName("");
    setCategoryErr(null);
  }

  function openEditProduct(p: Product) {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(String(Number(p.priceBaht)));
    setEditStock(String(p.stockBalance));
    setEditSku(p.sku ?? "");
    setEditCategoryId(p.categoryId ?? "");
    setEditImageUrl(p.imageUrl);
    setEditIsActive(p.isActive);
    setEditFeatured(false);
    setEditRecommended(p.isRecommended);
    setEditBestseller(p.isBestseller);
    setEditErr(null);
    setShowEditProductModal(true);
  }

  async function reloadCategories() {
    const res = await fetch("/api/ecommerce-store/session/categories", {
      credentials: "include",
      cache: "no-store",
    });
    const j = await res.json();
    setCategories(j.categories ?? []);
  }

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [prodRes] = await Promise.all([
        fetch("/api/ecommerce-store/session/products", { credentials: "include", cache: "no-store" }),
        reloadCategories(),
      ]);
      const j = await prodRes.json();
      if (!prodRes.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "โหลดสินค้าไม่สำเร็จ");
      }
      setProducts(j.products ?? []);
      setThreshold(j.lowStockThreshold ?? 5);
    } catch (e) {
      noticeErrorRef.current(e instanceof Error ? e.message : "โหลดสินค้าไม่สำเร็จ");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const downloadExcel = useCallback(async (mode: "template" | "export") => {
    try {
      const q = mode === "template" ? "?mode=template" : "";
      const res = await fetch(`/api/ecommerce-store/session/stock/excel${q}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "ดาวน์โหลดไม่สำเร็จ");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        mode === "export"
          ? `ecommerce-stock-${new Date().toISOString().slice(0, 10)}.xls`
          : "ecommerce-stock-template.xls";
      a.click();
      URL.revokeObjectURL(url);
      noticeSuccessRef.current(mode === "export" ? "ส่งออกสินค้าแล้ว" : "ดาวน์โหลดแบบฟอร์มแล้ว");
    } catch (e) {
      noticeErrorRef.current(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ");
    }
  }, []);

  const importExcel = useCallback(
    async (file: File) => {
      setImportBusy(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/ecommerce-store/session/stock/import", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          created?: number;
          updated?: number;
          skipped?: number;
        };
        if (!res.ok) throw new Error(j.error ?? "นำเข้าไม่สำเร็จ");
        noticeSuccessRef.current(
          `นำเข้าแล้ว · เพิ่ม ${j.created ?? 0} · อัปเดต ${j.updated ?? 0}${
            j.skipped ? ` · ข้าม ${j.skipped}` : ""
          }`,
        );
        await reload({ silent: true });
      } catch (e) {
        noticeErrorRef.current(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      } finally {
        setImportBusy(false);
      }
    },
    [reload],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  async function uploadImage(file: File, onUrl: (url: string) => void) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/ecommerce-store/session/upload-product-image", {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    const j = await res.json();
    if (res.ok && j.imageUrl) onUrl(j.imageUrl);
  }

  async function addCategory() {
    if (!categoryName.trim()) return;
    setCategoryBusy(true);
    setCategoryErr(null);
    try {
      const res = await fetch("/api/ecommerce-store/session/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      const j = await res.json();
      if (!res.ok) {
        setCategoryErr(j.error ?? "เพิ่มหมวดไม่สำเร็จ");
        return;
      }
      setShowAddCategoryModal(false);
      resetCategoryForm();
      await reload();
    } finally {
      setCategoryBusy(false);
    }
  }

  async function addProduct() {
    if (!name.trim()) return;
    setProductBusy(true);
    setProductErr(null);
    try {
      const res = await fetch("/api/ecommerce-store/session/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          priceBaht: Number(price),
          stockBalance: Number(stock),
          imageUrl: newImageUrl,
          categoryId: newCategoryId || null,
          isRecommended: newRecommended,
          isBestseller: newBestseller,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setProductErr(j.error ?? "เพิ่มสินค้าไม่สำเร็จ");
        return;
      }
      setShowAddProductModal(false);
      resetProductForm();
      await reload();
    } finally {
      setProductBusy(false);
    }
  }

  async function saveEditProduct() {
    if (!editId || !editName.trim()) return;
    const stockNum = Number(editStock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setEditErr("จำนวนสต๊อกไม่ถูกต้อง");
      return;
    }
    setEditBusy(true);
    setEditErr(null);
    try {
      const res = await fetch("/api/ecommerce-store/session/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editId,
          name: editName,
          priceBaht: Number(editPrice),
          stockBalance: Math.floor(stockNum),
          sku: editSku.trim() || null,
          imageUrl: editImageUrl,
          categoryId: editCategoryId || null,
          isActive: editIsActive,
          isRecommended: editRecommended,
          isBestseller: editBestseller,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setEditErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (editFeatured) {
        await fetch("/api/ecommerce-store/session/store", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ featuredProductId: editId, salePageEnabled: true }),
        });
      }
      setShowEditProductModal(false);
      resetEditForm();
      await reload({ silent: true });
    } finally {
      setEditBusy(false);
    }
  }

  async function adjustStock(id: string, delta: number) {
    if (stockInflightRef.current.has(id)) return;

    let snapshot: Product | undefined;
    let optimistic = 0;
    setProducts((list) => {
      const cur = list.find((p) => p.id === id);
      if (!cur) return list;
      snapshot = cur;
      optimistic = Math.max(0, cur.stockBalance + delta);
      if (optimistic === cur.stockBalance && delta < 0) return list;
      return list.map((p) => (p.id === id ? { ...p, stockBalance: optimistic } : p));
    });
    if (!snapshot) return;
    if (optimistic === snapshot.stockBalance && delta < 0) return;

    setStockModalProduct((cur) =>
      cur && cur.id === id ? { ...cur, stockBalance: optimistic } : cur,
    );

    stockInflightRef.current.add(id);
    try {
      const res = await fetch("/api/ecommerce-store/session/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, stockDelta: delta }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        product?: { stockBalance?: number };
      };
      if (!res.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "ปรับสต๊อกไม่สำเร็จ");
      }
      const serverBalance =
        typeof j.product?.stockBalance === "number" ? j.product.stockBalance : optimistic;
      // sync เฉพาะชิ้นนี้ — ไม่ reload รายการ
      if (serverBalance !== optimistic) {
        setProducts((list) =>
          list.map((p) => (p.id === id ? { ...p, stockBalance: serverBalance } : p)),
        );
        setStockModalProduct((cur) =>
          cur && cur.id === id ? { ...cur, stockBalance: serverBalance } : cur,
        );
      }
    } catch (e) {
      setProducts((list) => list.map((p) => (p.id === id && snapshot ? snapshot : p)));
      setStockModalProduct((cur) => (cur && cur.id === id && snapshot ? snapshot : cur));
      noticeErrorRef.current(e instanceof Error ? e.message : "ปรับสต๊อกไม่สำเร็จ");
    } finally {
      stockInflightRef.current.delete(id);
    }
  }

  async function adjustStockFromModal(delta: number) {
    if (!stockModalProduct) return;
    await adjustStock(stockModalProduct.id, delta);
  }

  async function removeProduct(id: string, productName: string) {
    if (!confirm(`ลบสินค้า «${productName}»?`)) return;
    await fetch(`/api/ecommerce-store/session/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await reload();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/ecommerce-store/session/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    await reload();
  }

  const filteredProducts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (stockFilter === "out" && p.stockBalance > 0) return false;
      if (stockFilter === "low" && (p.stockBalance <= 0 || p.stockBalance > threshold)) return false;
      if (stockFilter === "inactive" && p.isActive) return false;
      if (!kw) return true;
      const blob = `${p.name} ${p.sku ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [products, keyword, categoryFilter, stockFilter, threshold]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockBalance > 0 && p.stockBalance <= threshold).length,
    [products, threshold],
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stockBalance <= 0).length,
    [products],
  );

  const hasActiveFilter = keyword.trim() !== "" || categoryFilter !== "" || stockFilter !== "all";

  const toggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  const openAddProduct = useCallback(() => {
    resetProductForm();
    setShowAddProductModal(true);
  }, []);

  const openAddCategory = useCallback(() => {
    resetCategoryForm();
    setShowAddCategoryModal(true);
  }, []);

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      filterOpen,
      hasActiveFilters: hasActiveFilter,
      toggleFilter,
      openAddProduct,
      openAddCategory,
      downloadTemplate: () => void downloadExcel("template"),
      downloadExport: () => void downloadExcel("export"),
      triggerImport: () => importRef.current?.click(),
      importBusy,
      reload: () => {
        void reload();
      },
      loading,
    });
    return () => onEmbeddedToolbar(null);
  }, [
    embedded,
    onEmbeddedToolbar,
    filterOpen,
    hasActiveFilter,
    toggleFilter,
    openAddProduct,
    openAddCategory,
    downloadExcel,
    importBusy,
    loading,
  ]);

  const productFormFields = (
    opts: {
      nameVal: string;
      setNameVal: (v: string) => void;
      priceVal: string;
      setPriceVal: (v: string) => void;
      stockVal: string;
      setStockVal: (v: string) => void;
      skuVal?: string;
      setSkuVal?: (v: string) => void;
      categoryVal: string;
      setCategoryVal: (v: string) => void;
      imageVal: string | null;
      onImage: (url: string) => void;
      galleryInputRef: RefObject<HTMLInputElement | null>;
      cameraInputRef: RefObject<HTMLInputElement | null>;
      showActive?: boolean;
      isActive?: boolean;
      setIsActive?: (v: boolean) => void;
      showFeatured?: boolean;
      featured?: boolean;
      setFeatured?: (v: boolean) => void;
      recommended?: boolean;
      setRecommended?: (v: boolean) => void;
      bestseller?: boolean;
      setBestseller?: (v: boolean) => void;
    },
  ) => (
    <div className="space-y-3 p-1">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#1e1b4b] sm:col-span-2">
          ชื่อสินค้า
          <input
            className={cn(ecommerceFieldClass, "mt-1.5")}
            value={opts.nameVal}
            onChange={(e) => opts.setNameVal(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1e1b4b]">
          ราคา (บาท)
          <input
            className={cn(ecommerceFieldClass, "mt-1.5")}
            type="number"
            min={0}
            value={opts.priceVal}
            onChange={(e) => opts.setPriceVal(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1e1b4b]">
          สต๊อก
          <input
            className={cn(ecommerceFieldClass, "mt-1.5")}
            type="number"
            min={0}
            value={opts.stockVal}
            onChange={(e) => opts.setStockVal(e.target.value)}
          />
        </label>
        {opts.setSkuVal ? (
          <label className="block text-sm font-semibold text-[#1e1b4b] sm:col-span-2">
            SKU (ถ้ามี)
            <input
              className={cn(ecommerceFieldClass, "mt-1.5")}
              value={opts.skuVal}
              onChange={(e) => opts.setSkuVal?.(e.target.value)}
            />
          </label>
        ) : null}
      </div>
      <label className="block text-sm font-semibold text-[#1e1b4b]">
        หมวดหมู่
        <select
          className={cn(ecommerceFieldClass, "mt-1.5")}
          value={opts.categoryVal}
          onChange={(e) => opts.setCategoryVal(e.target.value)}
        >
          <option value="">— ไม่ระบุหมวด —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {opts.showActive && opts.setIsActive ? (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={opts.isActive ?? true}
            onChange={(e) => opts.setIsActive?.(e.target.checked)}
          />
          เปิดขายบนหน้าร้าน
        </label>
      ) : null}
      {opts.showFeatured && opts.setFeatured ? (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={opts.featured ?? false}
            onChange={(e) => opts.setFeatured?.(e.target.checked)}
          />
          ตั้งเป็นสินค้าเด่น (Sale Page)
        </label>
      ) : null}
      {opts.setRecommended ? (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={opts.recommended ?? false}
            onChange={(e) => opts.setRecommended?.(e.target.checked)}
          />
          สินค้าแนะนำ (แสดงแถวแนะนำบนหน้าร้าน)
        </label>
      ) : null}
      {opts.setBestseller ? (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={opts.bestseller ?? false}
            onChange={(e) => opts.setBestseller?.(e.target.checked)}
          />
          สินค้าขายดี (แสดงแถวขายดีบนหน้าร้อง)
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {opts.imageVal ? (
          <AppImageThumb src={opts.imageVal} alt="รูปสินค้า" onOpen={() => lb.open(opts.imageVal!)} />
        ) : null}
        <input
          ref={opts.galleryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadImage(f, opts.onImage);
            e.target.value = "";
          }}
        />
        <input
          ref={opts.cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadImage(f, opts.onImage);
            e.target.value = "";
          }}
        />
        <AppImagePickCameraButtons
          busy={uploading}
          onPickGallery={() => opts.galleryInputRef.current?.click()}
          onPickCamera={() => opts.cameraInputRef.current?.click()}
          labels={{ gallery: "รูปสินค้า", camera: "ถ่ายรูป" }}
        />
      </div>
    </div>
  );

  const body = (
    <>
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
        <AppSectionHeader
          title="สินค้า & สต๊อก"
          description="เพิ่มสินค้า · ปรับสต๊อก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div
              className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
              role="group"
              aria-label="เครื่องมือสินค้า"
            >
              <div className={ecommerceStoreInlineSubNavShellClass}>
                <button
                  type="button"
                  onClick={toggleFilter}
                  aria-expanded={filterOpen}
                  aria-controls="ecommerce-products-filter-panel"
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  className={cn(
                    ecommerceStoreInlineSubNavBtnClass(filterOpen),
                    "relative",
                    hasActiveFilter && !filterOpen && "ring-1 ring-amber-300/80",
                  )}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  {hasActiveFilter && !filterOpen ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
              <span className={ecommerceStoreNavDividerClass} aria-hidden />
              <div className={ecommerceStoreInlineSubNavShellClass}>
                <button
                  type="button"
                  className={ecommerceStoreInlineSubNavBtnClass(false)}
                  aria-label="เพิ่มหมวดหมู่"
                  onClick={openAddCategory}
                >
                  <span className="hidden sm:inline">+ หมวด</span>
                  <span className="sm:hidden text-[10px] font-black" aria-hidden>
                    หมวด
                  </span>
                </button>
                <button
                  type="button"
                  className={ecommerceStoreInlineSubNavBtnClass(false)}
                  aria-label="เพิ่มสินค้า"
                  onClick={openAddProduct}
                >
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">+ เพิ่มสินค้า</span>
                </button>
              </div>
            </div>
          }
        />
      ) : null}

      <div className={cn(embedded ? "min-w-0 space-y-2.5" : "mt-3 space-y-3")}>
        <section className="min-w-0 space-y-2.5" aria-label="กรองสินค้า">
          <p className="text-sm font-black tabular-nums text-[#2e2a58]">
            {hasActiveFilter
              ? `แสดง ${filteredProducts.length.toLocaleString("th-TH")} จาก ${products.length.toLocaleString("th-TH")} รายการ`
              : `ทั้งหมด ${products.length.toLocaleString("th-TH")} รายการ`}
          </p>

          <div
            id="ecommerce-products-filter-panel"
            className={cn("space-y-3", filterOpen ? "block" : "hidden")}
          >
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="กรองสต๊อก">
              {(
                [
                  { key: "all" as const, label: "ทั้งหมด" },
                  { key: "low" as const, label: "ใกล้หมด" },
                  { key: "out" as const, label: "หมดสต๊อก" },
                  { key: "inactive" as const, label: "ปิดขาย" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  onClick={() => setStockFilter(f.key)}
                  className={ecommerceFilterChipClass(stockFilter === f.key)}
                  aria-selected={stockFilter === f.key}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1" htmlFor="ecommerce-product-filter-keyword">
                <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                <input
                  id="ecommerce-product-filter-keyword"
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="ชื่อ · SKU · หมวด"
                  className={cn(ecommerceFieldClass, "mt-1")}
                  aria-label="ค้นหาสินค้า"
                />
              </label>
              <label className="min-w-0 sm:max-w-[12rem]" htmlFor="ecommerce-product-filter-category">
                <span className="text-xs font-bold text-[#4d47b6]">หมวดหมู่</span>
                <select
                  id="ecommerce-product-filter-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={cn(ecommerceFieldClass, "mt-1")}
                  aria-label="กรองหมวดหมู่"
                >
                  <option value="">ทุกหมวด</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setCategoryFilter("");
                    setStockFilter("all");
                  }}
                  className={cn(ecommerceStoreInlineSubNavBtnClass(false), "min-h-[44px] px-4")}
                  aria-label="ล้างตัวกรอง"
                >
                  ล้างกรอง
                </button>
              ) : null}
            </div>
          </div>
        </section>

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs font-semibold text-amber-950">
          แจ้งเตือนสต๊อก
          {outOfStockCount > 0 ? ` · หมดสต๊อก ${outOfStockCount} รายการ` : ""}
          {lowStockCount > 0 ? ` · ใกล้หมด ${lowStockCount} รายการ` : ""}
          {" "}— เกณฑ์ ≤ {threshold} ชิ้น · สต๊อกหักอัตโนมัติจากขายหน้าร้านและเว็บลูกค้า
        </div>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-slate-100/80" aria-hidden />
      ) : (
      <ul className={ecommerceListStackClass}>
        {products.length === 0 ? (
          <li className="col-span-full rounded-lg border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีสินค้า — กด + เพิ่มสินค้า หรือนำเข้า Excel
          </li>
        ) : null}
        {filteredProducts.length === 0 && products.length > 0 ? (
          <li className="col-span-full rounded-lg border border-dashed border-amber-200/80 bg-amber-50/50 py-10 text-center text-sm font-semibold text-amber-950">
            ไม่พบสินค้าตามเงื่อนไข
          </li>
        ) : null}
        {filteredProducts.map((p) => {
          const out = p.stockBalance <= 0;
          const low = !out && p.stockBalance <= threshold;
          const tone = ecommerceStoreProductRowTone({
            isActive: p.isActive,
            lowStock: low || out,
            isRecommended: p.isRecommended,
            isBestseller: p.isBestseller,
          });

          const productImage = p.imageUrl ? (
            <AppImageThumb
              src={p.imageUrl}
              alt={p.name}
              onOpen={() => lb.open(p.imageUrl!)}
              className="h-12 w-12 shrink-0 rounded-lg sm:h-14 sm:w-14"
            />
          ) : (
            <span className={ecommerceStoreCardIconTileClass(tone)} aria-hidden>
              <Package className="h-5 w-5" strokeWidth={2.1} />
            </span>
          );

          return (
            <li key={p.id} className={cn(ecommerceStoreTonedRowCardClass(tone), !p.isActive && "opacity-80")}>
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                {productImage}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b]">{p.name}</p>
                    {!p.isActive ? <span className={ecommerceProductTagClass("slate")}>ปิดขาย</span> : null}
                    {out ? <span className={ecommerceProductTagClass("rose")}>หมด</span> : null}
                    {low ? <span className={ecommerceProductTagClass("amber")}>ใกล้หมด</span> : null}
                    {p.isRecommended ? <span className={ecommerceProductTagClass("rose")}>แนะนำ</span> : null}
                    {p.isBestseller ? <span className={ecommerceProductTagClass("amber")}>ขายดี</span> : null}
                  </div>
                  <p className="truncate text-[11px] font-medium text-[#66638c]">
                    {p.category?.name ?? "ไม่มีหมวด"}
                    {p.sku ? ` · ${p.sku}` : ""}
                  </p>
                  <p className={cn("text-sm font-black tabular-nums", ecommerceGradientPriceClass)}>
                    ฿{Number(p.priceBaht).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={ecommerceStoreRowIconButtonClass}
                    aria-label={`ลดสต๊อก ${p.name}`}
                    disabled={p.stockBalance <= 0}
                    onClick={() => void adjustStock(p.id, -1)}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className={cn(
                      ecommerceStockPillClass,
                      "min-w-[2.25rem]",
                      (low || out) && "border-amber-300/70 bg-amber-50/90 text-amber-800 ring-amber-200/50",
                      out && "border-rose-300/70 bg-rose-50/90 text-rose-700 ring-rose-200/50",
                    )}
                    onClick={() => setStockModalProduct(p)}
                    aria-label={`สต๊อก ${p.stockBalance} ชิ้น — กดเพื่อปรับ ${p.name}`}
                  >
                    {p.stockBalance}
                  </button>
                  <button
                    type="button"
                    className={ecommerceStoreRowIconButtonClass}
                    aria-label={`เพิ่มสต๊อก ${p.name}`}
                    onClick={() => void adjustStock(p.id, 1)}
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
                    onClick={() => openEditProduct(p)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      assetRowEditIconButtonClass,
                      !p.isActive && "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                    aria-label={`${p.isActive ? "ปิด" : "เปิด"}ขาย ${p.name}`}
                    title={p.isActive ? "ปิดขาย" : "เปิดขาย"}
                    onClick={() => void toggleActive(p.id, p.isActive)}
                  >
                    {p.isActive ? (
                      <IconEyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <IconEye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${p.name}`}
                    title="ลบ"
                    onClick={() => void removeProduct(p.id, p.name)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      )}
      </div>

      <FormModal
        open={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
          resetCategoryForm();
        }}
        title="เพิ่มหมวดหมู่"
        description="ชื่อหมวดจะแสดงให้ลูกค้าเลือกบนหน้าร้าน"
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setShowAddCategoryModal(false);
              resetCategoryForm();
            }}
            onSubmit={addCategory}
            submitLabel="เพิ่มหมวด"
            submitDisabled={!categoryName.trim()}
            loading={categoryBusy}
          />
        }
      >
        <div className="space-y-3 p-1">
          <label className="block text-sm font-semibold text-[#1e1b4b]">
            ชื่อหมวด
            <input
              className={cn(ecommerceFieldClass, "mt-1.5")}
              placeholder="เช่น สกินแคร์"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
          </label>
          {categoryErr ? <p className="text-sm text-rose-600">{categoryErr}</p> : null}
        </div>
      </FormModal>

      <FormModal
        open={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          resetProductForm();
        }}
        title="เพิ่มสินค้า"
        description="กรอกข้อมูลและแนบรูป — บันทึกแล้วแสดงในหน้าร้าน"
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setShowAddProductModal(false);
              resetProductForm();
            }}
            onSubmit={addProduct}
            submitLabel="เพิ่มสินค้า"
            submitDisabled={!name.trim() || price === ""}
            loading={productBusy}
          />
        }
      >
        {productFormFields({
          nameVal: name,
          setNameVal: setName,
          priceVal: price,
          setPriceVal: setPrice,
          stockVal: stock,
          setStockVal: setStock,
          categoryVal: newCategoryId,
          setCategoryVal: setNewCategoryId,
          imageVal: newImageUrl,
          onImage: setNewImageUrl,
          galleryInputRef: galleryRef,
          cameraInputRef: cameraRef,
          recommended: newRecommended,
          setRecommended: setNewRecommended,
          bestseller: newBestseller,
          setBestseller: setNewBestseller,
        })}
        {productErr ? <p className="px-1 text-sm text-rose-600">{productErr}</p> : null}
      </FormModal>

      <FormModal
        open={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          resetEditForm();
        }}
        title="แก้ไขสินค้า"
        description="ชื่อ ราคา สต๊อก หมวด และรูป"
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setShowEditProductModal(false);
              resetEditForm();
            }}
            onSubmit={saveEditProduct}
            submitLabel="บันทึก"
            submitDisabled={!editName.trim() || editPrice === ""}
            loading={editBusy}
          />
        }
      >
        {productFormFields({
          nameVal: editName,
          setNameVal: setEditName,
          priceVal: editPrice,
          setPriceVal: setEditPrice,
          stockVal: editStock,
          setStockVal: setEditStock,
          skuVal: editSku,
          setSkuVal: setEditSku,
          categoryVal: editCategoryId,
          setCategoryVal: setEditCategoryId,
          imageVal: editImageUrl,
          onImage: setEditImageUrl,
          galleryInputRef: editGalleryRef,
          cameraInputRef: editCameraRef,
          showActive: true,
          isActive: editIsActive,
          setIsActive: setEditIsActive,
          showFeatured: true,
          featured: editFeatured,
          setFeatured: setEditFeatured,
          recommended: editRecommended,
          setRecommended: setEditRecommended,
          bestseller: editBestseller,
          setBestseller: setEditBestseller,
        })}
        {editErr ? <p className="px-1 text-sm text-rose-600">{editErr}</p> : null}
      </FormModal>

      <FormModal
        open={stockModalProduct !== null}
        onClose={() => setStockModalProduct(null)}
        title="ปรับสต๊อก"
        description={stockModalProduct?.name}
        size="sm"
      >
        {stockModalProduct ? (
          <div className="flex flex-col items-center gap-4 p-2">
            <p className="text-xs font-semibold text-[#66638c]">คงเหลือในคลัง</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className={ecommerceStockButtonClass}
                onClick={() => void adjustStockFromModal(-1)}
                disabled={stockModalProduct.stockBalance <= 0}
                aria-label="ลดสต๊อก"
              >
                −
              </button>
              <span
                className={cn(
                  "min-w-[3.5rem] text-center text-4xl font-black tabular-nums tracking-tight",
                  stockModalProduct.stockBalance <= threshold ? "text-amber-700" : "text-[#1e1b4b]",
                )}
              >
                {stockModalProduct.stockBalance}
              </span>
              <button
                type="button"
                className={ecommerceStockButtonClass}
                onClick={() => void adjustStockFromModal(1)}
                aria-label="เพิ่มสต๊อก"
              >
                +
              </button>
            </div>
            {stockModalProduct.stockBalance <= threshold ? (
              <p className="text-xs font-semibold text-amber-700">ใกล้หมดสต๊อก</p>
            ) : null}
          </div>
        ) : null}
      </FormModal>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปสินค้า" />
    </>
  );

  if (embedded) return body;
  return <AppDashboardSection tone="slate">{body}</AppDashboardSection>;
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M3 3l18 18M10.6 6.1A9 9 0 0122 12a13 13 0 01-2.6 3.5M6.6 6.6A13 13 0 002 12s3.5 7 10 7c1.7 0 3.3-.4 4.7-1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  );
}

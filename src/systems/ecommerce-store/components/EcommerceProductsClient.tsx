"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Package } from "lucide-react";
import {
  AppDashboardSection,
  AppImagePickCameraButtons,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { parseEcommerceProductImageUrls } from "@/lib/ecommerce/product-images";
import { FormModal } from "@/components/ui/FormModal";
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
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreRowIconButtonClass,
  ecommerceStoreTextareaClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

const formLabelClass = "block text-xs font-semibold text-[#4d47b6]";
const formCheckRowClass =
  "flex min-h-9 cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5";
const formSectionTitleClass = "text-xs font-bold tracking-wide text-[#1e1b4b]";

function ProductFormModalFooter({
  onCancel,
  onSubmit,
  submitLabel,
  submitDisabled,
  loading,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className={cn(ecommerceStoreOutlineButtonClass, "w-full sm:w-auto sm:min-w-[6.5rem]")}
      >
        ยกเลิก
      </button>
      <button
        type="button"
        disabled={submitDisabled || loading}
        onClick={onSubmit}
        className={cn(ecommerceStorePrimaryButtonClass, "w-full sm:w-auto sm:min-w-[7.5rem]")}
      >
        {loading ? "กำลังบันทึก…" : submitLabel}
      </button>
    </div>
  );
}

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
  description?: string | null;
  galleryImagesJson?: string;
  imageUrls?: string[];
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  isRecommended: boolean;
  isBestseller: boolean;
};

const ECOM_GALLERY_MAX = 11;

function productGalleryExtras(p: Product): string[] {
  if (p.imageUrls?.length) {
    const cover = p.imageUrl?.trim() || "";
    return p.imageUrls.filter((u) => u && u !== cover).slice(0, ECOM_GALLERY_MAX);
  }
  return parseEcommerceProductImageUrls(p.imageUrl, p.galleryImagesJson).slice(1);
}

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
  const [newGalleryUrls, setNewGalleryUrls] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newRecommended, setNewRecommended] = useState(false);
  const [newBestseller, setNewBestseller] = useState(false);

  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [editSku, setEditSku] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editGalleryUrls, setEditGalleryUrls] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState("");
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
  const newAnglesRef = useRef<HTMLInputElement>(null);
  const editAnglesRef = useRef<HTMLInputElement>(null);

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
    setNewGalleryUrls([]);
    setNewDescription("");
    setNewIsActive(true);
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
    setEditGalleryUrls([]);
    setEditDescription("");
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
    setEditGalleryUrls(productGalleryExtras(p));
    setEditDescription(p.description?.trim() ?? "");
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
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch("/api/ecommerce-store/session/upload-product-image", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (res.ok && j.imageUrl) onUrl(j.imageUrl);
      else noticeErrorRef.current(typeof j.error === "string" ? j.error : "อัปโหลดรูปไม่สำเร็จ");
    } catch (e) {
      noticeErrorRef.current(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  async function uploadGalleryFiles(
    files: FileList | File[],
    current: string[],
    setUrls: (next: string[]) => void,
    coverUrl: string | null,
  ) {
    const room = ECOM_GALLERY_MAX - current.length;
    if (room <= 0) {
      noticeErrorRef.current(`เพิ่มรูปมุมอื่นได้สูงสุด ${ECOM_GALLERY_MAX} รูป`);
      return;
    }
    const list = Array.from(files).slice(0, room);
    const added: string[] = [];
    for (const file of list) {
      await uploadImage(file, (url) => {
        if (url && url !== coverUrl?.trim() && !current.includes(url) && !added.includes(url)) {
          added.push(url);
        }
      });
    }
    if (added.length) setUrls([...current, ...added].slice(0, ECOM_GALLERY_MAX));
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
          galleryImageUrls: newGalleryUrls,
          description: newDescription.trim() || null,
          isActive: newIsActive,
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
          galleryImageUrls: editGalleryUrls,
          description: editDescription.trim() || null,
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
      descriptionVal?: string;
      setDescriptionVal?: (v: string) => void;
      imageVal: string | null;
      onImage: (url: string) => void;
      galleryUrls?: string[];
      setGalleryUrls?: (urls: string[]) => void;
      anglesInputRef?: RefObject<HTMLInputElement | null>;
      galleryInputRef: RefObject<HTMLInputElement | null>;
      cameraInputRef: RefObject<HTMLInputElement | null>;
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
    <div className="max-h-[min(60vh,560px)] space-y-3 overflow-y-auto pr-0.5">
      <section className={cn(ecommerceStorePanelClass, "space-y-3 p-3 sm:p-3.5")}>
        <p className={formSectionTitleClass}>ข้อมูลพื้นฐาน</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={cn(formLabelClass, "sm:col-span-2")}>
            ชื่อสินค้า
            <input
              className={cn(ecommerceFieldClass, "mt-1.5")}
              value={opts.nameVal}
              onChange={(e) => opts.setNameVal(e.target.value)}
            />
          </label>
          <label className={formLabelClass}>
            ราคา (บาท)
            <input
              className={cn(ecommerceFieldClass, "mt-1.5")}
              type="number"
              min={0}
              value={opts.priceVal}
              onChange={(e) => opts.setPriceVal(e.target.value)}
            />
          </label>
          <label className={formLabelClass}>
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
            <label className={cn(formLabelClass, "sm:col-span-2")}>
              SKU (ถ้ามี)
              <input
                className={cn(ecommerceFieldClass, "mt-1.5")}
                value={opts.skuVal}
                onChange={(e) => opts.setSkuVal?.(e.target.value)}
              />
            </label>
          ) : null}
          <label className={cn(formLabelClass, "sm:col-span-2")}>
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
          {opts.setDescriptionVal ? (
            <label className={cn(formLabelClass, "sm:col-span-2")}>
              รายละเอียดสินค้า
              <textarea
                className={cn(ecommerceStoreTextareaClass, "mt-1.5")}
                value={opts.descriptionVal ?? ""}
                onChange={(e) => opts.setDescriptionVal?.(e.target.value)}
                placeholder="สรุปสั้น ๆ แสดงบนการ์ดหน้าร้าน · รายละเอียดเต็มในหน้าดูสินค้า"
                maxLength={2000}
                rows={4}
              />
            </label>
          ) : null}
        </div>
      </section>

      {opts.setIsActive || opts.setRecommended || opts.setBestseller || opts.showFeatured ? (
        <section className={cn(ecommerceStorePanelClass, "space-y-2 p-3 sm:p-3.5")}>
          <p className={formSectionTitleClass}>การแสดงบนเว็บไซต์</p>
          {opts.setIsActive ? (
            <label className={formCheckRowClass}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                checked={opts.isActive ?? true}
                onChange={(e) => opts.setIsActive?.(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1e1b4b]">แสดงบนเว็บไซต์</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                  ติ๊กไว้ = ลูกค้าเห็นบนหน้าร้าน · ไม่ติ๊ก = ซ่อนจากเว็บ
                </span>
              </span>
            </label>
          ) : null}
          {opts.showFeatured && opts.setFeatured ? (
            <label className={formCheckRowClass}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                checked={opts.featured ?? false}
                onChange={(e) => opts.setFeatured?.(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1e1b4b]">สินค้าเด่น (Sale Page)</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                  ตั้งเป็นสินค้าหน้าซื้อด่วน
                </span>
              </span>
            </label>
          ) : null}
          {opts.setRecommended ? (
            <label className={formCheckRowClass}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                checked={opts.recommended ?? false}
                onChange={(e) => opts.setRecommended?.(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1e1b4b]">สินค้าแนะนำ</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                  แสดงในแถวแนะนำบนหน้าร้าน
                </span>
              </span>
            </label>
          ) : null}
          {opts.setBestseller ? (
            <label className={formCheckRowClass}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                checked={opts.bestseller ?? false}
                onChange={(e) => opts.setBestseller?.(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1e1b4b]">สินค้าขายดี</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                  แสดงในแถวขายดีบนหน้าร้าน
                </span>
              </span>
            </label>
          ) : null}
        </section>
      ) : null}

      <section className={cn(ecommerceStorePanelClass, "space-y-3 p-3 sm:p-3.5")}>
        <div>
          <p className={formSectionTitleClass}>รูปปกสินค้า</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#66638c]">รูปหลักบนการ์ดหน้าร้าน</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {opts.imageVal ? (
            <AppImageThumb src={opts.imageVal} alt="รูปสินค้า" onOpen={() => lb.open(opts.imageVal!)} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-[#8b87b8]">
              ไม่มีรูป
            </div>
          )}
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
            labels={{ gallery: "เลือกรูปปก", camera: "ถ่ายรูปปก" }}
            className="justify-start"
            buttonClassName={ecommerceStoreOutlineButtonClass}
          />
        </div>

        {opts.setGalleryUrls && opts.anglesInputRef ? (
          <div className="space-y-2 border-t border-slate-200/80 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={formSectionTitleClass}>
                  รูปมุมอื่น ({opts.galleryUrls?.length ?? 0}/{ECOM_GALLERY_MAX})
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[#66638c]">
                  ลูกค้าเลื่อนดูหลายมุมบนหน้าร้านได้
                </p>
              </div>
              <input
                ref={opts.anglesInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) {
                    void uploadGalleryFiles(
                      files,
                      opts.galleryUrls ?? [],
                      opts.setGalleryUrls!,
                      opts.imageVal,
                    );
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploading || (opts.galleryUrls?.length ?? 0) >= ECOM_GALLERY_MAX}
                onClick={() => opts.anglesInputRef?.current?.click()}
                className={ecommerceStoreOutlineButtonClass}
              >
                + เพิ่มมุมรูป
              </button>
            </div>
            {(opts.galleryUrls?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {opts.galleryUrls!.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative">
                    <AppImageThumb
                      src={url}
                      alt={`มุม ${idx + 1}`}
                      onOpen={() =>
                        lb.openGallery(
                          [opts.imageVal, ...(opts.galleryUrls ?? [])].filter(
                            (u): u is string => Boolean(u),
                          ),
                          opts.imageVal ? idx + 1 : idx,
                        )
                      }
                    />
                    <button
                      type="button"
                      className={cn(
                        ecommerceStoreRowIconButtonClass,
                        "absolute -right-1.5 -top-1.5 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
                      )}
                      aria-label={`ลบมุมที่ ${idx + 1}`}
                      onClick={() =>
                        opts.setGalleryUrls?.(opts.galleryUrls!.filter((_, i) => i !== idx))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
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
                  { key: "inactive" as const, label: "ซ่อนเว็บ" },
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
                    {!p.isActive ? <span className={ecommerceProductTagClass("slate")}>ซ่อนเว็บ</span> : null}
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
                  <label
                    className={cn(
                      "inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold",
                      p.isActive
                        ? "border-emerald-200/90 bg-emerald-50/90 text-emerald-800"
                        : "border-slate-200/90 bg-slate-50 text-slate-500",
                    )}
                    title={p.isActive ? "แสดงบนเว็บไซต์" : "ซ่อนจากเว็บไซต์"}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300"
                      checked={p.isActive}
                      onChange={() => void toggleActive(p.id, p.isActive)}
                      aria-label={`${p.isActive ? "ซ่อน" : "แสดง"} ${p.name} บนเว็บไซต์`}
                    />
                    <span className="hidden sm:inline">เว็บไซต์</span>
                  </label>
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
          <ProductFormModalFooter
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
        <div className={cn(ecommerceStorePanelClass, "space-y-3 p-3")}>
          <label className={formLabelClass}>
            ชื่อหมวด
            <input
              className={cn(ecommerceFieldClass, "mt-1.5")}
              placeholder="เช่น สกินแคร์"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
          </label>
          {categoryErr ? <p className="text-sm font-semibold text-rose-600">{categoryErr}</p> : null}
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
          <ProductFormModalFooter
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
          descriptionVal: newDescription,
          setDescriptionVal: setNewDescription,
          imageVal: newImageUrl,
          onImage: setNewImageUrl,
          galleryUrls: newGalleryUrls,
          setGalleryUrls: setNewGalleryUrls,
          anglesInputRef: newAnglesRef,
          galleryInputRef: galleryRef,
          cameraInputRef: cameraRef,
          isActive: newIsActive,
          setIsActive: setNewIsActive,
          recommended: newRecommended,
          setRecommended: setNewRecommended,
          bestseller: newBestseller,
          setBestseller: setNewBestseller,
        })}
        {productErr ? (
          <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {productErr}
          </p>
        ) : null}
      </FormModal>

      <FormModal
        open={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          resetEditForm();
        }}
        title="แก้ไขสินค้า"
        description="ชื่อ ราคา สต๊อก หมวด รายละเอียด และรูป"
        size="lg"
        footer={
          <ProductFormModalFooter
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
          descriptionVal: editDescription,
          setDescriptionVal: setEditDescription,
          imageVal: editImageUrl,
          onImage: setEditImageUrl,
          galleryUrls: editGalleryUrls,
          setGalleryUrls: setEditGalleryUrls,
          anglesInputRef: editAnglesRef,
          galleryInputRef: editGalleryRef,
          cameraInputRef: editCameraRef,
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
        {editErr ? (
          <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {editErr}
          </p>
        ) : null}
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

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปสินค้า"
      />
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

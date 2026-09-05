"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AppDashboardSection,
  AppImagePickCameraButtons,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  ecommerceCardAccentBarClass,
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceGradientPriceClass,
  ecommerceListRowCardClass,
  ecommerceListRowCardWarnClass,
  ecommerceListStackClass,
  ecommercePlainIconActionClass,
  ecommercePlainIconActionToggleActiveClass,
  ecommercePlainIconActionToggleInactiveClass,
  ecommercePlainIconActionWarnClass,
  ecommerceProductTagClass,
  ecommerceStockButtonClass,
  ecommerceStockPillClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

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

export function EcommerceProductsClient({ embedded = false }: { embedded?: boolean } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threshold, setThreshold] = useState(5);

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
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "inactive">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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
    const res = await fetch("/api/ecommerce-store/session/categories");
    const j = await res.json();
    setCategories(j.categories ?? []);
  }

  async function reload() {
    const [prodRes] = await Promise.all([
      fetch("/api/ecommerce-store/session/products"),
      reloadCategories(),
    ]);
    const j = await prodRes.json();
    setProducts(j.products ?? []);
    setThreshold(j.lowStockThreshold ?? 5);
  }

  useEffect(() => {
    void reload();
  }, []);

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
    setEditBusy(true);
    setEditErr(null);
    try {
      const res = await fetch("/api/ecommerce-store/session/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: editName,
          priceBaht: Number(editPrice),
          stockBalance: Number(editStock),
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
          body: JSON.stringify({ featuredProductId: editId, salePageEnabled: true }),
        });
      }
      setShowEditProductModal(false);
      resetEditForm();
      await reload();
    } finally {
      setEditBusy(false);
    }
  }

  async function adjustStock(id: string, delta: number) {
    await fetch("/api/ecommerce-store/session/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stockDelta: delta }),
    });
    await reload();
  }

  async function adjustStockFromModal(delta: number) {
    if (!stockModalProduct) return;
    await adjustStock(stockModalProduct.id, delta);
    setStockModalProduct((prev) =>
      prev ? { ...prev, stockBalance: Math.max(0, prev.stockBalance + delta) } : null,
    );
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
      if (stockFilter === "low" && p.stockBalance > threshold) return false;
      if (stockFilter === "inactive" && p.isActive) return false;
      if (!kw) return true;
      const blob = `${p.name} ${p.sku ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [products, keyword, categoryFilter, stockFilter, threshold]);

  const hasActiveFilter = keyword.trim() !== "" || categoryFilter !== "" || stockFilter !== "all";

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
            className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
            value={opts.nameVal}
            onChange={(e) => opts.setNameVal(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1e1b4b]">
          ราคา (บาท)
          <input
            className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
            type="number"
            min={0}
            value={opts.priceVal}
            onChange={(e) => opts.setPriceVal(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1e1b4b]">
          สต๊อก
          <input
            className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
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
              className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
              value={opts.skuVal}
              onChange={(e) => opts.setSkuVal?.(e.target.value)}
            />
          </label>
        ) : null}
      </div>
      <label className="block text-sm font-semibold text-[#1e1b4b]">
        หมวดหมู่
        <select
          className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
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
      <AppSectionHeader
        title="สินค้า & สต๊อก"
        description="เพิ่มสินค้า · ปรับสต๊อก"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                appTemplateOutlineButtonClass,
                "min-h-[40px] rounded-xl px-3 text-sm font-bold sm:px-4",
              )}
              aria-label="เพิ่มหมวดหมู่"
              onClick={() => {
                resetCategoryForm();
                setShowAddCategoryModal(true);
              }}
            >
              <span className="sm:hidden">หมวด</span>
              <span className="hidden sm:inline">+ หมวด</span>
            </button>
            <button
              type="button"
              className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm font-bold sm:min-w-0 sm:px-4"
              aria-label="เพิ่มสินค้า"
              onClick={() => {
                resetProductForm();
                setShowAddProductModal(true);
              }}
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ เพิ่มสินค้า</span>
            </button>
          </div>
        }
      />

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาชื่อ · SKU · หมวด"
            className={cn(ecommerceFieldClass, "min-w-0 flex-1")}
            aria-label="ค้นหาสินค้า"
          />
          <button
            type="button"
            onClick={() => setMobileFilterOpen((v) => !v)}
            className={cn(
              appTemplateOutlineButtonClass,
              "relative min-h-[44px] min-w-[44px] shrink-0 px-0 sm:hidden",
              (hasActiveFilter || mobileFilterOpen) && "border-[#5b61ff]/40 bg-[#ecebff]/80",
            )}
            aria-label="เปิดตัวกรอง"
            aria-expanded={mobileFilterOpen}
          >
            <IconFilter className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "space-y-2 rounded-2xl border border-white/50 bg-white/25 p-3 backdrop-blur-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
            mobileFilterOpen ? "block" : "hidden sm:block",
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch]">
              {(
                [
                  { key: "all" as const, label: "ทั้งหมด" },
                  { key: "low" as const, label: "ใกล้หมด" },
                  { key: "inactive" as const, label: "ปิดขาย" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStockFilter(f.key)}
                  className={ecommerceFilterChipClass(stockFilter === f.key)}
                  aria-pressed={stockFilter === f.key}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={cn(ecommerceFieldClass, "sm:max-w-[12rem]")}
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
          <p className="text-xs font-semibold text-[#66638c]">
            {hasActiveFilter
              ? `แสดง ${filteredProducts.length.toLocaleString("th-TH")} จาก ${products.length.toLocaleString("th-TH")} รายการ`
              : `ทั้งหมด ${products.length.toLocaleString("th-TH")} รายการ`}
          </p>
        </div>
      </div>

      <ul className={ecommerceListStackClass}>
        {products.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/60 py-10 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีสินค้า — กด + เพิ่มสินค้า
          </li>
        ) : null}
        {filteredProducts.length === 0 && products.length > 0 ? (
          <li className="rounded-2xl border border-dashed border-white/60 py-10 text-center text-sm font-semibold text-[#66638c]">
            ไม่พบสินค้าตามเงื่อนไข
          </li>
        ) : null}
        {filteredProducts.map((p) => {
          const low = p.stockBalance <= threshold;
          const accent = !p.isActive ? "slate" : low ? "amber" : p.isRecommended || p.isBestseller ? "rose" : "violet";

          const stockPill = (
            <button
              type="button"
              className={cn(
                ecommerceStockPillClass,
                low && "border-amber-300/70 bg-amber-50/90 text-amber-800 ring-amber-200/50",
              )}
              onClick={() => setStockModalProduct(p)}
              aria-label={`สต๊อก ${p.stockBalance} ชิ้น — กดเพื่อปรับ ${p.name}`}
            >
              {p.stockBalance}
            </button>
          );

          const stockInline = (
            <button
              type="button"
              className={cn(
                "inline font-black tabular-nums underline-offset-2 transition hover:underline",
                low ? "text-amber-700" : "text-[#4d47b6]",
              )}
              onClick={() => setStockModalProduct(p)}
              aria-label={`สต๊อก ${p.stockBalance} ชิ้น — กดเพื่อปรับ ${p.name}`}
            >
              {p.stockBalance}
            </button>
          );

          const priceBlock = (
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8] md:hidden">ราคา</p>
              <p className={cn("text-lg font-black tabular-nums leading-tight md:text-xl", ecommerceGradientPriceClass)}>
                ฿{Number(p.priceBaht).toLocaleString("th-TH")}
              </p>
            </div>
          );

          const actionButtons = (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className={ecommercePlainIconActionClass}
                aria-label={`แก้ไข ${p.name}`}
                title="แก้ไข"
                onClick={() => openEditProduct(p)}
              >
                <IconRowEdit className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className={p.isActive ? ecommercePlainIconActionToggleActiveClass : ecommercePlainIconActionToggleInactiveClass}
                aria-label={`${p.isActive ? "ปิด" : "เปิด"}ขาย ${p.name}`}
                title={p.isActive ? "ปิดขาย" : "เปิดขาย"}
                onClick={() => void toggleActive(p.id, p.isActive)}
              >
                {p.isActive ? (
                  <IconEyeOff className="h-5 w-5" aria-hidden />
                ) : (
                  <IconEye className="h-5 w-5" aria-hidden />
                )}
              </button>
              <button
                type="button"
                className={ecommercePlainIconActionWarnClass}
                aria-label={`ลบ ${p.name}`}
                title="ลบ"
                onClick={() => void removeProduct(p.id, p.name)}
              >
                <IconRowRemove className="h-5 w-5" aria-hidden />
              </button>
            </div>
          );

          const statusTags = (
            <>
              {!p.isActive ? <span className={ecommerceProductTagClass("slate")}>ปิดขาย</span> : null}
              {low ? <span className={ecommerceProductTagClass("amber")}>ใกล้หมด</span> : null}
            </>
          );

          const featureTagsLeft = (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {p.isRecommended ? <span className={ecommerceProductTagClass("rose")}>แนะนำ</span> : null}
              {p.isBestseller ? <span className={ecommerceProductTagClass("amber")}>ขายดี</span> : null}
            </div>
          );

          const metaLine = (
            <p className="truncate text-xs font-medium leading-relaxed text-[#66638c]">
              {p.category?.name ?? "ไม่มีหมวด"}
              {p.sku ? ` · ${p.sku}` : ""}
              <span className="hidden md:inline">
                {" · "}
                {stockInline}
              </span>
            </p>
          );

          const productImage = p.imageUrl ? (
            <AppImageThumb
              src={p.imageUrl}
              alt={p.name}
              onOpen={() => lb.open(p.imageUrl!)}
              className="h-16 w-16 shrink-0 md:h-20 md:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-gradient-to-br from-[#f5f4ff] to-[#ecebff] md:h-20 md:w-20">
              <IconImage className="h-6 w-6 text-[#b3b0d2]" />
            </div>
          );

          return (
            <li
              key={p.id}
              className={cn(
                "relative overflow-hidden pl-5 md:pl-6",
                low ? ecommerceListRowCardWarnClass : ecommerceListRowCardClass,
                !p.isActive && "opacity-80",
              )}
            >
              <span className={ecommerceCardAccentBarClass(accent)} aria-hidden />

              <div className="md:grid md:grid-cols-[5rem_minmax(0,1fr)_auto] md:items-start md:gap-5">
                <div className="flex gap-3 md:contents">
                  <div className="flex shrink-0 flex-col gap-1.5 md:w-20">
                    {productImage}
                    {(p.isRecommended || p.isBestseller) ? (
                      <div className="hidden flex-wrap gap-1 md:flex">{featureTagsLeft}</div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-base font-black leading-snug text-[#1e1b4b] md:leading-tight md:tracking-tight">
                      {p.name}
                    </p>
                    <div className="flex flex-wrap gap-1">{statusTags}</div>
                    {metaLine}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
                  {featureTagsLeft}
                  {stockPill}
                </div>

                <div className="hidden md:flex md:flex-col md:items-end md:gap-2 md:self-start">
                  {priceBlock}
                  {actionButtons}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 md:hidden">
                {priceBlock}
                {actionButtons}
              </div>
            </li>
          );
        })}
      </ul>

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
              className="app-input mt-1.5 min-h-[44px] w-full rounded-xl"
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

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M4 18l5-5 4 4 3-3 4 4" strokeLinejoin="round" />
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

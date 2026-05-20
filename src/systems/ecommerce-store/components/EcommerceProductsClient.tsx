"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
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
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

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

export function EcommerceProductsClient() {
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

  return (
    <AppDashboardSection className="appDashboardSectionSlateClass">
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

      <ul className="space-y-2">
        {products.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/60 py-10 text-center text-sm text-[#66638c]">
            ยังไม่มีสินค้า — กด + เพิ่มสินค้า
          </li>
        ) : null}
        {products.map((p) => {
          const low = p.stockBalance <= threshold;
          return (
            <li
              key={p.id}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border px-3 py-3 sm:px-4 ${
                low ? "border-amber-200 bg-amber-50/80" : "border-white/60 bg-white/70"
              } ${!p.isActive ? "opacity-60" : ""}`}
            >
              {p.imageUrl ? (
                <AppImageThumb
                  src={p.imageUrl}
                  alt={p.name}
                  onOpen={() => lb.open(p.imageUrl!)}
                  className="h-14 w-14 shrink-0"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f3f2fa] text-[10px] text-[#8b87b8]">
                  ไม่มีรูป
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1e1b4b]">{p.name}</p>
                <p className="text-xs text-[#66638c]">
                  ฿{Number(p.priceBaht).toLocaleString("th-TH")}
                  {p.sku ? ` · ${p.sku}` : ""} · คงเหลือ {p.stockBalance}
                  {low ? <span className="ml-2 font-bold text-amber-700">ใกล้หมด</span> : null}
                  {!p.isActive ? <span className="ml-2 text-rose-600">ปิดขาย</span> : null}
                </p>
                <p className="mt-1 text-xs text-[#8b87b8]">
                  หมวด: {p.category?.name ?? "—"}
                  {p.isRecommended ? (
                    <span className="ml-2 font-semibold text-rose-600">· แนะนำ</span>
                  ) : null}
                  {p.isBestseller ? (
                    <span className="ml-1 font-semibold text-amber-700">· ขายดี</span>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <button
                  type="button"
                  className="min-h-[40px] rounded-xl border border-white/60 bg-white/80 px-2 text-xs font-bold text-[#4d47b6]"
                  onClick={() => void adjustStock(p.id, -1)}
                  aria-label={`ลดสต๊อก ${p.name}`}
                >
                  −
                </button>
                <button
                  type="button"
                  className="min-h-[40px] rounded-xl border border-white/60 bg-white/80 px-2 text-xs font-bold text-[#4d47b6]"
                  onClick={() => void adjustStock(p.id, 1)}
                  aria-label={`เพิ่มสต๊อก ${p.name}`}
                >
                  +
                </button>
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
                  className={assetRowEditIconButtonClass}
                  aria-label={`${p.isActive ? "ปิด" : "เปิด"}ขาย ${p.name}`}
                  title={p.isActive ? "ปิดขาย" : "เปิดขาย"}
                  onClick={() => void toggleActive(p.id, p.isActive)}
                >
                  <span className="text-xs font-bold">{p.isActive ? "ปิด" : "เปิด"}</span>
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

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปสินค้า" />
    </AppDashboardSection>
  );
}

"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppSectionHeader,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  fetchDrinkPosCategories,
  fetchDrinkPosProducts,
  fetchDrinkPosSales,
  drinkPosFetchErrorMessage,
  type DrinkPosCategoryRow,
  type DrinkPosProductRow,
  type DrinkPosSaleRow,
} from "@/systems/drink-pos/lib/client-data";
import { formatThb } from "@/systems/inventory/lib/inventory-client-data";
import { suggestDrinkPosStockImageUrl } from "@/systems/drink-pos/lib/suggest-stock-image";
import { useDrinkPosMobileDraftSlot } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { DrinkPosLoyaltyBar } from "@/systems/drink-pos/components/DrinkPosLoyaltyBar";
import {
  DrinkPosPaymentPanel,
  drinkPosPaymentSubmitBlocked,
} from "@/systems/drink-pos/components/DrinkPosPaymentPanel";
import type { DrinkPosLoyaltyMemberDto } from "@/systems/drink-pos/lib/loyalty-rule";
import type { DrinkPosPaymentMethod } from "@/systems/drink-pos/lib/payment-method";
import {
  defaultDrinkPosSizePrices,
  drinkPosActiveSizePrices,
  drinkPosDisplayPriceLabel,
  drinkPosProductHasSizes,
  drinkPosResolveUnitPrice,
  type DrinkPosSizeCode,
  type DrinkPosSizePrice,
} from "@/systems/drink-pos/lib/size-prices";
import {
  drinkPosChipActiveClass,
  drinkPosChipIdleClass,
  drinkPosCtaClass,
  drinkPosDraftPanelClass,
  drinkPosFieldClass,
  drinkPosContentStackClass,
  drinkPosOutlineIconButtonClass,
  drinkPosProductCardClass,
  drinkPosPulseWashClass,
  drinkPosStatCardClass,
  drinkPosStatGridClass,
} from "@/systems/drink-pos/lib/ui-tokens";

/** กริดสินค้าหน้าจัดการ — มือถือ 3 คอลัมน์ · เดสก์ท็อป 8 */
const drinkPosManageProductGridClass =
  "mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-8 lg:gap-2";
const DRINK_POS_CARD_DOUBLE_TAP_MS = 280;

const draftQtyStepButtonClass = cn(
  "flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-[#0000BF]/25 bg-white/85 text-[#4d47b6] shadow-sm transition hover:bg-white active:scale-95 disabled:pointer-events-none disabled:opacity-35",
);

function IconDraftQtyMinus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconDraftQtyPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

type SaleDraftLine = {
  lineKey: string;
  productId: string;
  size: DrinkPosSizeCode | null;
  name: string;
  unitPriceBaht: number;
  quantity: number;
};

function draftLineKey(productId: string, size: DrinkPosSizeCode | null): string {
  return size ? `${productId}:${size}` : productId;
}

function formatDrinkPosCardPrice(product: DrinkPosProductRow): string {
  const label = drinkPosDisplayPriceLabel({
    priceBaht: product.basePriceBaht ?? product.priceBaht,
    sizePrices: product.sizePrices,
  });
  if (!label.includes("–")) return formatThb(Number(label));
  const [a, b] = label.split("–");
  return `${formatThb(Number(a))}–${formatThb(Number(b))}`;
}

function bangkokDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
}

function todayBangkokKey(): string {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
}

export function DrinkPosDashboardClient() {
  const [categories, setCategories] = useState<DrinkPosCategoryRow[]>([]);
  const [products, setProducts] = useState<DrinkPosProductRow[]>([]);
  const [sales, setSales] = useState<DrinkPosSaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string | "all">("all");

  const [catManageOpen, setCatManageOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<DrinkPosCategoryRow | null>(null);
  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("1");
  const [catIsActive, setCatIsActive] = useState(true);
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);
  const [catUploadBusy, setCatUploadBusy] = useState(false);
  const catGalleryRef = useRef<HTMLInputElement>(null);
  const catCameraRef = useRef<HTMLInputElement>(null);

  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodEdit, setProdEdit] = useState<DrinkPosProductRow | null>(null);
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodSizesEnabled, setProdSizesEnabled] = useState(false);
  const [prodSizePrices, setProdSizePrices] = useState<DrinkPosSizePrice[]>(defaultDrinkPosSizePrices());
  const [prodBusy, setProdBusy] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [prodUploadBusy, setProdUploadBusy] = useState(false);
  const prodGalleryRef = useRef<HTMLInputElement>(null);
  const prodCameraRef = useRef<HTMLInputElement>(null);

  const [draftLines, setDraftLines] = useState<SaleDraftLine[]>([]);
  const [draftBusy, setDraftBusy] = useState(false);
  const [billReviewOpen, setBillReviewOpen] = useState(false);
  const [loyaltyMember, setLoyaltyMember] = useState<DrinkPosLoyaltyMemberDto | null>(null);
  const [sizePick, setSizePick] = useState<{ product: DrinkPosProductRow; quantity: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DrinkPosPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);

  const setMobileDraftSlot = useDrinkPosMobileDraftSlot();

  const cardTapRef = useRef<{ productId: string; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [c, p, s] = await Promise.all([
        fetchDrinkPosCategories(),
        fetchDrinkPosProducts(),
        fetchDrinkPosSales(120),
      ]);
      if (!c.ok) {
        setError(c.error);
        return;
      }
      if (!p.ok) {
        setError(p.error);
        return;
      }
      if (!s.ok) {
        setError(s.error);
        return;
      }
      setCategories(c.categories);
      setProducts(p.products);
      setSales(s.sales);
    } catch (e) {
      setError(drinkPosFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => {
    const tKey = todayBangkokKey();
    const activeProducts = products.filter((x) => x.isActive);
    const todayTotal = sales
      .filter((x) => bangkokDayKey(x.createdAt) === tKey)
      .reduce((a, x) => a + x.totalBaht, 0);
    return {
      categories: categories.length,
      products: activeProducts.length,
      featured: activeProducts.filter((x) => x.isFeatured).length,
      todayTotal,
    };
  }, [categories.length, products, sales]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((x) => x.isActive);
    if (filterCat === "all") return list;
    return list.filter((x) => x.categoryId === filterCat);
  }, [products, filterCat]);

  const chipCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories],
  );

  const prodCategoryName = useMemo(
    () => categories.find((c) => c.id === prodCategoryId)?.name ?? null,
    [categories, prodCategoryId],
  );

  async function uploadDrinkPosImageFile(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch("/api/drink-pos/upload", { method: "POST", body: fd, credentials: "include" });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดไม่สำเร็จ");
    }
    return j.imageUrl;
  }

  async function onCatImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setCatErr(null);
    setCatUploadBusy(true);
    try {
      const url = await uploadDrinkPosImageFile(f);
      setCatImageUrl(url);
    } catch (err) {
      setCatErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setCatUploadBusy(false);
    }
  }

  async function onProdImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setProdErr(null);
    setProdUploadBusy(true);
    try {
      const url = await uploadDrinkPosImageFile(f);
      setProdImageUrl(url);
    } catch (err) {
      setProdErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setProdUploadBusy(false);
    }
  }

  function openCatManage() {
    setCatFormOpen(false);
    setCatEdit(null);
    setCatErr(null);
    setCatManageOpen(true);
  }

  function openCreateCategory() {
    setCatEdit(null);
    setCatName("");
    setCatImageUrl("");
    setCatSortOrder(String((categories[categories.length - 1]?.sortOrder ?? 0) + 1));
    setCatIsActive(true);
    setCatErr(null);
    setCatFormOpen(true);
    setCatManageOpen(true);
  }

  function openEditCategory(c: DrinkPosCategoryRow) {
    setCatEdit(c);
    setCatName(c.name);
    setCatImageUrl(c.imageUrl ?? "");
    setCatSortOrder(String(c.sortOrder));
    setCatIsActive(c.isActive !== false);
    setCatErr(null);
    setCatFormOpen(true);
    setCatManageOpen(true);
  }

  function closeCatForm() {
    if (catBusy || catUploadBusy) return;
    setCatFormOpen(false);
    setCatEdit(null);
    setCatErr(null);
  }

  async function submitCategory() {
    setCatBusy(true);
    setCatErr(null);
    try {
      const sort = Number(catSortOrder);
      const payload = {
        name: catName.trim(),
        imageUrl: catImageUrl.trim() || null,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        isActive: catIsActive,
      };
      if (!payload.name) {
        setCatErr("กรุณากรอกชื่อหมวด");
        return;
      }
      if (catEdit) {
        const res = await fetch(`/api/drink-pos/categories/${catEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCatErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        const res = await fetch("/api/drink-pos/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCatErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
          return;
        }
      }
      setCatFormOpen(false);
      setCatEdit(null);
      await reload();
    } finally {
      setCatBusy(false);
    }
  }

  async function deleteCategory(c: DrinkPosCategoryRow) {
    if (!window.confirm(`ลบหมวดหมู่ "${c.name}" ?\n(ถ้ามีสินค้าในหมวดนี้ต้องลบหรือย้ายสินค้าก่อน)`)) return;
    const res = await fetch(`/api/drink-pos/categories/${c.id}`, { method: "DELETE", credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(typeof j.error === "string" ? j.error : "ลบไม่สำเร็จ");
      return;
    }
    if (filterCat === c.id) setFilterCat("all");
    await reload();
  }

  function openCreateProduct() {
    setProdEdit(null);
    setProdCategoryId(categories[0]?.id ?? "");
    setProdName("");
    setProdPrice("");
    setProdImageUrl("");
    setProdFeatured(false);
    setProdSizesEnabled(false);
    setProdSizePrices(defaultDrinkPosSizePrices());
    setProdErr(null);
    setProdModalOpen(true);
  }

  function openEditProduct(p: DrinkPosProductRow) {
    setProdEdit(p);
    setProdCategoryId(p.categoryId);
    setProdName(p.name);
    setProdPrice(String(p.basePriceBaht ?? p.priceBaht));
    setProdImageUrl(p.imageUrl ?? "");
    setProdFeatured(p.isFeatured);
    setProdSizesEnabled(drinkPosProductHasSizes(p.sizePrices));
    setProdSizePrices(
      p.sizePrices?.length ?
        p.sizePrices.map((row) => ({ ...row }))
      : defaultDrinkPosSizePrices(p.basePriceBaht ?? p.priceBaht),
    );
    setProdErr(null);
    setProdModalOpen(true);
  }

  async function submitProduct() {
    setProdBusy(true);
    setProdErr(null);
    try {
      const price = Number.parseInt(prodPrice.replace(/\D/g, ""), 10);
      if (!prodName.trim()) {
        setProdErr("กรุณากรอกชื่อสินค้า");
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        setProdErr("ราคาไม่ถูกต้อง");
        return;
      }
      if (prodSizesEnabled) {
        const enabled = prodSizePrices.filter((x) => x.enabled);
        if (enabled.length === 0) {
          setProdErr("เปิดอย่างน้อย 1 ขนาด (S / M / L)");
          return;
        }
        for (const row of enabled) {
          if (!Number.isFinite(row.priceBaht) || row.priceBaht < 0) {
            setProdErr(`ราคาขนาด ${row.size} ไม่ถูกต้อง`);
            return;
          }
        }
      }
      if (!prodCategoryId) {
        setProdErr("เลือกหมวดก่อน — เพิ่มหมวดจากปุ่ม + หมวด");
        return;
      }
      const payload = {
        categoryId: prodCategoryId,
        name: prodName.trim(),
        priceBaht: prodSizesEnabled ?
          (prodSizePrices.find((x) => x.size === "M" && x.enabled)?.priceBaht ??
            prodSizePrices.find((x) => x.enabled)?.priceBaht ??
            price)
        : price,
        sizesEnabled: prodSizesEnabled,
        sizePrices: prodSizesEnabled ? prodSizePrices : null,
        imageUrl: prodImageUrl.trim() || null,
        isFeatured: prodFeatured,
      };
      if (prodEdit) {
        const res = await fetch(`/api/drink-pos/products/${prodEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setProdErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        const res = await fetch("/api/drink-pos/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setProdErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
          return;
        }
      }
      setProdModalOpen(false);
      await reload();
    } finally {
      setProdBusy(false);
    }
  }

  async function deleteProduct(p: DrinkPosProductRow) {
    if (!window.confirm(`ลบสินค้า «${p.name}»?`)) return;
    const res = await fetch(`/api/drink-pos/products/${p.id}`, { method: "DELETE", credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(typeof j.error === "string" ? j.error : "ลบไม่สำเร็จ");
      return;
    }
    await reload();
  }

  function addProductToDraft(p: DrinkPosProductRow, delta: number, size: DrinkPosSizeCode | null = null) {
    if (delta <= 0) return;
    const unitPriceBaht = drinkPosResolveUnitPrice(
      { priceBaht: p.basePriceBaht ?? p.priceBaht, sizePrices: p.sizePrices },
      size,
    );
    if (unitPriceBaht == null) return;
    const lineKey = draftLineKey(p.id, size);
    const displayName = size ? `${p.name} (${size})` : p.name;
    setDraftLines((prev) => {
      const i = prev.findIndex((x) => x.lineKey === lineKey);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + delta };
        return next;
      }
      return [
        ...prev,
        {
          lineKey,
          productId: p.id,
          size,
          name: displayName,
          unitPriceBaht,
          quantity: delta,
        },
      ];
    });
  }

  function incrementDraftLineQty(lineKey: string) {
    setDraftLines((prev) =>
      prev.map((x) => (x.lineKey === lineKey ? { ...x, quantity: x.quantity + 1 } : x)),
    );
  }

  function decrementDraftLineQty(lineKey: string) {
    setDraftLines((prev) => {
      const i = prev.findIndex((x) => x.lineKey === lineKey);
      if (i < 0) return prev;
      const q = prev[i].quantity - 1;
      if (q <= 0) return prev.filter((x) => x.lineKey !== lineKey);
      return prev.map((x, j) => (j === i ? { ...x, quantity: q } : x));
    });
  }

  function removeDraftLine(lineKey: string) {
    setDraftLines((prev) => prev.filter((x) => x.lineKey !== lineKey));
  }

  function handleProductCardTap(p: DrinkPosProductRow) {
    if (drinkPosProductHasSizes(p.sizePrices)) {
      const prev = cardTapRef.current;
      if (prev && prev.productId === p.id) {
        clearTimeout(prev.timeoutId);
        cardTapRef.current = null;
        setSizePick({ product: p, quantity: 2 });
        return;
      }
      if (prev && prev.productId !== p.id) {
        clearTimeout(prev.timeoutId);
        cardTapRef.current = null;
        const prevP = products.find((x) => x.id === prev.productId);
        if (prevP && !drinkPosProductHasSizes(prevP.sizePrices)) addProductToDraft(prevP, 1);
        else if (prevP) setSizePick({ product: prevP, quantity: 1 });
      }
      const timeoutId = setTimeout(() => {
        cardTapRef.current = null;
        setSizePick({ product: p, quantity: 1 });
      }, DRINK_POS_CARD_DOUBLE_TAP_MS);
      cardTapRef.current = { productId: p.id, timeoutId };
      return;
    }

    const prev = cardTapRef.current;
    if (prev && prev.productId === p.id) {
      clearTimeout(prev.timeoutId);
      cardTapRef.current = null;
      addProductToDraft(p, 2);
      return;
    }
    if (prev && prev.productId !== p.id) {
      clearTimeout(prev.timeoutId);
      cardTapRef.current = null;
      const prevP = products.find((x) => x.id === prev.productId);
      if (prevP) addProductToDraft(prevP, 1);
    }
    const timeoutId = setTimeout(() => {
      cardTapRef.current = null;
      addProductToDraft(p, 1);
    }, DRINK_POS_CARD_DOUBLE_TAP_MS);
    cardTapRef.current = { productId: p.id, timeoutId };
  }

  useEffect(() => {
    return () => {
      const t = cardTapRef.current;
      if (t) clearTimeout(t.timeoutId);
    };
  }, []);

  async function postSaleLines(
    lines: { productId: string; quantity: number; size?: DrinkPosSizeCode | null }[],
    payment?: { paymentMethod: DrinkPosPaymentMethod; paymentSlipUrl: string | null },
  ) {
    const res = await fetch("/api/drink-pos/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        note: null,
        memberPhone: loyaltyMember?.phone ?? null,
        paymentMethod: payment?.paymentMethod ?? "CASH",
        paymentSlipUrl: payment?.paymentSlipUrl ?? null,
        lines,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof j.error === "string" ? j.error : "บันทึกขายไม่สำเร็จ");
    }
  }

  const resetPayment = useCallback(() => {
    setPaymentMethod("CASH");
    setPaymentSlipUrl(null);
  }, []);

  const submitDraftBill = useCallback(async () => {
    if (draftLines.length === 0) return;
    const payTotal = draftLines.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0);
    if (drinkPosPaymentSubmitBlocked(paymentMethod, payTotal, paymentSlipUrl)) {
      setBillReviewOpen(true);
      window.alert(
        paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน",
      );
      return;
    }
    setDraftBusy(true);
    try {
      await postSaleLines(
        draftLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          size: l.size,
        })),
        {
          paymentMethod: payTotal <= 0 ? "CASH" : paymentMethod,
          paymentSlipUrl: payTotal <= 0 || paymentMethod === "CASH" ? null : paymentSlipUrl,
        },
      );
      setDraftLines([]);
      setBillReviewOpen(false);
      resetPayment();
      if (loyaltyMember?.phone) {
        const lookupRes = await fetch(
          `/api/drink-pos/session/loyalty/members?phone=${encodeURIComponent(loyaltyMember.phone)}`,
          { credentials: "include", cache: "no-store" },
        );
        const lj = (await lookupRes.json().catch(() => ({}))) as {
          member?: DrinkPosLoyaltyMemberDto | null;
        };
        if (lookupRes.ok && lj.member) setLoyaltyMember(lj.member);
      }
      await reload();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setDraftBusy(false);
    }
  }, [draftLines, reload, loyaltyMember, paymentMethod, paymentSlipUrl, resetPayment]);

  const draftTotalBaht = useMemo(() => {
    return draftLines.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0);
  }, [draftLines]);

  const draftQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of draftLines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity);
    return m;
  }, [draftLines]);

  useLayoutEffect(() => {
    if (draftLines.length === 0) {
      setMobileDraftSlot(null);
      return () => setMobileDraftSlot(null);
    }
    setMobileDraftSlot(
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-start gap-2">
          <DrinkPosButton
            type="button"
            disabled={draftBusy}
            onClick={() => setBillReviewOpen(true)}
            className="min-w-0 flex-1 rounded-2xl border border-transparent px-1 py-0.5 text-left outline-none transition hover:border-white/50 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 disabled:opacity-50"
            aria-label="ดูสรุปรายการก่อนบันทึกบิล"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายการรอบันทึก</p>
            <p className="truncate text-sm font-black text-[#1e1b4b]">
              {draftLines.length} รายการ · ฿{formatThb(draftTotalBaht)}
            </p>
          </DrinkPosButton>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <DrinkPosButton
              type="button"
              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 py-2 text-xs font-black")}
              onClick={() => {
                setDraftLines([]);
                resetPayment();
              }}
              disabled={draftBusy}
            >
              ล้าง
            </DrinkPosButton>
            <DrinkPosButton
              type="button"
              className={drinkPosCtaClass}
              onClick={() => setBillReviewOpen(true)}
              disabled={draftBusy}
            >
              ชำระ / บันทึก
            </DrinkPosButton>
          </div>
        </div>
        <ul className="max-h-[5.5rem] space-y-0.5 overflow-y-auto overscroll-contain text-xs font-semibold text-[#66638c] [-webkit-overflow-scrolling:touch]">
          {draftLines.map((l) => (
            <li key={l.lineKey} className="flex justify-between gap-2 px-0.5">
              <span className="min-w-0 truncate">
                {l.name} × {l.quantity}
              </span>
              <span className="shrink-0 tabular-nums">฿{formatThb(l.unitPriceBaht * l.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>,
    );
    return () => setMobileDraftSlot(null);
  }, [draftLines, draftTotalBaht, draftBusy, setMobileDraftSlot, resetPayment]);

  useEffect(() => {
    if (draftLines.length === 0 && billReviewOpen) setBillReviewOpen(false);
  }, [draftLines.length, billReviewOpen]);

  const paymentBlocked = drinkPosPaymentSubmitBlocked(paymentMethod, draftTotalBaht, paymentSlipUrl);

  return (
    <div className={drinkPosContentStackClass}>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <section aria-label="สรุป">
        <ul className={cn(drinkPosStatGridClass, "lg:grid-cols-4")}>
          <li className={drinkPosStatCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">หมวดหมู่</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">{stats.categories}</p>
          </li>
          <li className={drinkPosStatCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">สินค้าเปิดขาย</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">{stats.products}</p>
          </li>
          <li className={drinkPosStatCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">แนะนำ</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">{stats.featured}</p>
          </li>
          <li className={drinkPosStatCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ยอดขายวันนี้ (กทม.)</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#1e1b4b] sm:text-3xl">
              ฿{formatThb(stats.todayTotal)}
            </p>
          </li>
        </ul>
      </section>

      <DrinkPosLoyaltyBar member={loyaltyMember} onMemberChange={setLoyaltyMember} />

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="สินค้า"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/drink-pos/finance"
                aria-label="ดูยอดขาย"
                className={cn(
                  appTemplateOutlineButtonClass,
                  drinkPosOutlineIconButtonClass,
                )}
                title="ยอดขาย"
              >
                <svg className="h-5 w-5 sm:mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">ยอดขาย</span>
              </Link>
              <DrinkPosButton
                type="button"
                onClick={() => openCatManage()}
                aria-label="จัดการหมวดหมู่"
                className={cn(
                  appTemplateOutlineButtonClass,
                  drinkPosOutlineIconButtonClass,
                )}
                title="หมวดหมู่ — เพิ่ม แก้ไข ลบ"
              >
                <svg className="h-5 w-5 sm:mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">หมวดหมู่</span>
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={openCreateProduct}
                aria-label="เพิ่มสินค้า"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-0 font-black shadow-md sm:min-w-0 sm:px-4"
                title="เพิ่มสินค้า"
              >
                <svg className="h-5 w-5 sm:mr-1.5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">+ เพิ่มสินค้า</span>
              </DrinkPosButton>
            </div>
          }
        />

        <div
          className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-2 pt-0.5 [-webkit-overflow-scrolling:touch]"
          role="group"
          aria-label="กรองตามหมวดหมู่ — เลื่อนซ้ายขวาได้"
        >
          <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
            <DrinkPosButton
              type="button"
              onClick={() => setFilterCat("all")}
              aria-pressed={filterCat === "all"}
              className={cn(
                "shrink-0 snap-start transition",
                filterCat === "all" ? drinkPosChipActiveClass : drinkPosChipIdleClass,
              )}
            >
              ทั้งหมด
            </DrinkPosButton>
            {chipCategories.map((c) => (
              <DrinkPosButton
                key={c.id}
                type="button"
                onClick={() => setFilterCat(c.id)}
                aria-pressed={filterCat === c.id}
                className={cn(
                  "shrink-0 snap-start transition",
                  filterCat === c.id ? drinkPosChipActiveClass : drinkPosChipIdleClass,
                )}
              >
                {c.name}
              </DrinkPosButton>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={cn("mt-4 h-40 animate-pulse rounded-xl", drinkPosPulseWashClass)} aria-hidden />
        ) : filteredProducts.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-4">
            {categories.length === 0 ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มสินค้า" : "ไม่มีสินค้าในหมวดนี้"}
          </AppEmptyState>
        ) : (
          <ul className={drinkPosManageProductGridClass}>
            {filteredProducts.map((p) => {
              const inDraftQty = draftQtyByProductId.get(p.id) ?? 0;
              return (
              <li key={p.id} className={cn(drinkPosProductCardClass, "flex flex-col")}>
                <DrinkPosButton
                  type="button"
                  onClick={() => handleProductCardTap(p)}
                  className={cn(
                    "flex min-h-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80",
                    inDraftQty > 0 && "ring-2 ring-[#0000BF]/35 ring-offset-2 ring-offset-white/90",
                  )}
                  aria-label={`${p.name} ราคา ${formatDrinkPosCardPrice(p)} บาท${inDraftQty > 0 ? ` ในบิล ${inDraftQty} ชิ้น` : ""}${drinkPosProductHasSizes(p.sizePrices) ? " มีหลายขนาด" : ""}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#0000BF]/08 sm:aspect-[4/3] lg:aspect-square">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#66638c]">
                        <svg className="h-5 w-5 opacity-40 sm:h-12 sm:w-12 lg:h-7 lg:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                          <rect x="4" y="5" width="16" height="14" rx="2" />
                          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                          <path d="M4 17l4-4 3 3 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {inDraftQty > 0 ? (
                      <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-1 text-[9px] font-black tabular-nums text-white shadow-md backdrop-blur-sm sm:right-3 sm:top-3 sm:h-9 sm:min-w-[2.25rem] sm:px-2 sm:text-sm lg:right-1 lg:top-1 lg:h-6 lg:min-w-[1.5rem] lg:text-[10px]">
                        ×{inDraftQty}
                      </span>
                    ) : null}
                    {p.isFeatured ? (
                      <span className="absolute left-1 top-1 rounded-full border border-amber-200/80 bg-amber-50/95 px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-amber-800 shadow-sm backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:text-[10px] lg:left-1 lg:top-1 lg:px-1.5 lg:text-[8px]">
                        แนะนำ
                      </span>
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-between gap-0.5 p-1.5 sm:gap-2 sm:p-4 lg:gap-1 lg:p-2">
                    <div className="min-w-0">
                      <p className="truncate text-[8px] font-black uppercase tracking-widest text-[#66638c] sm:text-[10px] lg:text-[8px]">
                        {p.categoryName}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:mt-1 sm:text-base lg:text-[11px] lg:leading-tight">
                        {p.name}
                      </p>
                    </div>
                    <div className="border-t border-white/50 pt-1 sm:pt-3 lg:pt-1.5">
                      <p className="text-[11px] font-black tabular-nums text-[#4d47b6] sm:text-xl lg:text-sm">
                        ฿{formatDrinkPosCardPrice(p)}
                      </p>
                      {drinkPosProductHasSizes(p.sizePrices) ? (
                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-[#66638c] sm:text-[10px] lg:text-[8px]">
                          S / M / L
                        </p>
                      ) : null}
                    </div>
                  </div>
                </DrinkPosButton>
                <div className="flex justify-end gap-0.5 border-t border-white/50 px-1 py-1 sm:gap-1 sm:px-4 sm:py-2.5 lg:px-1.5 lg:py-1">
                  <DrinkPosButton
                    type="button"
                    className={cn(assetRowEditIconButtonClass, "min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] lg:min-h-[32px] lg:min-w-[32px]")}
                    aria-label={`แก้ไข ${p.name}`}
                    title="แก้ไข"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditProduct(p);
                    }}
                  >
                    <IconRowEdit className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3" aria-hidden />
                  </DrinkPosButton>
                  <DrinkPosButton
                    type="button"
                    className={cn(assetRowRemoveIconButtonClass, "min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] lg:min-h-[32px] lg:min-w-[32px]")}
                    aria-label={`ลบ ${p.name}`}
                    title="ลบ"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteProduct(p);
                    }}
                  >
                    <IconRowRemove className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3" aria-hidden />
                  </DrinkPosButton>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </AppDashboardSection>

      {draftLines.length > 0 ? (
        <div
          className={cn(
            "fixed left-4 right-4 z-[38] hidden md:bottom-8 md:left-auto md:right-8 md:block md:max-w-md",
            drinkPosDraftPanelClass,
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DrinkPosButton
              type="button"
              disabled={draftBusy}
              onClick={() => setBillReviewOpen(true)}
              className="min-w-0 flex-1 rounded-2xl border border-transparent px-1 py-0.5 text-left outline-none transition hover:border-white/55 hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 disabled:opacity-50"
              aria-label="ดูสรุปรายการก่อนบันทึกบิล"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายการรอบันทึก</p>
              <p className="truncate text-sm font-black text-[#1e1b4b]">
                {draftLines.length} รายการ · ฿{formatThb(draftTotalBaht)}
              </p>
            </DrinkPosButton>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <DrinkPosButton
                type="button"
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 py-2 text-xs font-black")}
                onClick={() => {
                  setDraftLines([]);
                  resetPayment();
                }}
                disabled={draftBusy}
              >
                ล้าง
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                className={drinkPosCtaClass}
                onClick={() => setBillReviewOpen(true)}
                disabled={draftBusy}
              >
                ชำระ / บันทึก
              </DrinkPosButton>
            </div>
          </div>
          <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-xs font-semibold text-[#66638c]">
            {draftLines.map((l) => (
              <li key={l.lineKey} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {l.name} × {l.quantity}
                </span>
                <span className="shrink-0 tabular-nums">฿{formatThb(l.unitPriceBaht * l.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <FormModal
        open={billReviewOpen}
        onClose={() => !draftBusy && setBillReviewOpen(false)}
        title="สรุปรายการ"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => !draftBusy && setBillReviewOpen(false)}
            onSubmit={() => void submitDraftBill()}
            submitLabel="บันทึกบิล"
            loading={draftBusy}
            submitDisabled={draftLines.length === 0 || paymentBlocked}
          />
        }
      >
        {draftLines.length === 0 ? (
          <AppEmptyState tone="violet" className="py-6">
            ไม่มีรายการในบิล
          </AppEmptyState>
        ) : (
          <div className="space-y-3">
            <ul className="max-h-[min(16rem,40vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
              {draftLines.map((l) => (
                <li
                  key={l.lineKey}
                  className="flex flex-col gap-3 rounded-2xl border border-white/55 bg-white/55 p-3 text-sm shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{l.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#66638c]">฿{formatThb(l.unitPriceBaht)} / ชิ้น</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                    <div className="flex items-center gap-0.5 rounded-full border border-white/55 bg-white/65 p-0.5 shadow-sm ring-1 ring-inset ring-white/40">
                      <DrinkPosButton
                        type="button"
                        className={draftQtyStepButtonClass}
                        disabled={draftBusy}
                        onClick={() => decrementDraftLineQty(l.lineKey)}
                        aria-label={`ลดจำนวน ${l.name}`}
                        title="ลด"
                      >
                        <IconDraftQtyMinus className="h-4 w-4" />
                      </DrinkPosButton>
                      <span className="min-w-[2rem] px-1 text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                        {l.quantity}
                      </span>
                      <DrinkPosButton
                        type="button"
                        className={draftQtyStepButtonClass}
                        disabled={draftBusy}
                        onClick={() => incrementDraftLineQty(l.lineKey)}
                        aria-label={`เพิ่มจำนวน ${l.name}`}
                        title="เพิ่ม"
                      >
                        <IconDraftQtyPlus className="h-4 w-4" />
                      </DrinkPosButton>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black tabular-nums text-[#4d47b6]">฿{formatThb(l.unitPriceBaht * l.quantity)}</p>
                      <DrinkPosButton
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        disabled={draftBusy}
                        aria-label={`ลบ ${l.name} ออกจากบิล`}
                        title="ลบรายการ"
                        onClick={() => removeDraftLine(l.lineKey)}
                      >
                        <IconRowRemove className="h-4 w-4" aria-hidden />
                      </DrinkPosButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#0000BF]/20 bg-gradient-to-r from-[#0000BF]/10 via-[#8b5cf6]/10 to-[#ec4899]/10 px-4 py-3">
              <span className="text-sm font-black text-[#1e1b4b]">ยอดรวม</span>
              <span className="text-lg font-black tabular-nums text-[#1e1b4b]">฿{formatThb(draftTotalBaht)}</span>
            </div>
            <DrinkPosPaymentPanel
              amountBaht={draftTotalBaht}
              method={paymentMethod}
              slipUrl={paymentSlipUrl}
              onMethodChange={setPaymentMethod}
              onSlipUrlChange={setPaymentSlipUrl}
              disabled={draftBusy}
            />
          </div>
        )}
      </FormModal>

      <FormModal
        open={catManageOpen}
        onClose={() => {
          if (catBusy || catUploadBusy) return;
          setCatManageOpen(false);
          setCatFormOpen(false);
          setCatEdit(null);
          setCatErr(null);
        }}
        title={catFormOpen ? (catEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่") : "หมวดหมู่"}
        description={catFormOpen ? "ลำดับเลขน้อยแสดงก่อน" : "เพิ่ม แก้ไข หรือลบหมวดทั้งหมด"}
        size="lg"
        mobileCentered
        footer={
          catFormOpen ? (
            <FormModalFooterActions
              onCancel={closeCatForm}
              onSubmit={() => void submitCategory()}
              submitLabel={catEdit ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
              loading={catBusy}
              submitDisabled={!catName.trim() || !Number.isFinite(Number(catSortOrder))}
            />
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <DrinkPosButton
                type="button"
                onClick={() => openCreateCategory()}
                className="app-btn-primary inline-flex min-h-[44px] items-center gap-1 rounded-xl px-4 text-sm font-semibold"
              >
                <span aria-hidden>+</span>
                เพิ่มหมวดหมู่
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={() => {
                  setCatManageOpen(false);
                  setCatFormOpen(false);
                  setCatEdit(null);
                }}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-white/55 bg-white/70 px-4 text-sm font-black text-[#5b61ff] shadow-sm backdrop-blur-sm"
              >
                ปิด
              </DrinkPosButton>
            </div>
          )
        }
      >
        <AppGalleryCameraFileInputs
          galleryInputRef={catGalleryRef}
          cameraInputRef={catCameraRef}
          onChange={(e) => void onCatImageFileChange(e)}
        />
        {catFormOpen ? (
          <div className="space-y-3">
            {catErr ? <p className="text-sm font-semibold text-rose-600">{catErr}</p> : null}
            <label className="block">
              <span className="text-xs font-bold text-[#66638c]">ชื่อหมวดหมู่</span>
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className={cn("mt-1", drinkPosFieldClass)}
                placeholder="เช่น กาแฟ"
                autoComplete="off"
              />
            </label>
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#66638c]">รูปหมวด</span>
              <div className="flex flex-wrap items-center gap-2">
                <AppImagePickCameraButtons
                  onPickGallery={() => catGalleryRef.current?.click()}
                  onPickCamera={() => catCameraRef.current?.click()}
                  disabled={catBusy}
                  busy={catUploadBusy}
                  labels={{ busy: "กำลังอัปโหลด…" }}
                  className="justify-start"
                />
                <DrinkPosButton
                  type="button"
                  disabled={catBusy || catUploadBusy}
                  onClick={() => {
                    setCatErr(null);
                    setCatImageUrl(suggestDrinkPosStockImageUrl({ name: catName, categoryName: catName }));
                  }}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "rounded-2xl px-3 py-2 text-xs font-black text-[#4d47b6] disabled:opacity-50",
                  )}
                >
                  แนะภาพตามหมวด
                </DrinkPosButton>
              </div>
              {catImageUrl.trim() ? (
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-[#0000BF]/08 ring-1 ring-inset ring-white/40">
                  <img
                    src={catImageUrl.trim()}
                    alt=""
                    className="h-28 w-full object-cover object-center"
                  />
                </div>
              ) : null}
              <label className="block">
                <span className="text-xs font-bold text-[#66638c]">ลิงก์รูป (URL)</span>
                <input
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  className={cn("mt-1", drinkPosFieldClass)}
                  placeholder="https://… หรือ /uploads/…"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-[#66638c]">ลำดับแสดงผล</span>
              <input
                type="number"
                value={catSortOrder}
                onChange={(e) => setCatSortOrder(e.target.value)}
                className={cn("mt-1", drinkPosFieldClass)}
                placeholder="ตัวเลข — น้อยขึ้นก่อน"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
              <input
                type="checkbox"
                checked={catIsActive}
                onChange={(e) => setCatIsActive(e.target.checked)}
              />
              เปิดใช้งานหมวดนี้
            </label>
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff]/70 px-3 py-8 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex min-h-[56px] items-center gap-3 rounded-[1.25rem] border border-[#e8e6f4]/90 bg-white/80 px-3 py-2.5"
              >
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ecebff] text-xs font-black text-[#4d47b6]">
                    {c.sortOrder}
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#1e1b4b]">
                  <span className="text-[#66638c]">{c.sortOrder}.</span> {c.name}
                  <span className="mt-0.5 block text-xs font-medium text-[#66638c]">
                    {c.productCount} รายการ
                    {c.isActive === false ? " · ปิดใช้งาน" : ""}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <DrinkPosButton
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    title="แก้ไข"
                    onClick={() => openEditCategory(c)}
                  >
                    <IconRowEdit className="h-4 w-4" aria-hidden />
                  </DrinkPosButton>
                  <DrinkPosButton
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    title="ลบ"
                    onClick={() => void deleteCategory(c)}
                  >
                    <IconRowRemove className="h-4 w-4" aria-hidden />
                  </DrinkPosButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={prodModalOpen}
        onClose={() => !prodBusy && !prodUploadBusy && setProdModalOpen(false)}
        title={prodEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
        footer={
          <FormModalFooterActions
            onCancel={() => !prodBusy && !prodUploadBusy && setProdModalOpen(false)}
            onSubmit={() => void submitProduct()}
            submitLabel="บันทึก"
            loading={prodBusy}
          />
        }
      >
        <div className="space-y-3">
          <AppGalleryCameraFileInputs
            galleryInputRef={prodGalleryRef}
            cameraInputRef={prodCameraRef}
            onChange={(e) => void onProdImageFileChange(e)}
          />
          {prodErr ? <p className="text-sm font-semibold text-rose-600">{prodErr}</p> : null}
          <label className="block">
            <span className="text-xs font-bold text-[#66638c]">หมวด</span>
            <select
              value={prodCategoryId}
              onChange={(e) => setProdCategoryId(e.target.value)}
              className={cn("mt-1", drinkPosFieldClass)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#66638c]">ชื่อสินค้า</span>
            <input
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              className={cn("mt-1", drinkPosFieldClass)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#66638c]">ราคา (บาท)</span>
            <input
              inputMode="numeric"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              disabled={prodSizesEnabled}
              className={cn("mt-1", drinkPosFieldClass, "disabled:opacity-50")}
              placeholder="0"
            />
          </label>
          <div className="rounded-2xl border border-white/55 bg-white/45 p-3 ring-1 ring-inset ring-white/40">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1e1b4b]">
              <input
                type="checkbox"
                checked={prodSizesEnabled}
                onChange={(e) => {
                  const on = e.target.checked;
                  setProdSizesEnabled(on);
                  if (on) {
                    const base = Number.parseInt(prodPrice.replace(/\D/g, ""), 10);
                    setProdSizePrices(defaultDrinkPosSizePrices(Number.isFinite(base) ? base : 0));
                  }
                }}
                className="h-4 w-4 rounded"
              />
              มีหลายขนาด (S / M / L)
            </label>
            {prodSizesEnabled ? (
              <ul className="mt-3 space-y-2">
                {prodSizePrices.map((row, idx) => (
                  <li key={row.size} className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex min-w-[4.5rem] items-center gap-2 text-sm font-black text-[#4d47b6]">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setProdSizePrices((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, enabled } : x)),
                          );
                        }}
                        className="h-4 w-4 rounded"
                      />
                      {row.size}
                    </label>
                    <input
                      inputMode="numeric"
                      value={String(row.priceBaht)}
                      disabled={!row.enabled}
                      onChange={(e) => {
                        const v = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                        setProdSizePrices((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, priceBaht: Number.isFinite(v) ? v : 0 } : x,
                          ),
                        );
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:ring-2 disabled:opacity-45"
                      placeholder="ราคา"
                      aria-label={`ราคาขนาด ${row.size}`}
                    />
                    <span className="text-xs font-semibold text-[#66638c]">บาท</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ปิดอยู่ — ใช้ราคาเดียวตามช่องด้านบน</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#66638c]">รูปสินค้า</span>
            <div className="flex flex-wrap items-center gap-2">
              <AppImagePickCameraButtons
                onPickGallery={() => prodGalleryRef.current?.click()}
                onPickCamera={() => prodCameraRef.current?.click()}
                disabled={prodBusy}
                busy={prodUploadBusy}
                labels={{ busy: "กำลังอัปโหลด…" }}
                className="justify-start"
              />
              <DrinkPosButton
                type="button"
                disabled={prodBusy || prodUploadBusy}
                onClick={() => {
                  setProdErr(null);
                  setProdImageUrl(
                    suggestDrinkPosStockImageUrl({
                      name: prodName,
                      categoryName: prodCategoryName,
                    }),
                  );
                }}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "rounded-2xl px-3 py-2 text-xs font-black text-[#4d47b6] disabled:opacity-50",
                )}
              >
                แนะภาพตามสินค้า
              </DrinkPosButton>
            </div>
            {prodImageUrl.trim() ? (
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-[#0000BF]/08 ring-1 ring-inset ring-white/40">
                <img
                  src={prodImageUrl.trim()}
                  alt=""
                  className="h-28 w-full object-cover object-center"
                />
              </div>
            ) : null}
            <label className="block">
              <span className="text-xs font-bold text-[#66638c]">ลิงก์รูป (URL) — ทับหลังอัปโหลดได้</span>
              <input
                value={prodImageUrl}
                onChange={(e) => setProdImageUrl(e.target.value)}
                className={cn("mt-1", drinkPosFieldClass)}
                placeholder="https://… หรือ /uploads/…"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/60 bg-white/60 px-3 py-2 text-sm font-bold text-[#1e1b4b]">
              <input type="checkbox" checked={prodFeatured} onChange={(e) => setProdFeatured(e.target.checked)} className="h-4 w-4 rounded" />
              รายการแนะนำ
            </label>
            <DrinkPosButton
              type="button"
              className={cn(appTemplateOutlineButtonClass, "rounded-2xl px-3 py-2 text-xs font-black text-[#4d47b6]")}
              onClick={() => setProdFeatured(true)}
            >
              ตั้งเป็นแนะนำ
            </DrinkPosButton>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={sizePick != null}
        onClose={() => setSizePick(null)}
        title="เลือกขนาด"
        size="sm"
        footer={null}
      >
        {sizePick ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#1e1b4b]">{sizePick.product.name}</p>
            <p className="text-xs font-medium text-[#66638c]">
              {sizePick.quantity > 1 ? `เพิ่ม ${sizePick.quantity} ชิ้น` : "เลือกขนาดเพื่อเพิ่มในบิล"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {drinkPosActiveSizePrices(sizePick.product.sizePrices).map((row) => (
                <DrinkPosButton
                  key={row.size}
                  type="button"
                  className="flex min-h-[72px] flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/80 px-2 py-3 text-center shadow-sm transition hover:border-[#0000BF]/35 hover:bg-violet-50/70"
                  onClick={() => {
                    addProductToDraft(sizePick.product, sizePick.quantity, row.size);
                    setSizePick(null);
                  }}
                >
                  <span className="text-lg font-black text-[#4d47b6]">{row.size}</span>
                  <span className="mt-1 text-xs font-bold tabular-nums text-[#1e1b4b]">฿{formatThb(row.priceBaht)}</span>
                </DrinkPosButton>
              ))}
            </div>
          </div>
        ) : null}
      </FormModal>
    </div>
  );
}

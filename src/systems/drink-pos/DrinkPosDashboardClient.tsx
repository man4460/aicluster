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
import type { DrinkPosMemberDto } from "@/systems/drink-pos/lib/member-service";

const statCardClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/60 via-indigo-50/25 to-violet-100/15 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-5";

const productCardClass =
  "group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/65 via-white/40 to-indigo-50/20 shadow-sm ring-1 ring-inset ring-white/45 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-[2rem]";

/** ช่วงเวลาแตะซ้ำบนการ์ดเดิมเพื่อนับเป็น «แตะคู่» (+2) — ใกล้เคียงพฤติกรรมสั่งผ่าน QR */
const DRINK_POS_CARD_DOUBLE_TAP_MS = 280;

const draftQtyStepButtonClass = cn(
  "flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/85 text-[#4d47b6] shadow-sm transition hover:bg-white active:scale-95 disabled:pointer-events-none disabled:opacity-35",
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
  productId: string;
  name: string;
  unitPriceBaht: number;
  quantity: number;
};

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

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<DrinkPosCategoryRow | null>(null);
  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
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
  const [prodBusy, setProdBusy] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [prodUploadBusy, setProdUploadBusy] = useState(false);
  const prodGalleryRef = useRef<HTMLInputElement>(null);
  const prodCameraRef = useRef<HTMLInputElement>(null);

  const [catManageOpen, setCatManageOpen] = useState(false);

  const [draftLines, setDraftLines] = useState<SaleDraftLine[]>([]);
  const [draftBusy, setDraftBusy] = useState(false);
  const [billReviewOpen, setBillReviewOpen] = useState(false);
  const [loyaltyMember, setLoyaltyMember] = useState<DrinkPosMemberDto | null>(null);
  const [redeemMode, setRedeemMode] = useState(false);

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

  function openCreateCategory() {
    setCatEdit(null);
    setCatName("");
    setCatImageUrl("");
    setCatErr(null);
    setCatModalOpen(true);
  }

  function openEditCategory(c: DrinkPosCategoryRow) {
    setCatEdit(c);
    setCatName(c.name);
    setCatImageUrl(c.imageUrl ?? "");
    setCatErr(null);
    setCatModalOpen(true);
  }

  async function submitCategory() {
    setCatBusy(true);
    setCatErr(null);
    try {
      const payload = { name: catName.trim(), imageUrl: catImageUrl.trim() || null };
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
      setCatModalOpen(false);
      await reload();
    } finally {
      setCatBusy(false);
    }
  }

  async function deleteCategory(c: DrinkPosCategoryRow) {
    if (!window.confirm(`ลบหมวด «${c.name}»?`)) return;
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
    setProdErr(null);
    setProdModalOpen(true);
  }

  function openEditProduct(p: DrinkPosProductRow) {
    setProdEdit(p);
    setProdCategoryId(p.categoryId);
    setProdName(p.name);
    setProdPrice(String(p.priceBaht));
    setProdImageUrl(p.imageUrl ?? "");
    setProdFeatured(p.isFeatured);
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
      if (!prodCategoryId) {
        setProdErr("เลือกหมวดก่อน — เพิ่มหมวดจากปุ่ม + หมวด");
        return;
      }
      const payload = {
        categoryId: prodCategoryId,
        name: prodName.trim(),
        priceBaht: price,
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

  function addProductToDraft(p: DrinkPosProductRow, delta: number) {
    if (delta <= 0) return;
    setDraftLines((prev) => {
      const i = prev.findIndex((x) => x.productId === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + delta };
        return next;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unitPriceBaht: p.priceBaht,
          quantity: delta,
        },
      ];
    });
  }

  function incrementDraftLineQty(productId: string) {
    setDraftLines((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, quantity: x.quantity + 1 } : x)),
    );
  }

  function decrementDraftLineQty(productId: string) {
    setDraftLines((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
      if (i < 0) return prev;
      const q = prev[i].quantity - 1;
      if (q <= 0) return prev.filter((x) => x.productId !== productId);
      return prev.map((x, j) => (j === i ? { ...x, quantity: q } : x));
    });
  }

  function removeDraftLine(productId: string) {
    setDraftLines((prev) => prev.filter((x) => x.productId !== productId));
  }

  function handleProductCardTap(p: DrinkPosProductRow) {
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

  async function postSaleLines(lines: { productId: string; quantity: number }[]) {
    const res = await fetch("/api/drink-pos/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        note: redeemMode ? "แลกแต้มฟรี" : null,
        memberPhone: loyaltyMember?.phone ?? null,
        isRewardRedemption: redeemMode && Boolean(loyaltyMember),
        lines,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof j.error === "string" ? j.error : "บันทึกขายไม่สำเร็จ");
    }
  }

  const submitDraftBill = useCallback(async () => {
    if (draftLines.length === 0) return;
    setDraftBusy(true);
    try {
      await postSaleLines(draftLines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
      setDraftLines([]);
      setBillReviewOpen(false);
      if (loyaltyMember?.phone) {
        const lookupRes = await fetch("/api/drink-pos/members/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone: loyaltyMember.phone }),
        });
        const lj = (await lookupRes.json().catch(() => ({}))) as { member?: DrinkPosMemberDto };
        if (lookupRes.ok && lj.member) setLoyaltyMember(lj.member);
      }
      setRedeemMode(false);
      await reload();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setDraftBusy(false);
    }
  }, [draftLines, reload, loyaltyMember, redeemMode]);

  const draftTotalBaht = useMemo(() => {
    if (redeemMode && loyaltyMember) return 0;
    return draftLines.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0);
  }, [draftLines, redeemMode, loyaltyMember]);

  const draftQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of draftLines) m.set(l.productId, l.quantity);
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
            className="min-w-0 flex-1 rounded-2xl border border-transparent px-1 py-0.5 text-left outline-none transition hover:border-white/50 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 disabled:opacity-50"
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
              onClick={() => setDraftLines([])}
              disabled={draftBusy}
            >
              ล้าง
            </DrinkPosButton>
            <DrinkPosButton
              type="button"
              className="min-h-[40px] rounded-xl bg-[#5b61ff] px-3 py-2 text-xs font-black text-white shadow-md disabled:opacity-50"
              onClick={() => void submitDraftBill()}
              disabled={draftBusy}
            >
              {draftBusy ? "กำลังบันทึก…" : "บันทึกบิล"}
            </DrinkPosButton>
          </div>
        </div>
        <ul className="max-h-[5.5rem] space-y-0.5 overflow-y-auto overscroll-contain text-xs font-semibold text-[#66638c] [-webkit-overflow-scrolling:touch]">
          {draftLines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2 px-0.5">
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
  }, [draftLines, draftTotalBaht, draftBusy, setMobileDraftSlot, submitDraftBill]);

  useEffect(() => {
    if (draftLines.length === 0 && billReviewOpen) setBillReviewOpen(false);
  }, [draftLines.length, billReviewOpen]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <section aria-label="สรุป">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <li className={statCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">หมวดหมู่</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">{stats.categories}</p>
          </li>
          <li className={statCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">สินค้าเปิดขาย</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">{stats.products}</p>
          </li>
          <li className={statCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">แนะนำ</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">{stats.featured}</p>
          </li>
          <li className={statCardClass}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ยอดขายวันนี้ (กทม.)</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#1e1b4b] sm:text-3xl">
              ฿{formatThb(stats.todayTotal)}
            </p>
          </li>
        </ul>
      </section>

      <DrinkPosLoyaltyBar
        member={loyaltyMember}
        onMemberChange={setLoyaltyMember}
        redeemMode={redeemMode}
        onRedeemModeChange={setRedeemMode}
      />

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
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border-[#5b61ff]/25 bg-white/80 px-0 text-[#4d47b6] sm:min-w-0 sm:px-4",
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
                onClick={() => setCatManageOpen(true)}
                aria-label="จัดการหมวดหมู่"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border-[#5b61ff]/25 bg-white/80 px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                )}
                title="จัดการหมวด"
              >
                <svg className="h-5 w-5 sm:mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">จัดการหมวด</span>
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={openCreateCategory}
                aria-label="เพิ่มหมวดหมู่"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border-[#5b61ff]/25 bg-white/80 px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                )}
                title="เพิ่มหมวด"
              >
                <svg className="h-5 w-5 sm:mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">หมวด</span>
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
          className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-2 pt-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
          role="group"
          aria-label="หมวดหมู่ — เลื่อนซ้ายขวาได้"
        >
          <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
            <DrinkPosButton
              type="button"
              onClick={() => setFilterCat("all")}
              className={cn(
                "shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition",
                filterCat === "all"
                  ? "border-[#5b61ff]/40 bg-[#5b61ff] text-white shadow-md"
                  : "border-white/60 bg-white/50 text-[#66638c] hover:bg-white/80",
              )}
            >
              ทั้งหมด
            </DrinkPosButton>
            {categories.map((c) => (
              <DrinkPosButton
                key={c.id}
                type="button"
                onClick={() => setFilterCat(c.id)}
                className={cn(
                  "shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition",
                  filterCat === c.id
                    ? "border-[#5b61ff]/40 bg-[#5b61ff] text-white shadow-md"
                    : "border-white/60 bg-white/50 text-[#66638c] hover:bg-white/80",
                )}
              >
                {c.name}
              </DrinkPosButton>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 h-40 animate-pulse rounded-[2rem] bg-[#ecebff]/50" aria-hidden />
        ) : filteredProducts.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-6">
            {categories.length === 0 ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มสินค้า" : "ไม่มีสินค้าในหมวดนี้"}
          </AppEmptyState>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {filteredProducts.map((p) => {
              const inDraftQty = draftQtyByProductId.get(p.id) ?? 0;
              return (
              <li key={p.id} className={cn(productCardClass, "flex flex-col")}>
                <DrinkPosButton
                  type="button"
                  onClick={() => handleProductCardTap(p)}
                  className={cn(
                    "flex min-h-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80",
                    inDraftQty > 0 && "ring-2 ring-[#5b61ff]/35 ring-offset-2 ring-offset-white/90",
                  )}
                  aria-label={`${p.name} ราคา ${formatThb(p.priceBaht)} บาท${inDraftQty > 0 ? ` ในบิล ${inDraftQty} ชิ้น` : ""}`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ecebff]/40">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#66638c]">
                        <svg className="h-12 w-12 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                          <rect x="4" y="5" width="16" height="14" rx="2" />
                          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                          <path d="M4 17l4-4 3 3 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {inDraftQty > 0 ? (
                      <span className="absolute right-3 top-3 flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-[#5b61ff]/30 bg-[#5b61ff] px-2 text-sm font-black tabular-nums text-white shadow-md backdrop-blur-sm">
                        ×{inDraftQty}
                      </span>
                    ) : null}
                    {p.isFeatured ? (
                      <span className="absolute left-3 top-3 rounded-full border border-amber-200/80 bg-amber-50/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 shadow-sm backdrop-blur-sm">
                        แนะนำ
                      </span>
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">{p.categoryName}</p>
                      <p className="mt-1 line-clamp-2 text-base font-black leading-snug text-[#1e1b4b]">{p.name}</p>
                    </div>
                    <div className="border-t border-white/50 pt-3">
                      <p className="text-xl font-black tabular-nums text-[#4d47b6] sm:text-2xl">฿{formatThb(p.priceBaht)}</p>
                    </div>
                  </div>
                </DrinkPosButton>
                <div className="flex justify-end gap-1 border-t border-white/50 px-3 py-2.5 sm:px-4">
                  <DrinkPosButton
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${p.name}`}
                    title="แก้ไข"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditProduct(p);
                    }}
                  >
                    <IconRowEdit className="h-4 w-4" aria-hidden />
                  </DrinkPosButton>
                  <DrinkPosButton
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${p.name}`}
                    title="ลบ"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteProduct(p);
                    }}
                  >
                    <IconRowRemove className="h-4 w-4" aria-hidden />
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
            "rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/90 via-indigo-50/40 to-violet-100/25 p-3 shadow-[0_20px_50px_-20px_rgba(30,27,75,0.45)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DrinkPosButton
              type="button"
              disabled={draftBusy}
              onClick={() => setBillReviewOpen(true)}
              className="min-w-0 flex-1 rounded-2xl border border-transparent px-1 py-0.5 text-left outline-none transition hover:border-white/55 hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 disabled:opacity-50"
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
                onClick={() => setDraftLines([])}
                disabled={draftBusy}
              >
                ล้าง
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                className="min-h-[40px] rounded-xl bg-[#5b61ff] px-3 py-2 text-xs font-black text-white shadow-md disabled:opacity-50"
                onClick={() => void submitDraftBill()}
                disabled={draftBusy}
              >
                {draftBusy ? "กำลังบันทึก…" : "บันทึกบิล"}
              </DrinkPosButton>
            </div>
          </div>
          <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-xs font-semibold text-[#66638c]">
            {draftLines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2">
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
          />
        }
      >
        {draftLines.length === 0 ? (
          <AppEmptyState tone="violet" className="py-6">
            ไม่มีรายการในบิล
          </AppEmptyState>
        ) : (
          <div className="space-y-3">
            <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
              {draftLines.map((l) => (
                <li
                  key={l.productId}
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
                        onClick={() => decrementDraftLineQty(l.productId)}
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
                        onClick={() => incrementDraftLineQty(l.productId)}
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
                        onClick={() => removeDraftLine(l.productId)}
                      >
                        <IconRowRemove className="h-4 w-4" aria-hidden />
                      </DrinkPosButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#5b61ff]/20 bg-[#5b61ff]/10 px-4 py-3">
              <span className="text-sm font-black text-[#1e1b4b]">ยอดรวม</span>
              <span className="text-lg font-black tabular-nums text-[#1e1b4b]">฿{formatThb(draftTotalBaht)}</span>
            </div>
          </div>
        )}
      </FormModal>

      <FormModal
        open={catManageOpen}
        onClose={() => setCatManageOpen(false)}
        title="จัดการหมวดหมู่"
        size="md"
        footer={null}
      >
        {categories.length === 0 ? (
          <AppEmptyState tone="slate" className="py-4">
            ยังไม่มีหมวด
          </AppEmptyState>
        ) : (
          <ul className="max-h-[min(24rem,60vh)] space-y-2 overflow-y-auto pr-1">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/20 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-[#1e1b4b]">{c.name}</p>
                  <p className="text-xs font-semibold text-[#66638c]">{c.productCount} รายการในหมวด</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <DrinkPosButton
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    title="แก้ไข"
                    onClick={() => {
                      setCatManageOpen(false);
                      openEditCategory(c);
                    }}
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
        open={catModalOpen}
        onClose={() => !catBusy && !catUploadBusy && setCatModalOpen(false)}
        title={catEdit ? "แก้ไขหมวด" : "เพิ่มหมวดหมู่"}
        footer={
          <FormModalFooterActions
            onCancel={() => !catBusy && !catUploadBusy && setCatModalOpen(false)}
            onSubmit={() => void submitCategory()}
            submitLabel="บันทึก"
            loading={catBusy}
          />
        }
      >
        <div className="space-y-3">
          <AppGalleryCameraFileInputs
            galleryInputRef={catGalleryRef}
            cameraInputRef={catCameraRef}
            onChange={(e) => void onCatImageFileChange(e)}
          />
          {catErr ? <p className="text-sm font-semibold text-rose-600">{catErr}</p> : null}
          <label className="block">
            <span className="text-xs font-bold text-[#66638c]">ชื่อหมวด</span>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
              placeholder="เช่น เครื่องดื่ม"
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
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-[#ecebff]/30 ring-1 ring-inset ring-white/40">
                <img
                  src={catImageUrl.trim()}
                  alt=""
                  className="h-28 w-full object-cover object-center"
                />
              </div>
            ) : null}
            <label className="block">
              <span className="text-xs font-bold text-[#66638c]">ลิงก์รูป (URL) — ทับหลังอัปโหลดได้</span>
              <input
                value={catImageUrl}
                onChange={(e) => setCatImageUrl(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
                placeholder="https://… หรือ /uploads/…"
              />
            </label>
          </div>
        </div>
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
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
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
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#66638c]">ราคา (บาท)</span>
            <input
              inputMode="numeric"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
              placeholder="0"
            />
          </label>
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
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-[#ecebff]/30 ring-1 ring-inset ring-white/40">
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
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
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
    </div>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AppEmptyState,
  alertSlipPrintRequiresMonthlyPlan,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { staffDailyUnlockHeaders, readStoredStaffDailyUnlock } from "@/lib/modules/staff-daily-pin";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { formatThb } from "@/systems/inventory/lib/inventory-client-data";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { DrinkPosRemoteImg } from "@/systems/drink-pos/components/DrinkPosRemoteImg";
import { DrinkPosLoyaltyBar } from "@/systems/drink-pos/components/DrinkPosLoyaltyBar";
import { useDrinkPosMobileDraftSlot } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import {
  DrinkPosPaymentPanel,
  drinkPosPaymentSubmitBlocked,
} from "@/systems/drink-pos/components/DrinkPosPaymentPanel";
import {
  fetchDrinkPosCategories,
  fetchDrinkPosProducts,
  drinkPosFetchErrorMessage,
  type DrinkPosCategoryRow,
  type DrinkPosProductRow,
} from "@/systems/drink-pos/lib/client-data";
import {
  printDrinkPosSaleReceipt,
  type DrinkPosShopReceiptMeta,
} from "@/systems/drink-pos/lib/drink-pos-order-ticket-print";
import type { DrinkPosLoyaltyMemberDto } from "@/systems/drink-pos/lib/loyalty-rule";
import type { DrinkPosPaymentMethod } from "@/systems/drink-pos/lib/payment-method";
import {
  drinkPosActiveSizePrices,
  drinkPosDisplayPriceLabel,
  drinkPosProductHasSizes,
  drinkPosResolveUnitPrice,
  type DrinkPosSizeCode,
} from "@/systems/drink-pos/lib/size-prices";
import {
  drinkPosChipActiveClass,
  drinkPosChipIdleClass,
  drinkPosCtaClass,
  drinkPosProductCardClass,
  drinkPosProductGridClass,
  drinkPosPulseWashClass,
} from "@/systems/drink-pos/lib/ui-tokens";

const DRINK_POS_CARD_DOUBLE_TAP_MS = 280;

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

const draftQtyStepButtonClass = cn(
  "flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-[#0000BF]/25 bg-white/85 text-[#4d47b6] shadow-sm transition hover:bg-white active:scale-95 disabled:pointer-events-none disabled:opacity-35",
);

const qtyBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0000BF]/25 bg-white text-[#4d47b6] shadow-sm transition hover:bg-violet-50 active:scale-95 disabled:opacity-35";

function IconQtyMinus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconQtyPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function DrinkPosOrderClient({
  staffAuth = null,
  layout = "dashboard",
  refreshNonce = 0,
  enableMobileDraft = true,
  slipPrintEnabled: slipPrintEnabledProp,
  shopLabel = null,
  shopReceipt: shopReceiptProp = null,
  defaultPaperSize: defaultPaperSizeProp = null,
}: {
  /** โหมดลิงก์พนักงาน — เมนู/บันทึกผ่าน /api/drink-pos/staff/* */
  staffAuth?: { ownerId: string; trialSessionId: string; k: string } | null;
  /** staffPortal = เต็มความกว้างพอร์ทัล · กริด/สกรอลล์ใน viewport */
  layout?: "dashboard" | "staffPortal";
  /** เพิ่มค่าเมื่อกดรีเฟรชที่หัวพอร์ทัล — โหลดเมนูใหม่ */
  refreshNonce?: number;
  /** ปิดแถบล่างสรุปบิล (เช่นตอนอยู่แท็บคิว) */
  enableMobileDraft?: boolean;
  /** แพ็กเหมารายเดือน — เปิดพิมพ์สลิป */
  slipPrintEnabled?: boolean;
  /** ชื่อร้านบนสลิป (พอร์ทัลพนักงาน) */
  shopLabel?: string | null;
  /** หัวใบเสร็จ (ที่อยู่ · เลขภาษี · เบอร์) — จาก bootstrap / โปรไฟล์ */
  shopReceipt?: DrinkPosShopReceiptMeta | null;
  /** ขนาดกระดาษจาก staff bootstrap — ไม่ส่ง = โหลดจากโปรไฟล์ */
  defaultPaperSize?: string | null;
} = {}) {
  const isStaffPortal = layout === "staffPortal" || Boolean(staffAuth);
  const [categories, setCategories] = useState<DrinkPosCategoryRow[]>([]);
  const [products, setProducts] = useState<DrinkPosProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string | "all">("all");

  const [draftLines, setDraftLines] = useState<SaleDraftLine[]>([]);
  const [draftBusy, setDraftBusy] = useState(false);
  const [billReviewOpen, setBillReviewOpen] = useState(false);
  const [loyaltyMember, setLoyaltyMember] = useState<DrinkPosLoyaltyMemberDto | null>(null);
  const [sizePick, setSizePick] = useState<{ product: DrinkPosProductRow; quantity: number } | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DrinkPosPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(slipPrintEnabledProp === true);
  const [printSlipAfterSubmit, setPrintSlipAfterSubmit] = useState(slipPrintEnabledProp === true);
  const [shopReceipt, setShopReceipt] = useState<DrinkPosShopReceiptMeta | null>(shopReceiptProp);
  const { paper: slipPaper } = useAppSlipPaperSize(
    defaultPaperSizeProp ?? shopReceiptProp?.slipPaperSize ?? shopReceipt?.slipPaperSize,
  );

  const setMobileDraftSlot = useDrinkPosMobileDraftSlot();
  const cardTapRef = useRef<{ productId: string; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    if (typeof slipPrintEnabledProp === "boolean") {
      setSlipPrintEnabled(slipPrintEnabledProp);
      setPrintSlipAfterSubmit(slipPrintEnabledProp);
    }
  }, [slipPrintEnabledProp]);

  useEffect(() => {
    if (shopReceiptProp) setShopReceipt(shopReceiptProp);
  }, [shopReceiptProp]);

  useEffect(() => {
    if (staffAuth || shopReceiptProp) return;
    let cancelled = false;
    void fetch("/api/drink-pos/profile", { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as {
          profile?: {
            displayName?: string | null;
            logoUrl?: string | null;
            address?: string | null;
            taxId?: string | null;
            contactPhone?: string | null;
            bankName?: string | null;
            bankAccountNumber?: string | null;
            bankAccountName?: string | null;
            slipPaperSize?: string | null;
          };
        };
        if (cancelled || !r.ok || !j.profile) return;
        setShopReceipt({
          shopLabel: j.profile.displayName?.trim() || shopLabel || "ร้านเครื่องดื่ม",
          logoUrl: j.profile.logoUrl,
          address: j.profile.address,
          taxId: j.profile.taxId,
          contactPhone: j.profile.contactPhone,
          bankName: j.profile.bankName,
          bankAccountNumber: j.profile.bankAccountNumber,
          bankAccountName: j.profile.bankAccountName,
          slipPaperSize: j.profile.slipPaperSize,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [staffAuth, shopReceiptProp, shopLabel]);

  const staffQs = useMemo(() => {
    if (!staffAuth) return "";
    return new URLSearchParams({
      ownerId: staffAuth.ownerId,
      t: staffAuth.trialSessionId,
      k: staffAuth.k,
    }).toString();
  }, [staffAuth]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      if (staffAuth) {
        const res = await fetch(`/api/drink-pos/staff/menu?${staffQs}`, {
          cache: "no-store",
          headers: staffDailyUnlockHeaders("drink-pos", staffAuth.ownerId),
        });
        const j = (await res.json().catch(() => ({}))) as {
          categories?: DrinkPosCategoryRow[];
          products?: DrinkPosProductRow[];
          error?: string;
        };
        if (!res.ok) {
          setError(j.error ?? "โหลดเมนูไม่สำเร็จ");
          return;
        }
        setCategories(j.categories ?? []);
        setProducts(j.products ?? []);
        return;
      }
      const [c, p] = await Promise.all([fetchDrinkPosCategories(), fetchDrinkPosProducts()]);
      if (!c.ok) {
        setError(c.error);
        return;
      }
      if (!p.ok) {
        setError(p.error);
        return;
      }
      setCategories(c.categories);
      setProducts(p.products);
    } catch (e) {
      setError(drinkPosFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [staffAuth, staffQs]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (refreshNonce <= 0) return;
    setLoading(true);
    void reload();
  }, [refreshNonce, reload]);

  useEffect(() => {
    return () => {
      const t = cardTapRef.current;
      if (t) clearTimeout(t.timeoutId);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const list = products.filter((x) => x.isActive);
    if (filterCat === "all") return list;
    return list.filter((x) => x.categoryId === filterCat);
  }, [products, filterCat]);

  const draftTotalBaht = useMemo(() => {
    return draftLines.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0);
  }, [draftLines]);

  const draftQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of draftLines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity);
    return m;
  }, [draftLines]);

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
        { lineKey, productId: p.id, size, name: displayName, unitPriceBaht, quantity: delta },
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
      if (prev[i].quantity <= 1) return prev.filter((x) => x.lineKey !== lineKey);
      return prev.map((x, j) => (j === i ? { ...x, quantity: x.quantity - 1 } : x));
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

  const resetPayment = useCallback(() => {
    setPaymentMethod("CASH");
    setPaymentSlipUrl(null);
  }, []);

  const submitDraftBill = useCallback(async () => {
    if (draftLines.length === 0) return;
    const payTotal = draftLines.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0);
    if (drinkPosPaymentSubmitBlocked(paymentMethod, payTotal, paymentSlipUrl)) {
      setSubmitErr(
        paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน",
      );
      setBillReviewOpen(true);
      return;
    }
    setDraftBusy(true);
    setSubmitErr(null);
    try {
      const salesUrl = staffAuth ? `/api/drink-pos/staff/orders?${staffQs}` : "/api/drink-pos/sales";
      const res = await fetch(salesUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(staffAuth ? staffDailyUnlockHeaders("drink-pos", staffAuth.ownerId) : {}),
        },
        credentials: staffAuth ? "omit" : "include",
        body: JSON.stringify({
          note: null,
          memberPhone: loyaltyMember?.phone ?? null,
          paymentMethod: payTotal <= 0 ? "CASH" : paymentMethod,
          paymentSlipUrl: payTotal <= 0 || paymentMethod === "CASH" ? null : paymentSlipUrl,
          lines: draftLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            size: l.size,
          })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        sale?: {
          id: string;
          note?: string | null;
          totalBaht: number;
          paymentMethod?: string | null;
          fulfillmentStatus?: string | null;
          statusUpdatedAt?: string | null;
          createdAt: string;
          memberPhone?: string | null;
          isRewardRedemption?: boolean | null;
          lines: Array<{
            id?: string;
            productName: string;
            sizeLabel?: string | null;
            quantity: number;
            unitPriceBaht?: number | null;
            lineTotalBaht?: number | null;
          }>;
        };
      };
      if (!res.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "บันทึกขายไม่สำเร็จ");
      }
      if (printSlipAfterSubmit) {
        if (!slipPrintEnabled) {
          alertSlipPrintRequiresMonthlyPlan();
        } else if (j.sale) {
          printDrinkPosSaleReceipt(
            {
              ...j.sale,
              paymentMethod: j.sale.paymentMethod ?? paymentMethod,
            },
            {
              shopLabel:
                shopReceipt?.shopLabel?.trim() ||
                shopLabel?.trim() ||
                "ร้านเครื่องดื่ม",
              logoUrl: shopReceipt?.logoUrl,
              address: shopReceipt?.address,
              taxId: shopReceipt?.taxId,
              contactPhone: shopReceipt?.contactPhone,
              bankName: shopReceipt?.bankName,
              bankAccountNumber: shopReceipt?.bankAccountNumber,
              bankAccountName: shopReceipt?.bankAccountName,
              slipPaperSize: shopReceipt?.slipPaperSize ?? slipPaper,
            },
            { paper: slipPaper },
          );
        }
      }
      setDraftLines([]);
      setBillReviewOpen(false);
      resetPayment();
      if (loyaltyMember?.phone) {
        const lookupUrl = staffAuth
          ? `/api/drink-pos/staff/loyalty/members?${staffQs}&phone=${encodeURIComponent(loyaltyMember.phone)}`
          : `/api/drink-pos/session/loyalty/members?phone=${encodeURIComponent(loyaltyMember.phone)}`;
        const lookupRes = await fetch(lookupUrl, {
          credentials: staffAuth ? "omit" : "include",
          cache: "no-store",
          headers: staffAuth ? staffDailyUnlockHeaders("drink-pos", staffAuth.ownerId) : undefined,
        });
        const lj = (await lookupRes.json().catch(() => ({}))) as {
          member?: DrinkPosLoyaltyMemberDto | null;
        };
        if (lookupRes.ok && lj.member) setLoyaltyMember(lj.member);
      }
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setDraftBusy(false);
    }
  }, [
    draftLines,
    loyaltyMember,
    paymentMethod,
    paymentSlipUrl,
    printSlipAfterSubmit,
    resetPayment,
    shopLabel,
    shopReceipt,
    slipPaper,
    slipPrintEnabled,
    staffAuth,
    staffQs,
  ]);

  const printSlipCheckbox = (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4d47b6]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#0000BF]/35 text-[#0000bf] focus:ring-[#0000BF]/40"
        checked={printSlipAfterSubmit && slipPrintEnabled}
        onChange={(e) => {
          if (!slipPrintEnabled) {
            alertSlipPrintRequiresMonthlyPlan();
            return;
          }
          setPrintSlipAfterSubmit(e.target.checked);
        }}
        disabled={draftBusy}
      />
          {slipPrintEnabled ? "พิมพ์ใบเสร็จหลังออเดอร์" : "พิมพ์ใบเสร็จ (ต้องแพ็ก 199 ของโมดูลนี้)"}
    </label>
  );

  useLayoutEffect(() => {
    if (!enableMobileDraft || draftLines.length === 0) {
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
  }, [draftLines, draftTotalBaht, draftBusy, setMobileDraftSlot, resetPayment, enableMobileDraft]);

  useEffect(() => {
    if (draftLines.length === 0 && billReviewOpen) setBillReviewOpen(false);
  }, [draftLines.length, billReviewOpen]);

  const paymentBlocked = drinkPosPaymentSubmitBlocked(paymentMethod, draftTotalBaht, paymentSlipUrl);
  /** แดชบอร์ดเดสก์ท็อป: คอลัมน์ซ้าย/ขวาเลื่อนอิสระเมื่อเกินขอบล่าง (มือถือยังเลื่อนทั้งหน้า) */
  const dashboardDesktopSplit = !isStaffPortal;

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col gap-3 lg:gap-4",
        isStaffPortal && "h-full overflow-hidden",
        dashboardDesktopSplit && "lg:h-full lg:min-h-0 lg:overflow-hidden",
      )}
    >
      {error ? (
        <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {/* มือถือแดชบอร์ด: สมาชิกเหนือกริด (เลื่อนทั้งหน้า) — ยังไม่ปรับ UX มือถือตามคำขอ */}
      {!isStaffPortal ? (
        <div className="shrink-0 lg:hidden">
          <DrinkPosLoyaltyBar
            member={loyaltyMember}
            onMemberChange={setLoyaltyMember}
            compact
            hideMembersLink={Boolean(staffAuth)}
            staffAuth={staffAuth}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-0 flex-1 gap-3 lg:gap-4",
          isStaffPortal
            ? "flex flex-col overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:grid lg:grid-rows-1 lg:overflow-hidden"
            : "grid",
          /** แดชบอร์ดเดสก์ท็อป: กรอกความสูงที่เหลือใต้หัวโมดูล — ไม่ใช้ max-h จาก 100dvh ที่ล้นขอบล่างจอ */
          dashboardDesktopSplit && "lg:min-h-0 lg:grid-rows-1 lg:overflow-hidden",
          isStaffPortal
            ? "lg:grid-cols-[minmax(260px,22rem)_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]",
        )}
      >
        {/* พอร์ทัลพนักงานมือถือ: เบอร์โทรเลื่อนรวมกับเมนู · หัวร้านคงที่นอกนี้ */}
        {isStaffPortal ? (
          <div className="shrink-0 lg:hidden">
            <DrinkPosLoyaltyBar
              member={loyaltyMember}
              onMemberChange={setLoyaltyMember}
              compact
              hideMembersLink={Boolean(staffAuth)}
              staffAuth={staffAuth}
            />
          </div>
        ) : null}
        {/* เดสก์ท็อป — ซ้ายเลื่อนทั้งคอลัมน์เมื่อเกินขอบล่าง */}
        <aside
          className={cn(
            "hidden min-h-0 flex-col gap-3 p-4 lg:flex",
            isStaffPortal
              ? "h-full min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-white/70 bg-white/55 [-webkit-overflow-scrolling:touch]"
              : "rounded-2xl border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/75 to-[#fdf2f8]/55 shadow-sm lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain [-webkit-overflow-scrolling:touch]",
          )}
        >
          <DrinkPosLoyaltyBar
            member={loyaltyMember}
            onMemberChange={setLoyaltyMember}
            compact
            hideMembersLink={Boolean(staffAuth)}
            staffAuth={staffAuth}
          />

          <div className="flex shrink-0 flex-col rounded-xl border border-white/70 bg-white/70">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e8e6fc]/80 px-3 py-2.5">
              <p className="text-xs font-black text-[#1e1b4b]">
                รายการที่เลือก
                {draftLines.length > 0 ? (
                  <span className="ml-1.5 text-[#4d47b6]">({draftLines.length})</span>
                ) : null}
              </p>
              {draftLines.length > 0 ? (
                <DrinkPosButton
                  type="button"
                  disabled={draftBusy}
                  onClick={() => setDraftLines([])}
                  className={cn(appTemplateOutlineButtonClass, "rounded-lg px-2.5 py-1 text-[10px] font-black")}
                >
                  ล้าง
                </DrinkPosButton>
              ) : null}
            </div>

            {draftLines.length === 0 ? (
              <div className="flex items-center justify-center p-4">
                <p className="text-center text-sm font-semibold text-[#66638c]">แตะเมนูด้านขวาเพื่อเพิ่มรายการ</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2.5">
                {draftLines.map((l) => (
                  <li
                    key={l.lineKey}
                    className="rounded-xl border border-white/70 bg-white/90 px-2.5 py-2 shadow-sm ring-1 ring-inset ring-white/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#1e1b4b]">{l.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                          ฿{formatThb(l.unitPriceBaht)} / ชิ้น
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black tabular-nums text-[#4d47b6]">
                        ฿{formatThb(l.unitPriceBaht * l.quantity)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <DrinkPosButton
                          type="button"
                          className={qtyBtnClass}
                          aria-label={`ลด ${l.name}`}
                          onClick={() => decrementDraftLineQty(l.lineKey)}
                        >
                          <IconQtyMinus className="h-3.5 w-3.5" />
                        </DrinkPosButton>
                        <span className="min-w-[1.75rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                          {l.quantity}
                        </span>
                        <DrinkPosButton
                          type="button"
                          className={qtyBtnClass}
                          aria-label={`เพิ่ม ${l.name}`}
                          onClick={() => incrementDraftLineQty(l.lineKey)}
                        >
                          <IconQtyPlus className="h-3.5 w-3.5" />
                        </DrinkPosButton>
                      </div>
                      <DrinkPosButton
                        type="button"
                        className="rounded-lg px-2 py-1 text-[10px] font-black text-rose-600 hover:bg-rose-50"
                        onClick={() => removeDraftLine(l.lineKey)}
                      >
                        ลบ
                      </DrinkPosButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="shrink-0 space-y-2 border-t border-[#e8e6fc]/80 bg-white/80 p-3">
              {submitErr ? <p className="text-xs font-semibold text-rose-600">{submitErr}</p> : null}
              <DrinkPosPaymentPanel
                amountBaht={draftTotalBaht}
                method={paymentMethod}
                slipUrl={paymentSlipUrl}
                onMethodChange={setPaymentMethod}
                onSlipUrlChange={setPaymentSlipUrl}
                disabled={draftBusy}
                variant={staffAuth ? "public" : "staff"}
                ownerId={staffAuth?.ownerId}
                trialParam={staffAuth?.trialSessionId}
              />
              {printSlipCheckbox}
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ยอดรวม</p>
                  <p className="text-2xl font-black tabular-nums text-[#1e1b4b]">฿{formatThb(draftTotalBaht)}</p>
                </div>
                <DrinkPosButton
                  type="button"
                  className={cn(drinkPosCtaClass, "min-w-[7.5rem] px-4 text-sm")}
                  disabled={draftBusy || draftLines.length === 0 || paymentBlocked}
                  onClick={() => void submitDraftBill()}
                >
                  {draftBusy ? "กำลังบันทึก…" : "บันทึกบิล"}
                </DrinkPosButton>
              </div>
            </div>
          </div>
        </aside>

        {/* เมนูสินค้า — เดสก์ท็อปเลื่อนคอลัมน์ขวาอิสระเมื่อเกินขอบล่าง · มือถือแดชบอร์ดยังไม่ปรับ */}
        <section
          className={cn(
            "flex flex-col p-3 lg:p-4",
            isStaffPortal
              ? "min-h-0 shrink-0 rounded-xl border border-white/70 bg-white/55 lg:min-h-0 lg:flex-1 lg:shrink lg:overflow-hidden"
              : "min-h-0 rounded-2xl border border-[#e8e6fc]/80 bg-white/60 shadow-sm lg:h-full lg:min-h-0 lg:overflow-hidden",
          )}
        >
          <div
            className="shrink-0 overflow-x-auto overflow-y-hidden pb-2 [-webkit-overflow-scrolling:touch]"
            role="group"
            aria-label="หมวดหมู่"
          >
            <div className="flex w-max gap-2">
              <DrinkPosButton
                type="button"
                onClick={() => setFilterCat("all")}
                className={cn("shrink-0 transition", filterCat === "all" ? drinkPosChipActiveClass : drinkPosChipIdleClass)}
              >
                ทั้งหมด
              </DrinkPosButton>
              {categories.filter((c) => c.isActive !== false).map((c) => (
                <DrinkPosButton
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(c.id)}
                  aria-pressed={filterCat === c.id}
                  className={cn(
                    "shrink-0 transition",
                    filterCat === c.id ? drinkPosChipActiveClass : drinkPosChipIdleClass,
                  )}
                >
                  {c.name}
                </DrinkPosButton>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "pt-1",
              (isStaffPortal || dashboardDesktopSplit) &&
                "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[-webkit-overflow-scrolling:touch]",
            )}
          >
            {loading ? (
              <div className={cn("h-40 animate-pulse rounded-xl", drinkPosPulseWashClass)} aria-hidden />
            ) : filteredProducts.length === 0 ? (
              <AppEmptyState tone="violet" className="mt-2">
                {categories.length === 0
                  ? staffAuth
                    ? "ยังไม่มีสินค้าในร้าน — รอเจ้าของร้านเพิ่มเมนู"
                    : "ยังไม่มีสินค้า — ไปที่จัดการสินค้าเพื่อเพิ่ม"
                  : "ไม่มีสินค้าในหมวดนี้"}
              </AppEmptyState>
            ) : (
              <ul
                className={cn(
                  drinkPosProductGridClass,
                  /* สำรองให้ Tailwind สแกนเจอใน .tsx — มือถือ 3 คอลัมน์ */
                  "grid-cols-3",
                  isStaffPortal && "xl:grid-cols-7 2xl:grid-cols-9",
                )}
              >
                {filteredProducts.map((p) => {
                  const inDraftQty = draftQtyByProductId.get(p.id) ?? 0;
                  return (
                    <li key={p.id} className={cn(drinkPosProductCardClass)}>
                      <DrinkPosButton
                        type="button"
                        onClick={() => handleProductCardTap(p)}
                        className={cn(
                          "flex w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35",
                          inDraftQty > 0 && "ring-2 ring-[#0000BF]/35 ring-offset-1",
                        )}
                        aria-label={`${p.name} ราคา ${formatDrinkPosCardPrice(p)} บาท`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-[#0000BF]/08">
                          <DrinkPosRemoteImg
                            src={p.imageUrl}
                            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                            fallback={
                            <div className="flex h-full w-full items-center justify-center text-[#66638c]">
                              <svg
                                className="h-5 w-5 opacity-40 sm:h-8 sm:w-8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                aria-hidden
                              >
                                <rect x="4" y="5" width="16" height="14" rx="2" />
                                <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                                <path d="M4 17l4-4 3 3 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            }
                          />
                          {inDraftQty > 0 ? (
                            <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-1 text-[9px] font-black text-white shadow-md sm:right-1.5 sm:top-1.5 sm:h-6 sm:min-w-[1.5rem] sm:px-1.5 sm:text-[10px]">
                              ×{inDraftQty}
                            </span>
                          ) : null}
                          {p.isFeatured ? (
                            <span className="absolute left-1 top-1 rounded-full bg-amber-50/95 px-1 py-0.5 text-[7px] font-black text-amber-800 sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px]">
                              แนะนำ
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-0 p-1.5 sm:space-y-0.5 sm:p-2">
                          <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:text-xs">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-black tabular-nums text-[#4d47b6] sm:text-sm">
                            ฿{formatDrinkPosCardPrice(p)}
                          </p>
                          {drinkPosProductHasSizes(p.sizePrices) ? (
                            <p className="text-[8px] font-black uppercase tracking-wide text-[#66638c] sm:text-[9px]">
                              S / M / L
                            </p>
                          ) : null}
                        </div>
                      </DrinkPosButton>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <FormModal
        open={billReviewOpen}
        onClose={() => !draftBusy && setBillReviewOpen(false)}
        title="สรุปรายการ"
        size={staffAuth ? "full" : "lg"}
        appearance={staffAuth ? "glass" : "default"}
        glassTint="amber"
        mobileCentered
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
        {submitErr ? <p className="mb-3 text-xs font-semibold text-rose-600">{submitErr}</p> : null}
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
                        <IconQtyMinus className="h-4 w-4" />
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
                        <IconQtyPlus className="h-4 w-4" />
                      </DrinkPosButton>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black tabular-nums text-[#4d47b6]">
                        ฿{formatThb(l.unitPriceBaht * l.quantity)}
                      </p>
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
              variant={staffAuth ? "public" : "staff"}
              ownerId={staffAuth?.ownerId}
              trialParam={staffAuth?.trialSessionId}
            />
            {printSlipCheckbox}
          </div>
        )}
      </FormModal>

      <FormModal open={sizePick != null} onClose={() => setSizePick(null)} title="เลือกขนาด" size="sm">
        {sizePick ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#1e1b4b]">{sizePick.product.name}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              {sizePick.quantity > 1 ? `เพิ่ม ${sizePick.quantity} ชิ้น` : "เลือกขนาดเพื่อเพิ่มในบิล"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {drinkPosActiveSizePrices(sizePick.product.sizePrices).map((row) => (
                <DrinkPosButton
                  key={row.size}
                  type="button"
                  className={cn(
                    "flex min-h-[72px] flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/80 px-2 py-3 text-center shadow-sm transition hover:border-[#0000BF]/35 hover:bg-violet-50/70",
                  )}
                  onClick={() => {
                    addProductToDraft(sizePick.product, sizePick.quantity, row.size);
                    setSizePick(null);
                  }}
                >
                  <span className="text-base font-black text-[#1e1b4b]">{row.size}</span>
                  <span className="mt-1 text-xs font-bold text-[#4d47b6]">฿{formatThb(row.priceBaht)}</span>
                </DrinkPosButton>
              ))}
            </div>
          </div>
        ) : null}
      </FormModal>
    </div>
  );
}

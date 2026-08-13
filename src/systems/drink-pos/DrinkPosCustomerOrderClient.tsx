"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  shopQrTemplateCardClass,
  shopQrTemplateCtaButtonClass,
  shopQrTemplateHeadKickerClass,
  shopQrTemplateHeadTitleClass,
  shopQrTemplateMaxWidthClass,
  shopQrTemplateOrderPagePaddingClass,
  shopQrTemplatePageBgClass,
} from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeStable } from "@/lib/dormitory/format-display-stable";
import {
  isDrinkPosMemberPhoneReady,
  normalizeDrinkPosMemberPhone,
  type DrinkPosLoyaltyRewardDto,
} from "@/systems/drink-pos/lib/loyalty-rule";
import {
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
  drinkPosNavActiveClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { DrinkPosCustomerLoyaltyPanel } from "@/systems/drink-pos/components/DrinkPosCustomerLoyaltyPanel";
import { DrinkPosRemoteImg } from "@/systems/drink-pos/components/DrinkPosRemoteImg";
import {
  DrinkPosPaymentPanel,
  drinkPosPaymentSubmitBlocked,
} from "@/systems/drink-pos/components/DrinkPosPaymentPanel";
import type { DrinkPosPaymentMethod } from "@/systems/drink-pos/lib/payment-method";
import {
  appPublicCheckInGlassCardClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";

type MenuCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
};

type MenuProduct = {
  id: string;
  categoryId: string;
  name: string;
  priceBaht: number;
  basePriceBaht: number;
  sizePrices: DrinkPosSizePrice[] | null;
  imageUrl: string | null;
  isFeatured: boolean;
};

type CartLine = {
  key: string;
  productId: string;
  name: string;
  size: DrinkPosSizeCode | null;
  unitPriceBaht: number;
  quantity: number;
};

type MyOrder = {
  id: string;
  totalBaht: number;
  fulfillmentStatus: string;
  createdAt: string;
  isRewardRedemption?: boolean;
  lines: Array<{
    id: string;
    productName: string;
    sizeLabel: string | null;
    unitPriceBaht: number;
    quantity: number;
    lineTotalBaht: number;
  }>;
};

function phoneStorageKey(ownerId: string, trialSessionId: string) {
  return `mawell.drink-pos.loyalty-phone.${ownerId}.${trialSessionId}`;
}

function sessionStorageKey(ownerId: string, trialSessionId: string) {
  return `mawell.drink-pos.customer-session.${ownerId}.${trialSessionId}`;
}

function statusLabel(st: string): string {
  switch (st) {
    case "RECEIVED":
      return "รับออเดอร์แล้ว";
    case "MAKING":
      return "กำลังทำ";
    case "DONE":
      return "พร้อมรับ";
    case "SERVED":
      return "ส่งมอบแล้ว";
    default:
      return st;
  }
}

function statusBadgeClass(st: string): string {
  switch (st) {
    case "SERVED":
      return "bg-slate-100 text-slate-800";
    case "DONE":
      return "bg-emerald-100 text-emerald-900";
    case "MAKING":
      return "bg-amber-100 text-amber-900";
    case "RECEIVED":
      return "bg-sky-100 text-sky-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function cartKey(productId: string, size: DrinkPosSizeCode | null) {
  return size ? `${productId}:${size}` : productId;
}

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatBaht(n: number) {
  return n.toLocaleString("th-TH");
}

function DrinkProductCard({
  product,
  qty,
  compact,
  onAdd,
  onDec,
}: {
  product: MenuProduct;
  qty: number;
  compact?: boolean;
  onAdd: () => void;
  onDec: () => void;
}) {
  const selected = qty > 0;
  const priceLabel = drinkPosDisplayPriceLabel({
    priceBaht: product.basePriceBaht ?? product.priceBaht,
    sizePrices: product.sizePrices,
  });
  const hasSizes = drinkPosProductHasSizes(product.sizePrices);

  return (
    <article
      className={cn(
        "group relative flex shrink-0 snap-start flex-col overflow-hidden border transition-all duration-200",
        compact ? "w-[6.75rem] rounded-lg sm:w-[7.25rem]" : "w-full rounded-2xl",
        selected ?
          "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
        : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300",
          compact ? "h-14" : "aspect-[4/3] h-auto",
        )}
      >
        <DrinkPosRemoteImg
          src={product.imageUrl}
          className="h-full w-full object-cover"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-slate-400" aria-hidden>
              <span className="text-lg opacity-40">◆</span>
            </div>
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/15 to-transparent" />
        {product.isFeatured ?
          <span className="absolute left-0.5 top-0.5 inline-flex items-center rounded bg-amber-400/95 px-1 py-px text-[8px] font-bold text-amber-950 shadow-sm">
            แนะนำ
          </span>
        : null}
        {selected ?
          <div
            className={cn(
              "absolute right-0.5 top-0.5 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow ring-1 ring-white",
              compact ? "h-5 w-5 text-[10px] font-bold" : "h-8 w-8 text-xs font-bold",
            )}
            aria-hidden
          >
            {qty}
          </div>
        : null}
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col", compact ? "p-1.5" : "p-2.5")}>
        <h3
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-slate-900",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {product.name}
        </h3>
        <div className={cn("mt-auto flex items-end justify-between gap-0.5", compact ? "pt-1" : "pt-2")}>
          <p
            className={cn(
              "font-bold tabular-nums text-indigo-700",
              compact ? "text-[11px]" : "text-sm",
            )}
          >
            ฿{priceLabel}
          </p>
          <div
            className="flex shrink-0 items-center gap-0 rounded-full bg-slate-100 p-px shadow-md ring-1 ring-slate-200/90"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="group"
            aria-label={`จำนวน ${product.name}`}
          >
            {qty > 0 && !hasSizes ?
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center rounded-full text-indigo-800",
                  compact ? "h-6 w-6 text-sm" : "h-8 w-8 text-base",
                )}
                aria-label={`ลด ${product.name}`}
                onClick={onDec}
              >
                −
              </button>
            : null}
            {qty > 0 && !hasSizes ?
              <span
                className={cn(
                  "min-w-[1rem] text-center font-bold tabular-nums text-slate-800",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                {qty}
              </span>
            : null}
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded-full bg-indigo-600 text-white",
                compact ? "h-6 w-6 text-sm" : "h-8 w-8 text-base",
              )}
              aria-label={`เพิ่ม ${product.name}`}
              onClick={onAdd}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** แถว 1 คอลัม — แบบร้านอาหาร (MenuDishCardGrid) */
function DrinkProductRowCard({
  product,
  qty,
  onAdd,
  onDec,
}: {
  product: MenuProduct;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
}) {
  const selected = qty > 0;
  const priceLabel = drinkPosDisplayPriceLabel({
    priceBaht: product.basePriceBaht ?? product.priceBaht,
    sizePrices: product.sizePrices,
  });
  const hasSizes = drinkPosProductHasSizes(product.sizePrices);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border transition-all duration-200",
        selected ?
          "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
        : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200",
      )}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-slate-200 to-slate-300">
          <DrinkPosRemoteImg
            src={product.imageUrl}
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-slate-400" aria-hidden>
                <span className="text-sm opacity-40">◆</span>
              </div>
            }
          />
          {selected ?
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/35">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-1 ring-white/60">
                {qty}
              </div>
            </div>
          : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="min-w-0 flex-1 truncate text-xs font-semibold leading-tight text-slate-900">
              {product.name}
            </h3>
            {product.isFeatured ?
              <span className="shrink-0 rounded bg-amber-400/90 px-1 py-px text-[8px] font-bold text-amber-950">
                แนะนำ
              </span>
            : null}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            <p className="text-xs font-bold tabular-nums text-indigo-700">฿{priceLabel}</p>
            <div
              className="flex items-center gap-0 rounded-full bg-slate-100 p-px ring-1 ring-slate-200/90"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="group"
              aria-label={`จำนวน ${product.name}`}
            >
              {qty > 0 && !hasSizes ?
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-slate-200/90"
                  aria-label={`ลด ${product.name}`}
                  onClick={onDec}
                >
                  −
                </button>
              : null}
              {qty > 0 && !hasSizes ?
                <span className="min-w-[1rem] px-0.5 text-center text-[11px] font-bold tabular-nums text-slate-900">
                  {qty}
                </span>
              : null}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                aria-label={`เพิ่ม ${product.name}`}
                onClick={onAdd}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DrinkPosCustomerOrderClient({
  ownerId,
  trialSessionId: trialProp,
  variant = "standalone",
}: {
  ownerId: string;
  trialSessionId?: string;
  /** portal = ฝังในเว็บลูกค้า (ไม่มีเปลือก QR เต็มหน้า) */
  variant?: "standalone" | "portal";
}) {
  const isPortal = variant === "portal";
  const cardClass = isPortal
    ? cn(appPublicCheckInGlassCardClass, "p-4 sm:p-5")
    : shopQrTemplateCardClass;
  const [trialSessionId, setTrialSessionId] = useState(trialProp || "prod");
  const [shopName, setShopName] = useState("ร้านเครื่องดื่ม");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState<DrinkPosLoyaltyRewardDto[]>([]);
  const [infoLoyaltyBalance, setInfoLoyaltyBalance] = useState<number | null>(null);
  const [loyaltyLookupTick, setLoyaltyLookupTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [customerTab, setCustomerTab] = useState<"info" | "menu" | "orders" | "redeem">("info");
  const [customerName, setCustomerName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [customerSessionId, setCustomerSessionId] = useState("");
  const [filterCat, setFilterCat] = useState<string | "all">("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<DrinkPosPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [sizePick, setSizePick] = useState<MenuProduct | null>(null);
  const doneResetRef = useRef(false);
  const hadActiveOrdersRef = useRef(false);

  const phoneKey = useMemo(
    () => phoneStorageKey(ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );
  const sessKey = useMemo(
    () => sessionStorageKey(ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(phoneKey);
      if (saved) setMemberPhone(normalizeDrinkPosMemberPhone(saved));
      let sid = localStorage.getItem(sessKey);
      if (!sid || !/^[0-9a-f-]{36}$/i.test(sid)) {
        sid = newSessionId();
        localStorage.setItem(sessKey, sid);
      }
      setCustomerSessionId(sid);
    } catch {
      setCustomerSessionId(newSessionId());
    }
  }, [phoneKey, sessKey]);

  const clearMemberPhone = useCallback(() => {
    setMemberPhone("");
    setInfoLoyaltyBalance(null);
    try {
      localStorage.removeItem(phoneKey);
    } catch {
      /* ignore */
    }
  }, [phoneKey]);

  useEffect(() => {
    if (!loyaltyEnabled) {
      setInfoLoyaltyBalance(null);
      return;
    }
    if (!isDrinkPosMemberPhoneReady(memberPhone)) {
      setInfoLoyaltyBalance(null);
      return;
    }
    const digits = normalizeDrinkPosMemberPhone(memberPhone);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ ownerId, phone: digits });
          if (trialSessionId) params.set("t", trialSessionId);
          const res = await fetch(`/api/drink-pos/public/loyalty?${params}`, { cache: "no-store" });
          const j = (await res.json().catch(() => ({}))) as {
            member?: { points_balance?: number } | null;
            rewards?: DrinkPosLoyaltyRewardDto[];
          };
          if (!res.ok) {
            setInfoLoyaltyBalance(null);
            return;
          }
          if (Array.isArray(j.rewards) && j.rewards.length > 0) {
            setLoyaltyRewards(j.rewards);
          }
          const bal = j.member?.points_balance;
          setInfoLoyaltyBalance(typeof bal === "number" ? bal : 0);
        } catch {
          setInfoLoyaltyBalance(null);
        }
      })();
    }, 400);
    return () => window.clearTimeout(t);
  }, [loyaltyEnabled, memberPhone, ownerId, trialSessionId, loyaltyLookupTick]);

  const infoCanRedeem = useMemo(() => {
    if (infoLoyaltyBalance == null || infoLoyaltyBalance <= 0) return false;
    return loyaltyRewards.some(
      (r) => r.is_active !== false && infoLoyaltyBalance >= r.points_cost,
    );
  }, [infoLoyaltyBalance, loyaltyRewards]);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ ownerId });
      if (trialProp) qs.set("t", trialProp);
      const res = await fetch(`/api/drink-pos/public/menu?${qs}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        trialSessionId?: string;
        shop?: { displayName?: string };
        categories?: MenuCategory[];
        products?: MenuProduct[];
        loyalty?: {
          enabled?: boolean;
          rewards?: DrinkPosLoyaltyRewardDto[];
        };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "โหลดเมนูไม่สำเร็จ");
      if (j.trialSessionId) setTrialSessionId(j.trialSessionId);
      setShopName(j.shop?.displayName?.trim() || "ร้านเครื่องดื่ม");
      setCategories(Array.isArray(j.categories) ? j.categories : []);
      setProducts(Array.isArray(j.products) ? j.products : []);
      setLoyaltyEnabled(j.loyalty?.enabled === true);
      setLoyaltyRewards(Array.isArray(j.loyalty?.rewards) ? j.loyalty!.rewards! : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [ownerId, trialProp]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    if (!loyaltyEnabled && customerTab === "redeem") setCustomerTab("info");
  }, [loyaltyEnabled, customerTab]);

  const loadMyOrders = useCallback(async () => {
    if (!customerSessionId && memberPhone.length < 9) return;
    try {
      const qs = new URLSearchParams({ ownerId });
      if (trialSessionId) qs.set("t", trialSessionId);
      if (customerSessionId) qs.set("customer_session_id", customerSessionId);
      if (memberPhone.length >= 9) qs.set("phone", memberPhone);
      const res = await fetch(`/api/drink-pos/public/my-orders?${qs}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { orders?: MyOrder[] };
      if (res.ok) setMyOrders(Array.isArray(j.orders) ? j.orders : []);
    } catch {
      /* ignore */
    }
  }, [ownerId, trialSessionId, customerSessionId, memberPhone]);

  useEffect(() => {
    if (!customerSessionId) return;
    void loadMyOrders();
  }, [customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!customerSessionId) return;
    const id = window.setInterval(() => void loadMyOrders(), 12000);
    return () => window.clearInterval(id);
  }, [customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!customerSessionId) return;
    const onFocus = () => void loadMyOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [customerSessionId, loadMyOrders]);

  /** หลังส่งมอบครบ (เคยมีออเดอร์ค้าง แล้วว่าง) — เริ่มเซสชันใหม่ */
  useEffect(() => {
    if (myOrders.length > 0) {
      hadActiveOrdersRef.current = true;
      doneResetRef.current = false;
      return;
    }
    if (!hadActiveOrdersRef.current || !customerSessionId) return;
    if (doneResetRef.current) return;
    doneResetRef.current = true;
    hadActiveOrdersRef.current = false;
    const next = newSessionId();
    try {
      localStorage.setItem(sessKey, next);
    } catch {
      /* ignore */
    }
    setCustomerSessionId(next);
  }, [myOrders, customerSessionId, sessKey]);

  useEffect(() => {
    if (!reviewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [reviewOpen]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th")),
    [categories],
  );

  const featuredItems = useMemo(
    () => products.filter((p) => p.isFeatured),
    [products],
  );

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPriceBaht * l.quantity, 0),
    [cart],
  );

  const qtyForProduct = useCallback(
    (productId: string) => cart.filter((l) => l.productId === productId).reduce((s, l) => s + l.quantity, 0),
    [cart],
  );

  const customerTabs = useMemo(() => {
    const tabs: Array<{
      id: "info" | "menu" | "orders" | "redeem";
      label: string;
      badge: number | null;
    }> = [
      { id: "info", label: "ข้อมูล", badge: null },
      { id: "menu", label: "สั่งเครื่องดื่ม", badge: cartCount > 0 ? cartCount : null },
      { id: "orders", label: "ออเดอร์", badge: myOrders.length > 0 ? myOrders.length : null },
    ];
    if (loyaltyEnabled) tabs.push({ id: "redeem", label: "แลกคะแนน", badge: null });
    return tabs;
  }, [cartCount, loyaltyEnabled, myOrders.length]);

  function addToCart(product: MenuProduct, size: DrinkPosSizeCode | null) {
    const unit = drinkPosResolveUnitPrice(
      { priceBaht: product.basePriceBaht ?? product.priceBaht, sizePrices: product.sizePrices },
      size,
    );
    if (unit == null) {
      setSizePick(product);
      return;
    }
    const key = cartKey(product.id, size);
    const label = size ? `${product.name} (${size})` : product.name;
    setCart((prev) => {
      const hit = prev.find((x) => x.key === key);
      if (hit) {
        return prev.map((x) => (x.key === key ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: label,
          size,
          unitPriceBaht: unit,
          quantity: 1,
        },
      ];
    });
    setSizePick(null);
    setMsg(null);
  }

  function requestAdd(product: MenuProduct) {
    if (drinkPosProductHasSizes(product.sizePrices)) {
      setSizePick(product);
      return;
    }
    addToCart(product, null);
  }

  function bumpQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function decProduct(product: MenuProduct) {
    if (drinkPosProductHasSizes(product.sizePrices)) {
      setCustomerTab("menu");
      setReviewOpen(true);
      return;
    }
    bumpQty(cartKey(product.id, null), -1);
  }

  async function submitOrder(): Promise<boolean> {
    if (cart.length === 0) return false;
    if (drinkPosPaymentSubmitBlocked(paymentMethod, cartTotal, paymentSlipUrl)) {
      setErr(
        paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน",
      );
      return false;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const phoneDigits = normalizeDrinkPosMemberPhone(memberPhone);
      if (phoneDigits.length >= 9) {
        try {
          localStorage.setItem(phoneKey, phoneDigits);
        } catch {
          /* ignore */
        }
      }
      const payTotal = cartTotal;
      const res = await fetch("/api/drink-pos/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          trialSessionId,
          customer_name: customerName.trim() || null,
          member_phone: phoneDigits.length >= 9 ? phoneDigits : null,
          customer_session_id: customerSessionId || null,
          paymentMethod: payTotal <= 0 ? "CASH" : paymentMethod,
          paymentSlipUrl: payTotal <= 0 || paymentMethod === "CASH" ? null : paymentSlipUrl,
          lines: cart.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            size: l.size,
          })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "ส่งออเดอร์ไม่สำเร็จ");
      setCart([]);
      setPaymentMethod("CASH");
      setPaymentSlipUrl(null);
      setMsg("ส่งออเดอร์แล้ว");
      setCustomerTab("orders");
      await loadMyOrders();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ส่งออเดอร์ไม่สำเร็จ");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmSendFromReview() {
    const ok = await submitOrder();
    if (ok) setReviewOpen(false);
  }

  function productsForCategory(catId: string) {
    return products.filter((p) => p.categoryId === catId);
  }

  if (loading) {
    if (isPortal) {
      return <div className="h-40 animate-pulse rounded-[1.25rem] bg-white/40" aria-busy aria-hidden />;
    }
    return (
      <div className={cn(shopQrTemplatePageBgClass, "min-h-[100dvh] text-slate-800")}>
        <div className={cn(shopQrTemplateMaxWidthClass, shopQrTemplateOrderPagePaddingClass)}>
          <div className={cn(shopQrTemplateCardClass, "h-40 animate-pulse")} aria-hidden />
        </div>
      </div>
    );
  }

  const orderBody = (
    <>
        {!isPortal ? (
          <header>
            <p className={shopQrTemplateHeadKickerClass}>สแกน · สั่ง</p>
            <h1 className={shopQrTemplateHeadTitleClass}>{shopName || "สั่งเครื่องดื่ม"}</h1>
          </header>
        ) : null}

        {err ? <p className="mt-3 text-center text-sm font-semibold text-rose-600">{err}</p> : null}
        {msg ? <p className="mt-3 text-center text-sm font-semibold text-emerald-700">{msg}</p> : null}

        <div
          className={cn(
            "mt-4 flex gap-1 rounded-2xl p-1 shadow-sm",
            isPortal
              ? "border border-white/60 bg-white/70 ring-1 ring-inset ring-white/50"
              : "border border-indigo-100/90 bg-white/90 ring-1 ring-indigo-100/60",
          )}
          role="tablist"
          aria-label="เมนูหน้าสั่ง"
        >
          {customerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={customerTab === tab.id}
              onClick={() => {
                setCustomerTab(tab.id);
                if (tab.id === "orders") void loadMyOrders();
              }}
              className={cn(
                "relative min-h-[42px] flex-1 rounded-xl px-1.5 text-center text-[11px] font-black transition sm:px-2 sm:text-xs",
                customerTab === tab.id ?
                  cn(drinkPosNavActiveClass, "shadow-md shadow-indigo-400/25")
                : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
              )}
            >
              {tab.label}
              {tab.badge != null ?
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums sm:ml-1",
                    customerTab === tab.id ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-800",
                  )}
                >
                  {tab.badge}
                </span>
              : null}
            </button>
          ))}
        </div>

        {customerTab === "info" ?
          <div className={cn("mt-5", isPortal ? cardClass : cn("p-4", shopQrTemplateCardClass))}>
            <h2 className="mb-1 text-sm font-bold text-[#1e1b4b]">ข้อมูล</h2>
            {loyaltyEnabled ?
              <p className="mb-3 text-xs font-medium text-slate-500">
                กรอกเบอร์โทรก่อนสั่ง เพื่อสะสมคะแนนอัตโนมัติ
              </p>
            : <p className="mb-3 text-xs font-medium text-slate-500">กรอกชื่อก่อนสั่งเครื่องดื่ม</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {loyaltyEnabled ?
                <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                  เบอร์โทรสะสมคะแนน
                  <span className="relative mt-1 block">
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      name="loyalty-phone"
                      className={cn(
                        "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
                        memberPhone ? "pr-11" : "pr-3",
                      )}
                      placeholder="08xxxxxxxx"
                      value={memberPhone}
                      onChange={(e) => {
                        const digits = normalizeDrinkPosMemberPhone(e.target.value);
                        setMemberPhone(digits);
                        try {
                          if (digits.length >= 9) localStorage.setItem(phoneKey, digits);
                          else localStorage.removeItem(phoneKey);
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                    {memberPhone ?
                      <button
                        type="button"
                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        aria-label="ล้างเบอร์โทร"
                        title="ล้างเบอร์"
                        onClick={clearMemberPhone}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    : null}
                  </span>
                </label>
              : null}
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                ชื่อ
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ชื่อลูกค้า"
                />
              </label>
            </div>
            <div className="mt-4 space-y-2">
              {infoCanRedeem ?
                <button
                  type="button"
                  onClick={() => setCustomerTab("redeem")}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-indigo-800",
                  )}
                >
                  ดูรายการแลก
                  {infoLoyaltyBalance != null ?
                    <span className="tabular-nums text-indigo-600">
                      · {infoLoyaltyBalance.toLocaleString("th-TH")}
                    </span>
                  : null}
                </button>
              : null}
              <button
                type="button"
                onClick={() => setCustomerTab("menu")}
                className={cn(shopQrTemplateCtaButtonClass, "w-full min-h-[48px]")}
              >
                ไปสั่งเครื่องดื่ม
              </button>
            </div>
          </div>
        : null}

        {customerTab === "redeem" && loyaltyEnabled ?
          <div className="mt-5">
            <DrinkPosCustomerLoyaltyPanel
              ownerId={ownerId}
              trialSessionId={trialSessionId}
              phone={memberPhone}
              hidePhoneInput
              customerName={customerName}
              initialRewards={loyaltyRewards}
              onRedeemed={() => {
                setMsg("แลกคะแนนแล้ว");
                setCustomerTab("orders");
                void loadMyOrders();
                setLoyaltyLookupTick((n) => n + 1);
              }}
            />
          </div>
        : null}

        {customerTab === "orders" ?
          <section className={cn("mt-5", isPortal ? cardClass : cn("p-4", shopQrTemplateCardClass))}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-bold text-[#1e1b4b]">ออเดอร์</h2>
              <button
                type="button"
                onClick={() => void loadMyOrders()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50/60"
              >
                รีเฟรช
              </button>
            </div>
            {!customerSessionId ?
              <p className="mt-3 text-xs text-slate-500">กำลังเตรียม…</p>
            : myOrders.length === 0 ?
              <div className="mt-4 space-y-3 text-center">
                <p className="text-sm text-slate-600">ยังไม่มีออเดอร์ในรอบนี้</p>
                <button
                  type="button"
                  onClick={() => setCustomerTab("menu")}
                  className={cn(shopQrTemplateCtaButtonClass, "mx-auto min-h-[44px] px-5")}
                >
                  ไปสั่งเครื่องดื่ม
                </button>
              </div>
            : <ul className="mt-3 space-y-3">
                {myOrders.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 text-sm shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold tabular-nums text-slate-800">
                        #{o.id.slice(-6)}
                        {o.isRewardRedemption ? " · แลกคะแนน" : ""}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          statusBadgeClass(o.fulfillmentStatus),
                        )}
                      >
                        {statusLabel(o.fulfillmentStatus)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatBangkokDateTimeStable(o.createdAt)}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700">
                      {o.lines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-2">
                          <span className="min-w-0">
                            <span className="tabular-nums text-slate-500">×{l.quantity}</span>{" "}
                            {l.productName}
                            {l.sizeLabel ? ` (${l.sizeLabel})` : ""}
                          </span>
                          <span className="shrink-0 tabular-nums">฿{formatBaht(l.lineTotalBaht)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-right text-sm font-bold tabular-nums text-indigo-800">
                      รวม ฿{formatBaht(o.totalBaht)}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </section>
        : null}

        {customerTab === "menu" ?
          <>
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-slate-500">หมวดหมู่</p>
              <div
                className="-mx-4 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-5"
                role="tablist"
                aria-label="หมวดหมู่สินค้า"
              >
                <div className="flex w-max flex-nowrap gap-2 px-4 sm:px-5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterCat === "all"}
                    onClick={() => setFilterCat("all")}
                    className={cn(
                      "min-h-[40px] shrink-0 whitespace-nowrap snap-start transition",
                      filterCat === "all" ? drinkPosChipActiveClass : drinkPosChipIdleClass,
                    )}
                  >
                    ทั้งหมด
                  </button>
                  {sortedCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={filterCat === c.id}
                      onClick={() => setFilterCat(c.id)}
                      className={cn(
                        "flex min-h-[40px] shrink-0 snap-start items-center gap-2 whitespace-nowrap transition",
                        filterCat === c.id ? drinkPosChipActiveClass : drinkPosChipIdleClass,
                      )}
                    >
                      {c.imageUrl ?
                        <DrinkPosRemoteImg src={c.imageUrl} className="h-6 w-6 rounded-md object-cover" />
                      : null}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filterCat === "all" && featuredItems.length > 0 ?
              <section className="mt-5">
                <h2 className="mb-2 text-base font-bold text-slate-900">เมนูแนะนำ</h2>
                <div className="-mx-4 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:-mx-5">
                  <div className="flex w-max gap-1.5 px-4 sm:px-5">
                    {featuredItems.map((p) => (
                      <DrinkProductCard
                        key={`feat-${p.id}`}
                        product={p}
                        qty={qtyForProduct(p.id)}
                        compact
                        onAdd={() => requestAdd(p)}
                        onDec={() => decProduct(p)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            : null}

            {sortedCategories.map((c) => {
              if (filterCat !== "all" && filterCat !== c.id) return null;
              const items = productsForCategory(c.id);
              if (items.length === 0) return null;
              return (
                <section key={c.id} className="mt-7">
                  <div className="mb-2.5 flex items-center gap-2.5 border-b border-slate-200 pb-2">
                    {c.imageUrl ?
                      <DrinkPosRemoteImg
                        src={c.imageUrl}
                        className="h-9 w-9 rounded-lg border border-slate-200 object-cover sm:h-10 sm:w-10"
                      />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 sm:h-10 sm:w-10" aria-hidden>
                        ◆
                      </div>
                    }
                    <h2 className="text-base font-bold text-slate-900">{c.name}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map((p) => (
                      <DrinkProductRowCard
                        key={p.id}
                        product={p}
                        qty={qtyForProduct(p.id)}
                        onAdd={() => requestAdd(p)}
                        onDec={() => decProduct(p)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {products.length === 0 ?
              <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/70 py-10 text-center text-sm text-slate-600">
                ยังไม่มีเมนู
              </p>
            : null}
          </>
        : null}
    </>
  );

  return (
    <>
      {isPortal ? (
        <div className={cn("text-[#1e1b4b]", customerTab === "menu" && cartCount > 0 ? "pb-24" : undefined)}>
          {orderBody}
        </div>
      ) : (
        <div className={cn(shopQrTemplatePageBgClass, "min-h-[100dvh] text-slate-800")}>
          <div
            className={cn(
              shopQrTemplateMaxWidthClass,
              shopQrTemplateOrderPagePaddingClass,
              customerTab !== "menu" ? "!pb-6" : undefined,
            )}
          >
            {orderBody}
          </div>
        </div>
      )}

      {customerTab === "menu" && cartCount > 0 ?
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl",
            isPortal
              ? "border-white/50 bg-white/90 shadow-[0_-12px_40px_rgba(30,27,75,0.12)]"
              : "border-slate-200 bg-white/95 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]",
          )}
        >
          <div
            className={cn(
              "mx-auto flex items-center justify-between gap-3 px-4 py-3",
              isPortal ? "max-w-6xl sm:px-6" : "max-w-lg sm:max-w-xl",
            )}
          >
            <div>
              <p className="text-xs text-[#66638c]">ยอดรวม</p>
              <p className="text-lg font-bold tabular-nums text-[#1e1b4b]">
                ฿{formatBaht(cartTotal)}
                <span className="ml-2 text-sm font-normal text-[#66638c]">({cartCount} ชิ้น)</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className={shopQrTemplateCtaButtonClass}
            >
              ตรวจสอบรายการ
            </button>
          </div>
          <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]" aria-hidden />
        </div>
      : null}

      {reviewOpen ?
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="ปิด"
            onClick={() => setReviewOpen(false)}
          />
          <div
            className="relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drink-pos-order-review-title"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
              <h2 id="drink-pos-order-review-title" className="text-lg font-bold text-slate-900">
                สรุปรายการ
              </h2>
              <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {cart.map((line) => (
                  <li key={line.key} className="flex items-start gap-3 text-sm leading-snug text-slate-800">
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/90">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-indigo-800"
                        aria-label={`ลด ${line.name}`}
                        onClick={() => bumpQty(line.key, -1)}
                      >
                        −
                      </button>
                      <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"
                        aria-label={`เพิ่ม ${line.name}`}
                        onClick={() => bumpQty(line.key, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                    </div>
                    <span className="shrink-0 tabular-nums font-semibold text-indigo-800">
                      ฿{formatBaht(line.unitPriceBaht * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">ชื่อ</dt>
                  <dd className="max-w-[65%] text-right font-medium text-slate-800">
                    {customerName.trim() || "—"}
                  </dd>
                </div>
                {loyaltyEnabled ?
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">เบอร์โทร</dt>
                    <dd className="text-right font-medium tabular-nums text-slate-800">
                      {normalizeDrinkPosMemberPhone(memberPhone).length >= 9 ?
                        normalizeDrinkPosMemberPhone(memberPhone)
                      : "—"}
                    </dd>
                  </div>
                : null}
                <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <dt className="font-semibold text-slate-700">ยอดรวม</dt>
                  <dd className="text-lg font-bold tabular-nums text-indigo-800">
                    ฿{formatBaht(cartTotal)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <DrinkPosPaymentPanel
                  variant="public"
                  ownerId={ownerId}
                  trialParam={trialSessionId === "prod" ? null : trialSessionId}
                  amountBaht={cartTotal}
                  method={paymentMethod}
                  slipUrl={paymentSlipUrl}
                  onMethodChange={setPaymentMethod}
                  onSlipUrlChange={setPaymentSlipUrl}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                กลับ
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  cart.length === 0 ||
                  drinkPosPaymentSubmitBlocked(paymentMethod, cartTotal, paymentSlipUrl)
                }
                onClick={() => void handleConfirmSendFromReview()}
                className={cn(shopQrTemplateCtaButtonClass, "min-h-[48px] flex-[1.15] px-4 disabled:opacity-50")}
              >
                {busy ? "กำลังส่ง…" : "ยืนยันส่งออเดอร์"}
              </button>
            </div>
          </div>
        </div>
      : null}

      {sizePick ?
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className={cn(shopQrTemplateCardClass, "w-full max-w-sm space-y-3 p-4")}>
            <h3 className="text-sm font-black text-slate-900">{sizePick.name}</h3>
            <div className="flex flex-wrap gap-2">
              {drinkPosActiveSizePrices(sizePick.sizePrices).map((s) => (
                <button
                  key={s.size}
                  type="button"
                  className={cn(drinkPosChipIdleClass, "min-h-[40px]")}
                  onClick={() => addToCart(sizePick, s.size)}
                >
                  {s.size} · ฿{s.priceBaht}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
              onClick={() => setSizePick(null)}
            >
              ปิด
            </button>
          </div>
        </div>
      : null}
    </>
  );
}

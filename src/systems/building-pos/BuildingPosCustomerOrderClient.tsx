"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  shopQrTemplateCardClass,
  shopQrTemplateCtaButtonClass,
  shopQrTemplateHeadKickerClass,
  shopQrTemplateHeadSubtitleClass,
  shopQrTemplateHeadTitleClass,
  shopQrTemplateMaxWidthClass,
  shopQrTemplateOrderPagePaddingClass,
  shopQrTemplatePageBgClass,
} from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeStable, formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import {
  buildingPosCustomerSessionStorageKey,
  isCustomerOrderSessionUuid,
} from "@/lib/building-pos/customer-order-session";
import {
  createBuildingPosPublicApiRepository,
  type PosCategory,
  type PosMenuItem,
  type PosOrder,
  type PosOrderItem,
} from "@/systems/building-pos/building-pos-service";

function buildingPosCustomerStatusLabel(st: PosOrder["status"]): string {
  switch (st) {
    case "NEW":
      return "รับออเดอร์แล้ว";
    case "PREPARING":
      return "กำลังทำ";
    case "SERVED":
      return "นำเสิร์ฟแล้ว";
    case "PAID":
      return "ชำระเงินแล้ว";
    default:
      return st;
  }
}

function sortByFeaturedThenSold(a: PosMenuItem, b: PosMenuItem) {
  const ff = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  if (ff !== 0) return ff;
  const ds = (b.sold_qty ?? 0) - (a.sold_qty ?? 0);
  if (ds !== 0) return ds;
  return a.id - b.id;
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l1.4 5.1L18 9l-5.6 1.9L12 16l-1.4-5.1L5 9l5.6-1.9L12 2z" />
    </svg>
  );
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 23c4.97 0 8-3.25 8-7.5 0-3.1-1.75-5.63-4.5-8.5-.5 2.5-2 4.12-3.5 5.5.5-2.75-.25-5.63-2.5-8C6.5 5.87 4 9.12 4 13.5 4 17.75 7.03 23 12 23z" />
    </svg>
  );
}

function MenuDishCard({
  item,
  qty,
  onAdd,
  onDec,
  compact,
  showHotBadge,
  useTemplate,
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  compact?: boolean;
  showHotBadge?: boolean;
  useTemplate: boolean;
}) {
  const selected = qty > 0;
  const imgH = compact ? "h-28" : "h-36";

  return (
    <article
      className={cn(
        "group relative flex w-[min(100%,220px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border transition-all duration-200",
        useTemplate ?
          selected ?
            "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md"
        : selected ?
          "border-emerald-400/70 bg-emerald-950/20 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
        : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]",
      )}
    >
      <div
        className={cn(
          `relative ${imgH} w-full shrink-0 overflow-hidden bg-gradient-to-br`,
          useTemplate ? "from-slate-200 to-slate-300" : "from-slate-700 to-slate-900",
        )}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className={cn("flex h-full w-full items-center justify-center", useTemplate ? "text-slate-400" : "text-slate-500")}>
            <IconSparkles className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent",
            useTemplate ? "from-slate-900/55 via-slate-900/15" : "from-slate-950/90 via-slate-950/20",
          )}
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {item.is_featured ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
              <IconSparkles className="h-3 w-3" />
              แนะนำ
            </span>
          ) : null}
          {showHotBadge ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <IconFlame className="h-3 w-3" />
              ขายดี
            </span>
          ) : null}
        </div>
        {selected ? (
          <div
            className={cn(
              "absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-2",
              useTemplate ? "bg-indigo-600 ring-white" : "bg-emerald-500 ring-slate-950",
            )}
            aria-hidden
          >
            <IconCheck className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h3
          className={cn(
            "line-clamp-2 text-sm font-semibold leading-snug",
            useTemplate ? "text-slate-900" : "text-white",
          )}
        >
          {item.name}
        </h3>
        {item.description ? (
          <p
            className={cn(
              "mt-1 line-clamp-2 text-[11px] leading-relaxed",
              useTemplate ? "text-slate-600" : "text-slate-400",
            )}
          >
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p
            className={cn(
              "text-base font-bold tabular-nums",
              useTemplate ? "text-indigo-700" : "text-emerald-400",
            )}
          >
            ฿{formatDormAmountStable(item.price)}
          </p>
          <div
            className={cn(
              "flex shrink-0 items-center gap-0 rounded-full p-0.5 shadow-lg ring-1",
              useTemplate ?
                "bg-slate-100 ring-slate-200/90"
              : "bg-slate-950/90 ring-white/15",
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="group"
            aria-label={`จำนวน ${item.name}`}
          >
            {selected ? (
              <button
                type="button"
                onClick={onDec}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition",
                  useTemplate ?
                    "text-slate-700 hover:bg-slate-200/90"
                  : "text-white hover:bg-white/10",
                )}
                aria-label="ลดจำนวน"
              >
                <IconMinus className="h-4 w-4" />
              </button>
            ) : null}
            {selected ? (
              <span
                className={cn(
                  "min-w-[1.5rem] px-1 text-center text-sm font-bold tabular-nums",
                  useTemplate ? "text-slate-900" : "text-white",
                )}
              >
                {qty}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-white transition",
                useTemplate ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-500 hover:bg-emerald-400",
              )}
              aria-label={selected ? "เพิ่มจำนวน" : "เพิ่มลงตะกร้า"}
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MenuDishCardGrid({
  item,
  qty,
  onAdd,
  onDec,
  showHotBadge,
  useTemplate,
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  showHotBadge?: boolean;
  useTemplate: boolean;
}) {
  const selected = qty > 0;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-200",
        useTemplate ?
          selected ?
            "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200"
        : selected ?
          "border-emerald-400/70 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
        : "border-white/10 bg-white/[0.06] hover:border-white/20",
      )}
    >
      <div className="flex gap-3 p-3 sm:gap-4">
        <div
          className={cn(
            "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:h-28 sm:w-28",
            useTemplate ? "from-slate-200 to-slate-300" : "from-slate-700 to-slate-900",
          )}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center", useTemplate ? "text-slate-400" : "text-slate-500")}>
              <IconSparkles className="h-8 w-8 opacity-40" />
            </div>
          )}
          {selected ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center backdrop-blur-[2px]",
                useTemplate ? "bg-indigo-600/30" : "bg-emerald-600/35",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg ring-2",
                  useTemplate ? "bg-indigo-600 ring-white/50" : "bg-emerald-500 ring-white/30",
                )}
              >
                <IconCheck className="h-5 w-5" />
              </div>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {item.is_featured ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                <IconSparkles className="h-3 w-3" />
                แนะนำ
              </span>
            ) : null}
            {showHotBadge ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                <IconFlame className="h-3 w-3" />
                ขายดี
              </span>
            ) : null}
          </div>
          <h3
            className={cn(
              "mt-1 text-sm font-semibold leading-snug sm:text-base",
              useTemplate ? "text-slate-900" : "text-white",
            )}
          >
            {item.name}
          </h3>
          {item.description ? (
            <p className={cn("mt-0.5 line-clamp-2 text-xs", useTemplate ? "text-slate-600" : "text-slate-400")}>
              {item.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                useTemplate ? "text-indigo-700" : "text-emerald-400",
              )}
            >
              ฿{formatDormAmountStable(item.price)}
            </p>
            <div
              className={cn(
                "flex items-center gap-0 rounded-full p-0.5 ring-1",
                useTemplate ? "bg-slate-100 ring-slate-200/90" : "bg-slate-950/90 ring-white/15",
              )}
            >
              {selected ? (
                <button
                  type="button"
                  onClick={onDec}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    useTemplate ? "text-slate-700 hover:bg-slate-200/90" : "text-white hover:bg-white/10",
                  )}
                  aria-label="ลดจำนวน"
                >
                  <IconMinus className="h-4 w-4" />
                </button>
              ) : null}
              {selected ? (
                <span
                  className={cn(
                    "min-w-[1.5rem] px-1 text-center text-sm font-bold tabular-nums",
                    useTemplate ? "text-slate-900" : "text-white",
                  )}
                >
                  {qty}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onAdd}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-white",
                  useTemplate ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-500 hover:bg-emerald-400",
                )}
                aria-label={selected ? "เพิ่มจำนวน" : "เพิ่มลงตะกร้า"}
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BuildingPosCustomerOrderClient({
  ownerId,
  trialSessionId,
  initialTableNo,
  variant = "customer",
  orderNoteTag,
  onOrderSuccess,
}: {
  ownerId: string;
  trialSessionId?: string;
  initialTableNo?: string;
  /** staff = หัวข้อ/หมายเหตุออเดอร์สำหรับพนักงานเสิร์ฟ */
  variant?: "customer" | "staff";
  /** บันทึกใน note ออเดอร์ (เช่น "พนักงานเสิร์ฟ") — ว่างกับลูกค้าใช้ข้อความมาตรฐานจาก API */
  orderNoteTag?: string;
  onOrderSuccess?: () => void;
}) {
  const repo = useMemo(() => createBuildingPosPublicApiRepository(ownerId, trialSessionId), [ownerId, trialSessionId]);

  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, PosOrderItem>>({});
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  /** ลูกค้า: เปิดโมดัลสรุปก่อนยืนยันส่ง */
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<PosOrder[]>([]);
  const [customerSessionId, setCustomerSessionId] = useState("");
  const paidResetRef = useRef(false);

  const isCustomer = variant === "customer";
  const customerReviewsBeforeSend = isCustomer;

  const sessionStorageKey = useMemo(
    () => buildingPosCustomerSessionStorageKey(ownerId, trialSessionId ?? "prod", tableNo),
    [ownerId, trialSessionId, tableNo],
  );

  useEffect(() => {
    void (async () => {
      const [c, m] = await Promise.all([repo.listCategories(), repo.listMenuItems()]);
      setCategories(c.filter((x) => x.is_active));
      setMenuItems(m.filter((x) => x.is_active));
    })();
  }, [repo]);

  useEffect(() => {
    const t = initialTableNo?.trim();
    if (t) setTableNo(t);
  }, [initialTableNo]);

  useEffect(() => {
    if (!isCustomer) return;
    if (typeof window === "undefined") return;
    let id = localStorage.getItem(sessionStorageKey);
    if (!id || !isCustomerOrderSessionUuid(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(sessionStorageKey, id);
    }
    setCustomerSessionId(id);
  }, [isCustomer, sessionStorageKey]);

  const loadMyOrders = useCallback(async () => {
    if (!isCustomer || !customerSessionId) return;
    try {
      const list = await repo.listMyOrders(tableNo, customerSessionId);
      setMyOrders(list);
    } catch {
      /* ignore */
    }
  }, [isCustomer, customerSessionId, repo, tableNo]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    void loadMyOrders();
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    const id = window.setInterval(() => void loadMyOrders(), 12000);
    return () => window.clearInterval(id);
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    const onFocus = () => void loadMyOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || myOrders.length === 0) {
      if (myOrders.length === 0) paidResetRef.current = false;
      return;
    }
    if (!myOrders.every((o) => o.status === "PAID")) {
      paidResetRef.current = false;
      return;
    }
    if (paidResetRef.current) return;
    paidResetRef.current = true;
    const next = crypto.randomUUID();
    localStorage.setItem(sessionStorageKey, next);
    setCustomerSessionId(next);
    setMyOrders([]);
    setMsg("โต๊ะนี้ชำระเงินครบแล้ว — สั่งรอบใหม่ได้");
  }, [isCustomer, myOrders, sessionStorageKey]);

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

  const addItem = useCallback((item: PosMenuItem) => {
    setCart((prev) => {
      const ex = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          qty: ex ? ex.qty + 1 : 1,
          note: ex?.note ?? "",
        },
      };
    });
  }, []);

  const decItem = useCallback((item: PosMenuItem) => {
    setCart((prev) => {
      const ex = prev[item.id];
      if (!ex) return prev;
      if (ex.qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { ...ex, qty: ex.qty - 1 },
      };
    });
  }, []);

  const cartList = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]);
  const cartTotal = useMemo(() => cartList.reduce((s, x) => s + x.qty * x.price, 0), [cartList]);
  const cartCount = useMemo(() => cartList.reduce((s, x) => s + x.qty, 0), [cartList]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [categories],
  );

  const bestsellerItems = useMemo(() => {
    return [...menuItems]
      .filter((m) => (m.sold_qty ?? 0) > 0)
      .sort((a, b) => (b.sold_qty ?? 0) - (a.sold_qty ?? 0) || sortByFeaturedThenSold(a, b))
      .slice(0, 10);
  }, [menuItems]);

  const topHotIds = useMemo(() => new Set(bestsellerItems.slice(0, 3).map((m) => m.id)), [bestsellerItems]);

  const featuredItems = useMemo(() => {
    return [...menuItems].filter((m) => m.is_featured).sort(sortByFeaturedThenSold);
  }, [menuItems]);

  function itemsForCategory(catId: number) {
    return [...menuItems].filter((m) => m.category_id === catId).sort(sortByFeaturedThenSold);
  }

  async function submitOrder(): Promise<boolean> {
    const items = cartList;
    if (items.length === 0) return false;
    let sessionForOrder: string | undefined;
    if (isCustomer) {
      let sid = customerSessionId;
      if (typeof window !== "undefined") {
        const fromLs = localStorage.getItem(sessionStorageKey);
        if (fromLs && isCustomerOrderSessionUuid(fromLs)) sid = fromLs;
      }
      if (!sid || !isCustomerOrderSessionUuid(sid)) {
        sid = crypto.randomUUID();
        if (typeof window !== "undefined") localStorage.setItem(sessionStorageKey, sid);
      }
      setCustomerSessionId(sid);
      sessionForOrder = sid;
    }
    try {
      await repo.createOrder(
        {
          customer_name: customerName.trim(),
          table_no: tableNo.trim(),
          status: "NEW",
          items,
          total_amount: 0,
          note: orderNoteTag?.trim() ?? "",
        },
        sessionForOrder ? { customerSessionId: sessionForOrder } : undefined,
      );
      setCart({});
      setMsg("ส่งออเดอร์เรียบร้อยแล้ว");
      onOrderSuccess?.();
      if (isCustomer && sessionForOrder) {
        const list = await repo.listMyOrders(tableNo, sessionForOrder);
        setMyOrders(list);
      }
      return true;
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "ส่งออเดอร์ไม่สำเร็จ");
      return false;
    }
  }

  const getQty = (id: number) => cart[id]?.qty ?? 0;
  /** ลูกค้าและพนักงานเสิร์ฟใช้โทนเดียวกับโปสเตอร์ QR (พื้นอ่อน) */
  const useTemplate = true;

  async function handleConfirmSendFromReview() {
    setSubmitting(true);
    try {
      const ok = await submitOrder();
      if (ok) setReviewOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "min-h-[100dvh]",
        useTemplate ?
          cn(shopQrTemplatePageBgClass, "text-slate-800")
        : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100",
      )}
    >
      <div className={cn(shopQrTemplateMaxWidthClass, shopQrTemplateOrderPagePaddingClass)}>
        <header>
          <p className={cn(useTemplate ? shopQrTemplateHeadKickerClass : "text-center text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-400/90")}>
            {variant === "staff" ? "พนักงานเสิร์ฟ" : "สแกน · สั่ง"}
          </p>
          <h1
            className={cn(
              useTemplate ? shopQrTemplateHeadTitleClass : "mt-2 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl",
            )}
          >
            {variant === "staff" ? "สั่งอาหารแทนลูกค้า" : "สั่งอาหาร"}
          </h1>
          <p
            className={cn(
              useTemplate ? shopQrTemplateHeadSubtitleClass : "mt-2 text-center text-sm text-slate-400",
            )}
          >
            {variant === "staff" ?
              "ระบุโต๊ะ แล้วส่งออเดอร์เพิ่มเหมือนลูกค้าสั่งผ่าน QR"
            : "เลือกเมนู ระบุโต๊ะ แล้วส่งเข้าครัว"}
          </p>
        </header>

        <div
          className={cn(
            "mt-6 p-4",
            useTemplate ? shopQrTemplateCardClass : "rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl backdrop-blur-md",
          )}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={cn("block text-xs font-medium", useTemplate ? "text-slate-600" : "text-slate-400")}
            >
              ชื่อ (ไม่บังคับ)
              <input
                className={cn(
                  "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                  useTemplate ?
                    "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-500/25"
                  : "border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40",
                )}
                placeholder="ชื่อลูกค้า"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label
              className={cn("block text-xs font-medium", useTemplate ? "text-slate-600" : "text-slate-400")}
            >
              โต๊ะ
              <input
                className={cn(
                  "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                  useTemplate ?
                    "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-500/25"
                  : "border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40",
                )}
                placeholder="เลขโต๊ะ"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
              />
            </label>
          </div>
        </div>

        {isCustomer ?
          <section className={cn("mt-5 p-4", shopQrTemplateCardClass)}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">ออเดอร์ของฉัน</h2>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  โต๊ะ {tableNo.trim() || "—"} · เมื่อรายการในรอบนี้ชำระเงินครบ ระบบจะเริ่มรอบใหม่ให้อัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadMyOrders()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50/60"
              >
                รีเฟรช
              </button>
            </div>
            {!customerSessionId ?
              <p className="mt-3 text-xs text-slate-500">กำลังเตรียมเซสชัน…</p>
            : myOrders.length === 0 ?
              <p className="mt-3 text-sm text-slate-600">ยังไม่มีออเดอร์ในรอบนี้</p>
            : <ul className="mt-3 space-y-3">
                {myOrders.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 text-sm shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold tabular-nums text-slate-800">#{o.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          o.status === "PAID" ? "bg-emerald-100 text-emerald-900"
                          : o.status === "SERVED" ? "bg-sky-100 text-sky-900"
                          : o.status === "PREPARING" ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-800",
                        )}
                      >
                        {buildingPosCustomerStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatBangkokDateTimeStable(o.created_at)}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700">
                      {o.items.map((it, idx) => (
                        <li key={`${o.id}-${it.menu_item_id}-${idx}`} className="flex justify-between gap-2">
                          <span className="min-w-0">
                            <span className="tabular-nums text-slate-500">×{it.qty}</span> {it.name}
                          </span>
                          <span className="shrink-0 tabular-nums">฿{formatDormAmountStable(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-right text-sm font-bold tabular-nums text-indigo-800">
                      รวม ฿{formatDormAmountStable(o.total_amount)}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </section>
        : null}

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-slate-500">หมวดหมู่</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            <button
              type="button"
              onClick={() => setFilterCat("all")}
              className={cn(
                "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition",
                filterCat === "all" ?
                  useTemplate ?
                    "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : useTemplate ?
                  "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200"
                : "bg-white/10 text-slate-300 hover:bg-white/15",
              )}
            >
              ทั้งหมด
            </button>
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCat(c.id)}
                className={cn(
                  "flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  filterCat === c.id ?
                    useTemplate ?
                      "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : useTemplate ?
                    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200"
                  : "bg-white/10 text-slate-300 hover:bg-white/15",
                )}
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-6 w-6 rounded-md object-cover" loading="lazy" />
                ) : null}
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {filterCat === "all" && featuredItems.length > 0 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <IconSparkles className={cn("h-5 w-5", useTemplate ? "text-amber-500" : "text-amber-400")} />
              <h2 className={cn("text-lg font-bold", useTemplate ? "text-slate-900" : "text-white")}>เมนูแนะนำ</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
              {featuredItems.map((m) => (
                <MenuDishCard
                  key={`feat-${m.id}`}
                  item={m}
                  qty={getQty(m.id)}
                  onAdd={() => addItem(m)}
                  onDec={() => decItem(m)}
                  compact
                  showHotBadge={topHotIds.has(m.id)}
                  useTemplate={useTemplate}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filterCat === "all" && bestsellerItems.length > 0 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <IconFlame className={cn("h-5 w-5", useTemplate ? "text-rose-500" : "text-rose-400")} />
              <h2 className={cn("text-lg font-bold", useTemplate ? "text-slate-900" : "text-white")}>ขายดี</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  useTemplate ? "bg-slate-200/90 text-slate-600" : "bg-white/10 text-slate-400",
                )}
              >
                จากยอดสั่งจริง
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
              {bestsellerItems.map((m) => (
                <MenuDishCard
                  key={`hot-${m.id}`}
                  item={m}
                  qty={getQty(m.id)}
                  onAdd={() => addItem(m)}
                  onDec={() => decItem(m)}
                  compact
                  showHotBadge={topHotIds.has(m.id)}
                  useTemplate={useTemplate}
                />
              ))}
            </div>
          </section>
        ) : null}

        {sortedCategories.map((c) => {
          if (filterCat !== "all" && filterCat !== c.id) return null;
          const items = itemsForCategory(c.id);
          if (items.length === 0) return null;
          return (
            <section key={c.id} className="mt-10">
              <div
                className={cn(
                  "mb-4 flex items-center gap-3 border-b pb-3",
                  useTemplate ? "border-slate-200" : "border-white/10",
                )}
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt=""
                    className={cn(
                      "h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14",
                      useTemplate ? "border border-slate-200" : "border border-white/10",
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14",
                      useTemplate ? "bg-slate-100 text-slate-400" : "bg-white/10 text-slate-500",
                    )}
                  >
                    <IconSparkles className="h-6 w-6 opacity-50" />
                  </div>
                )}
                <div>
                  <h2 className={cn("text-lg font-bold", useTemplate ? "text-slate-900" : "text-white")}>{c.name}</h2>
                  <p className="text-xs text-slate-500">{items.length} รายการ</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {items.map((m) => (
                  <MenuDishCardGrid
                    key={m.id}
                    item={m}
                    qty={getQty(m.id)}
                    onAdd={() => addItem(m)}
                    onDec={() => decItem(m)}
                    showHotBadge={topHotIds.has(m.id)}
                    useTemplate={useTemplate}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {msg ? (
          <p
            className={cn(
              "mt-6 rounded-2xl border px-4 py-3 text-center text-sm",
              useTemplate ?
                "border-indigo-200 bg-indigo-50 text-indigo-900"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
            )}
          >
            {msg}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 backdrop-blur-lg sm:px-6",
          useTemplate ?
            "border-slate-200 bg-white/95 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]"
          : "border-white/10 bg-slate-950/95 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 sm:max-w-xl">
          <div>
            <p className="text-xs text-slate-500">ยอดรวม</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                useTemplate ? "text-slate-900" : "text-white",
              )}
            >
              ฿{formatDormAmountStable(cartTotal)}
              {cartCount > 0 ? (
                <span className="ml-2 text-sm font-normal text-slate-500">({cartCount} ชิ้น)</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            disabled={cartList.length === 0}
            onClick={() => {
              if (customerReviewsBeforeSend) setReviewOpen(true);
              else void submitOrder();
            }}
            className={cn(
              useTemplate ?
                shopQrTemplateCtaButtonClass
              : "min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition enabled:hover:from-emerald-400 enabled:hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {customerReviewsBeforeSend ? "ตรวจสอบรายการ" : "ส่งออเดอร์"}
          </button>
        </div>
        <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]" aria-hidden />
      </div>

      {customerReviewsBeforeSend && reviewOpen ?
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="ปิด"
            onClick={() => setReviewOpen(false)}
          />
          <div
            className="relative z-10 flex max-h-[min(88dvh,640px)] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-order-review-title"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
              <h2 id="pos-order-review-title" className="text-lg font-bold text-slate-900">
                สรุปรายการก่อนส่ง
              </h2>
              <p className="mt-1 text-xs text-slate-500">ตรวจสอบเมนูและโต๊ะแล้วกดยืนยัน</p>

              <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {cartList.map((line) => (
                  <li
                    key={line.menu_item_id}
                    className="flex gap-3 text-sm leading-snug text-slate-800"
                  >
                    <span className="min-w-[2rem] tabular-nums text-slate-500">×{line.qty}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                      {line.note?.trim() ?
                        <p className="mt-0.5 text-xs text-slate-500">หมายเหตุ: {line.note.trim()}</p>
                      : null}
                    </div>
                    <span className="shrink-0 tabular-nums font-semibold text-indigo-800">
                      ฿{formatDormAmountStable(line.price * line.qty)}
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
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">โต๊ะ</dt>
                  <dd className="text-right font-medium tabular-nums text-slate-800">
                    {tableNo.trim() || <span className="text-amber-700">ยังไม่ระบุ</span>}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <dt className="font-semibold text-slate-700">ยอดรวม</dt>
                  <dd className="text-lg font-bold tabular-nums text-indigo-800">฿{formatDormAmountStable(cartTotal)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                แก้ไข
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmSendFromReview()}
                className={cn(shopQrTemplateCtaButtonClass, "min-h-[48px] flex-[1.15] px-4")}
              >
                {submitting ? "กำลังส่ง…" : "ยืนยันส่งออเดอร์"}
              </button>
            </div>
            <div className="h-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 bg-white sm:h-2" aria-hidden />
          </div>
        </div>
      : null}
    </div>
  );
}

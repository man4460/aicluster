"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBuildingPosPublicApiRepository,
  type PosCategory,
  type PosMenuItem,
  type PosOrderItem,
} from "@/systems/building-pos/building-pos-service";

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
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  compact?: boolean;
  showHotBadge?: boolean;
}) {
  const selected = qty > 0;
  const imgH = compact ? "h-28" : "h-36";

  return (
    <article
      className={`group relative flex w-[min(100%,220px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-emerald-400/70 bg-emerald-950/20 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]"
      }`}
    >
      <div className={`relative ${imgH} w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900`}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            <IconSparkles className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
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
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-2 ring-slate-950"
            aria-hidden
          >
            <IconCheck className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.name}</h3>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{item.description}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-base font-bold tabular-nums text-emerald-400">฿{item.price.toLocaleString()}</p>
          <div
            className="flex shrink-0 items-center gap-0 rounded-full bg-slate-950/90 p-0.5 shadow-lg ring-1 ring-white/15"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="group"
            aria-label={`จำนวน ${item.name}`}
          >
            {selected ? (
              <button
                type="button"
                onClick={onDec}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                aria-label="ลดจำนวน"
              >
                <IconMinus className="h-4 w-4" />
              </button>
            ) : null}
            {selected ? (
              <span className="min-w-[1.5rem] px-1 text-center text-sm font-bold tabular-nums text-white">{qty}</span>
            ) : null}
            <button
              type="button"
              onClick={onAdd}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400"
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
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  showHotBadge?: boolean;
}) {
  const selected = qty > 0;
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-emerald-400/70 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/20"
      }`}
    >
      <div className="flex gap-3 p-3 sm:gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 sm:h-28 sm:w-28">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <IconSparkles className="h-8 w-8 opacity-40" />
            </div>
          )}
          {selected ? (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/35 backdrop-blur-[2px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-2 ring-white/30">
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
          <h3 className="mt-1 text-sm font-semibold leading-snug text-white sm:text-base">{item.name}</h3>
          {item.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{item.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold tabular-nums text-emerald-400">฿{item.price.toLocaleString()}</p>
            <div className="flex items-center gap-0 rounded-full bg-slate-950/90 p-0.5 ring-1 ring-white/15">
              {selected ? (
                <button
                  type="button"
                  onClick={onDec}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
                  aria-label="ลดจำนวน"
                >
                  <IconMinus className="h-4 w-4" />
                </button>
              ) : null}
              {selected ? (
                <span className="min-w-[1.5rem] px-1 text-center text-sm font-bold tabular-nums text-white">{qty}</span>
              ) : null}
              <button
                type="button"
                onClick={onAdd}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
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
}: {
  ownerId: string;
  trialSessionId?: string;
  initialTableNo?: string;
}) {
  const repo = useMemo(() => createBuildingPosPublicApiRepository(ownerId, trialSessionId), [ownerId, trialSessionId]);

  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, PosOrderItem>>({});
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<number | "all">("all");

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

  async function submitOrder() {
    const items = cartList;
    if (items.length === 0) return;
    await repo.createOrder({
      customer_name: customerName.trim(),
      table_no: tableNo.trim(),
      status: "NEW",
      items,
      total_amount: 0,
      note: "",
    });
    setCart({});
    setMsg("ส่งออเดอร์เรียบร้อยแล้ว");
  }

  const getQty = (id: number) => cart[id]?.qty ?? 0;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 pb-32 pt-6 sm:max-w-xl sm:px-5 sm:pb-36 sm:pt-8">
        <header className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-400/90">สแกน · สั่ง</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">สั่งอาหาร</h1>
          <p className="mt-2 text-sm text-slate-400">เลือกเมนู ระบุโต๊ะ แล้วส่งเข้าครัว</p>
        </header>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-400">
              ชื่อ (ไม่บังคับ)
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                placeholder="ชื่อลูกค้า"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-slate-400">
              โต๊ะ
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                placeholder="เลขโต๊ะ"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-slate-500">หมวดหมู่</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            <button
              type="button"
              onClick={() => setFilterCat("all")}
              className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition ${
                filterCat === "all"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-white/10 text-slate-300 hover:bg-white/15"
              }`}
            >
              ทั้งหมด
            </button>
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCat(c.id)}
                className={`flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filterCat === c.id
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
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
              <IconSparkles className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">เมนูแนะนำ</h2>
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
                />
              ))}
            </div>
          </section>
        ) : null}

        {filterCat === "all" && bestsellerItems.length > 0 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <IconFlame className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-bold text-white">ขายดี</h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">จากยอดสั่งจริง</span>
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
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt=""
                    className="h-12 w-12 rounded-xl border border-white/10 object-cover sm:h-14 sm:w-14"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-slate-500 sm:h-14 sm:w-14">
                    <IconSparkles className="h-6 w-6 opacity-50" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{c.name}</h2>
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
                  />
                ))}
              </div>
            </section>
          );
        })}

        {msg ? (
          <p className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
            {msg}
          </p>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] backdrop-blur-lg sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 sm:max-w-xl">
          <div>
            <p className="text-xs text-slate-500">ยอดรวม</p>
            <p className="text-lg font-bold tabular-nums text-white">
              ฿{cartTotal.toLocaleString()}
              {cartCount > 0 ? (
                <span className="ml-2 text-sm font-normal text-slate-400">({cartCount} ชิ้น)</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            disabled={cartList.length === 0}
            onClick={() => void submitOrder()}
            className="min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition enabled:hover:from-emerald-400 enabled:hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ส่งออเดอร์
          </button>
        </div>
        <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]" aria-hidden />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IconCart, IconSearch } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import { EcommerceProductCard } from "@/systems/ecommerce-store/storefront/EcommerceProductCard";
import { useEcommerceCart } from "@/systems/ecommerce-store/storefront/useEcommerceCart";

export const ECOMMERCE_CATEGORY_ALL = "__all__" as const;
export const ECOMMERCE_CATEGORY_NONE = "__none__" as const;
export const ECOMMERCE_FILTER_RECOMMENDED = "__recommended__" as const;
export const ECOMMERCE_FILTER_BESTSELLER = "__bestseller__" as const;

type Category = { id: string; name: string };

export type StorefrontProductItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  priceBaht: string | number;
  stockBalance: number;
  categoryId: string | null;
  categoryName: string | null;
  isRecommended: boolean;
  isBestseller: boolean;
};

type StorePayload = {
  store: { id: string; storeName: string; logoUrl: string | null; description: string | null };
  categories: Category[];
  products: StorefrontProductItem[];
  salePageEnabled?: boolean;
  featuredProductId?: string | null;
};

export function EcommerceStorefrontClient({ data }: { data: StorePayload }) {
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ECOMMERCE_CATEGORY_ALL);
  const cart = useEcommerceCart(data.store.id);

  const filtered = useMemo(() => {
    let list = data.products;
    if (categoryFilter === ECOMMERCE_CATEGORY_NONE) {
      list = list.filter((p) => !p.categoryId);
    } else if (categoryFilter === ECOMMERCE_FILTER_RECOMMENDED) {
      list = list.filter((p) => p.isRecommended);
    } else if (categoryFilter === ECOMMERCE_FILTER_BESTSELLER) {
      list = list.filter((p) => p.isBestseller);
    } else if (categoryFilter !== ECOMMERCE_CATEGORY_ALL) {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.categoryName?.toLowerCase().includes(needle) ?? false),
    );
  }, [data.products, q, categoryFilter]);

  const hasUncategorized = useMemo(
    () => data.products.some((p) => !p.categoryId),
    [data.products],
  );
  const hasRecommended = useMemo(() => data.products.some((p) => p.isRecommended), [data.products]);
  const hasBestseller = useMemo(() => data.products.some((p) => p.isBestseller), [data.products]);
  const showHighlightRows =
    categoryFilter === ECOMMERCE_CATEGORY_ALL && !q.trim() && (hasRecommended || hasBestseller);
  const recommendedProducts = useMemo(
    () => data.products.filter((p) => p.isRecommended),
    [data.products],
  );
  const bestsellerProducts = useMemo(
    () => data.products.filter((p) => p.isBestseller),
    [data.products],
  );

  function renderCard(p: StorefrontProductItem, compact?: boolean) {
    const card = (
      <EcommerceProductCard
        product={p}
        categoryName={p.categoryName}
        inCartQty={cart.getLineQty(p.id)}
        onAdd={(qty) =>
          cart.add(
            {
              productId: p.id,
              name: p.name,
              priceBaht: Number(p.priceBaht),
              imageUrl: p.imageUrl,
              maxStock: p.stockBalance,
            },
            qty,
          )
        }
      />
    );
    if (compact) {
      return (
        <div key={p.id} className="w-[44%] max-w-[11rem] shrink-0 snap-start">
          {card}
        </div>
      );
    }
    return <div key={p.id}>{card}</div>;
  }

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-28" aria-hidden>
        <div className="sticky top-0 border-b border-white/60 bg-white/75 px-4 py-3">
          <div className="mx-auto h-11 max-w-lg animate-pulse rounded-2xl bg-[#ecebff]/50" />
        </div>
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 px-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#ecebff]/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-28">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {data.store.logoUrl ? (
            <Image
              src={data.store.logoUrl}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ede9ff] text-sm font-black text-[#4d47b6]">
              {data.store.storeName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-black text-[#1e1b4b]">{data.store.storeName}</h1>
            {data.store.description ? (
              <p className="truncate text-xs text-[#66638c]">{data.store.description}</p>
            ) : (
              <p className="text-xs text-[#8b87b8]">เลือกหมวด · ใส่ตะกร้า · ชำระเงิน</p>
            )}
          </div>
          <Link
            href={`/shop/${data.store.id}/track?tab=history`}
            className="flex min-h-[44px] items-center rounded-2xl border border-[#4d47b6]/25 bg-white/90 px-3 text-xs font-bold text-[#4d47b6]"
          >
            ประวัติซื้อ
          </Link>
          <Link
            href={`/shop/${data.store.id}/cart`}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-[#4d47b6] text-white shadow-lg"
            aria-label={`ตะกร้า ${cart.itemCount} ชิ้น`}
          >
            <IconCart className="h-5 w-5" />
            {cart.itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>
        </div>
        <div className="mx-auto mt-3 flex max-w-lg items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm">
          <IconSearch className="h-4 w-4 shrink-0 text-[#8b87b8]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            aria-label="ค้นหาสินค้า"
          />
        </div>
        {(data.categories.length > 0 ||
          hasUncategorized ||
          hasRecommended ||
          hasBestseller) && (
          <div
            className="mx-auto mt-3 flex max-w-lg flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="หมวดหมู่สินค้า"
          >
            <CategoryChip
              active={categoryFilter === ECOMMERCE_CATEGORY_ALL}
              label="ทั้งหมด"
              onClick={() => setCategoryFilter(ECOMMERCE_CATEGORY_ALL)}
            />
            {hasRecommended ? (
              <CategoryChip
                active={categoryFilter === ECOMMERCE_FILTER_RECOMMENDED}
                label="แนะนำ"
                onClick={() => setCategoryFilter(ECOMMERCE_FILTER_RECOMMENDED)}
              />
            ) : null}
            {hasBestseller ? (
              <CategoryChip
                active={categoryFilter === ECOMMERCE_FILTER_BESTSELLER}
                label="ขายดี"
                onClick={() => setCategoryFilter(ECOMMERCE_FILTER_BESTSELLER)}
              />
            ) : null}
            {data.categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryFilter === c.id}
                label={c.name}
                onClick={() => setCategoryFilter(c.id)}
              />
            ))}
            {hasUncategorized ? (
              <CategoryChip
                active={categoryFilter === ECOMMERCE_CATEGORY_NONE}
                label="อื่นๆ"
                onClick={() => setCategoryFilter(ECOMMERCE_CATEGORY_NONE)}
              />
            ) : null}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-lg px-3 py-4">
        {data.salePageEnabled && data.featuredProductId ? (
          <Link
            href={`/shop/${data.store.id}/sale`}
            className="mb-4 block rounded-2xl border border-[#4d47b6]/25 bg-gradient-to-r from-[#ede9ff] to-white px-4 py-3 text-sm font-semibold text-[#4d47b6] shadow-sm"
          >
            ซื้อด่วน — สินค้าเด่น (หน้าเดียวจบ) →
          </Link>
        ) : null}

        {showHighlightRows ? (
          <div className="mb-5 space-y-4">
            {recommendedProducts.length > 0 ? (
              <section>
                <h2 className="mb-2 text-sm font-black text-[#1e1b4b]">สินค้าแนะนำ</h2>
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recommendedProducts.map((p) => renderCard(p, true))}
                </div>
              </section>
            ) : null}
            {bestsellerProducts.length > 0 ? (
              <section>
                <h2 className="mb-2 text-sm font-black text-[#1e1b4b]">ขายดี</h2>
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {bestsellerProducts.map((p) => renderCard(p, true))}
                </div>
              </section>
            ) : null}
            <h2 className="text-sm font-black text-[#1e1b4b]">สินค้าทั้งหมด</h2>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#66638c]">
            {data.products.length === 0
              ? "ร้านยังไม่มีสินค้าพร้อมขาย"
              : categoryFilter === ECOMMERCE_FILTER_RECOMMENDED
                ? "ยังไม่มีสินค้าแนะนำ"
                : categoryFilter === ECOMMERCE_FILTER_BESTSELLER
                  ? "ยังไม่มีสินค้าขายดี"
                  : categoryFilter !== ECOMMERCE_CATEGORY_ALL
                    ? "ไม่มีสินค้าในหมวดนี้"
                    : "ไม่พบสินค้าที่ค้นหา"}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => renderCard(p))}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href={`/shop/${data.store.id}/cart`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[#4d47b6]/30 bg-white/90 text-sm font-bold text-[#4d47b6]"
          >
            ตะกร้า{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </Link>
          {cart.itemCount > 0 ? (
            <Link
              href={`/shop/${data.store.id}/checkout`}
              className="flex min-h-[48px] flex-[1.4] items-center justify-center rounded-2xl bg-[#4d47b6] text-sm font-bold text-white shadow-lg"
            >
              ชำระ ฿{cart.totalBaht.toLocaleString("th-TH")}
            </Link>
          ) : (
            <span className="flex min-h-[48px] flex-[1.4] items-center justify-center rounded-2xl bg-[#ecebff] text-sm font-semibold text-[#8b87b8]">
              เลือกสินค้าก่อน
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 min-h-[40px] rounded-2xl px-4 text-sm font-bold transition ${
        active
          ? "bg-[#4d47b6] text-white shadow-md"
          : "border border-white/70 bg-white/90 text-[#4d47b6]"
      }`}
    >
      {label}
    </button>
  );
}

"use client";

import Link from "next/link";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { IconCart, IconSearch } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import { EcommercePortalSection } from "@/systems/ecommerce-store/storefront/EcommercePortalSection";
import { EcommerceProductCard } from "@/systems/ecommerce-store/storefront/EcommerceProductCard";
import { useEcommerceCart } from "@/systems/ecommerce-store/storefront/useEcommerceCart";
import {
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePortalCategoryChipClass,
  ecommerceStorePortalShopNameClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

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
        <div key={p.id} className="w-[44%] max-w-[11rem] shrink-0 snap-start sm:w-[28%] sm:max-w-[14rem]">
          {card}
        </div>
      );
    }
    return <div key={p.id}>{card}</div>;
  }

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-[#faf9ff] pb-28" aria-hidden>
        <div className="border-b border-slate-200/80 bg-white px-4 py-4">
          <div className="mx-auto h-12 max-w-6xl animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-8 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const showCategoryBar =
    data.categories.length > 0 || hasUncategorized || hasRecommended || hasBestseller;

  return (
    <div className="min-h-dvh bg-[#faf9ff] pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {data.store.logoUrl ? (
            <EcommerceRemoteImg
              src={data.store.logoUrl}
              className="h-11 w-11 rounded-full object-cover"
              fallback={
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#5b61ff] to-[#c026d3] text-sm font-black text-white">
                  {data.store.storeName.slice(0, 1)}
                </div>
              }
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#5b61ff] to-[#c026d3] text-sm font-black text-white">
              {data.store.storeName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className={cn(ecommerceStorePortalShopNameClass, "truncate text-lg sm:text-xl")}>
              {data.store.storeName}
            </h1>
          </div>
          <Link
            href={`/shop/${data.store.id}/track?tab=history`}
            className={cn(ecommerceStoreOutlineButtonClass, "hidden sm:inline-flex")}
          >
            ประวัติซื้อ
          </Link>
          <Link
            href={`/shop/${data.store.id}/cart`}
            className={cn(ecommerceStorePrimaryButtonClass, "relative w-9 min-w-9 px-0")}
            aria-label={`ตะกร้า ${cart.itemCount} ชิ้น`}
          >
            <IconCart className="h-4 w-4" />
            {cart.itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2 shadow-sm">
            <IconSearch className="h-4 w-4 shrink-0 text-[#8b87b8]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              aria-label="ค้นหาสินค้า"
            />
          </div>

          {showCategoryBar ? (
            <div
              className="mt-3 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:space-y-14 sm:px-6">
        {data.salePageEnabled && data.featuredProductId ? (
          <Link
            href={`/shop/${data.store.id}/sale`}
            className={cn(
              ecommerceStorePrimaryButtonClass,
              "w-full justify-between px-4 text-left",
            )}
          >
            <span>ซื้อด่วน — สินค้าเด่น (หน้าเดียวจบ)</span>
            <span aria-hidden>→</span>
          </Link>
        ) : null}

        {showHighlightRows ? (
          <div className="space-y-10">
            {recommendedProducts.length > 0 ? (
              <EcommercePortalSection id="recommended" title="สินค้าแนะนำ">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recommendedProducts.map((p) => renderCard(p, true))}
                </div>
              </EcommercePortalSection>
            ) : null}
            {bestsellerProducts.length > 0 ? (
              <EcommercePortalSection id="bestsellers" title="ขายดี">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {bestsellerProducts.map((p) => renderCard(p, true))}
                </div>
              </EcommercePortalSection>
            ) : null}
          </div>
        ) : null}

        <EcommercePortalSection
          id="products"
          title={
            categoryFilter === ECOMMERCE_FILTER_RECOMMENDED
              ? "สินค้าแนะนำ"
              : categoryFilter === ECOMMERCE_FILTER_BESTSELLER
                ? "ขายดี"
                : showHighlightRows
                  ? "สินค้าทั้งหมด"
                  : "สินค้า"
          }
        >
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-[#66638c]">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {filtered.map((p) => renderCard(p))}
            </div>
          )}
        </EcommercePortalSection>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Link
            href={`/shop/${data.store.id}/cart`}
            className={cn(ecommerceStoreOutlineButtonClass, "flex-1")}
          >
            ตะกร้า{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </Link>
          {cart.itemCount > 0 ? (
            <Link
              href={`/shop/${data.store.id}/checkout`}
              className={cn(ecommerceStorePrimaryButtonClass, "flex-[1.4]")}
            >
              ชำระ ฿{cart.totalBaht.toLocaleString("th-TH")}
            </Link>
          ) : (
            <span className={cn(ecommerceStoreOutlineButtonClass, "flex-[1.4] cursor-default opacity-60")}>
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
      className={ecommerceStorePortalCategoryChipClass(active)}
    >
      {label}
    </button>
  );
}

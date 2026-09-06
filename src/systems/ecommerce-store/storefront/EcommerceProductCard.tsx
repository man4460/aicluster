"use client";

import { cn } from "@/lib/cn";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";

export type StorefrontProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  priceBaht: string | number;
  stockBalance: number;
  isRecommended?: boolean;
  isBestseller?: boolean;
  imageUrls?: string[];
  reviewAvg?: number | null;
  reviewCount?: number;
};

type Props = {
  product: StorefrontProduct;
  categoryName?: string | null;
  inCartQty: number;
  onOpen: () => void;
  compact?: boolean;
};

function ProductImageFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 text-[#4d47b6]" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-6 w-6 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinejoin="round" />
        <path d="M3.3 7 12 12l8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function EcommerceProductCard({
  product,
  categoryName,
  inCartQty,
  onOpen,
  compact,
}: Props) {
  const price = Number(product.priceBaht);
  const maxQty = Math.max(0, product.stockBalance);
  const soldOut = maxQty <= 0;
  const multi = (product.imageUrls?.length ?? 0) > 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40",
        soldOut && "opacity-70",
        compact && "rounded-md",
      )}
      aria-label={`ดูรายละเอียด ${product.name}`}
    >
      <div className="relative aspect-square bg-slate-100">
        <EcommerceRemoteImg
          src={product.imageUrl}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            soldOut && "grayscale",
          )}
          fallback={<ProductImageFallback />}
        />
        <div className="absolute left-1 top-1 flex max-w-[calc(100%-0.5rem)] flex-col gap-0.5 sm:left-1.5 sm:top-1.5">
          {product.isBestseller ? (
            <span className="w-fit rounded bg-amber-500 px-1 py-px text-[8px] font-bold text-white shadow sm:text-[9px]">
              ขายดี
            </span>
          ) : null}
          {product.isRecommended ? (
            <span className="w-fit rounded bg-rose-500 px-1 py-px text-[8px] font-bold text-white shadow sm:text-[9px]">
              แนะนำ
            </span>
          ) : null}
          {inCartQty > 0 ? (
            <span className="w-fit rounded bg-[#4d47b6] px-1 py-px text-[8px] font-bold text-white shadow sm:text-[9px]">
              ตะกร้า {inCartQty}
            </span>
          ) : null}
        </div>
        {multi ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 py-px text-[8px] font-bold text-white">
            {product.imageUrls!.length} รูป
          </span>
        ) : null}
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "p-1.5" : "p-2 sm:p-2.5")}>
        <h3
          className={cn(
            "font-bold leading-snug text-[#1e1b4b]",
            compact ? "line-clamp-2 text-[10px]" : "line-clamp-2 text-[11px] sm:text-xs",
          )}
        >
          {product.name}
        </h3>
        {!compact && categoryName ? (
          <p className="mt-0.5 line-clamp-1 text-[9px] font-semibold text-[#8b87b8]">{categoryName}</p>
        ) : null}
        <p
          className={cn(
            "mt-0.5 font-black tabular-nums text-emerald-700",
            compact ? "text-[11px]" : "text-xs sm:text-sm",
          )}
        >
          ฿{price.toLocaleString("th-TH")}
        </p>
        {soldOut ? (
          <p className="mt-0.5 text-[9px] font-semibold text-rose-600">หมด</p>
        ) : product.reviewCount && product.reviewCount > 0 && product.reviewAvg != null ? (
          <p className="mt-0.5 text-[9px] font-semibold text-amber-600">
            ★ {product.reviewAvg.toFixed(1)}
          </p>
        ) : null}
      </div>
    </button>
  );
}

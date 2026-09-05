"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import { ecommerceStorePrimaryButtonClass } from "@/systems/ecommerce-store/lib/ui-tokens";

export type StorefrontProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  priceBaht: string | number;
  stockBalance: number;
  isRecommended?: boolean;
  isBestseller?: boolean;
};

type Props = {
  product: StorefrontProduct;
  categoryName?: string | null;
  inCartQty: number;
  onAdd: (qty: number) => boolean;
};

function ProductImageFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 text-[#4d47b6]" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-8 w-8 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinejoin="round" />
        <path d="M3.3 7 12 12l8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function EcommerceProductCard({ product, categoryName, inCartQty, onAdd }: Props) {
  const price = Number(product.priceBaht);
  const maxQty = Math.max(0, product.stockBalance);
  const [pickQty, setPickQty] = useState(1);
  const [flash, setFlash] = useState<"ok" | "fail" | null>(null);

  const safePick = Math.min(Math.max(1, pickQty), maxQty || 1);

  function handleAdd() {
    if (maxQty <= 0) {
      setFlash("fail");
      return;
    }
    const ok = onAdd(safePick);
    setFlash(ok ? "ok" : "fail");
    if (ok) setTimeout(() => setFlash(null), 1600);
    else setTimeout(() => setFlash(null), 2200);
  }

  if (maxQty <= 0) {
    return (
      <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white opacity-70 shadow-sm">
        <div className="relative aspect-square bg-slate-100">
          <EcommerceRemoteImg
            src={product.imageUrl}
            className="absolute inset-0 h-full w-full object-cover grayscale"
            fallback={<ProductImageFallback />}
          />
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-bold text-[#1e1b4b]">{product.name}</h3>
          <p className="mt-2 text-xs font-semibold text-rose-600">สินค้าหมด</p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        <EcommerceRemoteImg
          src={product.imageUrl}
          className="absolute inset-0 h-full w-full object-cover"
          fallback={<ProductImageFallback />}
        />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
          {product.isBestseller ? (
            <span className="w-fit rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              ขายดี
            </span>
          ) : null}
          {product.isRecommended ? (
            <span className="w-fit rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              แนะนำ
            </span>
          ) : null}
          {inCartQty > 0 ? (
            <span className="w-fit rounded-md bg-[#4d47b6] px-2 py-0.5 text-[10px] font-bold text-white shadow">
              ในตะกร้า {inCartQty}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#1e1b4b]">
          {product.name}
        </h3>
        {categoryName ? (
          <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-[#8b87b8]">{categoryName}</p>
        ) : null}
        <p className="mt-1 text-base font-black tabular-nums text-emerald-700">
          ฿{price.toLocaleString("th-TH")}
        </p>
        <p className="mt-0.5 text-[10px] text-[#8b87b8]">คงเหลือ {maxQty} ชิ้น</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-lg border border-slate-200/90 bg-white">
            <button
              type="button"
              className="min-h-9 min-w-9 text-sm font-bold text-[#4d47b6]"
              aria-label={`ลดจำนวน ${product.name}`}
              onClick={() => setPickQty((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="min-w-[28px] text-center text-sm font-bold tabular-nums">{safePick}</span>
            <button
              type="button"
              className="min-h-9 min-w-9 text-sm font-bold text-[#4d47b6]"
              aria-label={`เพิ่มจำนวน ${product.name}`}
              onClick={() => setPickQty((q) => Math.min(maxQty, q + 1))}
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "mt-2 w-full",
            flash === "ok"
              ? "inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white"
              : flash === "fail"
                ? "inline-flex h-9 items-center justify-center rounded-lg bg-rose-100 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
                : ecommerceStorePrimaryButtonClass,
          )}
        >
          {flash === "ok" ? "ใส่ตะกร้าแล้ว" : flash === "fail" ? "เกินสต๊อก / หมด" : "ใส่ตะกร้า"}
        </button>
      </div>
    </article>
  );
}

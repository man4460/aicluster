"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

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
      <article className="app-surface flex flex-col overflow-hidden rounded-2xl border border-white/60 opacity-70">
        <div className="relative aspect-square bg-[#f3f2fa]">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt="" fill className="object-cover grayscale" sizes="50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#8b87b8]">ไม่มีรูป</div>
          )}
        </div>
        <div className="p-3">
          <h2 className="line-clamp-2 text-sm font-bold text-[#1e1b4b]">{product.name}</h2>
          <p className="mt-2 text-xs font-semibold text-rose-600">สินค้าหมด</p>
        </div>
      </article>
    );
  }

  return (
    <article className="app-surface flex flex-col overflow-hidden rounded-2xl border border-white/60 shadow-sm">
      <div className="relative aspect-square bg-[#f3f2fa]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="50vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#8b87b8]">ไม่มีรูป</div>
        )}
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
          {product.isBestseller ? (
            <span className="w-fit rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              ขายดี
            </span>
          ) : null}
          {product.isRecommended ? (
            <span className="w-fit rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              แนะนำ
            </span>
          ) : null}
          {inCartQty > 0 ? (
            <span className="w-fit rounded-lg bg-[#4d47b6] px-2 py-0.5 text-[10px] font-bold text-white shadow">
              ในตะกร้า {inCartQty}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#1e1b4b]">
          {product.name}
        </h2>
        {categoryName ? (
          <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-[#8b87b8]">{categoryName}</p>
        ) : null}
        <p className="mt-1 font-black text-[#4d47b6]">฿{price.toLocaleString("th-TH")}</p>
        <p className="mt-0.5 text-[10px] text-[#8b87b8]">คงเหลือ {maxQty} ชิ้น</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-xl border border-white/70 bg-white/80">
            <button
              type="button"
              className="min-h-[36px] min-w-[36px] text-sm font-bold text-[#4d47b6]"
              aria-label={`ลดจำนวน ${product.name}`}
              onClick={() => setPickQty((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="min-w-[28px] text-center text-sm font-bold tabular-nums">{safePick}</span>
            <button
              type="button"
              className="min-h-[36px] min-w-[36px] text-sm font-bold text-[#4d47b6]"
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
            "mt-2 min-h-[40px] w-full rounded-xl text-xs font-bold transition",
            flash === "ok"
              ? "bg-emerald-600 text-white"
              : flash === "fail"
                ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                : "bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] text-white active:scale-[0.98]",
          )}
        >
          {flash === "ok" ? "ใส่ตะกร้าแล้ว" : flash === "fail" ? "เกินสต๊อก / หมด" : "ใส่ตะกร้า"}
        </button>
      </div>
    </article>
  );
}

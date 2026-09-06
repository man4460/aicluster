"use client";

import { useEffect, useMemo, useState } from "react";
import { AppImageLightbox, useAppImageLightbox } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import type { StorefrontProduct } from "@/systems/ecommerce-store/storefront/EcommerceProductCard";

export type StorefrontProductDetail = StorefrontProduct & {
  imageUrls?: string[];
  reviewAvg?: number | null;
  reviewCount?: number;
  description?: string | null;
};

type ReviewRow = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  product: StorefrontProductDetail | null;
  storeId: string;
  inCartQty: number;
  onClose: () => void;
  onAdd: (qty: number) => boolean;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} ดาว`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function EcommerceProductDetailModal({
  open,
  product,
  storeId,
  inCartQty,
  onClose,
  onAdd,
}: Props) {
  const lb = useAppImageLightbox();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState<"ok" | "fail" | null>(null);
  const [slide, setSlide] = useState(0);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const images = useMemo(() => {
    if (!product) return [] as string[];
    if (product.imageUrls?.length) return product.imageUrls;
    return product.imageUrl?.trim() ? [product.imageUrl.trim()] : [];
  }, [product]);

  useEffect(() => {
    if (!open || !product) {
      setQty(1);
      setFlash(null);
      setSlide(0);
      setReviews([]);
      return;
    }
    setQty(1);
    setSlide(0);
    void fetch(
      `/api/ecommerce-store/public/${encodeURIComponent(storeId)}/reviews?productId=${encodeURIComponent(product.id)}`,
    )
      .then((r) => r.json())
      .then((j: { reviews?: ReviewRow[] }) => setReviews(j.reviews ?? []))
      .catch(() => setReviews([]));
  }, [open, product, storeId]);

  if (!product) return null;

  const maxQty = Math.max(0, product.stockBalance);
  const safeQty = Math.min(Math.max(1, qty), maxQty || 1);
  const price = Number(product.priceBaht);
  const current = images[Math.max(0, Math.min(slide, images.length - 1))] ?? null;

  function handleAdd() {
    if (maxQty <= 0) {
      setFlash("fail");
      return;
    }
    const ok = onAdd(safeQty);
    setFlash(ok ? "ok" : "fail");
    setTimeout(() => setFlash(null), ok ? 1400 : 2000);
  }

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        size="lg"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title={product.name}
        footer={
          <FormModalFooterActions
            onCancel={onClose}
            cancelLabel="ปิด"
            onSubmit={handleAdd}
            submitLabel={
              maxQty <= 0
                ? "สินค้าหมด"
                : flash === "ok"
                  ? "ใส่ตะกร้าแล้ว"
                  : flash === "fail"
                    ? "เกินสต๊อก"
                    : `ใส่ตะกร้า · ฿${(price * safeQty).toLocaleString("th-TH")}`
            }
            submitDisabled={maxQty <= 0}
          />
        }
      >
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <button
              type="button"
              className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100"
              onClick={() => current && lb.openGallery(images, slide)}
              aria-label="ดูรูปสินค้าเต็มจอ"
            >
              <EcommerceRemoteImg
                src={current}
                className="absolute inset-0 h-full w-full object-cover"
                fallback={
                  <div className="flex h-full items-center justify-center text-sm font-bold text-[#8b87b8]">
                    ไม่มีรูป
                  </div>
                }
              />
              {images.length > 1 ? (
                <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                  {slide + 1}/{images.length} · แตะดูเต็มจอ
                </span>
              ) : null}
            </button>
            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={cn(
                      "h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2",
                      i === slide ? "ring-[#5b61ff]" : "ring-transparent",
                    )}
                    aria-label={`มุมที่ ${i + 1}`}
                  >
                    <EcommerceRemoteImg src={src} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-2xl font-black tabular-nums text-emerald-700">
              ฿{price.toLocaleString("th-TH")}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#66638c]">คงเหลือ {maxQty} ชิ้น</p>
            {product.reviewCount && product.reviewCount > 0 && product.reviewAvg != null ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#4d47b6]">
                <Stars n={Math.round(product.reviewAvg)} />
                {product.reviewAvg.toFixed(1)} · {product.reviewCount} รีวิว
              </p>
            ) : null}
          </div>

          {product.description?.trim() ? (
            <p className="whitespace-pre-wrap text-sm font-medium text-[#5f5a8a]">{product.description}</p>
          ) : null}

          {maxQty > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#4d47b6]">จำนวน</span>
              <div className="flex items-center rounded-lg border border-slate-200/90 bg-white">
                <button
                  type="button"
                  className="min-h-10 min-w-10 text-sm font-bold text-[#4d47b6]"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">{safeQty}</span>
                <button
                  type="button"
                  className="min-h-10 min-w-10 text-sm font-bold text-[#4d47b6]"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                >
                  +
                </button>
              </div>
              {inCartQty > 0 ? (
                <span className="text-xs font-semibold text-[#66638c]">ในตะกร้า {inCartQty}</span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm font-bold text-rose-600">สินค้าหมดชั่วคราว</p>
          )}

          <div className="space-y-2 border-t border-slate-200/80 pt-3">
            <p className="text-xs font-bold text-[#4d47b6]">รีวิวสินค้า</p>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#66638c]">ยังไม่มีรีวิว</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1e1b4b]">{r.customerName}</p>
                      <Stars n={r.rating} />
                    </div>
                    {r.comment ? (
                      <p className="mt-1 text-xs font-medium text-[#5f5a8a]">{r.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </FormModal>
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt={product.name}
      />
    </>
  );
}

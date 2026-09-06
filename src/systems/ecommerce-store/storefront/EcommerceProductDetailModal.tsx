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
    if (ok) {
      setFlash("ok");
      // ปิดโมดัลหลังใส่ตะกร้าสำเร็จ — ให้เห็นป้ายสั้น ๆ ก่อนปิด
      window.setTimeout(() => onClose(), 450);
      return;
    }
    setFlash("fail");
    window.setTimeout(() => setFlash(null), 2000);
  }

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        size="lg"
        appearance="default"
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
          <div className="space-y-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm sm:p-2.5">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.25rem] bg-slate-50">
              <button
                type="button"
                className="absolute inset-0"
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
              </button>
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#1e1b4b] shadow-md backdrop-blur-sm hover:bg-white"
                    aria-label="รูปก่อนหน้า"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlide((s) => (s - 1 + images.length) % images.length);
                    }}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#1e1b4b] shadow-md backdrop-blur-sm hover:bg-white"
                    aria-label="รูปถัดไป"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlide((s) => (s + 1) % images.length);
                    }}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                  <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                    {slide + 1}/{images.length} · แตะดูเต็มจอ
                  </span>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={cn(
                      "h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/90 bg-white ring-2",
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

          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xl font-black tabular-nums text-emerald-700">
                  ฿{price.toLocaleString("th-TH")}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">คงเหลือ {maxQty} ชิ้น</p>
              </div>
              {maxQty > 0 ? (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4d47b6]">จำนวน</span>
                    <div className="flex items-center rounded-lg border border-slate-200/90 bg-white">
                      <button
                        type="button"
                        className="min-h-9 min-w-9 text-sm font-bold text-[#4d47b6]"
                        aria-label="ลดจำนวน"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        -
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums">
                        {safeQty}
                      </span>
                      <button
                        type="button"
                        className="min-h-9 min-w-9 text-sm font-bold text-[#4d47b6]"
                        aria-label="เพิ่มจำนวน"
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {inCartQty > 0 ? (
                    <span className="text-[10px] font-semibold text-[#66638c]">ในตะกร้า {inCartQty}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {maxQty <= 0 ? (
              <p className="mt-2 text-sm font-bold text-rose-600">สินค้าหมดชั่วคราว</p>
            ) : null}
            {product.reviewCount && product.reviewCount > 0 && product.reviewAvg != null ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#4d47b6]">
                <Stars n={Math.round(product.reviewAvg)} />
                {product.reviewAvg.toFixed(1)} · {product.reviewCount} รีวิว
              </p>
            ) : null}
            {product.description?.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-[#5f5a8a]">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-3.5">
            <p className="text-xs font-bold text-[#4d47b6]">รีวิวสินค้า</p>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#66638c]">ยังไม่มีรีวิว</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-slate-200/90 bg-white p-2.5 shadow-sm"
                  >
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

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

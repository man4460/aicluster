"use client";

import { Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreTonedRowCardClass,
} from "@/systems/ecommerce-store/lib/card-tones";
import {
  ECOMMERCE_POS_PAYMENT_METHODS,
  ecommercePosPaymentMethodLabel,
  ecommercePosPaymentShowsSlip,
  type EcommercePosPaymentMethod,
} from "@/systems/ecommerce-store/lib/sales-channel";
import { ecommerceStoreInlineSubNavShellClass } from "@/systems/ecommerce-store/lib/ui-tokens";

type Product = {
  id: string;
  name: string;
  priceBaht: string;
  stockBalance: number;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string } | null;
};

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stockBalance: number;
};

export function EcommercePosClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const { openCamera, cameraModal } = useAppCameraCapture();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<EcommercePosPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/products");
      const j = await res.json();
      setProducts((j.products ?? []) as Product[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.category) map.set(p.category.id, p.category.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (categoryId && p.category?.id !== categoryId) return false;
      if (!kw) return true;
      return p.name.toLowerCase().includes(kw);
    });
  }, [products, categoryId, keyword]);

  const cartTotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart],
  );

  const showSlip = ecommercePosPaymentShowsSlip(paymentMethod, cartTotal);

  function addToCart(p: Product) {
    if (p.stockBalance <= 0) {
      notice.error(`สต๊อกหมด — ${p.name}`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stockBalance) {
          notice.error(`สต๊อกไม่พอ — ${p.name}`);
          return prev;
        }
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unitPrice: Number(p.priceBaht),
          quantity: 1,
          stockBalance: p.stockBalance,
        },
      ];
    });
  }

  function setQty(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const q = Math.max(0, Math.min(l.stockBalance, Math.floor(quantity)));
          return { ...l, quantity: q };
        })
        .filter((l) => l.quantity > 0),
    );
  }

  async function uploadSlip(file: File) {
    setUploading(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch("/api/ecommerce-store/session/upload-slip", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) {
        notice.error(j.error ?? "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }
      setSlipUrl(typeof j.imageUrl === "string" ? j.imageUrl : null);
    } finally {
      setUploading(false);
    }
  }

  function onSlipInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void uploadSlip(f);
  }

  async function checkout() {
    if (cart.length === 0) {
      notice.error("เลือกสินค้าก่อนบันทึกขาย");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          paymentMethod,
          paymentSlipUrl: showSlip ? slipUrl : null,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        notice.error(j.error ?? "บันทึกขายไม่สำเร็จ");
        return;
      }
      notice.success(
        `ขายหน้าร้าน ฿${cartTotal.toLocaleString("th-TH")} · ${ecommercePosPaymentMethodLabel(paymentMethod)}`,
      );
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("CASH");
      setSlipUrl(null);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {notice.popup}
      {cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#1e1b4b]">ขายหน้าร้าน</h3>
          <p className="text-xs font-semibold text-[#66638c]">
            POS · ตัดสต๊อกทันที · นับรายรับช่องทางหน้าร้าน
          </p>
        </div>
        <div className={ecommerceStoreInlineSubNavShellClass}>
          <span className="px-2 text-xs font-black tabular-nums text-[#4d47b6]">
            ตะกร้า {cart.reduce((s, l) => s + l.quantity, 0)} · ฿{cartTotal.toLocaleString("th-TH")}
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,20rem)] lg:items-start">
        <section className="min-w-0 space-y-2.5" aria-label="เลือกสินค้า">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาสินค้า"
            className={cn(ecommerceFieldClass, "min-h-[44px]")}
            aria-label="ค้นหาสินค้าหน้าร้าน"
          />
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="หมวดสินค้า">
            <button
              type="button"
              role="tab"
              aria-selected={!categoryId}
              className={ecommerceFilterChipClass(!categoryId)}
              onClick={() => setCategoryId("")}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={categoryId === c.id}
                className={ecommerceFilterChipClass(categoryId === c.id)}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm font-semibold text-[#66638c]">กำลังโหลดสินค้า…</p>
          ) : visibleProducts.length === 0 ? (
            <AppEmptyState tone="slate">ไม่มีสินค้าที่ขายได้</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((p) => {
                const low = p.stockBalance <= 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={low}
                      onClick={() => addToCart(p)}
                      className={cn(
                        ecommerceStoreTonedRowCardClass(low ? "slate" : "violet"),
                        "h-full w-full flex-col items-stretch gap-2 p-2.5 text-left disabled:opacity-50",
                      )}
                      aria-label={`เพิ่ม ${p.name}`}
                    >
                      {p.imageUrl ? (
                        <AppImageThumb
                          src={p.imageUrl}
                          alt={p.name}
                          onOpen={() => lb.open(p.imageUrl!)}
                          className="h-20 w-20"
                        />
                      ) : (
                        <span className={ecommerceStoreCardIconTileClass("violet", "lg")} aria-hidden>
                          <Package className="h-6 w-6" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-black text-[#1e1b4b] sm:text-sm">{p.name}</p>
                        <p className="mt-1 text-sm font-black tabular-nums text-emerald-700">
                          ฿{Number(p.priceBaht).toLocaleString("th-TH")}
                        </p>
                        <p className="text-[10px] font-semibold text-[#66638c]">คงเหลือ {p.stockBalance}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#4d47b6]">
                        <Plus className="h-3 w-3" aria-hidden />
                        เพิ่ม
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-3 rounded-[1.25rem] border border-slate-200/80 bg-white/70 p-3 shadow-sm sm:p-4 lg:sticky lg:top-3">
          <div className="flex items-center gap-2">
            <span className={ecommerceStoreCardIconTileClass("emerald")} aria-hidden>
              <ShoppingBag className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-black text-[#1e1b4b]">ตะกร้า / ชำระ</h4>
          </div>

          {cart.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs font-semibold text-[#66638c]">
              แตะสินค้าเพื่อเพิ่มลงตะกร้า
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.productId} className="flex items-center gap-2 rounded-xl bg-slate-50/80 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[#1e1b4b]">{l.name}</p>
                    <p className="text-[10px] font-semibold text-[#66638c]">
                      ฿{l.unitPrice.toLocaleString("th-TH")} × {l.quantity}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={l.stockBalance}
                    value={l.quantity}
                    onChange={(e) => setQty(l.productId, Number(e.target.value))}
                    className="w-14 rounded-lg border border-slate-200 px-1 py-1 text-center text-sm font-bold"
                    aria-label={`จำนวน ${l.name}`}
                  />
                  <button
                    type="button"
                    className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-rose-600"
                    aria-label={`ลบ ${l.name}`}
                    onClick={() => setQty(l.productId, 0)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="block text-xs font-bold text-[#4d47b6]">
            ชื่อลูกค้า (ไม่บังคับ)
            <input
              className={cn(ecommerceFieldClass, "mt-1 min-h-[40px]")}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ลูกค้าหน้าร้าน"
            />
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            เบอร์โทร (ไม่บังคับ · บันทึก CRM)
            <input
              className={cn(ecommerceFieldClass, "mt-1 min-h-[40px]")}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08x-xxx-xxxx"
              inputMode="tel"
            />
          </label>

          <div className="space-y-1.5" role="group" aria-label="วิธีชำระ">
            <p className="text-xs font-bold text-[#4d47b6]">ชำระเงิน</p>
            <div className="flex flex-wrap gap-1.5">
              {ECOMMERCE_POS_PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={ecommerceFilterChipClass(paymentMethod === m)}
                  aria-pressed={paymentMethod === m}
                  onClick={() => {
                    setPaymentMethod(m);
                    if (!ecommercePosPaymentShowsSlip(m, cartTotal)) setSlipUrl(null);
                  }}
                >
                  {ecommercePosPaymentMethodLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {showSlip ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#4d47b6]">แนบสลิป (ถ้ามี)</p>
              {slipUrl ? (
                <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} className="h-16 w-16" />
              ) : null}
              <AppGalleryCameraFileInputs
                galleryInputRef={galleryRef}
                cameraInputRef={cameraInputRef}
                onChange={onSlipInputChange}
              />
              <AppImagePickCameraButtons
                busy={uploading}
                onPickGallery={() => galleryRef.current?.click()}
                onPickCamera={() => openCamera((file) => void uploadSlip(file))}
                labels={{ gallery: "เลือกสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
                className="justify-start"
              />
            </div>
          ) : null}

          <div className="flex items-end justify-between border-t border-slate-200/80 pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b87b8]">ยอดรวม</p>
              <p className="text-2xl font-black tabular-nums text-emerald-700">
                ฿{cartTotal.toLocaleString("th-TH")}
              </p>
            </div>
            <button
              type="button"
              className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-black disabled:opacity-50"
              disabled={saving || cart.length === 0}
              onClick={() => void checkout()}
            >
              {saving ? "กำลังบันทึก…" : "บันทึกขาย"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

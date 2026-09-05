"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import { EcommercePaymentPanel } from "@/systems/ecommerce-store/components/EcommercePaymentPanel";
import {
  ecommercePosPaymentMethodLabel,
  type EcommercePosPaymentMethod,
} from "@/systems/ecommerce-store/lib/payment-method";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import {
  ecommerceStorePosDraftPanelClass,
  ecommerceStorePosProductCardClass,
  ecommerceStorePosProductGridClass,
  ecommerceStorePosPulseWashClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreRowIconButtonClass,
  ecommerceStoreRowIconDangerClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

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

function IconImagePlaceholder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <path d="M4 17l4-4 3 3 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EcommercePosClient() {
  const notice = useAppNoticePopup();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<EcommercePosPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
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

  const cartQtyById = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart) m.set(l.productId, l.quantity);
    return m;
  }, [cart]);

  const cartTotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart],
  );
  const cartItemCount = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);

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
          paymentSlipUrl: slipUrl,
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

  const cartPanel = (
    <aside className={cn(ecommerceStorePosDraftPanelClass, "space-y-3 lg:sticky lg:top-3")}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-700 ring-1 ring-emerald-200/80">
          <ShoppingBag className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-black text-[#1e1b4b]">ตะกร้า / ชำระ</h4>
          <p className="text-[10px] font-semibold text-[#66638c]">
            {cartItemCount} ชิ้น · ฿{cartTotal.toLocaleString("th-TH")}
          </p>
        </div>
      </div>

      {cart.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-white/70 bg-white/40 py-6 text-center text-xs font-semibold text-[#66638c]">
          แตะเมนูเพื่อเพิ่มลงตะกร้า
        </p>
      ) : (
        <ul className="space-y-2">
          {cart.map((l) => (
            <li
              key={l.productId}
              className="flex items-center gap-2 rounded-[1.25rem] border border-white/55 bg-white/55 p-2.5 text-sm shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-[#1e1b4b] sm:text-sm">{l.name}</p>
                <p className="text-[10px] font-semibold text-[#66638c]">
                  ฿{l.unitPrice.toLocaleString("th-TH")} × {l.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={ecommerceStoreRowIconButtonClass}
                  aria-label={`ลด ${l.name}`}
                  onClick={() => setQty(l.productId, l.quantity - 1)}
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                  {l.quantity}
                </span>
                <button
                  type="button"
                  className={ecommerceStoreRowIconButtonClass}
                  aria-label={`เพิ่ม ${l.name}`}
                  disabled={l.quantity >= l.stockBalance}
                  onClick={() => setQty(l.productId, l.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className={ecommerceStoreRowIconDangerClass}
                  aria-label={`ลบ ${l.name}`}
                  onClick={() => setQty(l.productId, 0)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="block text-xs font-bold text-[#4d47b6]">
        ชื่อลูกค้า (ไม่บังคับ)
        <input
          className={cn(ecommerceFieldClass, "mt-1")}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="ลูกค้าหน้าร้าน"
        />
      </label>
      <label className="block text-xs font-bold text-[#4d47b6]">
        เบอร์โทร (ไม่บังคับ · บันทึก CRM)
        <input
          className={cn(ecommerceFieldClass, "mt-1")}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="08x-xxx-xxxx"
          inputMode="tel"
        />
      </label>

      <EcommercePaymentPanel
        amountBaht={cartTotal}
        method={paymentMethod}
        slipUrl={slipUrl}
        onMethodChange={setPaymentMethod}
        onSlipUrlChange={setSlipUrl}
        disabled={saving}
      />

      <div className="flex items-end justify-between gap-3 border-t border-white/60 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b87b8]">ยอดรวม</p>
          <p className="text-2xl font-black tabular-nums text-emerald-700">
            ฿{cartTotal.toLocaleString("th-TH")}
          </p>
        </div>
        <button
          type="button"
          className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
          disabled={saving || cart.length === 0}
          onClick={() => void checkout()}
        >
          {saving ? "กำลังบันทึก…" : "บันทึกขาย"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="space-y-3">
      {notice.popup}

      <div className="min-w-0">
        <h3 className="text-base font-black text-[#1e1b4b]">ขายหน้าร้าน</h3>
        <p className="text-xs font-semibold text-[#66638c]">
          POS แบบร้านอาหาร · ตัดสต๊อกทันที · นับรายรับช่องทางหน้าร้าน
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(260px,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:order-1">{cartPanel}</div>

        <section className="order-1 min-w-0 space-y-2.5 lg:order-2" aria-label="เลือกสินค้า">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาสินค้า"
            className={ecommerceFieldClass}
            aria-label="ค้นหาสินค้าหน้าร้าน"
          />
          <div
            className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [-webkit-overflow-scrolling:touch]"
            role="tablist"
            aria-label="หมวดสินค้า"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!categoryId}
              className={cn(ecommerceFilterChipClass(!categoryId), "shrink-0")}
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
                className={cn(ecommerceFilterChipClass(categoryId === c.id), "shrink-0")}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={cn("h-40 animate-pulse rounded-xl", ecommerceStorePosPulseWashClass)} aria-hidden />
          ) : visibleProducts.length === 0 ? (
            <AppEmptyState tone="violet">ไม่มีสินค้าที่ขายได้</AppEmptyState>
          ) : (
            <ul className={ecommerceStorePosProductGridClass}>
              {visibleProducts.map((p) => {
                const low = p.stockBalance <= 0;
                const inCartQty = cartQtyById.get(p.id) ?? 0;
                const price = Number(p.priceBaht);
                return (
                  <li
                    key={p.id}
                    className={cn(
                      ecommerceStorePosProductCardClass,
                      "min-w-0 max-w-full",
                      low && "opacity-55",
                    )}
                  >
                    <button
                      type="button"
                      disabled={low}
                      onClick={() => addToCart(p)}
                      className={cn(
                        "flex w-full min-w-0 max-w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35",
                        inCartQty > 0 && "ring-2 ring-[#5b61ff]/35 ring-offset-1",
                      )}
                      aria-label={`${p.name} ราคา ${price.toLocaleString("th-TH")} บาท`}
                    >
                      <div
                        className={cn(
                          "relative aspect-square w-full max-w-full overflow-hidden",
                          ecommerceStorePosPulseWashClass,
                        )}
                      >
                        <EcommerceRemoteImg
                          src={p.imageUrl}
                          className="h-full w-full max-h-full max-w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center text-[#66638c]">
                              <IconImagePlaceholder className="h-5 w-5 opacity-40 sm:h-8 sm:w-8" />
                            </div>
                          }
                        />
                        {inCartQty > 0 ? (
                          <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] px-1 text-[9px] font-black text-white shadow-md sm:right-1.5 sm:top-1.5 sm:h-6 sm:min-w-[1.5rem] sm:px-1.5 sm:text-[10px]">
                            ×{inCartQty}
                          </span>
                        ) : null}
                        {low ? (
                          <span className="absolute left-1 top-1 rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[7px] font-black text-white sm:left-1.5 sm:top-1.5 sm:text-[8px]">
                            หมด
                          </span>
                        ) : p.stockBalance <= 5 ? (
                          <span className="absolute left-1 top-1 rounded-full bg-amber-50/95 px-1 py-0.5 text-[7px] font-black text-amber-800 sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px]">
                            ใกล้หมด
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-0 p-1.5 sm:p-2">
                        <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:text-xs">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[10px] font-black tabular-nums text-[#4d47b6] sm:text-xs">
                          ฿{price.toLocaleString("th-TH")}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

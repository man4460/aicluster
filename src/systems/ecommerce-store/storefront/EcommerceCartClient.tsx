"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import { EcommercePortalSection } from "@/systems/ecommerce-store/storefront/EcommercePortalSection";
import { useEcommerceCart } from "@/systems/ecommerce-store/storefront/useEcommerceCart";
import {
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePortalBottomDockClass,
  ecommerceStorePortalPageInnerClass,
  ecommerceStorePortalPageShellClass,
  ecommerceStorePortalPageTitleClass,
  ecommerceStorePortalStickyHeaderClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreRowIconButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Props = {
  storeId: string;
  storeName: string;
};

function CartSummary({
  totalBaht,
  itemCount,
  storeId,
  className,
}: {
  totalBaht: number;
  itemCount: number;
  storeId: string;
  className?: string;
}) {
  return (
    <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5", className)}>
      <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">สรุปตะกร้า</p>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#66638c]">
        <span>{itemCount} รายการ</span>
        <span className="text-lg font-black tabular-nums text-emerald-700">
          ฿{totalBaht.toLocaleString("th-TH")}
        </span>
      </div>
      <Link
        href={`/shop/${storeId}/checkout`}
        className={cn(ecommerceStorePrimaryButtonClass, "w-full")}
      >
        ไปชำระเงิน
      </Link>
      <Link
        href={`/shop/${storeId}`}
        className={cn(ecommerceStoreOutlineButtonClass, "w-full")}
      >
        เลือกสินค้าเพิ่ม
      </Link>
    </div>
  );
}

export function EcommerceCartClient({ storeId, storeName }: Props) {
  const mounted = useMounted();
  const cart = useEcommerceCart(storeId);

  if (!mounted) {
    return (
      <div className={ecommerceStorePortalPageShellClass} aria-hidden>
        <div className={cn(ecommerceStorePortalPageInnerClass, "space-y-3 py-6")}>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className={cn(ecommerceStorePortalPageShellClass, "flex flex-col")}>
        <header className={ecommerceStorePortalStickyHeaderClass}>
          <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center justify-between gap-3 py-3")}>
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>ตะกร้าสินค้า</h1>
            <Link href={`/shop/${storeId}`} className={ecommerceStoreOutlineButtonClass}>
              กลับร้าน
            </Link>
          </div>
        </header>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex flex-1 flex-col items-center justify-center py-16 text-center")}>
          <div className={cn(ecommerceStorePanelClass, "w-full max-w-md space-y-4 p-6")}>
            <p className="text-lg font-black text-[#1e1b4b]">ตะกร้าว่าง</p>
            <p className="text-sm font-medium text-[#66638c]">{storeName}</p>
            <Link href={`/shop/${storeId}`} className={cn(ecommerceStorePrimaryButtonClass, "w-full")}>
              เลือกสินค้า
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ecommerceStorePortalPageShellClass}>
      <header className={ecommerceStorePortalStickyHeaderClass}>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center justify-between gap-3 py-3")}>
          <div className="min-w-0">
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>ตะกร้าสินค้า</h1>
            <p className="truncate text-xs font-semibold text-[#66638c] sm:text-sm">{storeName}</p>
          </div>
          <Link href={`/shop/${storeId}`} className={cn(ecommerceStoreOutlineButtonClass, "shrink-0")}>
            + เพิ่มสินค้า
          </Link>
        </div>
      </header>

      <main
        className={cn(
          ecommerceStorePortalPageInnerClass,
          "grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8",
        )}
      >
        <ul className="space-y-3" aria-label="รายการในตะกร้า">
          {cart.lines.map((line) => (
              <li
                key={line.productId}
                className={cn(ecommerceStorePanelClass, "flex gap-3 p-3 sm:gap-4 sm:p-4")}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
                  <EcommerceRemoteImg
                    src={line.imageUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full items-center justify-center text-[10px] font-semibold text-[#8b87b8]">
                        ไม่มีรูป
                      </div>
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-bold text-[#1e1b4b] sm:text-base">{line.name}</p>
                  <p className="mt-1 text-sm font-black tabular-nums text-emerald-700">
                    ฿{line.priceBaht.toLocaleString("th-TH")}
                    <span className="ml-1 text-xs font-semibold text-[#66638c]">× {line.quantity}</span>
                  </p>
                  <p className="text-[10px] font-medium text-[#8b87b8]">สต๊อกสูงสุด {line.maxStock}</p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      className={ecommerceStoreRowIconButtonClass}
                      aria-label={`ลด ${line.name}`}
                      onClick={() => cart.setQty(line.productId, line.quantity - 1, line.maxStock)}
                    >
                      -
                    </button>
                    <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className={ecommerceStoreRowIconButtonClass}
                      aria-label={`เพิ่ม ${line.name}`}
                      onClick={() => cart.setQty(line.productId, line.quantity + 1, line.maxStock)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      onClick={() => cart.remove(line.productId)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </li>
            ))}
        </ul>

        <aside className="hidden lg:block lg:sticky lg:top-24">
          <CartSummary totalBaht={cart.totalBaht} itemCount={cart.itemCount} storeId={storeId} />
        </aside>
      </main>

      <div className={ecommerceStorePortalBottomDockClass}>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center gap-3")}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-[#66638c]">{cart.itemCount} รายการ</p>
            <p className="text-lg font-black tabular-nums text-emerald-700">
              ฿{cart.totalBaht.toLocaleString("th-TH")}
            </p>
          </div>
          <Link
            href={`/shop/${storeId}/checkout`}
            className={cn(ecommerceStorePrimaryButtonClass, "shrink-0 px-5")}
          >
            ไปชำระเงิน
          </Link>
        </div>
      </div>
    </div>
  );
}

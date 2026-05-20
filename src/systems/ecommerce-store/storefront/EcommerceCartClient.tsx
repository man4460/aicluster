"use client";

import Image from "next/image";
import Link from "next/link";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import { useEcommerceCart } from "@/systems/ecommerce-store/storefront/useEcommerceCart";

type Props = {
  storeId: string;
  storeName: string;
};

export function EcommerceCartClient({ storeId, storeName }: Props) {
  const mounted = useMounted();
  const cart = useEcommerceCart(storeId);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-28" aria-hidden>
        <div className="mx-auto max-w-lg space-y-3 px-4 py-6">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-[#ecebff]/50" />
          <div className="app-surface h-24 animate-pulse rounded-2xl" />
          <div className="app-surface h-24 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white px-4 py-12 text-center">
        <h1 className="font-black text-xl text-[#1e1b4b]">ตะกร้าว่าง</h1>
        <p className="mt-2 text-sm text-[#66638c]">{storeName}</p>
        <Link
          href={`/shop/${storeId}`}
          className="app-btn-primary mt-6 inline-flex min-h-[48px] items-center rounded-2xl px-8 font-bold"
        >
          เลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-32">
      <header className="border-b border-white/60 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <h1 className="font-black text-xl text-[#1e1b4b]">ตะกร้าสินค้า</h1>
            <p className="text-sm text-[#66638c]">{storeName}</p>
          </div>
          <Link href={`/shop/${storeId}`} className="text-sm font-semibold text-[#4d47b6]">
            + เพิ่มสินค้า
          </Link>
        </div>
      </header>

      <ul className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {cart.lines.map((line) => (
          <li
            key={line.productId}
            className="app-surface flex gap-3 rounded-2xl border border-white/60 p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f3f2fa]">
              {line.imageUrl ? (
                <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-[#8b87b8]">ไม่มีรูป</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-bold text-sm text-[#1e1b4b]">{line.name}</p>
              <p className="mt-1 text-sm font-semibold text-[#4d47b6]">
                ฿{line.priceBaht.toLocaleString("th-TH")} × {line.quantity}
              </p>
              <p className="text-[10px] text-[#8b87b8]">สต๊อกสูงสุด {line.maxStock}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="min-h-[36px] min-w-[36px] rounded-lg border border-white/70 bg-white/90 text-sm font-bold text-[#4d47b6]"
                  aria-label={`ลด ${line.name}`}
                  onClick={() => cart.setQty(line.productId, line.quantity - 1, line.maxStock)}
                >
                  -
                </button>
                <span className="min-w-[24px] text-center text-sm font-bold tabular-nums">{line.quantity}</span>
                <button
                  type="button"
                  className="min-h-[36px] min-w-[36px] rounded-lg border border-white/70 bg-white/90 text-sm font-bold text-[#4d47b6]"
                  aria-label={`เพิ่ม ${line.name}`}
                  onClick={() => cart.setQty(line.productId, line.quantity + 1, line.maxStock)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-auto text-xs font-semibold text-rose-600"
                  onClick={() => cart.remove(line.productId)}
                >
                  ลบ
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <p className="mb-2 text-right text-sm text-[#66638c]">
            รวม{" "}
            <span className="font-black text-lg text-[#4d47b6]">
              ฿{cart.totalBaht.toLocaleString("th-TH")}
            </span>
          </p>
          <Link
            href={`/shop/${storeId}/checkout`}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#4d47b6] font-bold text-white shadow-lg"
          >
            ไปชำระเงิน
          </Link>
        </div>
      </div>
    </div>
  );
}

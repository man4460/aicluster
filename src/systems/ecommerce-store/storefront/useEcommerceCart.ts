"use client";

import { useCallback, useEffect, useState } from "react";

export type CartLine = {
  productId: string;
  name: string;
  priceBaht: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
};

const cartKey = (storeId: string) => `mawell-ec-cart:${storeId}`;

function readCart(storeId: string): CartLine[] {
  try {
    const raw = sessionStorage.getItem(cartKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useEcommerceCart(storeId: string) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readCart(storeId));
    setReady(true);
  }, [storeId]);

  const persist = useCallback(
    (next: CartLine[]) => {
      setLines(next);
      try {
        sessionStorage.setItem(cartKey(storeId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storeId],
  );

  const getLineQty = useCallback(
    (productId: string) => lines.find((l) => l.productId === productId)?.quantity ?? 0,
    [lines],
  );

  /** เพิ่มลงตะกร้า — คืน true ถ้าสำเร็จ, false ถ้าเกินสต๊อก */
  const add = useCallback(
    (
      item: Omit<CartLine, "quantity"> & { maxStock: number },
      qty = 1,
    ): boolean => {
      const addQty = Math.max(1, Math.floor(qty));
      const cap = Math.max(0, item.maxStock);
      if (cap <= 0) return false;

      let ok = false;
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === item.productId);
        const nextQty = (existing?.quantity ?? 0) + addQty;
        if (nextQty > cap) return prev;
        ok = true;
        const next = existing
          ? prev.map((l) =>
              l.productId === item.productId
                ? { ...l, quantity: nextQty, maxStock: cap, priceBaht: item.priceBaht }
                : l,
            )
          : [
              ...prev,
              {
                productId: item.productId,
                name: item.name,
                priceBaht: item.priceBaht,
                imageUrl: item.imageUrl,
                maxStock: cap,
                quantity: addQty,
              },
            ];
        try {
          sessionStorage.setItem(cartKey(storeId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      return ok;
    },
    [storeId],
  );

  const setQty = useCallback(
    (productId: string, quantity: number, maxStock?: number) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        if (!existing) return prev;
        const cap = maxStock ?? existing.maxStock;
        const q = Math.min(Math.max(0, Math.floor(quantity)), cap);
        const next =
          q <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, quantity: q, maxStock: cap } : l));
        try {
          sessionStorage.setItem(cartKey(storeId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storeId],
  );

  const remove = useCallback(
    (productId: string) => {
      setLines((prev) => {
        const next = prev.filter((l) => l.productId !== productId);
        try {
          sessionStorage.setItem(cartKey(storeId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storeId],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const totalBaht = lines.reduce((s, l) => s + l.priceBaht * l.quantity, 0);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  return { lines, ready, add, setQty, remove, clear, getLineQty, totalBaht, itemCount };
}

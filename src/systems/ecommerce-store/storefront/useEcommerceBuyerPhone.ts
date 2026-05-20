"use client";

import { useCallback, useEffect, useState } from "react";

const key = (storeId: string) => `ecommerce-buyer-phone:${storeId}`;

export function useEcommerceBuyerPhone(storeId: string) {
  const [phone, setPhoneState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key(storeId));
      if (saved) setPhoneState(saved);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storeId]);

  const setPhone = useCallback(
    (value: string) => {
      setPhoneState(value);
      try {
        if (value.trim()) sessionStorage.setItem(key(storeId), value);
        else sessionStorage.removeItem(key(storeId));
      } catch {
        /* ignore */
      }
    },
    [storeId],
  );

  return { phone, setPhone, ready };
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { drinkPosPublicImageUrl } from "@/lib/drink-pos/drink-stock-images";

/** รูปสินค้า/หมวดจาก URL ภายนอก — กัน hotlink และลิงก์ตาย */
export function DrinkPosRemoteImg({
  src,
  className,
  fallback = null,
  loading = "lazy",
}: {
  src: string | null | undefined;
  className?: string;
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  const s = drinkPosPublicImageUrl(src);
  useEffect(() => {
    setFailed(false);
  }, [s]);
  if (!s || failed) {
    return <>{fallback}</>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={s}
      alt=""
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

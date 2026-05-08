"use client";

import { useState, type ReactNode } from "react";

/**
 * รูปจาก URL ภายนอก — referrerPolicy ลดปัญหา hotlink และแสดง fallback เมื่อโหลดไม่สำเร็จ
 */
export function BuildingPosRemoteImg({
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
  const s = typeof src === "string" ? src.trim() : "";
  if (!s || failed) {
    return <>{fallback}</>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL ภายนอก / อัปโหลด
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

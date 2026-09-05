"use client";

import { useState, type ReactNode } from "react";

/**
 * รูปอัปโหลด / URL — แสดง fallback เมื่อโหลดไม่สำเร็จ (กันไอคอนรูปเสีย)
 */
export function EcommerceRemoteImg({
  src,
  alt = "",
  className,
  fallback = null,
  loading = "lazy",
}: {
  src: string | null | undefined;
  alt?: string;
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
    // eslint-disable-next-line @next/next/no-img-element -- อัปโหลดโลคอล / URL ภายนอก
    <img
      src={s}
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

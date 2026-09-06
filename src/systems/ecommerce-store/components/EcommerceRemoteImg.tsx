"use client";

import { useState, type ReactNode } from "react";

/**
 * รูปอัปโหลด / URL — แสดง fallback เมื่อโหลดไม่สำเร็จ (กันไอคอนรูปเสีย)
 * ผูก failed กับ URL นั้น ๆ — เปลี่ยน src แล้วลองโหลดใหม่ (แกลเลอรีเลื่อนมุม)
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
  const s = typeof src === "string" ? src.trim() : "";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(s) && failedSrc === s;

  if (!s || failed) {
    return <>{fallback}</>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- อัปโหลดโลคอล / URL ภายนอก
    <img
      key={s}
      src={s}
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailedSrc(s)}
    />
  );
}

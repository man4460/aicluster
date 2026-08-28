"use client";

import { useEffect, useState, type ReactNode } from "react";

/** รูปพอร์ทัล — ซ่อนเมื่อโหลดไม่สำเร็จ (ลิงก์เสีย / ไฟล์หาย) */
export function DormPortalRemoteImage({
  src,
  alt = "",
  className,
  fallback = null,
  loading = "lazy",
  onFailed,
  onLoaded,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
  onFailed?: () => void;
  onLoaded?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const s = typeof src === "string" ? src.trim() : "";

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
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding="async"
      onLoad={() => onLoaded?.()}
      onError={() => {
        setFailed(true);
        onFailed?.();
      }}
    />
  );
}

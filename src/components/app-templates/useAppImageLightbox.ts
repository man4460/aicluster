"use client";

import { useCallback, useState } from "react";

export type AppImageLightboxState = {
  /** URL รูปที่กำลังแสดงใน lightbox — ส่งเข้า AppImageLightbox */
  src: string | null;
  /** เปิดดูรูป (trim แล้วว่างจะไม่เปิด) */
  open: (url: string) => void;
  close: () => void;
};

/**
 * state กลางสำหรับคู่ AppImageLightbox — ใช้ซ้ำในทุกหน้าที่มีสลิป/รูปแนบ
 */
export function useAppImageLightbox(): AppImageLightboxState {
  const [src, setSrc] = useState<string | null>(null);
  const open = useCallback((url: string) => {
    const t = url.trim();
    setSrc(t || null);
  }, []);
  const close = useCallback(() => setSrc(null), []);
  return { src, open, close };
}

"use client";

import { useCallback, useState } from "react";

export type AppImageLightboxState = {
  /** URL รูปที่กำลังแสดงใน lightbox — ส่งเข้า AppImageLightbox */
  src: string | null;
  /** ชุดรูปเลื่อนดู (ถ้ามี) */
  sources: string[] | null;
  /** ดัชนีเริ่มต้นเมื่อเปิดชุดรูป */
  initialIndex: number;
  /** เปิดดูรูปเดี่ยว (trim แล้วว่างจะไม่เปิด) */
  open: (url: string) => void;
  /** เปิดชุดรูปเลื่อนได้ — เริ่มที่ index */
  openGallery: (urls: string[], index?: number) => void;
  close: () => void;
};

/**
 * state กลางสำหรับคู่ AppImageLightbox — ใช้ซ้ำในทุกหน้าที่มีสลิป/รูปแนบ
 */
export function useAppImageLightbox(): AppImageLightboxState {
  const [src, setSrc] = useState<string | null>(null);
  const [sources, setSources] = useState<string[] | null>(null);
  const [initialIndex, setInitialIndex] = useState(0);

  const open = useCallback((url: string) => {
    const t = url.trim();
    setSources(null);
    setInitialIndex(0);
    setSrc(t || null);
  }, []);

  const openGallery = useCallback((urls: string[], index = 0) => {
    const list = urls.map((u) => u.trim()).filter(Boolean);
    if (!list.length) {
      setSrc(null);
      setSources(null);
      setInitialIndex(0);
      return;
    }
    const i = Math.max(0, Math.min(index, list.length - 1));
    setSources(list);
    setInitialIndex(i);
    setSrc(list[i] ?? null);
  }, []);

  const close = useCallback(() => {
    setSrc(null);
    setSources(null);
    setInitialIndex(0);
  }, []);

  return { src, sources, initialIndex, open, openGallery, close };
}

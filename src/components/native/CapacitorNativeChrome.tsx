"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

/**
 * ตั้ง StatusBar ในแอป Capacitor — ไม่ให้เนื้อหาทับไอคอนสถานะมือถือ
 */
export function CapacitorNativeChrome() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: "#1e1b4b" });
        await StatusBar.setStyle({ style: Style.Dark });
        document.documentElement.classList.add("capacitor-native");
      } catch {
        /* web / plugin ยังไม่ sync */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

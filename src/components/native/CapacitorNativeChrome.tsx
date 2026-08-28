"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

/** สีพื้นหลังหลักของแอป — ตรงกับ `--background` ใน globals.css */
const MAWELL_NATIVE_STATUS_BAR_COLOR = "#f7f6ff";

/**
 * ตั้งแถบสถานะในแอป Capacitor — เนื้อหาไม่ทับไอคอนระบบ
 * ใช้สีเดียวกับพื้นหลังหน้าเว็บ ไอคอนระบบโทนเข้ม (Light style)
 */
export function CapacitorNativeChrome() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("capacitor-native");

    let cancelled = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: MAWELL_NATIVE_STATUS_BAR_COLOR });
        await StatusBar.setStyle({ style: Style.Light });
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

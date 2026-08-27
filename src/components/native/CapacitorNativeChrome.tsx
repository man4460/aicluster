"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

/**
 * ตั้งแถบสถานะในแอป Capacitor — เนื้อหาไม่ทับไอคอนระบบ
 *
 * - iOS: แถบโปร่ง (`overlay: true`) แล้วเว็บวาดไล่สีแบรนด์เอง (`html.capacitor-ios::before`)
 *   ได้โทนเดียวกับปุ่ม CTA — native วาดได้แต่สีเดียว ไล่สีไม่ได้
 * - Android: WebView อยู่ใต้แถบสถานะ (`setDecorFitsSystemWindows(true)` ใน MainActivity)
 *   จึง safe-area = 0 → ใช้พื้นทึบตามธีมต่อไป
 */
export function CapacitorNativeChrome() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const isIos = Capacitor.getPlatform() === "ios";
    const root = document.documentElement;
    root.classList.add("capacitor-native");
    if (isIos) root.classList.add("capacitor-ios");

    let cancelled = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        // ไอคอนระบบสีขาว — พื้นหลังเป็นไล่สีเข้มทั้งสองแพลตฟอร์ม
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: isIos });
        if (!isIos) {
          await StatusBar.setBackgroundColor({ color: "#0000bf" });
        }
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

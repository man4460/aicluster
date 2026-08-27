"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * เลิกชวนติดตั้งแบบ PWA / Add to Home Screen
 * แอปจริงคือ Capacitor APK — คู่มืออยู่ที่ /download-app
 */
export const PWA_BROWSER_INSTALL_ENABLED = false;

export type PwaInstallPlatform = "ios" | "android" | "other";

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Capacitor WebView
    const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function detectPwaPlatform(): PwaInstallPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function isIpadDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type PwaInstallContextValue = {
  isStandalone: boolean;
  platform: PwaInstallPlatform;
  isIpad: boolean;
  isMobile: boolean;
  canNativeInstall: boolean;
  showBanner: boolean;
  installing: boolean;
  iosGuideOpen: boolean;
  androidGuideOpen: boolean;
  setIosGuideOpen: (open: boolean) => void;
  setAndroidGuideOpen: (open: boolean) => void;
  install: () => Promise<boolean>;
  openInstallGuide: () => void;
  dismiss: () => void;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);
  const [platform] = useState(detectPwaPlatform);
  const [isIpad] = useState(isIpadDevice);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    if (isStandaloneMode()) {
      document.documentElement.classList.add("pwa-standalone");
    }
  }, []);

  /** กลืน beforeinstallprompt ของ Chrome — ไม่โชว์ «ติดตั้งแอป» แบบเบราว์เซอร์ */
  useEffect(() => {
    if (PWA_BROWSER_INSTALL_ENABLED) return;
    const block = (event: Event) => {
      event.preventDefault();
    };
    window.addEventListener("beforeinstallprompt", block);
    return () => window.removeEventListener("beforeinstallprompt", block);
  }, []);

  const dismiss = useCallback(() => {}, []);
  const openInstallGuide = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.assign("/download-app");
    }
  }, []);
  const install = useCallback(async () => {
    openInstallGuide();
    return false;
  }, [openInstallGuide]);

  const isMobile = platform === "ios" || platform === "android";
  const value = useMemo<PwaInstallContextValue>(
    () => ({
      isStandalone,
      platform,
      isIpad,
      isMobile,
      canNativeInstall: false,
      showBanner: false,
      installing: false,
      iosGuideOpen: false,
      androidGuideOpen: false,
      setIosGuideOpen: () => {},
      setAndroidGuideOpen: () => {},
      install,
      openInstallGuide,
      dismiss,
    }),
    [isStandalone, platform, isIpad, isMobile, install, openInstallGuide, dismiss],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}

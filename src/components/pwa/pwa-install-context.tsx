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

const DISMISS_KEY = "mawell.v1.pwaInstallDismissedAt";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type PwaInstallPlatform = "ios" | "android" | "other";

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
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

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < ms;
  } catch {
    return false;
  }
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
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(isDismissedRecently);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [androidGuideOpen, setAndroidGuideOpen] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    if (isStandaloneMode()) {
      document.documentElement.classList.add("pwa-standalone");
    }
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanNativeInstall(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setCanNativeInstall(false);
      setIsStandalone(true);
      document.documentElement.classList.add("pwa-standalone");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setIosGuideOpen(false);
    setAndroidGuideOpen(false);
  }, []);

  const openInstallGuide = useCallback(() => {
    if (platform === "ios") {
      setIosGuideOpen(true);
      return;
    }
    if (platform === "android") {
      if (deferredPrompt) {
        void (async () => {
          setInstalling(true);
          try {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setCanNativeInstall(false);
          } catch {
            setAndroidGuideOpen(true);
          } finally {
            setInstalling(false);
          }
        })();
        return;
      }
      setAndroidGuideOpen(true);
    }
  }, [deferredPrompt, platform]);

  const install = useCallback(async () => {
    if (platform === "ios") {
      setIosGuideOpen(true);
      return false;
    }
    if (!deferredPrompt) {
      setAndroidGuideOpen(true);
      return false;
    }
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanNativeInstall(false);
      return outcome === "accepted";
    } catch {
      return false;
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt, platform]);

  const isMobile = platform === "ios" || platform === "android";
  const showBanner =
    !isStandalone &&
    !dismissed &&
    isMobile &&
    (canNativeInstall || platform === "ios" || platform === "android");

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      isStandalone,
      platform,
      isIpad,
      isMobile,
      canNativeInstall,
      showBanner,
      installing,
      iosGuideOpen,
      androidGuideOpen,
      setIosGuideOpen,
      setAndroidGuideOpen,
      install,
      openInstallGuide,
      dismiss,
    }),
    [
      isStandalone,
      platform,
      isIpad,
      isMobile,
      canNativeInstall,
      showBanner,
      installing,
      iosGuideOpen,
      androidGuideOpen,
      install,
      openInstallGuide,
      dismiss,
    ],
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

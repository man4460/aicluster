"use client";

import { useCallback, useEffect, useState } from "react";
import { isStandaloneMode } from "@/components/pwa/pwa-install-context";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}

function isBrowserFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FullscreenElement;
  return Boolean(
    el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen,
  );
}

async function requestBrowserFullscreen(): Promise<boolean> {
  const el = document.documentElement as FullscreenElement;
  const req =
    el.requestFullscreen?.bind(el) ??
    el.webkitRequestFullscreen?.bind(el) ??
    el.msRequestFullscreen?.bind(el);
  if (!req) return false;
  try {
    await req();
    return Boolean(getFullscreenElement());
  } catch {
    return false;
  }
}

async function exitBrowserFullscreen(): Promise<boolean> {
  const doc = document as FullscreenDocument;
  const exit =
    document.exitFullscreen?.bind(document) ??
    doc.webkitExitFullscreen?.bind(document) ??
    doc.msExitFullscreen?.bind(document);
  if (!exit) return false;
  try {
    await exit();
    return !getFullscreenElement();
  } catch {
    return false;
  }
}

export type AppBrowserFullscreenState = {
  /** อยู่ในโหมดเต็มจอของเบราว์เซอร์ */
  isFullscreen: boolean;
  /** เบราว์เซอร์รองรับ Fullscreen API */
  supported: boolean;
  /** แอป native / PWA standalone — ไม่ต้องมีปุ่ม */
  hideControl: boolean;
  toggle: () => Promise<boolean>;
  enter: () => Promise<boolean>;
  exit: () => Promise<boolean>;
};

export function useAppBrowserFullscreen(): AppBrowserFullscreenState {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [hideControl, setHideControl] = useState(false);

  useEffect(() => {
    setSupported(isBrowserFullscreenSupported());
    setHideControl(isStandaloneMode());
    setIsFullscreen(Boolean(getFullscreenElement()));

    const sync = () => setIsFullscreen(Boolean(getFullscreenElement()));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  const enter = useCallback(async () => {
    const ok = await requestBrowserFullscreen();
    setIsFullscreen(Boolean(getFullscreenElement()));
    return ok;
  }, []);

  const exit = useCallback(async () => {
    const ok = await exitBrowserFullscreen();
    setIsFullscreen(Boolean(getFullscreenElement()));
    return ok;
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) return exit();
    return enter();
  }, [enter, exit]);

  return { isFullscreen, supported, hideControl, toggle, enter, exit };
}

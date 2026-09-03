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

/** ผู้ใช้กดปุ่มเต็มจอ — คงไว้จนกว่าจะกดปุ่มออก (dialog พิมพ์/โฟกัสหายไม่ถือว่าออก) */
export const APP_BROWSER_FULLSCREEN_RESTORE_MESSAGE = "mawell-restore-fullscreen";

let fullscreenWanted = false;
let intentionalExit = false;
let listenersInstalled = false;
let restoreTimer: ReturnType<typeof setTimeout> | null = null;
let restoreAttempts = 0;

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

async function restoreBrowserFullscreenNow(): Promise<boolean> {
  if (!fullscreenWanted || intentionalExit) return false;
  if (getFullscreenElement()) return true;
  if (!isBrowserFullscreenSupported()) return false;
  return requestBrowserFullscreen();
}

function scheduleRestoreBrowserFullscreen(): void {
  if (!fullscreenWanted || intentionalExit) return;
  if (getFullscreenElement()) return;

  if (restoreTimer) clearTimeout(restoreTimer);
  restoreAttempts = 0;

  const tryRestore = () => {
    if (!fullscreenWanted || intentionalExit || getFullscreenElement()) return;
    restoreAttempts += 1;
    void restoreBrowserFullscreenNow().then((ok) => {
      if (ok || !fullscreenWanted || intentionalExit) return;
      if (restoreAttempts < 6) {
        restoreTimer = setTimeout(tryRestore, restoreAttempts < 2 ? 80 : 250);
      }
    });
  };

  restoreTimer = setTimeout(tryRestore, 0);
}

/** เรียกหลังพิมพ์ / เมื่อเบราว์เซอร์ออกจากเต็มจอโดยไม่ได้กดปุ่มออก */
export function restoreAppBrowserFullscreenIfWanted(): void {
  scheduleRestoreBrowserFullscreen();
}

function onFullscreenChange(): void {
  if (!fullscreenWanted || intentionalExit) return;
  if (!getFullscreenElement()) scheduleRestoreBrowserFullscreen();
}

function installPersistentFullscreenListeners(): void {
  if (listenersInstalled || typeof document === "undefined") return;
  listenersInstalled = true;

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
  window.addEventListener("afterprint", scheduleRestoreBrowserFullscreen);
  window.addEventListener("focus", scheduleRestoreBrowserFullscreen);
  window.addEventListener("message", (event) => {
    if (event.data === APP_BROWSER_FULLSCREEN_RESTORE_MESSAGE) {
      scheduleRestoreBrowserFullscreen();
    }
  });
}

export type AppBrowserFullscreenState = {
  /** อยู่ในโหมดเต็มจอของเบราว์เซอร์ (DOM จริง) */
  isFullscreen: boolean;
  /** ผู้ใช้เปิดโหมดเต็มจอไว้ — คงจนกว่าจะกดปุ่มออก (รวมช่วง dialog พิมพ์) */
  pinned: boolean;
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
  const [pinned, setPinned] = useState(false);
  const [supported, setSupported] = useState(false);
  const [hideControl, setHideControl] = useState(false);

  useEffect(() => {
    installPersistentFullscreenListeners();
    setSupported(isBrowserFullscreenSupported());
    setHideControl(isStandaloneMode());
    setPinned(fullscreenWanted);
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
    fullscreenWanted = true;
    setPinned(true);
    const ok = await requestBrowserFullscreen();
    setIsFullscreen(Boolean(getFullscreenElement()));
    return ok;
  }, []);

  const exit = useCallback(async () => {
    fullscreenWanted = false;
    setPinned(false);
    intentionalExit = true;
    try {
      const ok = await exitBrowserFullscreen();
      setIsFullscreen(Boolean(getFullscreenElement()));
      return ok;
    } finally {
      intentionalExit = false;
    }
  }, []);

  const toggle = useCallback(async () => {
    if (fullscreenWanted) return exit();
    return enter();
  }, [enter, exit]);

  return { isFullscreen, pinned, supported, hideControl, toggle, enter, exit };
}

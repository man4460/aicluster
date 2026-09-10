/** จำสถานะหน้าแรกเมื่อไป/กลับจาก /try — ใช้ sessionStorage (ต่อแท็บเบราว์เซอร์) */

export type LandingModuleTab = "free" | "daily";

const TAB_KEY = "mawell-landing-module-tab";
const SCROLL_KEY = "mawell-landing-scroll-y";
const HERO_KEY = "mawell-landing-hero-index";
const RESTORE_FLAG = "mawell-landing-restore";

export function saveLandingVisitState(opts?: {
  tab?: LandingModuleTab;
  heroIndex?: number;
  /** ตั้งเมื่อกำลังออกไปหน้าทดลอง — ให้หน้าแรก restore เลื่อนเมื่อกลับมา */
  markForRestore?: boolean;
  /** บันทึกตำแหน่งเลื่อน (ค่าเริ่ม: true เมื่อ markForRestore) */
  saveScroll?: boolean;
}): void {
  if (typeof window === "undefined") return;
  try {
    if (opts?.tab === "free" || opts?.tab === "daily") {
      window.sessionStorage.setItem(TAB_KEY, opts.tab);
    }
    if (typeof opts?.heroIndex === "number" && Number.isFinite(opts.heroIndex)) {
      window.sessionStorage.setItem(HERO_KEY, String(Math.max(0, Math.floor(opts.heroIndex))));
    }
    const shouldSaveScroll = opts?.saveScroll ?? Boolean(opts?.markForRestore);
    if (shouldSaveScroll) {
      window.sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY || 0)));
    }
    if (opts?.markForRestore) {
      window.sessionStorage.setItem(RESTORE_FLAG, "1");
    }
  } catch {
    /* ignore */
  }
}

export function readLandingVisitState(): {
  tab: LandingModuleTab | null;
  scrollY: number | null;
  heroIndex: number | null;
  shouldRestore: boolean;
} {
  if (typeof window === "undefined") {
    return { tab: null, scrollY: null, heroIndex: null, shouldRestore: false };
  }
  try {
    const tabRaw = window.sessionStorage.getItem(TAB_KEY);
    const tab = tabRaw === "free" || tabRaw === "daily" ? tabRaw : null;
    const scrollRaw = window.sessionStorage.getItem(SCROLL_KEY);
    const scrollY = scrollRaw != null && scrollRaw !== "" ? Number(scrollRaw) : null;
    const heroRaw = window.sessionStorage.getItem(HERO_KEY);
    const heroIndex = heroRaw != null && heroRaw !== "" ? Number(heroRaw) : null;
    const shouldRestore = window.sessionStorage.getItem(RESTORE_FLAG) === "1";
    return {
      tab,
      scrollY: Number.isFinite(scrollY) ? scrollY : null,
      heroIndex: Number.isFinite(heroIndex) ? heroIndex : null,
      shouldRestore,
    };
  } catch {
    return { tab: null, scrollY: null, heroIndex: null, shouldRestore: false };
  }
}

export function clearLandingRestoreFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RESTORE_FLAG);
  } catch {
    /* ignore */
  }
}

export function markLandingRestorePending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESTORE_FLAG, "1");
  } catch {
    /* ignore */
  }
}

/** ลิงก์กลับหน้าแรกที่ส่วนโมดูล */
export const LANDING_HOME_MODULES_HREF = "/#modules" as const;

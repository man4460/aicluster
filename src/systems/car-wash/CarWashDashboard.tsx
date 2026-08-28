"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppMobileDockShell,
  AppUsageGuideModal,
  appMobileDockGridClass,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import {
  CAR_WASH_HEADER_COLLAPSE_EVENT,
  CAR_WASH_SETTINGS_LINK_HREF,
  CAR_WASH_SETTINGS_PATH,
  CAR_WASH_TAB_ITEMS,
  carWashTabHref,
  carWashTabIcon,
  isCarWashTabActive,
  parseCarWashTab,
  readCarWashHeaderCollapsed,
  type CarWashTabKey,
  writeCarWashHeaderCollapsed,
} from "@/systems/car-wash/car-wash-module-nav";
import {
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { StaffQrLandingShell } from "@/components/qr/staff-qr-landing-shell";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import {
  carWashAccentBarClass,
  carWashContentStackClass,
  carWashCtaClass,
  carWashFieldClass,
  carWashFilterChipClass,
  carWashFilterFieldGridClass,
  carWashHeaderCollapseBtnClass,
  carWashHeaderEnLabelClass,
  carWashHeaderToolbarGroupClass,
  carWashMainPaddingBottomClass,
  carWashModuleIconBadgeClass,
  carWashNavActiveClass,
  carWashNavIdleClass,
  carWashShellWrapperClass,
  carWashStatGridClass,
  carWashSubTabSegmentShellClass,
  carWashVisitFieldClass,
} from "@/systems/car-wash/car-wash-ui-tokens";
import { CarWashPaymentPanel } from "@/systems/car-wash/CarWashPaymentPanel";
import {
  printCarWashBundleReceipt,
  printCarWashVisitReceipt,
  type CarWashPrintShopProfile,
} from "@/systems/car-wash/lib/car-wash-print-docs";
import {
  carWashPaymentIsPayLater,
  carWashPaymentMethodLabel,
  type CarWashPaymentMethod,
} from "@/systems/car-wash/lib/payment-method";
import { CAR_WASH_VISIT_EVIDENCE_MAX } from "@/systems/car-wash/lib/visit-media";
import { CAR_WASH_SERVICE_STATUSES, carWashStatusLabelTh } from "@/lib/car-wash/service-status";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import {
  PopupIconButton,
  popupIconBtnDanger,
} from "@/systems/car-wash/car-wash-popup-icon-buttons";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { CarWashSalesPanel } from "@/systems/car-wash/CarWashSalesPanel";
import { CarWashServiceLanePanel } from "@/systems/car-wash/CarWashServiceLanePanel";
import { CarWashCostPanel } from "@/systems/car-wash/CarWashCostPanel";
import { useCarWashLaneBoardSse } from "@/systems/car-wash/lib/use-car-wash-lane-board-sse";
import {
  CarWashDashboardHubClient,
} from "@/systems/car-wash/CarWashDashboardHubClient";
import { CarWashBookingsClient } from "@/systems/car-wash/CarWashBookingsClient";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  buildBookableStartSlots,
  carWashNormalizeDurationMinutes,
  scheduledAtLocalFromSlot,
  type SlotAvailabilityItem,
} from "@/lib/car-wash/booking-slot-availability";
import {
  carWashComputePortalPayDue,
  normalizeCarWashPortalPaymentMode,
  type CarWashPortalBookingPaymentMode,
} from "@/lib/car-wash/portal-booking";
import {
  type CarWashServiceStatus,
  type CarWashStaffAuth,
  type CostCategory,
  type CostEntry,
  createCarWashSessionApiRepository,
  uploadCarWashPackageImage,
  uploadCarWashSessionImage,
  type ServiceVisit,
  type ServicePackage,
  type WashBundle,
  type WashBundlePatch,
} from "@/systems/car-wash/car-wash-service";
import {
  ModuleShopSettingsDesktopNavLink,
  ModuleShopSettingsDockLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";

const CAR_WASH_MODULE_LABEL = "โมดูล";

type TabKey = CarWashTabKey;
type OffersListTabKey = "packages" | "bundles";
type PackageStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type BundleStatusFilter = "ALL" | "READY" | "EXHAUSTED" | "INACTIVE";

function OffersFilterFunnelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function CarWashHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

function CarWashStat({
  title,
  value,
  tone = "blue",
  icon: Icon,
}: {
  title: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate" | "amber";
  icon?: React.ReactNode;
}) {
  const toneStyles = {
    blue: "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl",
    green: "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl",
    red: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)] backdrop-blur-xl",
    amber: "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)] backdrop-blur-xl",
    slate: "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)] backdrop-blur-xl",
  };

  const valueGradientClass =
    "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-6",
      toneStyles[tone]
    )}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{title}</p>
          {Icon && <div className="opacity-40">{Icon}</div>}
        </div>
        <p className={cn("mt-4 text-2xl font-black tabular-nums tracking-tight sm:text-3xl", valueGradientClass)}>{value}</p>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}

function normalizePlate(s: string): string {
  return s.trim().replace(/\s+/g, "").toLowerCase();
}

function phoneLooseMatch(storedPhone: string, queryDigits: string): boolean {
  const a = storedPhone.replace(/\D/g, "");
  if (!a || !queryDigits) return false;
  if (a === queryDigits) return true;
  if (queryDigits.length >= 6 && (a.endsWith(queryDigits) || queryDigits.endsWith(a))) return true;
  return false;
}

function plateLooseMatch(storedPlate: string, query: string): boolean {
  const b = normalizePlate(query);
  if (b.length < 2) return false;
  const a = normalizePlate(storedPlate);
  return a.includes(b) || b.includes(a);
}

type CustomerLookupMatch =
  | { kind: "bundle"; b: WashBundle }
  | { kind: "visit"; v: ServiceVisit };

function findCustomerLookupMatch(
  q: string,
  bundleRows: WashBundle[],
  visitRows: ServiceVisit[],
): CustomerLookupMatch | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const qDigits = trimmed.replace(/\D/g, "");

  const pickBundle = (list: WashBundle[]) =>
    list
      .filter((x) => x.is_active && x.used_uses < x.total_uses)
      .sort((xa, xb) => xb.total_uses - xb.used_uses - (xa.total_uses - xa.used_uses))[0] ?? list[0];

  if (qDigits.length >= 6) {
    const byPhone = bundleRows.filter((b) => phoneLooseMatch(b.customer_phone, qDigits));
    const pb = pickBundle(byPhone);
    if (pb) return { kind: "bundle", b: pb };
  }
  if (trimmed.length >= 2) {
    const byPlate = bundleRows.filter((b) => plateLooseMatch(b.plate_number, trimmed));
    const pl = pickBundle(byPlate);
    if (pl) return { kind: "bundle", b: pl };
  }

  const visSorted = [...visitRows].sort((a, b) => (a.visit_at < b.visit_at ? 1 : -1));
  if (qDigits.length >= 6) {
    const v = visSorted.find((x) => phoneLooseMatch(x.customer_phone, qDigits));
    if (v) return { kind: "visit", v };
  }
  if (trimmed.length >= 2) {
    const v2 = visSorted.find((x) => plateLooseMatch(x.plate_number, trimmed));
    if (v2) return { kind: "visit", v: v2 };
  }

  return null;
}

export function CarWashDashboard({
  shopLabel,
  logoUrl,
  baseUrl,
  recorderDisplayName,
  ownerId,
  trialSessionId,
  isTrialSandbox,
  paymentChannelsNote = null,
  shopPrintProfile = null,
  defaultTab,
  layoutVariant = "full",
  staffPortal = false,
  staffAuth = null,
  forcedTab,
  refreshNonce = 0,
}: {
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  recorderDisplayName: string;
  ownerId: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  /** จากโปรไฟล์หอพัก (prod) — แสดงในบิล / QR เหมือน POS */
  paymentChannelsNote?: string | null;
  /** โปรไฟล์พิมพ์ใบเสร็จ + ขนาดสลิปจากตั้งค่าโมดูล */
  shopPrintProfile?: CarWashPrintShopProfile | null;
  /** แท็บเริ่มต้นเมื่อ layoutVariant เป็น full */
  defaultTab?: TabKey;
  /** staff_lane = หน้าพนักงานจาก QR (ล็อกอินร้าน) · lane_board = ลานล้างเต็มจอ (SSE) */
  layoutVariant?: "full" | "staff_lane" | "lane_board";
  /** พอร์ทัลลิงก์พนักงานแบบโทเค็น (ไม่ล็อกอิน) — เมนูจำกัดภาพรวม+แพ็ก · API โทเค็น */
  staffPortal?: boolean;
  staffAuth?: CarWashStaffAuth | null;
  /** แท็บที่ถูกบังคับเมื่อ staffPortal (คุมจากภายนอกโดย CarWashStaffClient) */
  forcedTab?: Extract<TabKey, "overview" | "offers">;
  refreshNonce?: number;
}) {
  /** พอร์ทัลลิงก์พนักงาน — ใส่โทเค็นแทน session cookie ทุกคำขอ (repo + อัปโหลดรูป) */
  const effectiveStaffAuth = staffPortal ? staffAuth : null;
  const repo = useMemo(
    () => createCarWashSessionApiRepository({ staffAuth: staffPortal ? staffAuth : null }),
    [staffPortal, staffAuth],
  );
  const lightbox = useAppImageLightbox();

  const isLaneBoard = layoutVariant === "lane_board";
  const isStaffLaneOnly = layoutVariant === "staff_lane" || isLaneBoard;
  /** ซ่อนหัว/เมนู/แถบล่าง — ทั้งลานล้างเต็มจอ · หน้าลานล็อกอิน · พอร์ทัลโทเค็นพนักงาน */
  const hideChrome = isStaffLaneOnly || staffPortal;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const tabFromUrl = useMemo(() => parseCarWashTab(searchParams.get("tab")), [searchParams]);
  const [tab, setTabState] = useState<TabKey>(
    staffPortal ? (forcedTab ?? "overview") : isStaffLaneOnly ? "overview" : (defaultTab ?? tabFromUrl),
  );
  const [loading, setLoading] = useState(true);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readCarWashHeaderCollapsed());

  useEffect(() => {
    if (staffPortal) {
      setTabState(forcedTab ?? "overview");
      return;
    }
    if (!isStaffLaneOnly) setTabState(tabFromUrl);
  }, [tabFromUrl, isStaffLaneOnly, staffPortal, forcedTab]);

  useLayoutEffect(() => {
    if (isStaffLaneOnly || staffPortal) return;
    if (searchParams.get("tab") === "qr") {
      router.replace(CAR_WASH_SETTINGS_LINK_HREF, { scroll: false });
    }
  }, [searchParams, router, isStaffLaneOnly, staffPortal]);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readCarWashHeaderCollapsed());
    sync();
    window.addEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeCarWashHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const setTab = useCallback(
    (key: TabKey) => {
      setTabState(key);
      if (isStaffLaneOnly || staffPortal) return;
      const q = new URLSearchParams(searchParams.toString());
      if (key === "overview") q.delete("tab");
      else q.set("tab", key);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [isStaffLaneOnly, staffPortal, pathname, router, searchParams],
  );

  /** พอร์ทัลลิงก์พนักงาน — ต่อท้าย ownerId/t/k/du ทุกคำขอ แทน session cookie */
  const staffApiUrl = useCallback(
    (path: string) => {
      if (!staffPortal || !staffAuth) return path;
      const qs = new URLSearchParams({
        ownerId: staffAuth.ownerId,
        t: staffAuth.trialSessionId,
        k: staffAuth.k,
      });
      const unlock = readStoredStaffDailyUnlock("car-wash", staffAuth.ownerId);
      if (unlock) qs.set("du", unlock);
      return `${path}?${qs.toString()}`;
    },
    [staffPortal, staffAuth],
  );
  const staffApiInit = useCallback(
    (init?: RequestInit): RequestInit => {
      if (!staffPortal || !staffAuth) return { ...init, credentials: init?.credentials ?? "include" };
      const headerBag = new Headers(init?.headers);
      const unlockHeaders = staffDailyUnlockHeaders("car-wash", staffAuth.ownerId);
      for (const [key, value] of Object.entries(unlockHeaders)) headerBag.set(key, value);
      return { ...init, credentials: "omit", headers: headerBag };
    },
    [staffPortal, staffAuth],
  );
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [bundles, setBundles] = useState<WashBundle[]>([]);
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: "",
    price: "",
    duration_minutes: "60",
    total_uses: "1",
    description: "",
    image_url: null as string | null,
    is_active: true,
  });
  const [pkgImageBusy, setPkgImageBusy] = useState(false);
  const pkgGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openPkgCamera,
    cameraInputRef: pkgCameraInputRef,
    cameraModal: pkgCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปแพ็กเกจ" });
  const pkgLightbox = useAppImageLightbox();

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitAdvancedOpen, setVisitAdvancedOpen] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [offersListTab, setOffersListTab] = useState<OffersListTabKey>("packages");
  const [offersFilterOpen, setOffersFilterOpen] = useState(true);
  const [pkgStatusFilter, setPkgStatusFilter] = useState<PackageStatusFilter>("ALL");
  const [pkgQuery, setPkgQuery] = useState("");
  const [bundleStatusFilter, setBundleStatusFilter] = useState<BundleStatusFilter>("ALL");
  const [bundleQuery, setBundleQuery] = useState("");
  const [visitLookupHint, setVisitLookupHint] = useState<string | null>(null);
  const visitFormRef = useRef<HTMLFormElement>(null);
  const visitGalleryInputRef = useRef<HTMLInputElement>(null);
  const visitCameraInputRef = useRef<HTMLInputElement>(null);
  const [visitPhotoBusy, setVisitPhotoBusy] = useState(false);
  const [visitCameraOpen, setVisitCameraOpen] = useState(false);
  const [visitEntryMode, setVisitEntryMode] = useState<"walkin" | "bundle">("walkin");
  const [visitForm, setVisitForm] = useState({
    customer_lookup: "",
    customer_name: "",
    customer_phone: "",
    plate_number: "",
    package_id: "",
    bundle_id: "",
    final_price: "",
    note: "",
    recorded_by_override: "",
    /** รูปหลักฐานสภาพรถตอนรับรถ (ไม่ใช่สลิปชำระ) */
    evidence_photo_urls: [] as string[],
  });
  const [bundleForm, setBundleForm] = useState({
    customer_name: "",
    customer_phone: "",
    plate_number: "",
    package_id: "",
    paid_amount: "1000",
    total_uses: "10",
    is_active: true,
    slip_photo_url: "",
  });
  const bundleTabLightbox = useAppImageLightbox();
  const bundleTabGalleryRef = useRef<HTMLInputElement>(null);
  const bundleTabCameraRef = useRef<HTMLInputElement>(null);
  const bundleTabSlipTargetIdRef = useRef<number | null>(null);
  const [bundleTabPhotoBusy, setBundleTabPhotoBusy] = useState(false);
  const [bundleTabCameraOpen, setBundleTabCameraOpen] = useState(false);
  const [bundleTabRowDetailId, setBundleTabRowDetailId] = useState<number | null>(null);
  const [bundleEditTarget, setBundleEditTarget] = useState<WashBundle | null>(null);
  const [bundleEditForm, setBundleEditForm] = useState<{
    customer_name: string;
    customer_phone: string;
    plate_number: string;
    package_id: string;
    paid_amount: string;
    total_uses: string;
    is_active: boolean;
  } | null>(null);
  const [bundleEditSaving, setBundleEditSaving] = useState(false);
  const bundleEditFormRef = useRef<HTMLFormElement>(null);
  const bundleModalSlipGalleryRef = useRef<HTMLInputElement>(null);
  /** เข้าลานตอนบันทึก — แสดงบนแดชบอร์ด POS */
  const [visitLaneStatus, setVisitLaneStatus] = useState<CarWashServiceStatus>("WASHING");
  const [visitPaymentMethod, setVisitPaymentMethod] = useState<CarWashPaymentMethod>("CASH");
  const [visitPaymentSlipUrl, setVisitPaymentSlipUrl] = useState<string | null>(null);
  const [visitPrintReceipt, setVisitPrintReceipt] = useState(false);
  const [visitBookDateKey, setVisitBookDateKey] = useState(() => bangkokDateKey());
  const [visitSelectedSlot, setVisitSelectedSlot] = useState("");
  const [visitSlotAvailability, setVisitSlotAvailability] = useState<SlotAvailabilityItem[]>([]);
  const [visitScheduleSlotMinutes, setVisitScheduleSlotMinutes] = useState(30);
  const [visitScheduleClosed, setVisitScheduleClosed] = useState(false);
  const [visitScheduleLoading, setVisitScheduleLoading] = useState(false);
  const [visitBookPayMode, setVisitBookPayMode] = useState<CarWashPortalBookingPaymentMode>("NONE");
  const [visitShopDeposit, setVisitShopDeposit] = useState<number | null>(null);
  const [laneBusyVisitId, setLaneBusyVisitId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeBundles = useMemo(
    () => bundles.filter((b) => b.is_active && b.used_uses < b.total_uses),
    [bundles],
  );

  const packageFilterStats = useMemo(() => {
    const active = packages.filter((p) => p.is_active).length;
    return {
      total: packages.length,
      active,
      inactive: packages.length - active,
    };
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const q = pkgQuery.trim().toLowerCase();
    return packages.filter((p) => {
      if (pkgStatusFilter === "ACTIVE" && !p.is_active) return false;
      if (pkgStatusFilter === "INACTIVE" && p.is_active) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [packages, pkgQuery, pkgStatusFilter]);

  const packageFiltersActive = pkgStatusFilter !== "ALL" || pkgQuery.trim().length > 0;

  const bundleFilterStats = useMemo(() => {
    let ready = 0;
    let exhausted = 0;
    let inactive = 0;
    for (const b of bundles) {
      if (!b.is_active) {
        inactive += 1;
        continue;
      }
      if (b.used_uses >= b.total_uses) exhausted += 1;
      else ready += 1;
    }
    return { total: bundles.length, ready, exhausted, inactive };
  }, [bundles]);

  const filteredBundles = useMemo(() => {
    const q = bundleQuery.trim().toLowerCase();
    const phoneQ = bundleQuery.replace(/\D/g, "");
    return bundles.filter((b) => {
      const remaining = Math.max(0, b.total_uses - b.used_uses);
      if (bundleStatusFilter === "READY" && !(b.is_active && remaining > 0)) return false;
      if (bundleStatusFilter === "EXHAUSTED" && !(b.is_active && remaining <= 0)) return false;
      if (bundleStatusFilter === "INACTIVE" && b.is_active) return false;
      if (!q && phoneQ.length < 1) return true;
      const phone = (b.customer_phone ?? "").replace(/\D/g, "");
      if (phoneQ.length > 0 && phone.includes(phoneQ)) return true;
      const hay = `${b.customer_name} ${b.customer_phone} ${b.plate_number} ${b.package_name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [bundles, bundleQuery, bundleStatusFilter]);

  const bundleFiltersActive = bundleStatusFilter !== "ALL" || bundleQuery.trim().length > 0;
  const offersFiltersActive = offersListTab === "packages" ? packageFiltersActive : bundleFiltersActive;

  const bundleTabRowDetail = useMemo(
    () =>
      bundleTabRowDetailId != null ? bundles.find((x) => x.id === bundleTabRowDetailId) ?? null : null,
    [bundleTabRowDetailId, bundles],
  );

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [pkgRows, bundleRows, visitRows, catRows, costRows] = await Promise.all([
        repo.listPackages(),
        repo.listBundles(),
        repo.listVisits(),
        repo.listCostCategories(),
        repo.listCostEntries(),
      ]);
      setPackages(pkgRows);
      setBundles(bundleRows);
      setVisits(visitRows);
      setCostCategories(catRows);
      setCostEntries(costRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [repo]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll, refreshNonce]);

  /** พอร์ทัลลิงก์พนักงาน — ต่อ query ให้ SSE (EventSource ตั้ง header เองไม่ได้) */
  const staffStreamQuery = useMemo(() => {
    if (!staffPortal || !staffAuth) return undefined;
    const qs = new URLSearchParams({
      ownerId: staffAuth.ownerId,
      t: staffAuth.trialSessionId,
      k: staffAuth.k,
    });
    const unlock = readStoredStaffDailyUnlock("car-wash", staffAuth.ownerId);
    if (unlock) qs.set("du", unlock);
    return qs.toString();
  }, [staffPortal, staffAuth]);

  /** SSE ลานล้าง — หน้าเต็มจอเปิดเสมอ · แดชบอร์ด/พนักงานเมื่อแท็บภาพรวมหรือ staff */
  useCarWashLaneBoardSse(
    () => {
      void loadAll({ silent: true });
    },
    isLaneBoard || isStaffLaneOnly || tab === "overview",
    staffStreamQuery,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      /** เมื่อมี SSE แล้วไม่ต้อง poll 60s ซ้ำหนัก — soft-poll อยู่ใน hook */
      if (isLaneBoard) return;
      void loadAll({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAll, isLaneBoard]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [loadAll]);

  useEffect(() => {
    const onQueueChanged = () => {
      void loadAll({ silent: true });
    };
    window.addEventListener("car-wash-queue-changed", onQueueChanged);
    return () => window.removeEventListener("car-wash-queue-changed", onQueueChanged);
  }, [loadAll]);

  useEffect(() => {
    if (bundleTabRowDetailId == null) return;
    if (!bundles.some((b) => b.id === bundleTabRowDetailId)) setBundleTabRowDetailId(null);
  }, [bundleTabRowDetailId, bundles]);

  const todayStats = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const keyOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const todayRows = visits.filter((v) => keyOf(v.visit_at) === todayKey);
    const uniqueCustomers = new Set(todayRows.map((v) => `${v.customer_name}|${v.plate_number}`)).size;
    const packageUses = todayRows.filter((v) => v.package_id != null).length;
    const visitRevenue = todayRows.reduce((sum, v) => sum + v.final_price, 0);
    const bundleRevenue = bundles
      .filter((b) => keyOf(b.created_at) === todayKey)
      .reduce((sum, b) => sum + b.paid_amount, 0);
    return {
      totalVisits: todayRows.length,
      uniqueCustomers,
      packageUses,
      revenue: visitRevenue + bundleRevenue,
    };
  }, [visits, bundles]);

  function openCreatePackage() {
    setEditingPkg(null);
    setPkgForm({
      name: "",
      price: "",
      duration_minutes: "60",
      total_uses: "1",
      description: "",
      image_url: null,
      is_active: true,
    });
    setShowPkgModal(true);
  }

  function openEditPackage(row: ServicePackage) {
    setEditingPkg(row);
    setPkgForm({
      name: row.name,
      price: String(row.price),
      duration_minutes: String(row.duration_minutes),
      total_uses: String(row.total_uses ?? 1),
      description: row.description ?? "",
      image_url: row.image_url?.trim() || null,
      is_active: row.is_active,
    });
    setShowPkgModal(true);
  }

  async function onPkgImageFile(file: File) {
    setPkgImageBusy(true);
    setError(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const url = await uploadCarWashPackageImage(prepared, effectiveStaffAuth);
      setPkgForm((s) => ({ ...s, image_url: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setPkgImageBusy(false);
    }
  }

  async function submitPackage(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(pkgForm.price);
    const duration = Number(pkgForm.duration_minutes);
    const totalUses = Math.max(1, Math.trunc(Number(pkgForm.total_uses)) || 1);
    if (!pkgForm.name.trim() || !Number.isFinite(price) || !Number.isFinite(duration)) return;
    if (editingPkg) {
      await repo.updatePackage(editingPkg.id, {
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        total_uses: totalUses,
        description: pkgForm.description.trim(),
        image_url: pkgForm.image_url,
        is_active: pkgForm.is_active,
      });
    } else {
      await repo.createPackage({
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        total_uses: totalUses,
        description: pkgForm.description.trim(),
        image_url: pkgForm.image_url,
        is_active: pkgForm.is_active,
      });
    }
    setShowPkgModal(false);
    await loadAll();
  }

  async function removePackage(id: number) {
    if (!confirm("ยืนยันลบแพ็กเกจนี้?")) return;
    await repo.deletePackage(id);
    await loadAll();
  }

  function openVisitModal() {
    setError(null);
    setVisitLookupHint(null);
    setVisitForm({
      customer_lookup: "",
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      bundle_id: "",
      final_price: "",
      note: "",
      recorded_by_override: "",
      evidence_photo_urls: [],
    });
    setVisitLaneStatus("WASHING");
    setVisitPaymentMethod("CASH");
    setVisitPaymentSlipUrl(null);
    setVisitPrintReceipt(false);
    setVisitEntryMode("walkin");
    setVisitAdvancedOpen(false);
    setVisitBookDateKey(bangkokDateKey());
    setVisitSelectedSlot("");
    setVisitSlotAvailability([]);
    setShowVisitModal(true);
  }

  const visitSelectedPkg = useMemo(
    () => packages.find((p) => String(p.id) === visitForm.package_id) ?? null,
    [packages, visitForm.package_id],
  );

  const visitBookableSlots = useMemo(
    () =>
      buildBookableStartSlots(
        visitSlotAvailability,
        visitScheduleSlotMinutes,
        carWashNormalizeDurationMinutes(visitSelectedPkg?.duration_minutes, visitScheduleSlotMinutes),
      ),
    [visitSlotAvailability, visitScheduleSlotMinutes, visitSelectedPkg?.duration_minutes],
  );

  const visitBookingPayDue = useMemo(
    () =>
      carWashComputePortalPayDue({
        mode: visitBookPayMode,
        depositAmountBaht: visitShopDeposit,
        totalBaht: visitSelectedPkg?.price ?? 0,
      }),
    [visitBookPayMode, visitShopDeposit, visitSelectedPkg?.price],
  );

  const loadVisitSchedule = useCallback(async (dk: string) => {
    setVisitScheduleLoading(true);
    try {
      const res = await fetch(
        staffApiUrl(`/api/car-wash/day-schedules?date=${encodeURIComponent(dk)}`),
        staffApiInit(),
      );
      const j = (await res.json().catch(() => ({}))) as {
        slotMinutes?: number;
        isClosed?: boolean;
        slotAvailability?: SlotAvailabilityItem[];
        error?: string;
      };
      if (!res.ok) {
        setError(j.error ?? "โหลดตารางเวลาไม่สำเร็จ");
        setVisitSlotAvailability([]);
        return;
      }
      setVisitScheduleSlotMinutes(j.slotMinutes ?? 30);
      setVisitScheduleClosed(Boolean(j.isClosed));
      const slots = j.slotAvailability ?? [];
      setVisitSlotAvailability(slots);
      setVisitSelectedSlot((prev) =>
        slots.some((s) => s.time === prev && s.available) ? prev : slots.find((s) => s.available)?.time ?? "",
      );
    } finally {
      setVisitScheduleLoading(false);
    }
  }, [staffApiUrl, staffApiInit]);

  useEffect(() => {
    if (!showVisitModal || visitEntryMode !== "walkin") return;
    void loadVisitSchedule(visitBookDateKey);
  }, [showVisitModal, visitEntryMode, visitBookDateKey, loadVisitSchedule]);

  useEffect(() => {
    if (!showVisitModal) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          staffApiUrl("/api/car-wash/session/booking-payment"),
          staffApiInit(),
        );
        const j = (await res.json().catch(() => ({}))) as {
          bookingPayment?: { portalBookingPaymentMode?: string; depositAmountBaht?: number | null };
        };
        if (!res.ok || cancelled) return;
        setVisitBookPayMode(normalizeCarWashPortalPaymentMode(j.bookingPayment?.portalBookingPaymentMode));
        setVisitShopDeposit(j.bookingPayment?.depositAmountBaht ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showVisitModal, staffApiUrl, staffApiInit]);

  const visitPayAmountBaht = useMemo(() => {
    if (visitEntryMode !== "walkin") return 0;
    const isFuture = visitBookDateKey > bangkokDateKey();
    if (isFuture && visitBookingPayDue != null) return visitBookingPayDue;
    const raw = Number(visitForm.final_price);
    if (Number.isFinite(raw) && raw >= 0) return raw;
    const pkg = packages.find((p) => String(p.id) === visitForm.package_id);
    return pkg?.price ?? 0;
  }, [
    visitEntryMode,
    visitForm.final_price,
    visitForm.package_id,
    packages,
    visitBookDateKey,
    visitBookingPayDue,
  ]);

  function resolveVisitPrintShop(): CarWashPrintShopProfile {
    const rawLogo = shopPrintProfile?.logoUrl || logoUrl;
    return {
      displayName: shopPrintProfile?.displayName?.trim() || shopLabel,
      logoUrl: rawLogo ? resolveAssetUrl(rawLogo, baseUrl) : null,
      address: shopPrintProfile?.address ?? null,
      taxId: shopPrintProfile?.taxId ?? null,
      contactPhone: shopPrintProfile?.contactPhone ?? null,
      bankAccountName: shopPrintProfile?.bankAccountName ?? null,
      slipPaperSize: shopPrintProfile?.slipPaperSize ?? null,
    };
  }

  function runVisitLookup() {
    setError(null);
    const q = visitForm.customer_lookup.trim();
    if (!q) {
      setVisitLookupHint("กรุณากรอกเบอร์โทรหรือทะเบียนรถ");
      return;
    }
    const m = findCustomerLookupMatch(q, bundles, visits);
    if (m?.kind === "bundle") {
      const b = m.b;
      setVisitEntryMode("bundle");
      setVisitForm((s) => ({
        ...s,
        bundle_id: String(b.id),
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        plate_number: b.plate_number,
        package_id: String(b.package_id),
        final_price: "0",
      }));
      setVisitLookupHint("พบข้อมูลจากแพ็กเกจเหมา — ระบบเติมข้อมูลแล้ว (ตัดสิทธิ์ 1 ครั้งเมื่อบันทึก)");
      return;
    }
    if (m?.kind === "visit") {
      if (visitEntryMode === "bundle") {
        setVisitLookupHint("ไม่พบลูกค้าแพ็กเหมาในคำค้นนี้ — ลองค้นหาเบอร์/ทะเบียนที่ซื้อแพ็กเหมา");
        return;
      }
      const v = m.v;
      setVisitEntryMode("walkin");
      setVisitForm((s) => ({
        ...s,
        bundle_id: "",
        customer_name: v.customer_name,
        customer_phone: v.customer_phone || "",
        plate_number: v.plate_number,
        package_id: "",
        final_price: "",
      }));
      setVisitLookupHint("พบจากประวัติการใช้บริการ — เลือกบริการด้านบนแล้วตรวจเบอร์/ทะเบียน");
      return;
    }
    setVisitForm((s) => ({
      ...s,
      bundle_id: "",
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      final_price: "",
      note: "",
      evidence_photo_urls: [],
    }));
    setVisitEntryMode("walkin");
    setVisitLookupHint("ไม่พบข้อมูล — กรอกเบอร์หรือทะเบียนเป็น Walk-in (ชื่อไม่บังคับ)");
  }

  async function submitVisit(e: React.FormEvent) {
    e.preventDefault();
    if (visitEntryMode === "bundle" && !visitForm.bundle_id) {
      setError("กรุณาค้นหาและเลือกลูกค้าแพ็กเหมาก่อนบันทึก");
      return;
    }
    const customerName = visitForm.customer_name.trim();
    const plateNumber = visitForm.plate_number.trim();
    const phoneDigits = visitForm.customer_phone.replace(/\D/g, "").trim();
    if (visitEntryMode === "walkin") {
      if (!visitForm.package_id) {
        setError("กรุณาเลือกบริการ/แพ็กเกจก่อนบันทึก");
        return;
      }
      const hasPlate = plateNumber.length > 0;
      const hasPhone = phoneDigits.length > 0;
      if (!hasPlate && !hasPhone) {
        setError("กรุณากรอกเบอร์โทรหรือทะเบียนรถอย่างน้อยหนึ่งอย่าง");
        return;
      }
      if (phoneDigits.length > 0 && phoneDigits.length < 9) {
        setError("เบอร์โทรต้องอย่างน้อย 9 หลัก หรือลบเบอร์ที่กรอกไม่ครบแล้วใช้ทะเบียนแทน");
        return;
      }
    } else if (!plateNumber) {
      setError("กรุณาระบุทะเบียนรถ");
      return;
    }
    setError(null);
    const recordedBy = visitForm.recorded_by_override.trim() || recorderDisplayName;
    const bundleId = visitForm.bundle_id ? Number(visitForm.bundle_id) : null;
    const resetVisitModal = () => {
      setShowVisitModal(false);
      setVisitLookupHint(null);
      setVisitLaneStatus("WASHING");
      setVisitPaymentMethod("CASH");
      setVisitPaymentSlipUrl(null);
      setVisitPrintReceipt(false);
      setVisitForm({
        customer_lookup: "",
        customer_name: "",
        customer_phone: "",
        plate_number: "",
        package_id: "",
        bundle_id: "",
        final_price: "",
        note: "",
        recorded_by_override: "",
        evidence_photo_urls: [],
      });
    };
    if (bundleId != null) {
      const b = bundles.find((x) => x.id === bundleId);
      if (!b || !b.is_active || b.used_uses >= b.total_uses) {
        setError("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
        return;
      }
      const remainingAfter = Math.max(0, b.total_uses - b.used_uses - 1);
      const evidenceUrls = visitForm.evidence_photo_urls
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, CAR_WASH_VISIT_EVIDENCE_MAX);
      try {
        await repo.createVisit({
          customer_name: customerName,
          customer_phone: b.customer_phone,
          plate_number: plateNumber,
          package_id: b.package_id,
          package_name: `เหมาจ่าย: ${b.package_name}`,
          listed_price: 0,
          final_price: 0,
          note: visitForm.note.trim(),
          recorded_by_name: recordedBy,
          service_status: visitLaneStatus,
          photo_url: "",
          evidence_photo_urls: evidenceUrls,
          bundle_id: bundleId,
          booking_id: null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "บันทึกรายการไม่สำเร็จ");
        return;
      }
      if (visitPrintReceipt) {
        printCarWashVisitReceipt({
          shop: resolveVisitPrintShop(),
          customerName: customerName || b.customer_name || "ลูกค้า",
          customerPhone: b.customer_phone,
          plateNumber,
          packageName: `เหมาจ่าย: ${b.package_name}`,
          priceBaht: 0,
          paymentMethod: "CASH",
          soldAtIso: new Date().toISOString(),
          note: `เหลือ ${remainingAfter}/${b.total_uses} ครั้ง`,
        });
      }
      resetVisitModal();
      await loadAll();
      return;
    }
    const pkgId = visitForm.package_id ? Number(visitForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    const listedPrice = pkg?.price ?? 0;
    const finalPriceRaw = Number(visitForm.final_price);
    const finalPrice = Number.isFinite(finalPriceRaw) ? finalPriceRaw : listedPrice;
    const payLabel = carWashPaymentMethodLabel(visitPaymentMethod);
    const noteBase = visitForm.note.trim();
    const noteWithPay =
      finalPrice > 0 || carWashPaymentIsPayLater(visitPaymentMethod)
        ? [noteBase, `ชำระ: ${payLabel}`].filter(Boolean).join(" · ")
        : noteBase;
    const payLater = carWashPaymentIsPayLater(visitPaymentMethod);
    const photoUrl = payLater ? "" : (visitPaymentSlipUrl?.trim() || "").trim();
    const evidenceUrls = visitForm.evidence_photo_urls
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, CAR_WASH_VISIT_EVIDENCE_MAX);

    if (!visitSelectedSlot) {
      setError("เลือกช่วงเวลาก่อนบันทึก");
      return;
    }
    if (visitScheduleClosed) {
      setError("วันที่เลือกปิดรับจอง");
      return;
    }
    if (phoneDigits.length < 9) {
      setError("จองคิวต้องมีเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }

    const todayKey = bangkokDateKey();
    const isFuture = visitBookDateKey > todayKey;
    const bookingPayDue = visitBookingPayDue;
    if (!payLater && bookingPayDue != null && bookingPayDue > 0) {
      if (
        (visitPaymentMethod === "PROMPTPAY" || visitPaymentMethod === "TRANSFER") &&
        !visitPaymentSlipUrl
      ) {
        setError(visitBookPayMode === "FULL" ? "แนบสลิปชำระเต็มยอด" : "แนบสลิปมัดจำ");
        return;
      }
    }

    let bookingId: number | null = null;
    try {
      const chargeNow = !payLater && bookingPayDue != null && bookingPayDue > 0;
      const bookRes = await fetch(
        staffApiUrl("/api/car-wash/bookings"),
        staffApiInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phoneDigits,
            plateNumber: plateNumber || null,
            customerName: customerName || null,
            packageId: pkgId,
            scheduledAtLocal: scheduledAtLocalFromSlot(visitBookDateKey, visitSelectedSlot),
            paymentMethod: payLater ? "PAY_LATER" : chargeNow ? visitPaymentMethod : "UNPAID",
            amountPaidBaht: chargeNow ? bookingPayDue : 0,
            paymentSlipUrl: chargeNow ? visitPaymentSlipUrl : null,
          }),
        }),
      );
      const bookJ = (await bookRes.json().catch(() => ({}))) as {
        error?: string;
        booking?: { id?: number; scheduledAt?: string };
      };
      if (!bookRes.ok) {
        setError(bookJ.error ?? "จองคิวไม่สำเร็จ");
        return;
      }
      bookingId = Number(bookJ.booking?.id) || null;

      if (isFuture) {
        resetVisitModal();
        setError(null);
        window.dispatchEvent(new CustomEvent("car-wash-queue-changed"));
        await loadAll();
        window.alert(`บันทึกคิวจองล่วงหน้าแล้ว — ดูที่เมนูจัดการคิว วันที่ ${visitBookDateKey}`);
        return;
      }

      if (bookingId != null) {
        const arriveRes = await fetch(
          staffApiUrl(`/api/car-wash/bookings/${bookingId}`),
          staffApiInit({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ARRIVED" }),
          }),
        );
        const arriveJ = (await arriveRes.json().catch(() => ({}))) as {
          booking?: { visitId?: number | null };
        };
        const visitId = arriveJ.booking?.visitId;
        if (visitId != null) {
          await repo.updateVisit(visitId, {
            ...(customerName.trim() ? { customer_name: customerName.trim() } : {}),
            ...(plateNumber.trim() ? { plate_number: plateNumber.trim() } : {}),
            listed_price: listedPrice,
            final_price: finalPrice,
            note: noteWithPay,
            recorded_by_name: recordedBy,
            service_status: visitLaneStatus,
            photo_url: photoUrl,
            evidence_photo_urls: evidenceUrls,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกรายการไม่สำเร็จ");
      return;
    }
    if (visitPrintReceipt && !payLater) {
      printCarWashVisitReceipt({
        shop: resolveVisitPrintShop(),
        customerName: customerName || plateNumber || phoneDigits || "ลูกค้า",
        customerPhone: phoneDigits,
        plateNumber,
        packageName: pkg?.name ?? "บริการพิเศษ",
        priceBaht: finalPrice,
        paymentMethod: visitPaymentMethod,
        soldAtIso: new Date().toISOString(),
        note: noteBase || null,
      });
    }
    resetVisitModal();
    await loadAll();
  }

  async function handleVisitLaneStatus(id: number, status: CarWashServiceStatus) {
    setLaneBusyVisitId(id);
    setError(null);
    try {
      await repo.updateVisitStatus(id, status);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setLaneBusyVisitId(null);
    }
  }

  async function handleLaneVisitPhoto(id: number, photoUrl: string) {
    setLaneBusyVisitId(id);
    setError(null);
    try {
      await repo.updateVisit(id, { photo_url: photoUrl });
      await loadAll();
    } catch {
      setError("อัปโหลดหรือบันทึกรูปไม่สำเร็จ");
    } finally {
      setLaneBusyVisitId(null);
    }
  }

  async function handleLaneVisitEvidence(id: number, evidencePhotoUrls: string[]) {
    setLaneBusyVisitId(id);
    setError(null);
    try {
      await repo.updateVisit(id, { evidence_photo_urls: evidencePhotoUrls });
      await loadAll();
    } catch {
      setError("บันทึกรูปหลักฐานรถไม่สำเร็จ");
    } finally {
      setLaneBusyVisitId(null);
    }
  }

  async function handleLanePayment(
    id: number,
    payload: {
      service_status: "PAID";
      photo_url?: string;
      note?: string;
      signature_image_url?: string | null;
    },
  ) {
    setLaneBusyVisitId(id);
    setError(null);
    try {
      await repo.updateVisit(id, {
        service_status: payload.service_status,
        ...(payload.photo_url !== undefined ? { photo_url: payload.photo_url } : {}),
        ...(payload.note !== undefined ? { note: payload.note } : {}),
        ...(payload.signature_image_url !== undefined
          ? { signature_image_url: payload.signature_image_url }
          : {}),
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกการชำระไม่สำเร็จ");
      throw e;
    } finally {
      setLaneBusyVisitId(null);
    }
  }

  const onVisitGalleryFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (picked.length === 0) return;
    const slotsLeft = CAR_WASH_VISIT_EVIDENCE_MAX - visitForm.evidence_photo_urls.length;
    if (slotsLeft <= 0) {
      window.alert(`แนบรูปหลักฐานได้ไม่เกิน ${CAR_WASH_VISIT_EVIDENCE_MAX} รูป`);
      return;
    }
    const files = picked.slice(0, slotsLeft);
    if (picked.length > slotsLeft) {
      window.alert(
        `แนบได้สูงสุด ${CAR_WASH_VISIT_EVIDENCE_MAX} รูป — จะอัปโหลด ${files.length} รูปจากที่เลือก`,
      );
    }
    setVisitPhotoBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared, effectiveStaffAuth);
        uploaded.push(url);
      }
      if (uploaded.length === 0) return;
      setVisitForm((s) => ({
        ...s,
        evidence_photo_urls: [...s.evidence_photo_urls, ...uploaded].slice(
          0,
          CAR_WASH_VISIT_EVIDENCE_MAX,
        ),
      }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setVisitPhotoBusy(false);
    }
  }, [effectiveStaffAuth, visitForm.evidence_photo_urls.length]);

  const onVisitCameraCaptured = useCallback(async (file: File) => {
    setVisitCameraOpen(false);
    if (visitForm.evidence_photo_urls.length >= CAR_WASH_VISIT_EVIDENCE_MAX) {
      window.alert(`แนบรูปหลักฐานได้ไม่เกิน ${CAR_WASH_VISIT_EVIDENCE_MAX} รูป`);
      return;
    }
    setVisitPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared, effectiveStaffAuth);
      setVisitForm((s) => {
        if (s.evidence_photo_urls.length >= CAR_WASH_VISIT_EVIDENCE_MAX) return s;
        return {
          ...s,
          evidence_photo_urls: [...s.evidence_photo_urls, url].slice(0, CAR_WASH_VISIT_EVIDENCE_MAX),
        };
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setVisitPhotoBusy(false);
    }
  }, [effectiveStaffAuth, visitForm.evidence_photo_urls.length]);

  async function submitBundle(e: React.FormEvent) {
    e.preventDefault();
    const totalUses = Number(bundleForm.total_uses);
    const paidAmount = Number(bundleForm.paid_amount);
    const customerName = bundleForm.customer_name.trim();
    const customerPhone = bundleForm.customer_phone.replace(/\D/g, "").trim();
    const plateNumber = bundleForm.plate_number.trim();
    const packageId = Number(bundleForm.package_id);
    const selectedPackage = packages.find((p) => p.id === packageId) ?? null;
    if (!customerName || !plateNumber || !selectedPackage) return;
    if (customerPhone.length < 9) {
      setError("สมัครแพ็กเกจเหมาต้องใส่เบอร์โทรลูกค้าอย่างน้อย 9 หลัก");
      return;
    }
    if (!Number.isFinite(totalUses) || totalUses <= 0) return;
    if (!Number.isFinite(paidAmount) || paidAmount < 0) return;
    setError(null);
    await repo.createBundle({
      customer_name: customerName,
      customer_phone: customerPhone,
      plate_number: plateNumber,
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
      paid_amount: paidAmount,
      total_uses: totalUses,
      is_active: bundleForm.is_active,
      slip_photo_url: bundleForm.slip_photo_url.trim(),
    });
    setShowBundleModal(false);
    setBundleForm({
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      paid_amount: "1000",
      total_uses: "10",
      is_active: true,
      slip_photo_url: "",
    });
    await loadAll();
  }

  async function removeBundle(id: number) {
    if (!confirm("ยืนยันลบแพ็กเกจเหมารายการนี้?")) return;
    setBundleTabRowDetailId((cur) => (cur === id ? null : cur));
    await repo.deleteBundle(id);
    await loadAll();
  }

  const { paper: slipPaper } = useAppSlipPaperSize(shopPrintProfile?.slipPaperSize);

  function printBundleSlipDashboard(b: WashBundle) {
    const ok = printCarWashBundleReceipt(resolveVisitPrintShop(), b);
    if (!ok) {
      window.alert("แพ็กเหมานี้มียอด ฿0 — ไม่พิมพ์ใบเสร็จรับเงิน");
    }
  }

  const onBundleModalGalleryFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBundleTabPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared, effectiveStaffAuth);
      setBundleForm((s) => ({ ...s, slip_photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBundleTabPhotoBusy(false);
    }
  }, [effectiveStaffAuth]);

  const onBundleModalCameraCaptured = useCallback(async (file: File) => {
    setBundleTabPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared, effectiveStaffAuth);
      setBundleForm((s) => ({ ...s, slip_photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBundleTabPhotoBusy(false);
    }
  }, [effectiveStaffAuth]);

  const finalizeBundleTabListSlip = useCallback(
    async (file: File) => {
      const id = bundleTabSlipTargetIdRef.current;
      bundleTabSlipTargetIdRef.current = null;
      if (id == null) return;
      setBundleTabPhotoBusy(true);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared, effectiveStaffAuth);
        await repo.updateBundle(id, { slip_photo_url: url });
        await loadAll();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
      } finally {
        setBundleTabPhotoBusy(false);
      }
    },
    [repo, loadAll, effectiveStaffAuth],
  );

  const onBundleUnifiedCameraCaptured = useCallback(
    async (file: File) => {
      setBundleTabCameraOpen(false);
      const tid = bundleTabSlipTargetIdRef.current;
      bundleTabSlipTargetIdRef.current = null;
      if (tid != null) {
        bundleTabSlipTargetIdRef.current = tid;
        await finalizeBundleTabListSlip(file);
      } else {
        await onBundleModalCameraCaptured(file);
      }
    },
    [finalizeBundleTabListSlip, onBundleModalCameraCaptured],
  );

  const onBundleTabGalleryChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeBundleTabListSlip(file);
    },
    [finalizeBundleTabListSlip],
  );

  async function clearBundleTabSlip(id: number) {
    if (!confirm("ลบสลิปออกจากแพ็กเหมานี้?")) return;
    try {
      await repo.updateBundle(id, { slip_photo_url: "" });
      await loadAll();
    } catch {
      setError("อัปเดตไม่สำเร็จ");
    }
  }

  function openBundleEditFromTab(b: WashBundle) {
    setBundleTabRowDetailId(null);
    setBundleEditTarget(b);
    setBundleEditForm({
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      plate_number: b.plate_number,
      package_id: String(b.package_id),
      paid_amount: String(b.paid_amount),
      total_uses: String(b.total_uses),
      is_active: b.is_active,
    });
  }

  async function submitBundleEditFromTab() {
    if (!bundleEditTarget || !bundleEditForm) return;
    const phoneDigits = bundleEditForm.customer_phone.replace(/\D/g, "").trim();
    if (phoneDigits.length < 9) {
      setError("แพ็กเหมาต้องใส่เบอร์โทรลูกค้าอย่างน้อย 9 หลัก");
      return;
    }
    const pkgId = bundleEditForm.package_id ? Number(bundleEditForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    if (!pkg) {
      setError("เลือกแพ็กเกจบริการ");
      return;
    }
    const paidRaw = Number(bundleEditForm.paid_amount);
    const usesRaw = Number(bundleEditForm.total_uses);
    if (!Number.isFinite(paidRaw) || paidRaw < 0 || !Number.isFinite(usesRaw) || usesRaw < 1) {
      setError("ข้อมูลยอดหรือจำนวนครั้งไม่ถูกต้อง");
      return;
    }
    if (usesRaw < bundleEditTarget.used_uses) {
      setError("จำนวนครั้งรวมต้องไม่น้อยกว่าที่ใช้ไปแล้ว");
      return;
    }
    setError(null);
    setBundleEditSaving(true);
    try {
      const patch: WashBundlePatch = {
        customer_name: bundleEditForm.customer_name.trim(),
        customer_phone: phoneDigits,
        plate_number: bundleEditForm.plate_number.trim(),
        package_id: pkg.id,
        package_name: pkg.name,
        paid_amount: paidRaw,
        total_uses: usesRaw,
        is_active: bundleEditForm.is_active,
      };
      await repo.updateBundle(bundleEditTarget.id, patch);
      setBundleEditTarget(null);
      setBundleEditForm(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBundleEditSaving(false);
    }
  }

  const tabItems = CAR_WASH_TAB_ITEMS;

  const bookingDateKey = bangkokDateKey();

  const serviceLanePanelEl = (
    <CarWashServiceLanePanel
      visits={visits}
      packages={packages}
      baseUrl={baseUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      paymentChannelsNote={paymentChannelsNote}
      shopPrintProfile={shopPrintProfile}
      busyVisitId={laneBusyVisitId}
      onSetStatus={handleVisitLaneStatus}
      onVisitPhotoUpdate={handleLaneVisitPhoto}
      onVisitEvidenceUpdate={handleLaneVisitEvidence}
      onLanePayment={handleLanePayment}
      onRecordVisit={openVisitModal}
      onRefresh={() => void refreshData()}
      refreshing={refreshing}
      iconOnlyActions={layoutVariant === "staff_lane"}
      staffLayout={layoutVariant === "staff_lane"}
      showFullscreenBoardLink={!isLaneBoard && !staffPortal}
      fullscreenBoardHref="/dashboard/car-wash/lane-board"
      staffAuth={effectiveStaffAuth}
      showHubTabToolbar={!isStaffLaneOnly && !isLaneBoard}
    />
  );

  return (
    <div
      className={cn(
        "max-w-full",
        carWashContentStackClass,
        !hideChrome && carWashMainPaddingBottomClass,
        isLaneBoard && "min-h-dvh",
      )}
    >
      {!hideChrome ? (
        <header className={cn(carWashShellWrapperClass, headerCollapsed && "hidden")}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className={carWashModuleIconBadgeClass} aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                      <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                      <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6] sm:block" aria-hidden>
                      {CAR_WASH_MODULE_LABEL}
                    </p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">คาร์แคร์</h1>
                  </div>
                </div>
              </div>
              <div className={carWashHeaderToolbarGroupClass}>
                <button
                  type="button"
                  onClick={toggleHeader}
                  className={cn("inline-flex", carWashHeaderCollapseBtnClass)}
                  aria-expanded={!headerCollapsed}
                  aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  title={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  suppressHydrationWarning
                >
                  <CarWashHeaderCollapseGlyph />
                </button>
                <button
                  type="button"
                  onClick={() => setUsageGuideOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" />
                  </svg>
                  <span className="hidden sm:inline">คู่มือ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className={carWashAccentBarClass} aria-hidden />
          </div>

          <nav
            aria-label="เมนูคาร์แคร์"
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
          >
            <ul className="flex gap-1">
              {tabItems.map((item) => {
                const active = isCarWashTabActive(pathname, item.key, searchParams.get("tab")) || tab === item.key;
                return (
                  <li key={item.key} className="flex-1 min-w-0">
                    <Link
                      href={carWashTabHref(item.key)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all min-h-[44px]",
                        active ? carWashNavActiveClass : carWashNavIdleClass,
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className={cn("h-4 w-4 shrink-0", active ? "text-white/95" : "text-slate-400")}
                        aria-hidden
                      >
                        {carWashTabIcon(item.key)}
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {moduleShopSettingsDesktopNavItem(
                <ModuleShopSettingsDesktopNavLink href={CAR_WASH_SETTINGS_PATH} active={false} />,
              )}
            </ul>
          </nav>
        </header>
      ) : null}

      {!hideChrome ? (
        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือการใช้งาน — ระบบคาร์แคร์"
          subtitle="วิธีใช้งานแบบละเอียดทุกเมนูในระบบคาร์แคร์"
          sections={[
            {
              title: "ลำดับเริ่มต้นแนะนำ",
              content: (
                <>
                  <p>
                    เริ่มจากตั้ง <strong className="font-semibold text-[#2e2a58]">แพ็กเกจ</strong> และ{" "}
                    <strong className="font-semibold text-[#2e2a58]">แพ็กเกจเหมา</strong> ก่อน แล้วใช้{" "}
                    <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> รับรถรายวัน และติดตามผลที่{" "}
                    <strong className="font-semibold text-[#2e2a58]">ยอดขาย</strong>
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                    <li>เพิ่มแพ็กเกจบริการและราคา</li>
                    <li>เปิดรับลูกค้าและบันทึกรายการล้าง</li>
                    <li>ตรวจยอดขาย ต้นทุน และพิมพ์ใบรายการ</li>
                  </ol>
                </>
              ),
            },
            {
              title: "เมนู: แดชบอร์ด",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ดูสถิติวันนี้ เช่น จำนวนคิว รายรับ และแพ็กเกจที่ใช้</li>
                  <li>ติดตามสถานะรถในลาน (กำลังล้าง/รอชำระ/เสร็จแล้ว)</li>
                  <li>ใช้เป็นหน้าหลักสำหรับพนักงานรับรถ</li>
                </ul>
              ),
            },
            {
              title: "เมนู: ยอดขาย",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ดูรายการขายย้อนหลังและยอดรวมตามช่วงเวลา</li>
                  <li>แก้ไขข้อมูลบิล ยอดเงิน หรือรูปแนบเมื่อบันทึกผิด</li>
                  <li>พิมพ์เอกสารรายการขายและตรวจประวัติรถลูกค้า</li>
                </ul>
              ),
            },
            {
              title: "เมนู: ต้นทุน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>บันทึกค่าน้ำยา ค่าแรง และค่าใช้จ่ายประจำวัน</li>
                  <li>ดูสุทธิรายรับ-รายจ่ายจริงของกิจการคาร์แคร์</li>
                  <li>ใช้ข้อมูลนี้วิเคราะห์กำไรและปรับราคาแพ็กเกจ</li>
                </ul>
              ),
            },
            {
              title: "เมนู: แพ็กเกจ",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สร้างบริการ เช่น ล้างธรรมดา เคลือบสี ดูดฝุ่น</li>
                  <li>กำหนดราคา ระยะเวลา และสถานะเปิดใช้งาน</li>
                  <li>แพ็กเกจที่ปิดใช้งานจะไม่ให้เลือกในงานรับรถใหม่</li>
                </ul>
              ),
            },
            {
              title: "เมนู: แพ็กเกจเหมา",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ขายแพ็กหลายครั้งให้ลูกค้าและติดตามสิทธิ์คงเหลือ</li>
                  <li>บันทึกสลิปการชำระและแก้ข้อมูลลูกค้าได้</li>
                  <li>ใช้กับลูกค้าประจำเพื่อลดเวลารับเงินสดหน้างาน</li>
                </ul>
              ),
            },
            {
              title: "เมนู: QR พนักงาน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สร้างทางเข้าหน้าลานสำหรับพนักงานจากมือถือ</li>
                  <li>คัดลอกลิงก์หรือดาวน์โหลดโปสเตอร์ QR ไปติดจุดทำงาน</li>
                  <li>เหมาะสำหรับสาขาที่มีหลายจุดรับรถ</li>
                </ul>
              ),
            },
            {
              title: "ปุ่ม: QR ลูกค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เปิดลิงก์ให้ลูกค้าจองคิว (เลือกแพ็ก + ช่วงเวลา) หรือใช้แพ็กเหมาเดิม</li>
                  <li>มีปุ่มเปิดลิงก์ · คัดลอก · แสดง/ซ่อน · ดาวน์โหลดโปสเตอร์</li>
                  <li>แนะนำติด QR จุดรับรถหรือจุดรอคิว</li>
                </ul>
              ),
            },
            {
              title: "โหมดพนักงาน (staff lane)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เห็นเฉพาะงานในลานที่จำเป็นต่อการปฏิบัติงาน</li>
                  <li>ใช้สำหรับอุปกรณ์หน้างานที่ไม่ต้องเข้าถึงเมนูผู้ดูแลทั้งหมด</li>
                  <li>ลดความเสี่ยงการแก้ข้อมูลสำคัญโดยไม่ตั้งใจ</li>
                </ul>
              ),
            },
            {
              title: "หมายเหตุการใช้งานประจำวัน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ก่อนปิดร้านให้ตรวจรถค้างลานและยอดชำระที่ยังไม่ครบ</li>
                  <li>กดรีเฟรชข้อมูลเมื่อมีหลายเครื่องใช้งานพร้อมกัน</li>
                  <li>สำรองข้อมูลสำคัญและทบทวนรายรับสุทธิทุกวัน</li>
                </ul>
              ),
            },
            {
              title: "สรุปการใช้งาน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เปิดรับงานที่แดชบอร์ด จัดการขายที่ยอดขาย และคุมกำไรที่ต้นทุน</li>
                  <li>ใช้แพ็กเกจเหมา/QR เพื่อลดเวลารับงานซ้ำและเพิ่มความเร็วบริการ</li>
                  <li>ทบทวนข้อมูลทุกเมนูตอนสิ้นวันเพื่อให้ตัวเลขแม่นยำ</li>
                </ul>
              ),
            },
          ]}
        />
      ) : null}

      {isLaneBoard ?
        <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/55 bg-white/40 px-4 py-3 shadow-sm backdrop-blur-xl sm:rounded-[2rem] sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">Live · SSE</p>
              <h1 className="truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                ลานล้างวันนี้ — {shopLabel}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800"
                title="อัปเดตสถานะแบบสดผ่าน SSE"
              >
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                สด
              </span>
              <Link
                href="/dashboard/car-wash"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center px-3 text-sm font-bold",
                )}
              >
                ปิดเต็มจอ
              </Link>
            </div>
          </header>
          {loading ? <p className="text-sm font-medium text-[#66638c]">กำลังโหลดลานล้าง...</p> : null}
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="min-h-0 flex-1">{serviceLanePanelEl}</div>
        </div>
      : isStaffLaneOnly ?
        <StaffQrLandingShell
          variant="car-wash"
          title="คาร์แคร์พนักงาน"
          shopLabel={shopLabel}
          loading={loading}
          error={error}
        >
          <div className="space-y-6">
            <CarWashBookingsClient initialDateKey={bookingDateKey} staffQrLanding />
            {serviceLanePanelEl}
          </div>
        </StaffQrLandingShell>
      : tab === "overview" ? (
        <CarWashDashboardHubClient initialDateKey={bookingDateKey}>
          <div className="space-y-4 rounded-[2.5rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
            <div className="min-w-0">
              <p className={cn(carWashHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
                TODAY&apos;S STATS
              </p>
              <h3 className="text-lg font-bold text-[#2e2a58]">สถิติวันนี้</h3>
            </div>
            <div className={cn("mt-4 grid grid-cols-2 gap-3", carWashStatGridClass)}>
              <CarWashStat
                title="ลูกค้าวันนี้"
                value={todayStats.uniqueCustomers.toLocaleString("en-US")}
                tone="slate"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                }
              />
              <CarWashStat
                title="เข้าบริการรวม"
                value={todayStats.totalVisits.toLocaleString("en-US")}
                tone="blue"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
              <CarWashStat
                title="ใช้แพ็กเกจ"
                value={todayStats.packageUses.toLocaleString("en-US")}
                tone="green"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
                  </svg>
                }
              />
              <CarWashStat
                title="รายรับวันนี้"
                value={`฿${todayStats.revenue.toLocaleString("en-US")}`}
                tone="amber"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
                  </svg>
                }
              />
            </div>
          </div>
          {serviceLanePanelEl}
        </CarWashDashboardHubClient>
      ) : null}

      {!hideChrome && tab === "finance" ? (
        <CarWashSalesPanel
          visits={visits}
          bundles={bundles}
          packages={packages}
          costEntries={costEntries}
          costCategories={costCategories}
          repo={repo}
          baseUrl={baseUrl}
          shopLabel={shopLabel}
          logoUrl={logoUrl}
          shopPrintProfile={shopPrintProfile}
          recorderDisplayName={recorderDisplayName}
          onRefresh={loadAll}
          updateVisit={(id, p) => repo.updateVisit(id, p)}
          deleteVisit={(id) => repo.deleteVisit(id)}
          updateBundle={(id, p) => repo.updateBundle(id, p)}
          deleteBundle={(id) => repo.deleteBundle(id)}
        />
      ) : null}

      {/* รวมรายการต้นทุนเข้ากับ Finance Panel แล้ว */}

      {tab === "offers" ? (
        <div className="space-y-5 sm:space-y-6">
          <AppDashboardSection tone="slate">
            {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {!loading ? (
              <>
                <AppImageLightbox src={bundleTabLightbox.src} onClose={bundleTabLightbox.close} alt="สลิปแพ็กเหมา" />
                <AppImageLightbox src={pkgLightbox.src} onClose={pkgLightbox.close} alt="รูปแพ็กเกจ" />

                <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className={cn(carWashHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
                      PACKAGES &amp; BUNDLES
                    </p>
                    <h2 className="text-lg font-black tracking-tight text-[#1e1b4b]">แพ็กเกจและเหมาจ่าย</h2>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setOffersFilterOpen((o) => !o)}
                      aria-expanded={offersFilterOpen}
                      aria-controls="car-wash-offers-filter-panel"
                      aria-label={offersFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                      title={offersFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-[1rem] px-0 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
                        offersFilterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                        offersFiltersActive && !offersFilterOpen && "border-amber-300/80 bg-amber-50/90",
                      )}
                    >
                      <OffersFilterFunnelIcon className="h-5 w-5 shrink-0" />
                      <span className="hidden sm:inline">{offersFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                      {offersFiltersActive ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#4338ca] via-[#5b61ff] to-[#ec4899] ring-2 ring-white"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <div className={cn(carWashSubTabSegmentShellClass, "rounded-xl")}>
                      {offersListTab === "packages" ?
                        <div className="mr-1.5 flex items-center gap-1 border-r border-slate-200 pr-1.5">
                          <button
                            type="button"
                            onClick={openCreatePackage}
                            className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold shadow-sm ring-1", carWashCtaClass)}
                            aria-label="เพิ่มแพ็กเกจ"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="hidden sm:inline">เพิ่มแพ็กเกจ</span>
                          </button>
                        </div>
                      : <div className="mr-1.5 flex items-center gap-1 border-r border-slate-200 pr-1.5">
                          <button
                            type="button"
                            onClick={() => setShowBundleModal(true)}
                            className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold shadow-sm ring-1", carWashCtaClass)}
                            aria-label="เพิ่มเหมาจ่าย"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="hidden sm:inline">เพิ่มเหมา</span>
                          </button>
                        </div>
                      }
                      <button
                        type="button"
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                          offersListTab === "packages" ? carWashNavActiveClass : carWashNavIdleClass,
                        )}
                        onClick={() => setOffersListTab("packages")}
                      >
                        <span className={cn(offersListTab === "packages" ? "text-white" : "")}>แพ็กเกจ</span>
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                          offersListTab === "bundles" ? carWashNavActiveClass : carWashNavIdleClass,
                        )}
                        onClick={() => setOffersListTab("bundles")}
                      >
                        <span className={cn(offersListTab === "bundles" ? "text-white" : "")}>เหมาจ่าย</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  id="car-wash-offers-filter-panel"
                  className={cn(
                    "space-y-3 rounded-[1.5rem] border border-white/55 bg-white/40 p-3 shadow-sm backdrop-blur-xl sm:p-4",
                    offersFilterOpen ? "block" : "hidden",
                  )}
                  aria-label={offersListTab === "packages" ? "ตัวกรองแพ็กเกจ" : "ตัวกรองเหมาจ่าย"}
                >
                  {offersListTab === "packages" ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="กรองสถานะแพ็กเกจ">
                          {(
                            [
                              { key: "ALL" as const, label: "ทั้งหมด", count: packageFilterStats.total },
                              { key: "ACTIVE" as const, label: "เปิดใช้", count: packageFilterStats.active },
                              { key: "INACTIVE" as const, label: "ปิด", count: packageFilterStats.inactive },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              role="tab"
                              aria-selected={pkgStatusFilter === opt.key}
                              onClick={() => setPkgStatusFilter(opt.key)}
                              className={carWashFilterChipClass(pkgStatusFilter === opt.key)}
                            >
                              <span className="inline-flex items-baseline gap-1">
                                {opt.label}
                                <span
                                  aria-hidden
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                                    pkgStatusFilter === opt.key ? "bg-white/25 text-white/95" : "bg-[#e8e6fc]/80 text-[#4d47b6]",
                                  )}
                                >
                                  {opt.count}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs font-bold tabular-nums text-[#8b87ad]">
                          แสดง {filteredPackages.length}/{packages.length}
                        </p>
                      </div>
                      <div className={carWashFilterFieldGridClass}>
                        <label className="min-w-0 space-y-1.5" htmlFor="cw-offers-pkg-q">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ค้นหา</span>
                          <input
                            id="cw-offers-pkg-q"
                            className={carWashFieldClass}
                            placeholder="ชื่อแพ็กเกจ / รายละเอียด"
                            value={pkgQuery}
                            onChange={(e) => setPkgQuery(e.target.value)}
                            autoComplete="off"
                          />
                        </label>
                        {packageFiltersActive ? (
                          <div className="flex items-end">
                            <button
                              type="button"
                              className={cn(appTemplateOutlineButtonClass, "min-h-[44px] px-4 text-xs font-black text-[#4d47b6]")}
                              aria-label="ล้างตัวกรองแพ็กเกจ"
                              onClick={() => {
                                setPkgStatusFilter("ALL");
                                setPkgQuery("");
                              }}
                            >
                              ล้างกรอง
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="กรองสถานะเหมาจ่าย">
                          {(
                            [
                              { key: "ALL" as const, label: "ทั้งหมด", count: bundleFilterStats.total },
                              { key: "READY" as const, label: "พร้อมใช้", count: bundleFilterStats.ready },
                              { key: "EXHAUSTED" as const, label: "หมดสิทธิ์", count: bundleFilterStats.exhausted },
                              { key: "INACTIVE" as const, label: "ปิด", count: bundleFilterStats.inactive },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              role="tab"
                              aria-selected={bundleStatusFilter === opt.key}
                              onClick={() => setBundleStatusFilter(opt.key)}
                              className={carWashFilterChipClass(bundleStatusFilter === opt.key)}
                            >
                              <span className="inline-flex items-baseline gap-1">
                                {opt.label}
                                <span
                                  aria-hidden
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                                    bundleStatusFilter === opt.key ? "bg-white/25 text-white/95" : "bg-[#e8e6fc]/80 text-[#4d47b6]",
                                  )}
                                >
                                  {opt.count}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs font-bold tabular-nums text-[#8b87ad]">
                          แสดง {filteredBundles.length}/{bundles.length}
                        </p>
                      </div>
                      <div className={carWashFilterFieldGridClass}>
                        <label className="min-w-0 space-y-1.5" htmlFor="cw-offers-bundle-q">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ค้นหา</span>
                          <input
                            id="cw-offers-bundle-q"
                            className={carWashFieldClass}
                            placeholder="ชื่อ · เบอร์ · ทะเบียน · ชื่อแพ็ก"
                            value={bundleQuery}
                            onChange={(e) => setBundleQuery(e.target.value)}
                            autoComplete="off"
                          />
                        </label>
                        {bundleFiltersActive ? (
                          <div className="flex items-end">
                            <button
                              type="button"
                              className={cn(appTemplateOutlineButtonClass, "min-h-[44px] px-4 text-xs font-black text-[#4d47b6]")}
                              aria-label="ล้างตัวกรองเหมาจ่าย"
                              onClick={() => {
                                setBundleStatusFilter("ALL");
                                setBundleQuery("");
                              }}
                            >
                              ล้างกรอง
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>

                {offersListTab === "packages" ?
                  packages.length === 0 ?
                    <AppEmptyState tone="glass">ยังไม่มีแพ็กเกจ — กด «เพิ่มแพ็กเกจ» เพื่อสร้างรายการแรก</AppEmptyState>
                  : filteredPackages.length === 0 ?
                    <AppEmptyState tone="glass">ไม่พบแพ็กเกจตามตัวกรอง — ปรับหรือล้างกรอง</AppEmptyState>
                  : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
                      <ul
                        className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
                        aria-label="แพ็กเกจบริการคาร์แคร์"
                      >
                        {filteredPackages.map((p) => (
                          <li
                            key={p.id}
                            className="group/item relative flex min-h-0 flex-col gap-2 overflow-hidden px-3 py-3 transition-all duration-300 hover:bg-white/45 sm:px-4 lg:min-h-[200px] lg:rounded-2xl lg:border lg:border-white/60 lg:bg-white/50 lg:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.42)] lg:backdrop-blur-xl lg:hover:-translate-y-1 lg:hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.45)]"
                          >
                            <span
                              aria-hidden
                              className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff] via-[#8d64ff] to-[#f06dc8] opacity-80 transition-all group-hover/item:w-1.5"
                            />
                            <div className="relative flex min-w-0 items-start gap-2.5 border-b border-white/70 pb-2">
                              <button
                                type="button"
                                className={cn(
                                  "h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/80",
                                  !p.image_url && "bg-gradient-to-br from-violet-200 via-indigo-100 to-fuchsia-200",
                                )}
                                aria-label={p.image_url ? `ดูรูป ${p.name}` : `ยังไม่มีรูป ${p.name}`}
                                disabled={!p.image_url}
                                onClick={() => p.image_url && pkgLightbox.open(p.image_url)}
                              >
                                {p.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="min-w-0 text-xs font-bold text-[#2e2a58] sm:text-sm">{p.name}</h3>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold sm:text-[11px] ${
                                      p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {p.is_active ? "เปิด" : "ปิด"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {p.description?.trim() ?
                              <p className="relative line-clamp-3 text-[11px] leading-snug text-[#5f5a8a]">{p.description}</p>
                            : null}
                            <div className="relative mt-auto flex items-baseline justify-between gap-2 border-t border-white/70 pt-2 text-[11px] sm:text-xs">
                              <span className="text-[#8b87ad]">ราคา / เวลา</span>
                              <span className="text-right">
                                <span className="font-semibold text-[#4d47b6]">฿{p.price.toLocaleString()}</span>
                                <span className="text-[#8b87ad]"> · </span>
                                <span className="font-medium text-[#2e2a58]">{p.duration_minutes} น.</span>
                                <span className="text-[#8b87ad]"> · </span>
                                <span className="font-medium text-[#2e2a58]">{p.total_uses ?? 1} ครั้ง</span>
                              </span>
                            </div>
                            <div className="relative mt-1 flex flex-wrap items-center justify-end gap-1.5">
                              <PopupIconButton
                                label="แก้ไขแพ็กเกจ"
                                onClick={() => openEditPackage(p)}
                                className="border-[#4d47b6]/35 bg-[#ecebff] text-[#4d47b6] hover:bg-[#e0dcff] hover:text-[#3d3799]"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </PopupIconButton>
                              <PopupIconButton
                                label="ลบแพ็กเกจ"
                                onClick={() => void removePackage(p.id)}
                                className={popupIconBtnDanger}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" x2="10" y1="11" y2="17" />
                                  <line x1="14" x2="14" y1="11" y2="17" />
                                </svg>
                              </PopupIconButton>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                : <>
                    <AppGalleryCameraFileInputs
                      galleryInputRef={bundleTabGalleryRef}
                      cameraInputRef={bundleTabCameraRef}
                      onChange={onBundleTabGalleryChange}
                    />
                    {bundles.length === 0 ?
                      <AppEmptyState tone="glass">ยังไม่มีแพ็กเหมา</AppEmptyState>
                    : filteredBundles.length === 0 ?
                      <AppEmptyState tone="glass">ไม่พบเหมาจ่ายตามตัวกรอง — ปรับหรือล้างกรอง</AppEmptyState>
                    : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
                        <ul
                          className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
                          aria-label="รายการเหมาจ่ายคาร์แคร์"
                        >
                          {filteredBundles.map((b) => {
                            const remaining = Math.max(0, b.total_uses - b.used_uses);
                            const canUse = b.is_active && remaining > 0;
                            const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
                            const phoneLine = b.customer_phone?.trim() || "—";
                            return (
                              <li key={b.id} className="lg:flex lg:min-h-0 lg:flex-col">
                                <button
                                  type="button"
                                  onClick={() => setBundleTabRowDetailId(b.id)}
                                  className={cn(
                                    "group/item relative flex w-full min-h-0 flex-1 flex-col gap-2 overflow-hidden border-l-[3px] border-amber-300/70 bg-white/45 px-3 py-3 text-left backdrop-blur-sm transition-all duration-300 hover:bg-white/60 sm:px-4",
                                    "lg:min-h-[200px] lg:rounded-2xl lg:border lg:border-white/60 lg:shadow-[0_16px_34px_-24px_rgba(217,119,6,0.38)] lg:backdrop-blur-xl lg:hover:-translate-y-1 lg:hover:shadow-[0_24px_44px_-24px_rgba(217,119,6,0.42)]",
                                  )}
                                  aria-label={`ดูรายละเอียดแพ็กเหมา #${b.id}`}
                                >
                                  <span
                                    aria-hidden
                                    className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#f59e0b] via-[#fb7185] to-[#f06dc8] opacity-80 transition-all group-hover/item:w-1.5"
                                  />
                                  <div className="relative flex min-w-0 items-start justify-between gap-2 border-b border-white/70 pb-2">
                                    <div className="min-w-0">
                                      <h3 className="truncate text-xs font-bold text-[#2e2a58] sm:text-sm">{b.package_name.trim() || "—"}</h3>
                                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">รหัสแพ็กเหมา #{b.id}</p>
                                    </div>
                                    <span
                                      className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold ${
                                        canUse ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {canUse ? "ใช้งานได้" : "ปิด/หมดสิทธิ์"}
                                    </span>
                                  </div>

                                  <div className="relative flex min-w-0 items-center gap-2.5">
                                    {slipResolved ?
                                      <AppImageThumb
                                        className="!h-12 !w-12 rounded-lg sm:!h-14 sm:!w-14"
                                        src={slipResolved}
                                        alt="สลิป"
                                        onOpen={() => bundleTabLightbox.open(slipResolved)}
                                      />
                                    : <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-amber-200 bg-amber-50/80 text-[8px] text-amber-800/80 sm:h-14 sm:w-14">
                                        ไม่มีสลิป
                                      </div>
                                    }
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-bold text-slate-900">{b.customer_name.trim() || "—"}</p>
                                      <p className="truncate text-sm font-bold tabular-nums text-[#2e2a58]">{b.plate_number.trim() || "—"}</p>
                                      <p className="truncate text-[11px] text-slate-500">{phoneLine}</p>
                                    </div>
                                  </div>

                                  <div className="relative grid grid-cols-2 gap-2 border-t border-white/70 pt-2 text-[11px] sm:text-xs">
                                    <div>
                                      <p className="text-slate-500">ยอดซื้อ</p>
                                      <p className="font-semibold tabular-nums text-amber-900">฿{b.paid_amount.toLocaleString("th-TH")}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-slate-500">สิทธิ์คงเหลือ</p>
                                      <p className="font-semibold tabular-nums text-[#0000BF]">{remaining}/{b.total_uses}</p>
                                    </div>
                                  </div>
                                  <p className="relative mt-auto text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    คลิกเพื่อดูรายละเอียดทั้งหมด
                                  </p>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    }
                  </>
                }
              </>
            ) : null}
          </AppDashboardSection>
        </div>
      ) : null}

      {!hideChrome ? (
        <AppMobileDockShell ariaLabel="เมนูล่างคาร์แคร์">
          <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
            {tabItems.map((item) => {
              const active = tab === item.key;
              return (
                <li key={item.key} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setTab(item.key)}
                    aria-label={item.label}
                    className={cn(
                      "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
                      active ? carWashNavActiveClass : carWashNavIdleClass,
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className={cn("h-5 w-5 shrink-0", active ? "text-white/95" : "")}
                      aria-hidden
                    >
                      {carWashTabIcon(item.key)}
                    </svg>
                    <span
                      className={cn(
                        "max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none",
                        active ? "text-white" : "",
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="min-w-0">
              <ModuleShopSettingsDockLink href={CAR_WASH_SETTINGS_PATH} active={false} />
            </li>
          </ul>
        </AppMobileDockShell>
      ) : null}
      <FormModal
        open={bundleTabRowDetail != null}
        onClose={() => setBundleTabRowDetailId(null)}
        title={bundleTabRowDetail ? `แพ็กเหมา #${bundleTabRowDetail.id}` : "แพ็กเหมา"}
        description="รายละเอียดแพ็กเหมาแบบเต็ม พร้อมปุ่มจัดการ"
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setBundleTabRowDetailId(null)}
            >
              ปิด
            </button>
          </div>
        }
      >
        {bundleTabRowDetail ?
          (() => {
            const b = bundleTabRowDetail;
            const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
            const remaining = Math.max(0, b.total_uses - b.used_uses);
            const timeStr = new Date(b.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3 text-sm">
                  <p className="text-xs font-medium tabular-nums text-slate-500">{timeStr}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#2e2a58]">{b.plate_number.trim() || "—"}</p>
                  <p className="mt-1 font-medium text-slate-800">{b.package_name}</p>
                  <p className="text-xs text-slate-600">{b.customer_name.trim() || "—"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-700">
                    <p>เบอร์โทร: <span className="font-semibold">{b.customer_phone?.trim() || "—"}</span></p>
                    <p className="text-right">สถานะ: <span className="font-semibold">{b.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span></p>
                    <p>ยอดซื้อ: <span className="font-bold tabular-nums text-amber-900">฿{b.paid_amount.toLocaleString()}</span></p>
                    <p className="text-right">ใช้งาน: <span className="font-semibold tabular-nums">{b.used_uses}/{b.total_uses} ครั้ง</span></p>
                    <p className="col-span-2">สิทธิ์คงเหลือ: <span className="font-bold tabular-nums text-[#0000BF]">{remaining} ครั้ง</span></p>
                  </div>
                </div>
                <div
                  className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
                  role="toolbar"
                  aria-label="ดำเนินการแพ็กเหมา"
                >
                  <PopupIconButton
                    label="ดูสลิป"
                    disabled={!slipResolved}
                    onClick={() => slipResolved && bundleTabLightbox.open(slipResolved)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" x2="8" y1="13" y2="13" />
                      <line x1="16" x2="8" y1="17" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="พิมพ์ใบเสร็จ"
                    disabled={!(b.paid_amount > 0)}
                    onClick={() => printBundleSlipDashboard(b)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect width="12" height="8" x="6" y="14" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="อัปโหลดสลิป"
                    busy={bundleTabPhotoBusy}
                    disabled={bundleTabPhotoBusy}
                    onClick={() => {
                      bundleTabSlipTargetIdRef.current = b.id;
                      bundleTabGalleryRef.current?.click();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ถ่ายรูปสลิป"
                    busy={bundleTabPhotoBusy}
                    disabled={bundleTabPhotoBusy}
                    onClick={() => {
                      bundleTabSlipTargetIdRef.current = b.id;
                      setBundleTabCameraOpen(true);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </PopupIconButton>
                  {slipResolved ?
                    <PopupIconButton
                      label="ล้างสลิป"
                      disabled={bundleTabPhotoBusy}
                      onClick={() => void clearBundleTabSlip(b.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6M9 9l6 6" />
                      </svg>
                    </PopupIconButton>
                  : null}
                  <PopupIconButton
                    label="แก้ไข"
                    disabled={bundleTabPhotoBusy}
                    onClick={() => openBundleEditFromTab(b)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ลบแพ็กเหมา"
                    disabled={bundleTabPhotoBusy}
                    className={popupIconBtnDanger}
                    onClick={() => void removeBundle(b.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </PopupIconButton>
                </div>
              </div>
            );
          })()
        : null}
      </FormModal>

      <FormModal
        open={showPkgModal}
        onClose={() => setShowPkgModal(false)}
        title={editingPkg ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจ"}
        description="กำหนดชื่อ ราคา รายละเอียด และรูปบริการ"
        footer={
          <FormModalFooterActions
            onCancel={() => setShowPkgModal(false)}
            onSubmit={() => {
              const form = document.getElementById("pkg-form") as HTMLFormElement;
              form?.requestSubmit();
            }}
            submitLabel="บันทึกแพ็กเกจ"
            submitDisabled={pkgImageBusy}
          />
        }
      >
        <form id="pkg-form" className="space-y-6" onSubmit={(e) => void submitPackage(e)}>
          <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 sm:p-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รูปแพ็กเกจ</label>
              <AppGalleryCameraFileInputs
                galleryInputRef={pkgGalleryRef}
                cameraInputRef={pkgCameraInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onPkgImageFile(file);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                {pkgForm.image_url ? (
                  <AppImageThumb
                    src={pkgForm.image_url}
                    alt="รูปแพ็กเกจ"
                    onOpen={() => pkgForm.image_url && pkgLightbox.open(pkgForm.image_url)}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-[10px] font-bold text-[#8b87b8] ring-2 ring-white">
                    ไม่มีรูป
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <AppImagePickCameraButtons
                    disabled={pkgImageBusy}
                    busy={pkgImageBusy}
                    onPickGallery={() => pkgGalleryRef.current?.click()}
                    onPickCamera={() => openPkgCamera((file) => void onPkgImageFile(file))}
                    labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                  />
                  {pkgForm.image_url ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600 underline-offset-2 hover:underline"
                      disabled={pkgImageBusy}
                      onClick={() => setPkgForm((s) => ({ ...s, image_url: null }))}
                    >
                      ลบรูป
                    </button>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-500">แนบรูปเพื่อแสดงบนลิงก์ลูกค้า</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ชื่อแพ็กเกจบริการ</label>
              <input
                className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                placeholder="เช่น ล้างสี-ดูดฝุ่น"
                value={pkgForm.name}
                onChange={(e) => setPkgForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5b61ff]">ราคา (฿)</label>
                <input
                  className="w-full rounded-2xl border-indigo-100 bg-white px-4 py-3 text-lg font-black text-indigo-900 focus:ring-[#5b61ff]"
                  type="number"
                  placeholder="0"
                  value={pkgForm.price}
                  onChange={(e) => setPkgForm((s) => ({ ...s, price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">เวลา (นาที)</label>
                <input
                  className="w-full rounded-2xl border-purple-100 bg-white px-4 py-3 text-lg font-black text-purple-900 focus:ring-[#8d64ff]"
                  type="number"
                  placeholder="60"
                  value={pkgForm.duration_minutes}
                  onChange={(e) => setPkgForm((s) => ({ ...s, duration_minutes: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                จำนวนครั้ง (1 = รายครั้ง · มากกว่า 1 = แพ็กเหมา)
              </label>
              <input
                className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold focus:ring-[#5b61ff]"
                type="number"
                min={1}
                max={500}
                value={pkgForm.total_uses}
                onChange={(e) => setPkgForm((s) => ({ ...s, total_uses: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รายละเอียดเพิ่มเติม</label>
              <textarea
                className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-slate-300 focus:ring-[#5b61ff]"
                placeholder="อธิบายบริการสั้นๆ..."
                value={pkgForm.description}
                onChange={(e) => setPkgForm((s) => ({ ...s, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="px-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-lg border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={pkgForm.is_active}
                onChange={(e) => setPkgForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              <span className="text-sm font-bold text-slate-600">เปิดใช้งานแพ็กเกจนี้</span>
            </label>
          </div>
        </form>
        {pkgCameraModal}
      </FormModal>

      <FormModal
        open={showVisitModal}
        size="lg"
        mobileCentered={hideChrome}
        onClose={() => {
          setShowVisitModal(false);
          setVisitLookupHint(null);
          setVisitAdvancedOpen(false);
        }}
        title="บันทึกรายการ"
        description="เลือกบริการ · กรอกข้อมูล · ชำระเงิน · พิมพ์ใบเสร็จ — หลักเดียวกับจองคิวและเช็คอิน"
        footer={
          <FormModalFooterActions
            cancelLabel="ปิด"
            onCancel={() => {
              setShowVisitModal(false);
              setVisitLookupHint(null);
              setVisitAdvancedOpen(false);
            }}
            submitLabel="บันทึก"
            onSubmit={() => visitFormRef.current?.requestSubmit()}
          />
        }
      >
          <form ref={visitFormRef} className="space-y-5" onSubmit={(e) => void submitVisit(e)}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setVisitEntryMode("walkin");
                    setVisitLookupHint(null);
                    setVisitForm((s) => ({ ...s, bundle_id: "" }));
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all",
                    visitEntryMode === "walkin"
                      ? "bg-white text-[#5b61ff] shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  ซื้อบริการ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisitEntryMode("bundle");
                    setVisitLookupHint(null);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all",
                    visitEntryMode === "bundle"
                      ? "bg-white text-[#8d64ff] shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  ใช้แพ็กเหมา
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            ) : null}

            <div className="space-y-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/30 p-4 sm:p-6">
              {visitEntryMode === "walkin" ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#4d47b6]">เลือกบริการก่อนกรอกข้อมูลลูกค้า</p>
                    {packages.filter((p) => p.is_active).length === 0 ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        ยังไม่มีบริการที่เปิดใช้งาน — ไปแท็บแพ็กเกจก่อน
                      </p>
                    ) : (
                      <ul
                        className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3"
                        role="listbox"
                        aria-label="เลือกบริการ"
                      >
                        {packages
                          .filter((p) => p.is_active)
                          .map((p) => {
                            const active = visitForm.package_id === String(p.id);
                            return (
                              <li key={p.id} className="min-h-0 h-full">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={active}
                                  title={p.name}
                                  onClick={() => {
                                    setVisitForm((s) => ({
                                      ...s,
                                      package_id: String(p.id),
                                      bundle_id: "",
                                      final_price: String(p.price),
                                    }));
                                  }}
                                  className={cn(
                                    "flex h-full min-h-[104px] w-full flex-col rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] sm:min-h-[112px]",
                                    active
                                      ? "border-[#5b61ff] bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/25"
                                      : "border-violet-200 bg-white text-[#4d47b6] hover:border-[#5b61ff]/45 hover:bg-[#5b61ff]/5",
                                  )}
                                >
                                  <span className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-snug text-[#1e1b4b]">
                                    {p.name}
                                  </span>
                                  <span className="mt-auto pt-1 text-[11px] font-semibold text-[#66638c]">
                                    {p.duration_minutes} นาที
                                    {(p.total_uses ?? 1) > 1 ? ` · ${p.total_uses} ครั้ง` : ""}
                                  </span>
                                  <span className="mt-0.5 text-xs font-black text-[#4d47b6]">
                                    ฿{p.price.toLocaleString("th-TH")}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                    {!visitForm.package_id ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        เลือกบริการก่อน จึงกรอกเบอร์/ทะเบียนได้
                      </p>
                    ) : null}
                  </div>

                  {visitForm.package_id ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#4d47b6]">เลือกวันและช่วงเวลา (ผูกคิวตามรอบ)</p>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วันที่รับบริการ</span>
                        <input
                          type="date"
                          min={bangkokDateKey()}
                          value={visitBookDateKey}
                          onChange={(e) => setVisitBookDateKey(e.target.value)}
                          className={carWashVisitFieldClass}
                        />
                      </label>
                      {visitBookDateKey > bangkokDateKey() ? (
                        <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900">
                          จองล่วงหน้า — จะแสดงในเมนูจัดการคิววันที่ {visitBookDateKey} (ยังไม่เข้าลาน)
                        </p>
                      ) : null}
                      {visitScheduleLoading ? (
                        <p className="text-sm text-[#66638c]">กำลังโหลดตาราง…</p>
                      ) : visitScheduleClosed ? (
                        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">วันนี้ปิดรับจอง</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="เลือกช่วงเวลา">
                          {visitBookableSlots.map((s) => (
                            <button
                              key={s.time}
                              type="button"
                              disabled={!s.available}
                              onClick={() => s.available && setVisitSelectedSlot(s.time)}
                              className={cn(
                                "min-h-[44px] rounded-xl border text-sm font-bold tabular-nums",
                                s.available
                                  ? visitSelectedSlot === s.time
                                    ? "border-[#5b61ff] bg-[#5b61ff] text-white"
                                    : "border-violet-200 bg-white text-[#4d47b6]"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through",
                              )}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className={cn("space-y-4", !visitForm.package_id && "pointer-events-none opacity-45")}>
                    <p className="text-[10px] font-bold text-slate-400">
                      จองคิวต้องมีเบอร์โทร · ทะเบียนไม่บังคับ
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#5b61ff]">เบอร์โทรศัพท์</label>
                      <input
                        className={cn(carWashVisitFieldClass, "border-indigo-100 tracking-widest focus:border-[#5b61ff] focus:ring-[#5b61ff]/25")}
                        placeholder="08XXXXXXXX"
                        value={visitForm.customer_phone}
                        onChange={(e) =>
                          setVisitForm((s) => ({
                            ...s,
                            customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15),
                          }))
                        }
                        inputMode="numeric"
                        disabled={!visitForm.package_id}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">
                          ทะเบียนรถ
                        </label>
                        <input
                          className={cn(carWashVisitFieldClass, "border-purple-100 tracking-widest focus:border-[#8d64ff] focus:ring-[#8d64ff]/25")}
                          placeholder="กข 1234"
                          value={visitForm.plate_number}
                          onChange={(e) => setVisitForm((s) => ({ ...s, plate_number: e.target.value }))}
                          disabled={!visitForm.package_id}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          ชื่อลูกค้า <span className="font-medium normal-case">(ไม่บังคับ)</span>
                        </label>
                        <input
                          className={cn(carWashVisitFieldClass, "border-slate-200 tracking-normal focus:border-[#5b61ff] focus:ring-[#5b61ff]/25")}
                          placeholder="เช่น คุณสมชาย"
                          value={visitForm.customer_name}
                          onChange={(e) => setVisitForm((s) => ({ ...s, customer_name: e.target.value }))}
                          disabled={!visitForm.package_id}
                        />
                      </div>
                    </div>

                    {visitForm.package_id ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#4d47b6]">
                            ยอดที่รับชำระ (บาท)
                          </label>
                          <input
                            className={cn(carWashVisitFieldClass, "border-indigo-100 tabular-nums focus:border-[#5b61ff] focus:ring-[#5b61ff]/25")}
                            inputMode="decimal"
                            value={visitForm.final_price}
                            onChange={(e) => setVisitForm((s) => ({ ...s, final_price: e.target.value }))}
                          />
                        </div>
                        <CarWashPaymentPanel
                          amountBaht={visitPayAmountBaht}
                          method={visitPaymentMethod}
                          slipUrl={visitPaymentSlipUrl}
                          onMethodChange={setVisitPaymentMethod}
                          onSlipUrlChange={setVisitPaymentSlipUrl}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-xs font-medium text-[#4d47b6]">
                    ค้นหาลูกค้าแพ็กเหมา — ตัดสิทธิ์ 1 ครั้งเมื่อบันทึก (เหมือนเช็คอินใช้แพ็ก)
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">
                      ค้นหาลูกค้าแพ็กเหมา
                    </label>
                    <div className="flex gap-2">
                      <input
                        className={cn(carWashVisitFieldClass, "min-w-0 flex-1 border-purple-100 focus:border-[#8d64ff] focus:ring-[#8d64ff]/25")}
                        placeholder="เบอร์โทร หรือ ทะเบียนรถ"
                        value={visitForm.customer_lookup}
                        onChange={(e) => setVisitForm((s) => ({ ...s, customer_lookup: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={runVisitLookup}
                        className="shrink-0 rounded-2xl bg-[#8d64ff] px-5 min-h-[48px] text-sm font-black text-white shadow-lg shadow-purple-100 transition-all active:scale-95"
                      >
                        ค้นหา
                      </button>
                    </div>
                  </div>

                  {visitLookupHint ? (
                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-[11px] font-bold text-indigo-600">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                        <circle cx="12" cy="12" r="10" /><path d="M12 16h.01M12 8v4" />
                      </svg>
                      {visitLookupHint}
                    </div>
                  ) : null}

                  {visitForm.bundle_id ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">ข้อมูลที่พบ</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">เบอร์โทร</p>
                          <p className="text-sm font-black text-emerald-900">{visitForm.customer_phone || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">ทะเบียนรถ</p>
                          <p className="text-sm font-black text-emerald-900">{visitForm.plate_number || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">ชื่อลูกค้า</p>
                          <p className="text-sm font-black text-emerald-900">{visitForm.customer_name || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setShowVisitModal(false);
                      setShowBundleModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-xs font-bold text-slate-400 transition-all hover:border-[#8d64ff] hover:text-[#8d64ff] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    ยังไม่มีแพ็ก? ขายแพ็กเกจเหมาใหม่
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สถานะเริ่มต้นบนลาน</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CAR_WASH_SERVICE_STATUSES.filter(
                  (s) => s !== "COMPLETED" && s !== "PAID" && s !== "HANDED_OVER",
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVisitLaneStatus(s)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 transition-all active:scale-95",
                      visitLaneStatus === s
                        ? "border-[#5b61ff] bg-indigo-50/50 text-[#5b61ff] ring-1 ring-[#5b61ff]"
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200",
                    )}
                  >
                    <span className="text-[10px] font-black">{carWashStatusLabelTh(s)}</span>
                    <span className="text-[8px] font-bold opacity-50">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={visitPrintReceipt}
                onChange={(e) => setVisitPrintReceipt(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#1e1b4b]">พิมพ์ใบเสร็จหลังบันทึก</span>
                <span className="block text-[11px] font-semibold text-[#66638c]">
                  ขนาดกระดาษตามตั้งค่าร้าน ({shopPrintProfile?.slipPaperSize || slipPaper})
                </span>
              </span>
            </label>

            <div className="rounded-2xl border border-slate-100 bg-white p-2">
              <button
                type="button"
                onClick={() => setVisitAdvancedOpen((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-xs font-black text-slate-500">ข้อมูลเพิ่มเติม (โน้ต / รูปหลักฐานรถ)</span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn("h-4 w-4 text-slate-400 transition-transform", visitAdvancedOpen && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className={cn("grid transition-all duration-300", visitAdvancedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <div className="space-y-5 p-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">บันทึกเพิ่มเติม</label>
                      <textarea
                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium placeholder:text-slate-300 focus:ring-[#5b61ff]"
                        placeholder="เช่น ยางแตก, มีรอยขีดข่วน..."
                        value={visitForm.note}
                        onChange={(e) => setVisitForm((s) => ({ ...s, note: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            รูปหลักฐานสภาพรถ
                          </label>
                          <p className="mt-0.5 text-[11px] font-medium text-[#8b87b8]">
                            ร่องรอย / รอยขีดข่วนตอนรับรถ · เลือกหลายรูปได้ · สูงสุด{" "}
                            {CAR_WASH_VISIT_EVIDENCE_MAX} รูป
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black tabular-nums text-slate-600">
                          {visitForm.evidence_photo_urls.length}/{CAR_WASH_VISIT_EVIDENCE_MAX}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visitForm.evidence_photo_urls.map((raw) => {
                          const src = resolveAssetUrl(raw, baseUrl);
                          if (!src) return null;
                          return (
                            <div key={raw} className="group relative">
                              <AppImageThumb
                                className="h-16 w-16 rounded-xl border-2 border-white shadow-md transition-transform group-hover:scale-105"
                                src={src}
                                alt="รูปหลักฐานรถ"
                                onOpen={() => lightbox.open(src)}
                              />
                              <button
                                type="button"
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md active:scale-90"
                                onClick={() =>
                                  setVisitForm((s) => ({
                                    ...s,
                                    evidence_photo_urls: s.evidence_photo_urls.filter((u) => u !== raw),
                                  }))
                                }
                                aria-label="ลบรูปหลักฐาน"
                              >
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                        {visitForm.evidence_photo_urls.length === 0 ? (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 text-slate-300">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                            </svg>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <AppImagePickCameraButtons
                          busy={visitPhotoBusy}
                          disabled={visitForm.evidence_photo_urls.length >= CAR_WASH_VISIT_EVIDENCE_MAX}
                          onPickGallery={() => visitGalleryInputRef.current?.click()}
                          onPickCamera={() => setVisitCameraOpen(true)}
                          labels={{ gallery: "เลือกหลายรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด..." }}
                        />
                        {visitForm.evidence_photo_urls.length > 0 ? (
                          <button
                            type="button"
                            disabled={visitPhotoBusy}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                            onClick={() => setVisitForm((s) => ({ ...s, evidence_photo_urls: [] }))}
                          >
                            ลบทั้งหมด
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <AppGalleryCameraFileInputs
              galleryInputRef={visitGalleryInputRef}
              cameraInputRef={visitCameraInputRef}
              galleryMultiple
              onChange={(e) => void onVisitGalleryFileChange(e)}
            />
          </form>
      </FormModal>

      <AppCameraCaptureModal
        open={visitCameraOpen}
        onClose={() => setVisitCameraOpen(false)}
        onCapture={(file) => void onVisitCameraCaptured(file)}
        onRequestLegacyPicker={() => {
          setVisitCameraOpen(false);
          requestAnimationFrame(() => visitCameraInputRef.current?.click());
        }}
        title="ถ่ายรูปหลักฐานรถ"
      />

      <AppCameraCaptureModal
        open={bundleTabCameraOpen}
        onClose={() => {
          setBundleTabCameraOpen(false);
          bundleTabSlipTargetIdRef.current = null;
        }}
        onCapture={(file) => void onBundleUnifiedCameraCaptured(file)}
        onRequestLegacyPicker={() => {
          setBundleTabCameraOpen(false);
          requestAnimationFrame(() => bundleTabCameraRef.current?.click());
        }}
        title="ถ่ายรูปสลิปแพ็กเหมา"
      />

      <FormModal open={showBundleModal} onClose={() => setShowBundleModal(false)} title="ขายแพ็กเกจเหมา" description="สมัครแพ็กเกจล้างรถแบบเหมาจ่ายรายครั้ง">
          <form className="space-y-6" onSubmit={(e) => void submitBundle(e)}>
            <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 sm:p-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ชื่อลูกค้า</label>
                <input
                  className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                  placeholder="เช่น คุณสมชาย"
                  value={bundleForm.customer_name}
                  onChange={(e) => setBundleForm((s) => ({ ...s, customer_name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5b61ff]">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <input
                      className={cn(
                        "peer w-full rounded-2xl border-indigo-100 bg-white pr-4 py-3.5 text-lg font-black tracking-widest text-indigo-900 placeholder:text-slate-200 focus:border-[#5b61ff] focus:ring-[#5b61ff] transition-all",
                        "pl-6 peer-placeholder-shown:pl-16",
                      )}
                      placeholder="08XXXXXXXX"
                      value={bundleForm.customer_phone}
                      onChange={(e) =>
                        setBundleForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                      }
                      inputMode="numeric"
                      required
                    />
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity peer-placeholder-shown:opacity-100"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">ทะเบียนรถ</label>
                  <div className="relative">
                    <input
                      className={cn(
                        "peer w-full rounded-2xl border-purple-100 bg-white pr-4 py-3.5 text-lg font-black tracking-widest text-purple-900 placeholder:text-slate-200 focus:border-[#8d64ff] focus:ring-[#8d64ff] transition-all",
                        "pl-6 peer-placeholder-shown:pl-16",
                      )}
                      placeholder="กข 1234"
                      value={bundleForm.plate_number}
                      onChange={(e) => setBundleForm((s) => ({ ...s, plate_number: e.target.value }))}
                      required
                    />
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity peer-placeholder-shown:opacity-100"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect width="18" height="12" x="3" y="6" rx="2" /><path d="M7 12h10M12 9v6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">เลือกแพ็กเกจที่จะเหมา</label>
                <select
                  className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold focus:ring-[#5b61ff]"
                  value={bundleForm.package_id}
                  onChange={(e) => {
                    const packageId = e.target.value;
                    const selectedPackage = packageId
                      ? packages.find((p) => p.id === Number(packageId)) ?? null
                      : null;
                    setBundleForm((s) => ({
                      ...s,
                      package_id: packageId,
                      paid_amount: selectedPackage ? String(selectedPackage.price) : s.paid_amount,
                    }));
                  }}
                  required
                >
                  <option value="">เลือกแพ็กเกจ…</option>
                  {packages
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (฿ {p.price})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ยอดชำระรวม (฿)</label>
                  <input
                    className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#1e1b4b] focus:ring-[#5b61ff]"
                    type="number"
                    value={bundleForm.paid_amount}
                    onChange={(e) => setBundleForm((s) => ({ ...s, paid_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนครั้งที่ได้</label>
                  <input
                    className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#1e1b4b] focus:ring-[#5b61ff]"
                    type="number"
                    value={bundleForm.total_uses}
                    onChange={(e) => setBundleForm((s) => ({ ...s, total_uses: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-lg border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                  checked={bundleForm.is_active}
                  onChange={(e) => setBundleForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                <span className="text-sm font-bold text-slate-600">เปิดใช้งานแพ็กเกจทันที</span>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">สลิปชำระเงิน (ถ้ามี)</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {bundleForm.slip_photo_url.trim() ? (
                  <div className="group relative">
                    <AppImageThumb
                      className="h-16 w-16 rounded-xl border-2 border-white shadow-md transition-transform group-hover:scale-105"
                      src={resolveAssetUrl(bundleForm.slip_photo_url.trim(), baseUrl)}
                      alt="สลิป"
                      onOpen={() => {
                        const u = resolveAssetUrl(bundleForm.slip_photo_url.trim(), baseUrl);
                        if (u) bundleTabLightbox.open(u);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md active:scale-90"
                      onClick={() => setBundleForm((s) => ({ ...s, slip_photo_url: "" }))}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-amber-100 bg-white/50 text-amber-200">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
                <AppImagePickCameraButtons
                  busy={bundleTabPhotoBusy}
                  onPickGallery={() => bundleModalSlipGalleryRef.current?.click()}
                  onPickCamera={() => {
                    bundleTabSlipTargetIdRef.current = null;
                    setBundleTabCameraOpen(true);
                  }}
                  labels={{ gallery: "เลือกรูปสลิป", camera: "ถ่ายรูปสลิป", busy: "กำลังอัปโหลด…" }}
                />
              </div>
              <input
                ref={bundleModalSlipGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onBundleModalGalleryFileChange(e)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b61ff] py-4 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-[#4d47b6] active:scale-[0.98] sm:w-auto sm:px-12"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                บันทึกการขาย
              </button>
            </div>
          </form>
      </FormModal>


      <FormModal
        open={bundleEditTarget != null && bundleEditForm != null}
        onClose={() => {
          setBundleEditTarget(null);
          setBundleEditForm(null);
        }}
        title={bundleEditTarget ? `แก้ไขแพ็กเหมา #${bundleEditTarget.id}` : "แก้ไขแพ็กเกจเหมา"}
        description="อัปเดตข้อมูลลูกค้าและสิทธิ์การใช้งาน"
        size="lg"
        footer={
          bundleEditForm ? (
            <FormModalFooterActions
              onCancel={() => {
                setBundleEditTarget(null);
                setBundleEditForm(null);
              }}
              submitLabel="บันทึกการแก้ไข"
              loading={bundleEditSaving}
              onSubmit={() => bundleEditFormRef.current?.requestSubmit()}
            />
          ) : null
        }
      >
        {bundleEditTarget && bundleEditForm ? (
          <form
            ref={bundleEditFormRef}
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void submitBundleEditFromTab();
            }}
          >
            <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 sm:p-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ชื่อลูกค้า</label>
                <input
                  className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                  placeholder="ชื่อลูกค้า"
                  value={bundleEditForm.customer_name}
                  onChange={(e) => setBundleEditForm((s) => (s ? { ...s, customer_name: e.target.value } : s))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5b61ff]">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <input
                      className={cn(
                        "peer w-full rounded-2xl border-indigo-100 bg-white pr-4 py-3.5 text-lg font-black tracking-widest text-indigo-900 placeholder:text-slate-200 focus:border-[#5b61ff] focus:ring-[#5b61ff] transition-all",
                        "pl-6 peer-placeholder-shown:pl-16",
                      )}
                      placeholder="08XXXXXXXX"
                      inputMode="numeric"
                      value={bundleEditForm.customer_phone}
                      onChange={(e) =>
                        setBundleEditForm((s) =>
                          s ? { ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) } : s,
                        )
                      }
                      required
                    />
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity peer-placeholder-shown:opacity-100"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">ทะเบียนรถ</label>
                  <div className="relative">
                    <input
                      className={cn(
                        "peer w-full rounded-2xl border-purple-100 bg-white pr-4 py-3.5 text-lg font-black tracking-widest text-purple-900 placeholder:text-slate-200 focus:border-[#8d64ff] focus:ring-[#8d64ff] transition-all",
                        "pl-6 peer-placeholder-shown:pl-16",
                      )}
                      placeholder="กข 1234"
                      value={bundleEditForm.plate_number}
                      onChange={(e) => setBundleEditForm((s) => (s ? { ...s, plate_number: e.target.value } : s))}
                      required
                    />
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity peer-placeholder-shown:opacity-100"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect width="18" height="12" x="3" y="6" rx="2" /><path d="M7 12h10M12 9v6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">แพ็กเกจบริการ</label>
                <select
                  className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold focus:ring-[#5b61ff]"
                  value={bundleEditForm.package_id}
                  onChange={(e) => {
                    const packageId = e.target.value;
                    const selectedPackage = packageId ? packages.find((p) => p.id === Number(packageId)) ?? null : null;
                    setBundleEditForm((s) => {
                      if (!s) return s;
                      return {
                        ...s,
                        package_id: packageId,
                        paid_amount: selectedPackage ? String(selectedPackage.price) : s.paid_amount,
                      };
                    });
                  }}
                  required
                >
                  {packages
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (฿ {p.price})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ยอดชำระรวม (฿)</label>
                  <input
                    className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#1e1b4b] focus:ring-[#5b61ff]"
                    type="number"
                    min={0}
                    value={bundleEditForm.paid_amount}
                    onChange={(e) => setBundleEditForm((s) => (s ? { ...s, paid_amount: e.target.value } : s))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนครั้ง</label>
                  <input
                    className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#1e1b4b] focus:ring-[#5b61ff]"
                    type="number"
                    min={1}
                    value={bundleEditForm.total_uses}
                    onChange={(e) => setBundleEditForm((s) => (s ? { ...s, total_uses: e.target.value } : s))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="px-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-lg border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                  checked={bundleEditForm.is_active}
                  onChange={(e) => setBundleEditForm((s) => (s ? { ...s, is_active: e.target.checked } : s))}
                />
                <span className="text-sm font-bold text-slate-600">เปิดใช้งานแพ็กเกจนี้</span>
              </label>
            </div>
            <p className="px-2 text-[10px] font-medium text-slate-400 italic">
              * แก้ไขรูปสลิปได้จากประวัติในแท็บยอดขาย หรือรายการด้านล่าง
            </p>
          </form>
        ) : null}
      </FormModal>

      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="ภาพแนบ" />
    </div>
  );
}

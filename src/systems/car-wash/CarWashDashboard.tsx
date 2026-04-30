"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import QRCode from "qrcode";
import {
  AppCameraCaptureModal,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  AppUsageGuideModal,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

const CAR_WASH_CUSTOMER_QR_TAGLINE =
  "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ";
const CAR_WASH_STAFF_QR_TAGLINE =
  "สแกนเข้าหน้าลานพนักงาน — บันทึกรายการและจัดการคิววันนี้ (ต้องล็อกอินร้าน)";
import { cn } from "@/lib/cn";
import { CAR_WASH_SERVICE_STATUSES, carWashStatusLabelTh } from "@/lib/car-wash/service-status";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import {
  buildCarWashBundleSlipInnerHtml,
  openCarWashBundleSlipPrintWindow,
  type PosTablePaperSize,
} from "@/systems/car-wash/car-wash-bundle-slip-print";
import {
  PopupIconButton,
  popupIconBtnDanger,
} from "@/systems/car-wash/car-wash-popup-icon-buttons";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { CarWashSalesPanel } from "@/systems/car-wash/CarWashSalesPanel";
import { CarWashServiceLanePanel } from "@/systems/car-wash/CarWashServiceLanePanel";
import { CarWashCostPanel } from "@/systems/car-wash/CarWashCostPanel";
import {
  type CarWashServiceStatus,
  type CostCategory,
  type CostEntry,
  createCarWashSessionApiRepository,
  uploadCarWashSessionImage,
  type ServiceVisit,
  type ServicePackage,
  type WashBundle,
  type WashBundlePatch,
} from "@/systems/car-wash/car-wash-service";

type TabKey = "overview" | "finance" | "offers" | "qr";
type OffersListTabKey = "packages" | "bundles";

function carWashTabIcon(key: TabKey) {
  if (key === "overview") return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
  if (key === "finance") return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
  if (key === "offers") return <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />;
  return <path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />;
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

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2rem] border p-5 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-6",
      toneStyles[tone]
    )}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
          {Icon && <div className="opacity-40">{Icon}</div>}
        </div>
        <p className="mt-4 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{value}</p>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" />
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
  defaultTab,
  layoutVariant = "full",
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
  /** แท็บเริ่มต้นเมื่อ layoutVariant เป็น full */
  defaultTab?: TabKey;
  /** staff_lane = หน้าเฉพาะลาน (มือถือ) ไม่มีเมนูเต็ม */
  layoutVariant?: "full" | "staff_lane";
}) {
  const repo = useMemo(() => createCarWashSessionApiRepository(), []);
  const lightbox = useAppImageLightbox();

  const isStaffLaneOnly = layoutVariant === "staff_lane";
  const [tab, setTab] = useState<TabKey>(
    isStaffLaneOnly ? "qr" : (defaultTab ?? "overview"),
  );
  const [loading, setLoading] = useState(true);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
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
    duration_minutes: "",
    description: "",
    is_active: true,
  });

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitAdvancedOpen, setVisitAdvancedOpen] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [offersListTab, setOffersListTab] = useState<OffersListTabKey>("packages");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showStaffQrModal, setShowStaffQrModal] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalQr, setPortalQr] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  /** ป๊อปอัป QR: ลิงก์ซ่อนเป็นค่าเริ่มต้น แตะแสดงลิงก์เมื่อต้องการ */
  const [qrLinkVisible, setQrLinkVisible] = useState(false);
  const [staffPortalQr, setStaffPortalQr] = useState<string | null>(null);
  const [staffPosterPreviewUrl, setStaffPosterPreviewUrl] = useState<string | null>(null);
  const [staffQrLinkVisible, setStaffQrLinkVisible] = useState(false);
  const [staffQrBusy, setStaffQrBusy] = useState(false);
  const [staffCopyMsg, setStaffCopyMsg] = useState<string | null>(null);
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
    photo_url: "",
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
  const [laneBusyVisitId, setLaneBusyVisitId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeBundles = useMemo(
    () => bundles.filter((b) => b.is_active && b.used_uses < b.total_uses),
    [bundles],
  );

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
  }, [loadAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

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
    if (bundleTabRowDetailId == null) return;
    if (!bundles.some((b) => b.id === bundleTabRowDetailId)) setBundleTabRowDetailId(null);
  }, [bundleTabRowDetailId, bundles]);

  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const staffPageUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return "";
    const u = new URL("/dashboard/car-wash/staff", root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, isTrialSandbox, trialSessionId]);

  useEffect(() => {
    if (showQrModal) setQrLinkVisible(false);
  }, [showQrModal]);

  useEffect(() => {
    if (showStaffQrModal) setStaffQrLinkVisible(false);
  }, [showStaffQrModal]);

  useEffect(() => {
    if (tab !== "qr") {
      setStaffQrLinkVisible(false);
      setShowQrModal(false);
      setShowStaffQrModal(false);
    }
  }, [tab]);

  useEffect(() => {
    const root = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl : "";
    if (!root) {
      setPortalUrl("");
      return;
    }
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    const q = params.toString();
    const base = `${root.replace(/\/$/, "")}/car-wash/check-in/${ownerId}`;
    setPortalUrl(q ? `${base}?${q}` : base);
  }, [baseUrl, ownerId, trialSessionId, isTrialSandbox]);

  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setPortalQr)
      .catch(() => setPortalQr(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!portalQr) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: portalQr,
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoUrl,
      tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
    })
      .then((url) => {
        if (!cancelled) setPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [portalQr, resolvedLogoUrl, shopLabel]);

  useEffect(() => {
    if (isStaffLaneOnly || tab !== "qr" || !staffPageUrl) {
      setStaffPortalQr(null);
      setStaffPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(staffPageUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setStaffPortalQr(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPortalQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isStaffLaneOnly, tab, staffPageUrl]);

  useEffect(() => {
    if (!staffPortalQr) {
      setStaffPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: staffPortalQr,
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoUrl,
      tagline: CAR_WASH_STAFF_QR_TAGLINE,
    })
      .then((url) => {
        if (!cancelled) setStaffPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffPortalQr, resolvedLogoUrl, shopLabel]);

  async function copyPortalLink() {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopyMsg("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopyMsg(null), 1800);
    } catch {
      setError("คัดลอกลิงก์ไม่สำเร็จ");
    }
  }

  async function copyStaffPageUrl() {
    if (!staffPageUrl) return;
    try {
      await navigator.clipboard.writeText(staffPageUrl);
      setStaffCopyMsg("คัดลอกลิงก์หน้าพนักงานแล้ว");
      setTimeout(() => setStaffCopyMsg(null), 1800);
    } catch {
      setError("คัดลอกลิงก์ไม่สำเร็จ");
    }
  }

  async function downloadQrPng() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
      });
      await downloadPosterPng(canvas, "car-wash-qr-poster.png");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdf() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, "car-wash-qr-poster-a4.pdf", "a4");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadStaffQrPng() {
    if (!staffPageUrl || !staffPortalQr) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_STAFF_QR_TAGLINE,
      });
      await downloadPosterPng(canvas, "car-wash-staff-qr-poster.png");
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadStaffQrPdf() {
    if (!staffPageUrl || !staffPortalQr) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_STAFF_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, "car-wash-staff-qr-poster-a4.pdf", "a4");
    } finally {
      setStaffQrBusy(false);
    }
  }

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
    setPkgForm({ name: "", price: "", duration_minutes: "", description: "", is_active: true });
    setShowPkgModal(true);
  }

  function openEditPackage(row: ServicePackage) {
    setEditingPkg(row);
    setPkgForm({
      name: row.name,
      price: String(row.price),
      duration_minutes: String(row.duration_minutes),
      description: row.description ?? "",
      is_active: row.is_active,
    });
    setShowPkgModal(true);
  }

  async function submitPackage(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(pkgForm.price);
    const duration = Number(pkgForm.duration_minutes);
    if (!pkgForm.name.trim() || !Number.isFinite(price) || !Number.isFinite(duration)) return;
    if (editingPkg) {
      await repo.updatePackage(editingPkg.id, {
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        description: pkgForm.description.trim(),
        is_active: pkgForm.is_active,
      });
    } else {
      await repo.createPackage({
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        description: pkgForm.description.trim(),
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
      photo_url: "",
    });
    setVisitLaneStatus("WASHING");
    setVisitEntryMode("walkin");
    setVisitAdvancedOpen(false);
    setShowVisitModal(true);
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
      setVisitLookupHint("พบจากประวัติการใช้บริการ — เลือกแพ็กเกจหรือราคาด้านล่าง");
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
      photo_url: "",
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
    if (bundleId != null) {
      const b = bundles.find((x) => x.id === bundleId);
      if (!b || !b.is_active || b.used_uses >= b.total_uses) {
        setError("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
        return;
      }
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
          photo_url: visitForm.photo_url.trim(),
          bundle_id: bundleId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "บันทึกรายการไม่สำเร็จ");
        return;
      }
      setShowVisitModal(false);
      setVisitLookupHint(null);
      setVisitLaneStatus("WASHING");
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
        photo_url: "",
      });
      await loadAll();
      return;
    }
    const pkgId = visitForm.package_id ? Number(visitForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    const listedPrice = pkg?.price ?? 0;
    const finalPriceRaw = Number(visitForm.final_price);
    const finalPrice = Number.isFinite(finalPriceRaw) ? finalPriceRaw : listedPrice;
    try {
      await repo.createVisit({
        customer_name: customerName,
        customer_phone: phoneDigits,
        plate_number: plateNumber,
        package_id: pkg?.id ?? null,
        package_name: pkg?.name ?? "บริการพิเศษ",
        listed_price: listedPrice,
        final_price: finalPrice,
        note: visitForm.note.trim(),
        recorded_by_name: recordedBy,
        service_status: visitLaneStatus,
        photo_url: visitForm.photo_url.trim(),
        bundle_id: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกรายการไม่สำเร็จ");
      return;
    }
    setShowVisitModal(false);
    setVisitLookupHint(null);
    setVisitLaneStatus("WASHING");
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
      photo_url: "",
    });
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

  const onVisitGalleryFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setVisitPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      setVisitForm((s) => ({ ...s, photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setVisitPhotoBusy(false);
    }
  }, []);

  const onVisitCameraCaptured = useCallback(async (file: File) => {
    setVisitCameraOpen(false);
    setVisitPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      setVisitForm((s) => ({ ...s, photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setVisitPhotoBusy(false);
    }
  }, []);

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

  const resolvedLogoForBundlePrint = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  function printBundleSlipDashboard(b: WashBundle, paper: PosTablePaperSize) {
    const printedAt = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour12: false,
    });
    const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
    const inner = buildCarWashBundleSlipInnerHtml({
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoForBundlePrint,
      bundle: b,
      printedAt,
      slipImageUrl: slipResolved,
    });
    const ok = openCarWashBundleSlipPrintWindow(paper, inner);
    if (!ok) {
      window.alert(
        "ไม่สามารถเปิดหน้าพิมพ์ได้ — ลองอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือรีเฟรชแล้วลองอีกครั้ง",
      );
    }
  }

  const onBundleModalGalleryFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBundleTabPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      setBundleForm((s) => ({ ...s, slip_photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBundleTabPhotoBusy(false);
    }
  }, []);

  const onBundleModalCameraCaptured = useCallback(async (file: File) => {
    setBundleTabPhotoBusy(true);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      setBundleForm((s) => ({ ...s, slip_photo_url: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBundleTabPhotoBusy(false);
    }
  }, []);

  const finalizeBundleTabListSlip = useCallback(
    async (file: File) => {
      const id = bundleTabSlipTargetIdRef.current;
      bundleTabSlipTargetIdRef.current = null;
      if (id == null) return;
      setBundleTabPhotoBusy(true);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared);
        await repo.updateBundle(id, { slip_photo_url: url });
        await loadAll();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
      } finally {
        setBundleTabPhotoBusy(false);
      }
    },
    [repo, loadAll],
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

  const tabItems: { key: TabKey; label: string }[] = [
    { key: "overview", label: "แดชบอร์ดของระบบ" },
    { key: "finance", label: "การเงิน" },
    { key: "offers", label: "แพ็กเกจ" },
    { key: "qr", label: "QR" },
  ];

  const serviceLanePanelEl = (
    <CarWashServiceLanePanel
      visits={visits}
      packages={packages}
      baseUrl={baseUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      paymentChannelsNote={paymentChannelsNote}
      busyVisitId={laneBusyVisitId}
      onSetStatus={handleVisitLaneStatus}
      onVisitPhotoUpdate={handleLaneVisitPhoto}
      onRecordVisit={openVisitModal}
      onRefresh={() => void refreshData()}
      refreshing={refreshing}
      iconOnlyActions={isStaffLaneOnly}
      staffLayout={isStaffLaneOnly}
    />
  );

  return (
    <div
      className={cn(
        "max-w-full space-y-4 sm:space-y-6",
        !isStaffLaneOnly && "pb-20 md:pb-0",
      )}
    >
      {!isStaffLaneOnly ? (
        <div
          className={cn(
            "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
            "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
            "sm:px-8 sm:py-6 print:hidden",
          )}
        >
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#f06dc8] text-white shadow-lg shadow-indigo-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                      <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                      <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">คาร์แคร์</h1>
                    <p className="hidden text-xs font-bold text-slate-500 md:block">ระบบจัดการลานล้างและแพ็กเกจสมาชิก</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsageGuideOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
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
          </header>

          <nav
            aria-label="เมนูคาร์แคร์"
            className="mt-5 hidden border-t border-white/40 pt-5 md:block print:hidden"
          >
            <ul className="flex gap-1">
              {tabItems.map((item) => {
                const active = tab === item.key;
                return (
                  <li key={item.key} className="flex-1">
                    <button
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
                        active
                          ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
                          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                      )}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className={cn("h-4 w-4", active ? "text-[#5b61ff]" : "text-slate-400")}
                        aria-hidden
                      >
                        {carWashTabIcon(item.key)}
                      </svg>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}

      {!isStaffLaneOnly ? (
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
                  <li>เปิดหน้าสร้าง QR ให้ลูกค้าเช็กสิทธิ์และใช้บริการสะดวกขึ้น</li>
                  <li>มีปุ่มคัดลอกลิงก์ แสดง/ซ่อนลิงก์ และดาวน์โหลดโปสเตอร์</li>
                  <li>แนะนำติด QR จุดรับรถเพื่อเร่งขั้นตอนหน้างาน</li>
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

      {isStaffLaneOnly ?
        <AppPublicCheckInGlassPage>
          <div className="relative mx-auto max-w-md space-y-4">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-[#5b61ff]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                  <circle cx="12" cy="11" r="2.5" />
                  <path d="m8 19 4-2 4 2" />
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">คาร์แคร์พนักงาน</h1>
              <p className="mt-1 text-sm text-[#6b6894]">บันทึกรายการและจัดการคิววันนี้</p>
              {shopLabel.trim() ?
                <p className="mt-2 text-xs font-bold text-[#9490c0]">{shopLabel.trim()}</p>
              : null}
            </div>
            {loading ? <p className="text-center text-sm text-[#66638c]">กำลังโหลด...</p> : null}
            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
            {!loading ?
              <div className={appPublicCheckInGlassCardClass}>
                <div className="px-5 py-5 sm:px-6">{serviceLanePanelEl}</div>
              </div>
            : null}
          </div>
        </AppPublicCheckInGlassPage>
      : tab === "overview" ? (
        <div className="space-y-6">
          <div className="space-y-4 rounded-[2.5rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถิติวันนี้</h3>
              <div className="ml-4 h-px flex-1 bg-white/65" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
        </div>
      ) : tab === "qr" ?
        <div className="space-y-4">
          {loading ? <p className="text-sm font-medium text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          {!loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffQrModal(false);
                    setShowQrModal(true);
                  }}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                    "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
                    "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                    "ring-1 ring-inset ring-white/60 transition-all duration-300",
                    "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
                    "active:translate-y-0 sm:p-8",
                  )}
                  aria-label="เปิดจัดการ QR ลูกค้า"
                >
                  <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
                  <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                        เช็กสิทธิ์แพ็กเหมาและสแกนเข้าใช้บริการ — คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ และดูตัวอย่างในป๊อปอัป
                      </p>
                      <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b61ff]">
                        <span>คลิกเพื่อเปิด</span>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setShowStaffQrModal(true);
                  }}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                    "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
                    "p-6 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                    "ring-1 ring-inset ring-white/60 transition-all duration-300",
                    "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
                    "active:translate-y-0 sm:p-8",
                  )}
                  aria-label="เปิดจัดการ QR พนักงาน"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
                  <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR พนักงาน</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                        ลิงก์หน้าลานและโปสเตอร์สำหรับทีม — คัดลอก ดาวน์โหลด และดูตัวอย่างในป๊อปอัป
                      </p>
                      <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
                        <span>คลิกเพื่อเปิด</span>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </p>
                    </div>
                  </div>
                </button>
            </div>
          ) : null}
        </div>
      : null}

      {!isStaffLaneOnly && tab === "finance" ? (
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

                <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-[#1e1b4b]">แพ็กเกจและเหมาจ่าย</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      รวม {packages.length} แพ็กเกจบริการ · {bundles.length} รายการเหมาจ่าย
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-1">
                    <div className="flex items-center gap-1 rounded-xl border border-white/60 bg-white/40 p-1 backdrop-blur-md">
                      {offersListTab === "packages" ?
                        <div className="mr-1.5 flex items-center gap-1 border-r border-slate-200 pr-1.5">
                          <button
                            type="button"
                            onClick={openCreatePackage}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5b61ff] px-2.5 text-xs font-bold text-white shadow-sm ring-1 ring-[#5b61ff] hover:bg-[#4d47b6]"
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
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5b61ff] px-2.5 text-xs font-bold text-white shadow-sm ring-1 ring-[#5b61ff] hover:bg-[#4d47b6]"
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
                          offersListTab === "packages" ?
                            "bg-white/80 text-[#5b61ff] shadow-sm ring-1 ring-white/80"
                          : "text-slate-600 hover:bg-white/55 hover:text-slate-800",
                        )}
                        onClick={() => setOffersListTab("packages")}
                      >
                        แพ็กเกจ
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                          offersListTab === "bundles" ?
                            "bg-white/80 text-amber-700 shadow-sm ring-1 ring-white/80"
                          : "text-slate-600 hover:bg-white/55 hover:text-slate-800",
                        )}
                        onClick={() => setOffersListTab("bundles")}
                      >
                        เหมาจ่าย
                      </button>
                    </div>
                  </div>
                </div>

                {offersListTab === "packages" ?
                  packages.length === 0 ?
                    <AppEmptyState tone="glass">ยังไม่มีแพ็กเกจ — กด «เพิ่มแพ็กเกจ» เพื่อสร้างรายการแรก</AppEmptyState>
                  : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
                      <ul
                        className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
                        aria-label="แพ็กเกจบริการคาร์แคร์"
                      >
                        {packages.map((p) => (
                          <li
                            key={p.id}
                            className="group/item relative flex min-h-0 flex-col gap-2 overflow-hidden px-3 py-3 transition-all duration-300 hover:bg-white/45 sm:px-4 lg:min-h-[200px] lg:rounded-2xl lg:border lg:border-white/60 lg:bg-white/50 lg:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.42)] lg:backdrop-blur-xl lg:hover:-translate-y-1 lg:hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.45)]"
                          >
                            <span
                              aria-hidden
                              className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff] via-[#8d64ff] to-[#f06dc8] opacity-80 transition-all group-hover/item:w-1.5"
                            />
                            <div className="relative flex min-w-0 items-start justify-between gap-2 border-b border-white/70 pb-2">
                              <h3 className="min-w-0 text-xs font-bold text-[#2e2a58] sm:text-sm">{p.name}</h3>
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold sm:text-[11px] ${
                                  p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {p.is_active ? "เปิด" : "ปิด"}
                              </span>
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
                    : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
                        <ul
                          className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
                          aria-label="รายการเหมาจ่ายคาร์แคร์"
                        >
                          {bundles.map((b) => {
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

      {!isStaffLaneOnly ? (
        <nav
          className={cn(
            "fixed inset-x-4 bottom-6 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
            "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
            "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
          )}
          aria-label="เมนูล่างคาร์แคร์"
        >
          <ul className="grid grid-cols-4 gap-1">
            {tabItems.map((item) => {
              const active = tab === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setTab(item.key)}
                    aria-label={item.label}
                    className={cn(
                      "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
                      active
                        ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
                        : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className="h-5 w-5"
                      aria-hidden
                    >
                      {carWashTabIcon(item.key)}
                    </svg>
                    <span className="text-[9px] font-black">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
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
                    label="พิมพ์ใบ"
                    onClick={() => printBundleSlipDashboard(b, "SLIP_80")}
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
        description="กำหนดชื่อ ราคา และรายละเอียดบริการ"
        footer={
          <FormModalFooterActions
            onCancel={() => setShowPkgModal(false)}
            onSubmit={() => {
              const form = document.getElementById("pkg-form") as HTMLFormElement;
              form?.requestSubmit();
            }}
            submitLabel="บันทึกแพ็กเกจ"
          />
        }
      >
        <form id="pkg-form" className="space-y-6" onSubmit={(e) => void submitPackage(e)}>
          <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 sm:p-8">
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
                  placeholder="30"
                  value={pkgForm.duration_minutes}
                  onChange={(e) => setPkgForm((s) => ({ ...s, duration_minutes: e.target.value }))}
                  required
                />
              </div>
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
      </FormModal>

      <FormModal
        open={showVisitModal}
        size="lg"
        mobileCentered={isStaffLaneOnly}
        onClose={() => {
          setShowVisitModal(false);
          setVisitLookupHint(null);
          setVisitAdvancedOpen(false);
        }}
        title="บันทึกรายการ"
        description="กรอกข้อมูลลูกค้าและแพ็กเกจ — แบบฟอร์มกระชับสไตล์ POS"
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
          <form ref={visitFormRef} className="space-y-6" onSubmit={(e) => void submitVisit(e)}>
            {/* Mode Switcher */}
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
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Walk-in
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
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  แพ็กเกจเหมา
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            ) : null}

            {/* Status Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สถานะเริ่มต้น</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CAR_WASH_SERVICE_STATUSES.filter((s) => s !== "COMPLETED" && s !== "PAID").map((s) => (
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

            {/* Main Form Section */}
            <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 sm:p-8">
              {visitEntryMode === "walkin" ? (
                <div className="space-y-5">
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      ชื่อลูกค้า <span className="font-medium normal-case text-slate-400">(ไม่บังคับ)</span>
                    </label>
                    <input
                      className="w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                      placeholder="เช่น คุณสมชาย"
                      value={visitForm.customer_name}
                      onChange={(e) => setVisitForm((s) => ({ ...s, customer_name: e.target.value }))}
                    />
                  </div>

                  {/* Highlighted Fields: Phone & Plate */}
                  <p className="text-[10px] font-bold text-slate-400">
                    กรอกเบอร์โทรหรือทะเบียนรถอย่างน้อยหนึ่งอย่าง
                  </p>
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
                        value={visitForm.customer_phone}
                        onChange={(e) =>
                          setVisitForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                        }
                        inputMode="numeric"
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
                        value={visitForm.plate_number}
                        onChange={(e) => setVisitForm((s) => ({ ...s, plate_number: e.target.value }))}
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

                  {/* Package Selector */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">เลือกแพ็กเกจบริการ</label>
                    <div className="grid grid-cols-1 gap-2">
                      {packages
                        .filter((p) => p.is_active)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setVisitForm((s) => ({
                                ...s,
                                package_id: String(p.id),
                                bundle_id: "",
                                final_price: String(p.price),
                              }));
                            }}
                            className={cn(
                              "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all active:scale-[0.98]",
                              visitForm.package_id === String(p.id)
                                ? "border-[#5b61ff] bg-white text-[#5b61ff] shadow-sm ring-1 ring-[#5b61ff]"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            )}
                          >
                            <span className="text-sm font-bold">{p.name}</span>
                            <span className="text-sm font-black">฿{p.price.toLocaleString()}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Bundle Search */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d64ff]">ค้นหาลูกค้าแพ็กเหมา</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          className={cn(
                            "peer w-full rounded-2xl border-purple-100 bg-white pr-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:border-[#8d64ff] focus:ring-[#8d64ff] transition-all",
                            "pl-4 peer-placeholder-shown:pl-16",
                          )}
                          placeholder="เบอร์โทร หรือ ทะเบียนรถ"
                          value={visitForm.customer_lookup}
                          onChange={(e) => setVisitForm((s) => ({ ...s, customer_lookup: e.target.value }))}
                        />
                        <span
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity peer-placeholder-shown:opacity-100"
                          aria-hidden
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                          </svg>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={runVisitLookup}
                        className="rounded-2xl bg-[#8d64ff] px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-100 transition-all active:scale-95"
                      >
                        ค้นหา
                      </button>
                    </div>
                  </div>

                  {visitLookupHint ? (
                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-[11px] font-bold text-indigo-600">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16h.01M12 8v4" />
                      </svg>
                      {visitLookupHint}
                    </div>
                  ) : null}

                  {visitForm.bundle_id && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">ข้อมูลที่พบ</p>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">ชื่อลูกค้า</p>
                          <p className="text-sm font-black text-emerald-900">{visitForm.customer_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500">ทะเบียนรถ</p>
                          <p className="text-sm font-black text-emerald-900">{visitForm.plate_number || "-"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowVisitModal(false);
                      setShowBundleModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-xs font-bold text-slate-400 transition-all hover:border-[#8d64ff] hover:text-[#8d64ff] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    ยังไม่มีแพ็กเกจ? คลิกเพื่อขายแพ็กเกจใหม่
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div className="rounded-2xl border border-slate-100 bg-white p-2">
              <button
                type="button"
                onClick={() => setVisitAdvancedOpen((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-xs font-black text-slate-500">ข้อมูลเพิ่มเติม (โน้ต / รูปแนบ)</span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn("h-4 w-4 text-slate-400 transition-transform", visitAdvancedOpen && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รูปแนบ (สภาพรถ / สลิป)</label>
                      <div className="flex flex-wrap items-center gap-3">
                        {visitForm.photo_url.trim() ? (
                          <div className="group relative">
                            <AppImageThumb
                              className="h-16 w-16 rounded-xl border-2 border-white shadow-md transition-transform group-hover:scale-105"
                              src={resolveAssetUrl(visitForm.photo_url.trim(), baseUrl)}
                              alt="รูปแนบ"
                              onOpen={() => {
                                const u = resolveAssetUrl(visitForm.photo_url.trim(), baseUrl);
                                if (u) lightbox.open(u);
                              }}
                            />
                            <button
                              type="button"
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md active:scale-90"
                              onClick={() => setVisitForm((s) => ({ ...s, photo_url: "" }))}
                            >
                              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 text-slate-300">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                            </svg>
                          </div>
                        )}
                        <AppImagePickCameraButtons
                          busy={visitPhotoBusy}
                          onPickGallery={() => visitGalleryInputRef.current?.click()}
                          onPickCamera={() => setVisitCameraOpen(true)}
                          labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด..." }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <AppGalleryCameraFileInputs
              galleryInputRef={visitGalleryInputRef}
              cameraInputRef={visitCameraInputRef}
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
        title="ถ่ายรูปรายการ"
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

      <FormModal
        open={showQrModal}
        size="lg"
        appearance="glass"
        glassTint="violet"
        onClose={() => setShowQrModal(false)}
        title="QR ลูกค้า"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
            </button>
          </div>
        }
      >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyPortalLink()}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="2" y="2" width="13" height="13" rx="2" /></svg>
                <span className="cw-btn-label">คัดลอกลิงก์</span>
              </button>
              <button
                type="button"
                onClick={() => setQrLinkVisible((v) => !v)}
                className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  {qrLinkVisible ? <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" /> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
                <span className="cw-btn-label">{qrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPdf()}
                className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPng()}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                <span className="cw-btn-label">ดาวน์โหลด PNG</span>
              </button>
            </div>
            {copyMsg ?
              <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
                {copyMsg}
              </p>
            : null}
            {qrLinkVisible ?
              <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
                {portalUrl || "-"}
              </p>
            : (
              <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
                ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
              </p>
            )}
            <div className="overflow-x-auto rounded-2xl border border-white/50 bg-white/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md">
              {posterPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR คาร์แคร์" className="mx-auto w-[340px] rounded-3xl shadow-lg shadow-indigo-950/10" />
              ) : (
                <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-white/45 bg-white/40 text-xs font-medium text-slate-600 backdrop-blur-sm">
                  กำลังเรนเดอร์ตัวอย่าง...
                </div>
              )}
            </div>
          </div>
      </FormModal>

      <FormModal
        open={showStaffQrModal}
        size="lg"
        appearance="glass"
        glassTint="amber"
        onClose={() => setShowStaffQrModal(false)}
        title="QR พนักงาน"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowStaffQrModal(false)}
              className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyStaffPageUrl()}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="2" y="2" width="13" height="13" rx="2" /></svg>
              <span className="cw-btn-label">คัดลอกลิงก์</span>
            </button>
            <button
              type="button"
              onClick={() => setStaffQrLinkVisible((v) => !v)}
              className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {staffQrLinkVisible ? <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" /> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
              <span className="cw-btn-label">{staffQrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPortalQr}
              onClick={() => void downloadStaffQrPdf()}
              className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPortalQr}
              onClick={() => void downloadStaffQrPng()}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
              <span className="cw-btn-label">ดาวน์โหลด PNG</span>
            </button>
          </div>
          {staffCopyMsg ?
            <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
              {staffCopyMsg}
            </p>
          : null}
          {staffQrLinkVisible ?
            <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
              {staffPageUrl || "-"}
            </p>
          : (
            <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
              ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-white/50 bg-white/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md">
            {staffPosterPreviewUrl ?
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={staffPosterPreviewUrl}
                alt="ตัวอย่างโปสเตอร์ QR พนักงานคาร์แคร์"
                className="mx-auto w-[340px] rounded-3xl shadow-lg shadow-amber-950/10"
              />
            : staffPageUrl ?
              <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-white/45 bg-white/40 text-xs font-medium text-slate-600 backdrop-blur-sm">
                กำลังเรนเดอร์ตัวอย่าง...
              </div>
            : (
              <div className="mx-auto flex min-h-[200px] max-w-md items-center justify-center rounded-3xl border border-amber-300/50 bg-amber-100/35 px-4 text-center text-xs font-medium text-amber-950 backdrop-blur-sm">
                ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง เพื่อให้ลิงก์และโปสเตอร์ถูกต้อง
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="ภาพแนบ" />
    </div>
  );
}

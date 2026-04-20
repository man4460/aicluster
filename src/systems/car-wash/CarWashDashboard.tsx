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
  AppSectionHeader,
  AppUsageGuideModal,
  useAppImageLightbox,
} from "@/components/app-templates";
import {
  HomeFinanceEntityRow,
  HomeFinanceList,
  HomeFinanceListHeading,
  HomeFinancePageSection,
} from "@/systems/home-finance/components/HomeFinanceUi";
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
  SalesRowOpenDetailButton,
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

type TabKey = "overview" | "sales" | "costs" | "packages" | "bundles" | "staff_qr";

function icon(kind: "add" | "edit" | "delete" | "status") {
  if (kind === "add") return <span aria-hidden>➕</span>;
  if (kind === "edit") return <span aria-hidden>✏️</span>;
  if (kind === "delete") return <span aria-hidden>🗑️</span>;
  return <span aria-hidden>🔄</span>;
}

/** สถิติแบบแดชบอร์ดรายรับ–รายจ่าย */
function CarWashStat({
  title,
  value,
  tone = "blue",
}: {
  title: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
        ? "border-red-200 bg-red-50"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50"
          : tone === "slate"
            ? "border-slate-200 bg-slate-50"
            : "border-[#0000BF]/20 bg-[#0000BF]/[0.03]";
  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", toneClass)}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{value}</p>
    </div>
  );
}

const carWashNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

const cardShellClass = "app-surface-strong rounded-lg border border-[#e8e6f4]/60 px-3 py-2.5 shadow-sm";
const cardHeadClass = "flex items-start justify-between gap-2 border-b border-[#e8e6f4]/80 pb-2";
const cardActionsClass = "mt-2 flex justify-end gap-1.5 border-t border-[#e8e6f4]/70 pt-2";
const cardActionSm = "rounded-md px-2 py-0.5 text-[11px] font-semibold sm:text-xs";

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
    isStaffLaneOnly ? "staff_qr" : (defaultTab ?? "overview"),
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
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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

  const activeBundles = useMemo(
    () => bundles.filter((b) => b.is_active && b.used_uses < b.total_uses),
    [bundles],
  );

  const bundleTabRowDetail = useMemo(
    () =>
      bundleTabRowDetailId != null ? bundles.find((x) => x.id === bundleTabRowDetailId) ?? null : null,
    [bundleTabRowDetailId, bundles],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void loadAll();
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
    if (tab !== "staff_qr") setStaffQrLinkVisible(false);
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
    if (isStaffLaneOnly || tab !== "staff_qr" || !staffPageUrl) {
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
      const v = m.v;
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
    setVisitLookupHint("ไม่พบข้อมูล — กรอกชื่อ เบอร์ ทะเบียนเป็น Walk-in");
  }

  async function submitVisit(e: React.FormEvent) {
    e.preventDefault();
    const customerName = visitForm.customer_name.trim();
    const plateNumber = visitForm.plate_number.trim();
    const phoneDigits = visitForm.customer_phone.replace(/\D/g, "").trim();
    if (!customerName || !plateNumber) return;
    if (phoneDigits.length > 0 && phoneDigits.length < 9) {
      setError("เบอร์โทรต้องอย่างน้อย 9 หลัก หรือเว้นว่าง");
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
    { key: "overview", label: "แดชบอร์ด" },
    { key: "sales", label: "ยอดขาย" },
    { key: "costs", label: "ต้นทุน" },
    { key: "packages", label: "แพ็กเกจ" },
    { key: "bundles", label: "แพ็กเกจเหมา" },
    { key: "staff_qr", label: "QR พนักงาน" },
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
    />
  );

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      {!isStaffLaneOnly ?
        <>
          <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">คาร์แคร์</h1>
                <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
                  แพ็กเกจ · บันทึกการล้าง — QR ลูกค้า
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="app-btn-soft min-h-[44px] shrink-0 rounded-xl border border-[#dcd8f0] px-4 py-2.5 text-sm font-semibold text-[#4d47b6] hover:bg-[#f4f3ff]"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
              >
                คู่มือการใช้งาน
              </button>
            </div>
          </header>

          <nav aria-label="เมนูคาร์แคร์" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
            <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
            <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              {tabItems.map((item) => (
                <li key={item.key} className="min-w-0 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={cn(
                      carWashNavItemBase,
                      "w-full sm:w-auto",
                      tab === item.key
                        ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                        : "app-btn-soft text-[#66638c]",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li className="min-w-0 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className={cn(carWashNavItemBase, "w-full sm:w-auto app-btn-soft text-[#4d47b6]")}
                >
                  QR ลูกค้า
                </button>
              </li>
            </ul>
          </nav>
        </>
      : <div className="app-surface rounded-2xl px-4 py-4 sm:px-6 print:hidden">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#2e2a58] sm:text-xl">ลานล้างวันนี้ (พนักงาน)</h1>
            <p className="mt-0.5 text-xs text-[#66638c]">เฉพาะคิวในลาน — บันทึกรายการใหม่ได้</p>
          </div>
        </div>
      }

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
        <>
          {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading ? serviceLanePanelEl : null}
        </>
      : tab === "overview" ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <HomeFinanceListHeading>สถิติวันนี้</HomeFinanceListHeading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CarWashStat title="ลูกค้าวันนี้ (ไม่ซ้ำ)" value={String(todayStats.uniqueCustomers)} tone="slate" />
              <CarWashStat title="เข้าใช้บริการรวม" value={String(todayStats.totalVisits)} tone="blue" />
              <CarWashStat title="ใช้แพ็กเกจ" value={String(todayStats.packageUses)} tone="green" />
              <CarWashStat
                title="รายรับวันนี้"
                value={`฿${todayStats.revenue.toLocaleString("th-TH")}`}
                tone="amber"
              />
            </div>
          </div>
          {serviceLanePanelEl}
        </div>
      ) : tab === "staff_qr" ?
        <div className="space-y-4">
          {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading ?
            <>
              <AppDashboardSection tone="violet">
                <AppSectionHeader tone="violet" title="QR พนักงาน" />
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyStaffPageUrl()}
                      className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6]"
                    >
                      คัดลอกลิงก์
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffQrLinkVisible((v) => !v)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {staffQrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
                    </button>
                    <button
                      type="button"
                      disabled={staffQrBusy || !staffPortalQr}
                      onClick={() => void downloadStaffQrPdf()}
                      className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      ดาวน์โหลด PDF (A4)
                    </button>
                    <button
                      type="button"
                      disabled={staffQrBusy || !staffPortalQr}
                      onClick={() => void downloadStaffQrPng()}
                      className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
                    >
                      ดาวน์โหลด PNG
                    </button>
                  </div>
                  {staffCopyMsg ?
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{staffCopyMsg}</p>
                  : null}
                  {staffQrLinkVisible ?
                    <p className="break-all rounded-lg bg-[#f8f8ff] px-3 py-2 text-xs text-[#4d47b6]">{staffPageUrl || "-"}</p>
                  : (
                    <p className="rounded-lg border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-2 text-xs text-[#8b87ad]">
                      ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
                    {staffPosterPreviewUrl ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={staffPosterPreviewUrl}
                        alt="ตัวอย่างโปสเตอร์ QR พนักงานคาร์แคร์"
                        className="mx-auto w-[340px] rounded-3xl shadow-md"
                      />
                    : staffPageUrl ?
                      <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
                        กำลังเรนเดอร์ตัวอย่าง...
                      </div>
                    : (
                      <div className="mx-auto flex min-h-[200px] max-w-md items-center justify-center rounded-3xl border border-amber-200 bg-amber-50/80 px-4 text-center text-xs text-amber-900">
                        ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง เพื่อให้ลิงก์และโปสเตอร์ถูกต้อง
                      </div>
                    )}
                  </div>
                </div>
              </AppDashboardSection>
              {serviceLanePanelEl}
            </>
          : null}
        </div>
      : null}

      {!isStaffLaneOnly && tab === "sales" ?
        <CarWashSalesPanel
          visits={visits}
          bundles={bundles}
          packages={packages}
          costEntries={costEntries}
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
      : null}

      {tab === "costs" ?
        <HomeFinancePageSection>
          {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading ?
            <CarWashCostPanel
              repo={repo}
              baseUrl={baseUrl}
              categories={costCategories}
              entries={costEntries}
              onRefresh={loadAll}
            />
          : null}
        </HomeFinancePageSection>
      : null}

      {tab === "packages" || tab === "bundles" ? (
        <HomeFinancePageSection>
          {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && tab === "packages" ? (
            <div className="space-y-4">
              <AppSectionHeader
                tone="slate"
                title="แพ็กเกจ"
                action={
                  <button type="button" onClick={openCreatePackage} className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold">
                    {icon("add")} เพิ่ม
                  </button>
                }
              />

              <div className="flex flex-col gap-2">
                {packages.map((p) => (
                  <article key={p.id} className={cardShellClass}>
                    <div className={cardHeadClass}>
                      <h3 className="min-w-0 text-xs font-bold text-[#2e2a58] sm:text-sm">{p.name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold sm:text-[11px] ${
                          p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {p.is_active ? "เปิด" : "ปิด"}
                      </span>
                    </div>
                    {p.description?.trim() ? (
                      <p className="mb-1.5 line-clamp-2 text-[11px] leading-snug text-[#5f5a8a]">{p.description}</p>
                    ) : null}
                    <div className="flex items-baseline justify-between gap-2 border-t border-[#e8e6f4]/70 pt-1.5 text-[11px] sm:text-xs">
                      <span className="text-[#8b87ad]">ราคา / เวลา</span>
                      <span>
                        <span className="font-semibold text-[#4d47b6]">฿{p.price.toLocaleString()}</span>
                        <span className="text-[#8b87ad]"> · </span>
                        <span className="font-medium text-[#2e2a58]">{p.duration_minutes} น.</span>
                      </span>
                    </div>
                    <div className={cn(cardActionsClass, "flex-wrap")}>
                      <button
                        type="button"
                        onClick={() => openEditPackage(p)}
                        className={cn(cardActionSm, "app-btn-soft text-[#4d47b6]")}
                      >
                        {icon("edit")} แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => void removePackage(p.id)}
                        className={cn(cardActionSm, "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100")}
                      >
                        {icon("delete")} ลบ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && tab === "bundles" ? (
            <div className="space-y-4">
              <AppImageLightbox src={bundleTabLightbox.src} onClose={bundleTabLightbox.close} alt="สลิปแพ็กเหมา" />
              <AppGalleryCameraFileInputs
                galleryInputRef={bundleTabGalleryRef}
                cameraInputRef={bundleTabCameraRef}
                onChange={onBundleTabGalleryChange}
              />
              <AppSectionHeader
                tone="slate"
                title="เหมาจ่าย"
                description="ซื้อครั้งเดียว ใช้หลายครั้ง — กดไอคอนรายละเอียดที่แต่ละการ์ดเพื่อดูสลิป อัปโหลด พิมพ์ใบ แก้ไข หรือลบ"
                action={
                  <button
                    type="button"
                    onClick={() => setShowBundleModal(true)}
                    className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    {icon("add")} เพิ่มเหมา
                  </button>
                }
              />
              {bundles.length === 0 ? (
                <AppEmptyState tone="slate">ยังไม่มีแพ็กเหมา</AppEmptyState>
              ) : (
                <HomeFinanceList listRole="รายการเหมาจ่าย">
                  {bundles.map((b) => {
                    const remaining = Math.max(0, b.total_uses - b.used_uses);
                    const canUse = b.is_active && remaining > 0;
                    const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
                    const phoneLine = b.customer_phone?.trim() || "—";
                    return (
                      <HomeFinanceEntityRow
                        key={b.id}
                        className="items-stretch justify-between gap-0 border-l-[3px] border-amber-200/80 bg-amber-50/25 px-2.5 py-2.5 sm:px-3 sm:py-3"
                      >
                        {/* ซ้าย: สลิป + รายละเอียด */}
                        <div className="flex min-w-0 flex-1 flex-row items-center gap-2.5 sm:gap-3">
                          <div className="flex shrink-0 items-center self-start pt-0.5">
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
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold ${
                                  canUse ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {canUse ? "ใช้ได้" : "หมด"}
                              </span>
                              <span className="shrink-0 rounded bg-slate-100 px-1 py-px font-mono text-[9px] text-slate-600">
                                #{b.id}
                              </span>
                            </div>
                            <p className="truncate text-base font-bold tabular-nums leading-tight text-[#2e2a58] sm:text-lg">
                              {b.plate_number.trim() || "—"}
                            </p>
                            <p className="truncate text-sm font-semibold text-slate-900">{b.customer_name.trim() || "—"}</p>
                            <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                              {phoneLine} · {b.package_name.trim() || "—"}
                            </p>
                          </div>
                        </div>
                        {/* ขวา: ยอด สิทธิ์ ปุ่ม — แยกเส้นแนวตั้ง */}
                        <div className="ml-2 flex shrink-0 flex-col items-end justify-between gap-2 self-stretch border-l border-amber-200/70 pl-2.5 sm:ml-3 sm:min-w-[5.25rem] sm:pl-3">
                          <div className="w-full text-right leading-tight">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/70">ยอด</p>
                            <p className="text-base font-bold tabular-nums text-amber-900 sm:text-lg">
                              ฿{b.paid_amount.toLocaleString("th-TH")}
                            </p>
                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">สิทธิ์คงเหลือ</p>
                            <p className="text-xs font-bold tabular-nums text-[#0000BF]">
                              {remaining}/{b.total_uses}
                            </p>
                          </div>
                          <SalesRowOpenDetailButton onClick={() => setBundleTabRowDetailId(b.id)} />
                        </div>
                      </HomeFinanceEntityRow>
                    );
                  })}
                </HomeFinanceList>
              )}
            </div>
          ) : null}
        </HomeFinancePageSection>
      ) : null}

      <FormModal
        open={bundleTabRowDetail != null}
        onClose={() => setBundleTabRowDetailId(null)}
        title={bundleTabRowDetail ? `แพ็กเหมา #${bundleTabRowDetail.id}` : "แพ็กเหมา"}
        description="รายละเอียดและปุ่มไอคอน — ชี้ค้างที่ปุ่มเพื่อดูคำอธิบาย"
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
                  <p className="mt-2 text-xs text-slate-600">
                    สิทธิ์ {remaining}/{b.total_uses} ครั้ง · ยอดซื้อ{" "}
                    <span className="font-bold tabular-nums text-amber-900">
                      ฿{b.paid_amount.toLocaleString()}
                    </span>
                  </p>
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
      >
          <form className="space-y-3" onSubmit={(e) => void submitPackage(e)}>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="ชื่อแพ็กเกจ"
              value={pkgForm.name}
              onChange={(e) => setPkgForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                placeholder="ราคา"
                value={pkgForm.price}
                onChange={(e) => setPkgForm((s) => ({ ...s, price: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                placeholder="ระยะเวลา (นาที)"
                value={pkgForm.duration_minutes}
                onChange={(e) => setPkgForm((s) => ({ ...s, duration_minutes: e.target.value }))}
                required
              />
            </div>
            <textarea
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="รายละเอียด"
              value={pkgForm.description}
              onChange={(e) => setPkgForm((s) => ({ ...s, description: e.target.value }))}
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm text-[#55517d]">
              <input
                type="checkbox"
                checked={pkgForm.is_active}
                onChange={(e) => setPkgForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดใช้งานแพ็กเกจ
            </label>
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </form>
      </FormModal>

      <FormModal
        open={showVisitModal}
        size="lg"
        onClose={() => {
          setShowVisitModal(false);
          setVisitLookupHint(null);
        }}
        title="บันทึกรายการ"
        description="กรอกข้อมูลลูกค้าและแพ็กเกจ — แนบรูปสลิปได้ (แบบ POS)"
        footer={
          <FormModalFooterActions
            cancelLabel="ปิด"
            onCancel={() => {
              setShowVisitModal(false);
              setVisitLookupHint(null);
            }}
            submitLabel="บันทึก"
            onSubmit={() => visitFormRef.current?.requestSubmit()}
          />
        }
      >
          <form ref={visitFormRef} className="space-y-3" onSubmit={(e) => void submitVisit(e)}>
            <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2 text-sm">
              <p className="text-xs font-semibold text-[#4d47b6]">ผู้บันทึก</p>
              <p className="mt-0.5 font-medium text-[#2e2a58]">{recorderDisplayName}</p>
              <input
                className="app-input mt-2 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="แก้ชื่อผู้บันทึก (ถ้าไม่ใช่ผู้ใช้นี้)"
                value={visitForm.recorded_by_override}
                onChange={(e) => setVisitForm((s) => ({ ...s, recorded_by_override: e.target.value }))}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-[#4d47b6]">ค้นหาจากเบอร์โทรหรือทะเบียน</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="app-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น 0812345678 หรือ กข 1234"
                  value={visitForm.customer_lookup}
                  onChange={(e) => setVisitForm((s) => ({ ...s, customer_lookup: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={runVisitLookup}
                  className="app-btn-soft shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-[#4d47b6]"
                >
                  ค้นหา
                </button>
              </div>
              {visitLookupHint ? <p className="mt-1 text-xs text-[#5f5a8a]">{visitLookupHint}</p> : null}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2">
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เข้าลานเป็น
                <select
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm text-[#2e2a58]"
                  value={visitLaneStatus}
                  onChange={(e) => setVisitLaneStatus(e.target.value as CarWashServiceStatus)}
                >
                  {CAR_WASH_SERVICE_STATUSES.filter((s) => s !== "COMPLETED" && s !== "PAID").map((s) => (
                    <option key={s} value={s}>
                      {carWashStatusLabelTh(s)} ({s})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <select
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              value={visitForm.bundle_id}
              onChange={(e) => {
                const bundleId = e.target.value;
                const selected = bundleId ? activeBundles.find((b) => b.id === Number(bundleId)) ?? null : null;
                setVisitForm((s) => ({
                  ...s,
                  bundle_id: bundleId,
                  customer_name: selected?.customer_name ?? s.customer_name,
                  customer_phone: selected?.customer_phone ?? s.customer_phone,
                  plate_number: selected?.plate_number ?? s.plate_number,
                  package_id: selected ? String(selected.package_id) : s.package_id,
                  final_price: selected ? "0" : s.final_price,
                }));
              }}
            >
              <option value="">เลือกลูกค้าเหมาจ่าย (ระบบเติมข้อมูลอัตโนมัติ)</option>
              {activeBundles.map((b) => {
                const remaining = b.total_uses - b.used_uses;
                return (
                  <option key={b.id} value={b.id}>
                    {b.customer_name} / {b.plate_number} / {b.package_name} - เหลือ {remaining} ครั้ง
                  </option>
                );
              })}
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อลูกค้า (Walk-in กรอกเอง)"
                value={visitForm.customer_name}
                onChange={(e) => setVisitForm((s) => ({ ...s, customer_name: e.target.value }))}
                required
                disabled={Boolean(visitForm.bundle_id)}
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เบอร์โทร (ไม่บังคับ — อย่างน้อย 9 หลักถ้ากรอก)"
                value={visitForm.customer_phone}
                onChange={(e) =>
                  setVisitForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                }
                inputMode="numeric"
                disabled={Boolean(visitForm.bundle_id)}
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm sm:col-span-2"
                placeholder="ทะเบียนรถ"
                value={visitForm.plate_number}
                onChange={(e) => setVisitForm((s) => ({ ...s, plate_number: e.target.value }))}
                required
                disabled={Boolean(visitForm.bundle_id)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                value={visitForm.package_id}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = pkgId ? packages.find((p) => p.id === Number(pkgId)) ?? null : null;
                  setVisitForm((s) => ({
                    ...s,
                    package_id: pkgId,
                    bundle_id: s.bundle_id,
                    final_price: pkg ? String(pkg.price) : s.final_price,
                  }));
                }}
                disabled={Boolean(visitForm.bundle_id)}
              >
                <option value="">เลือกแพ็กเกจ (หรือบริการพิเศษ)</option>
                {packages
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (฿ {p.price})
                    </option>
                  ))}
              </select>
              <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2 text-xs text-[#5f5a8a]">
                {visitForm.bundle_id
                  ? "เลือกแพ็กเกจเหมาแล้ว ระบบจะหักสิทธิ์อัตโนมัติ 1 ครั้ง"
                  : "ถ้าไม่เลือกเหมาจ่าย ให้เลือกแพ็กเกจหรือกรอกราคาเอง"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ราคาที่คิดจริง"
                type="number"
                value={visitForm.final_price}
                onChange={(e) => setVisitForm((s) => ({ ...s, final_price: e.target.value }))}
                disabled={Boolean(visitForm.bundle_id)}
              />
            </div>
            <textarea
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              value={visitForm.note}
              onChange={(e) => setVisitForm((s) => ({ ...s, note: e.target.value }))}
              rows={3}
            />
            <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2">
              <p className="text-xs font-semibold text-[#4d47b6]">รูปแนบ (สลิป / หลักฐาน)</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {visitForm.photo_url.trim() ?
                  <>
                    <AppImageThumb
                      className="!h-14 !w-14 rounded-lg border border-[#e8e6f4]"
                      src={resolveAssetUrl(visitForm.photo_url.trim(), baseUrl)}
                      alt="รูปแนบ"
                      onOpen={() => {
                        const u = resolveAssetUrl(visitForm.photo_url.trim(), baseUrl);
                        if (u) lightbox.open(u);
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#4d47b6] underline touch-manipulation"
                      onClick={() => setVisitForm((s) => ({ ...s, photo_url: "" }))}
                    >
                      ล้างรูป
                    </button>
                    <span className="text-[11px] text-[#66638c]">แนบแล้ว — อัปโหลดใหม่ได้</span>
                  </>
                : <span className="text-[11px] text-[#9b98c4]">ยังไม่มีรูป</span>}
                <AppImagePickCameraButtons
                  className="ml-auto"
                  busy={visitPhotoBusy}
                  onPickGallery={() => visitGalleryInputRef.current?.click()}
                  onPickCamera={() => setVisitCameraOpen(true)}
                  labels={{ gallery: "อัปโหลดรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                />
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

      <FormModal open={showBundleModal} onClose={() => setShowBundleModal(false)} title="เพิ่มเหมาจ่าย">
          <form className="space-y-3" onSubmit={(e) => void submitBundle(e)}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อลูกค้า"
                value={bundleForm.customer_name}
                onChange={(e) => setBundleForm((s) => ({ ...s, customer_name: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เบอร์โทรลูกค้า"
                value={bundleForm.customer_phone}
                onChange={(e) =>
                  setBundleForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                }
                inputMode="numeric"
                required
              />
            </div>
            <p className="text-xs text-[#66638c]">เบอร์โทรนี้จะใช้สำหรับค้นหาและให้ลูกค้าเช็กอินผ่าน QR</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ทะเบียนรถ"
                value={bundleForm.plate_number}
                onChange={(e) => setBundleForm((s) => ({ ...s, plate_number: e.target.value }))}
                required
              />
              <select
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
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
                <option value="">เลือกแพ็กเกจบริการ</option>
                {packages
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (฿ {p.price})
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ยอดชำระรวม"
                type="number"
                value={bundleForm.paid_amount}
                onChange={(e) => setBundleForm((s) => ({ ...s, paid_amount: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="จำนวนครั้งที่ใช้ได้"
                type="number"
                value={bundleForm.total_uses}
                onChange={(e) => setBundleForm((s) => ({ ...s, total_uses: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#55517d]">
              <input
                type="checkbox"
                checked={bundleForm.is_active}
                onChange={(e) => setBundleForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดใช้งานแพ็กเกจนี้
            </label>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
              <p className="text-xs font-semibold text-amber-950">สลิปชำระเงิน (ไม่บังคับ)</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {bundleForm.slip_photo_url.trim() ?
                  <>
                    <AppImageThumb
                      className="!h-14 !w-14 rounded-lg border border-amber-200"
                      src={resolveAssetUrl(bundleForm.slip_photo_url.trim(), baseUrl)}
                      alt="สลิป"
                      onOpen={() => {
                        const u = resolveAssetUrl(bundleForm.slip_photo_url.trim(), baseUrl);
                        if (u) bundleTabLightbox.open(u);
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs font-semibold text-amber-900 underline touch-manipulation"
                      onClick={() => setBundleForm((s) => ({ ...s, slip_photo_url: "" }))}
                    >
                      ล้างสลิป
                    </button>
                  </>
                : <span className="text-[11px] text-amber-900/70">ยังไม่มีสลิป</span>}
                <AppImagePickCameraButtons
                  className="ml-auto"
                  busy={bundleTabPhotoBusy}
                  onPickGallery={() => bundleModalSlipGalleryRef.current?.click()}
                  onPickCamera={() => {
                    bundleTabSlipTargetIdRef.current = null;
                    setBundleTabCameraOpen(true);
                  }}
                  labels={{ gallery: "อัปโหลดสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
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
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
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
        title={bundleEditTarget ? `แก้ไขแพ็กเหมา #${bundleEditTarget.id}` : "แก้ไข"}
        size="lg"
        footer={
          bundleEditForm ?
            <FormModalFooterActions
              cancelLabel="ปิด"
              onCancel={() => {
                setBundleEditTarget(null);
                setBundleEditForm(null);
              }}
              submitLabel="บันทึก"
              loading={bundleEditSaving}
              onSubmit={() => bundleEditFormRef.current?.requestSubmit()}
            />
          : null
        }
      >
        {bundleEditTarget && bundleEditForm ?
          <form
            ref={bundleEditFormRef}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitBundleEditFromTab();
            }}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อลูกค้า"
                value={bundleEditForm.customer_name}
                onChange={(e) =>
                  setBundleEditForm((s) => (s ? { ...s, customer_name: e.target.value } : s))
                }
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เบอร์โทร"
                inputMode="numeric"
                value={bundleEditForm.customer_phone}
                onChange={(e) =>
                  setBundleEditForm((s) =>
                    s ? { ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) } : s,
                  )
                }
                required
              />
            </div>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="ทะเบียนรถ"
              value={bundleEditForm.plate_number}
              onChange={(e) =>
                setBundleEditForm((s) => (s ? { ...s, plate_number: e.target.value } : s))
              }
              required
            />
            <select
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              value={bundleEditForm.package_id}
              onChange={(e) => {
                const packageId = e.target.value;
                const selectedPackage = packageId
                  ? packages.find((p) => p.id === Number(packageId)) ?? null
                  : null;
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                min={0}
                placeholder="ยอดชำระรวม"
                value={bundleEditForm.paid_amount}
                onChange={(e) =>
                  setBundleEditForm((s) => (s ? { ...s, paid_amount: e.target.value } : s))
                }
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                min={1}
                placeholder="จำนวนครั้ง"
                value={bundleEditForm.total_uses}
                onChange={(e) =>
                  setBundleEditForm((s) => (s ? { ...s, total_uses: e.target.value } : s))
                }
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#55517d]">
              <input
                type="checkbox"
                checked={bundleEditForm.is_active}
                onChange={(e) =>
                  setBundleEditForm((s) => (s ? { ...s, is_active: e.target.checked } : s))
                }
              />
              เปิดใช้งานแพ็กนี้
            </label>
            <p className="text-[11px] text-[#66638c]">
              แก้สลิปได้จากแท็บนี้ (อัปโหลด/ถ่าย) หรือจากแท็บยอดขาย
            </p>
          </form>
        : null}
      </FormModal>

      <FormModal
        open={showQrModal}
        size="lg"
        onClose={() => setShowQrModal(false)}
        title="QR ลูกค้า"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              ปิด
            </button>
          </div>
        }
      >
          <div className="space-y-3">
            <p className="text-sm text-[#5f5a8a]">เทมเพลตเดียวกับร้านตัดผม: ลูกค้าสแกน กรอกเบอร์ และยืนยันใช้สิทธิ์</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyPortalLink()}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6]"
              >
                คัดลอกลิงก์
              </button>
              <button
                type="button"
                onClick={() => setQrLinkVisible((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {qrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPdf()}
                className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                ดาวน์โหลด PDF (A4)
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPng()}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              >
                ดาวน์โหลด PNG
              </button>
            </div>
            {copyMsg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{copyMsg}</p> : null}
            {qrLinkVisible ?
              <p className="break-all rounded-lg bg-[#f8f8ff] px-3 py-2 text-xs text-[#4d47b6]">{portalUrl || "-"}</p>
            : (
              <p className="rounded-lg border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-2 text-xs text-[#8b87ad]">
                ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
              </p>
            )}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
              {posterPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR คาร์แคร์" className="mx-auto w-[340px] rounded-3xl shadow-md" />
              ) : (
                <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
                  กำลังเรนเดอร์ตัวอย่าง...
                </div>
              )}
            </div>
          </div>
      </FormModal>

      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="ภาพแนบ" />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppCompareBarList,
  type AppCompareBarRow,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  useAppImageLightbox,
} from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
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
import {
  uploadCarWashSessionImage,
  type CarWashServiceStatus,
  type CostEntry,
  type ServicePackage,
  type ServiceVisit,
  type ServiceVisitPatch,
  type WashBundle,
  type WashBundlePatch,
} from "@/systems/car-wash/car-wash-service";

const MAX_COMPARE_ROWS = 18;

function capLeaderboard(entries: [string, number][], max: number): [string, number][] {
  if (entries.length <= max) return entries;
  const head = entries.slice(0, max - 1);
  const tail = entries.slice(max - 1);
  const restSum = tail.reduce((s, [, a]) => s + a, 0);
  return [...head, ["อื่น ๆ รวม", restSum]];
}

function entriesToBarRows(entries: [string, number][]): AppCompareBarRow[] {
  if (entries.length === 0) return [];
  const maxAmt = Math.max(...entries.map(([, a]) => a), 1);
  return entries.map(([label, amount], i) => ({
    key: `${label}__${i}`,
    label,
    amount,
    pct: Math.round((amount / maxAmt) * 100),
  }));
}

/** รายการที่นับเป็นการใช้สิทธิ์เหมา (ยังมี bundle_id หรือปิดคิวแล้วแต่ชื่อแพ็กเป็นรูปแบบเหมาจ่าย) */
function isBundleConsumptionVisit(v: ServiceVisit): boolean {
  if (v.bundle_id != null) return true;
  return v.package_name.trim().startsWith("เหมาจ่าย:");
}

/** ชื่อแพ็กสำหรับกราฟฝั่งเหมา — ตัดคำนำหน้าเหมาจ่าย */
function bundleVisitPackageLabel(v: ServiceVisit): string {
  const p = v.package_name.trim();
  if (p.toLowerCase().startsWith("เหมาจ่าย:")) {
    const rest = p.replace(/^เหมาจ่าย:\s*/i, "").trim();
    return rest || "ไม่ระบุแพ็กเกจ";
  }
  return p || "ไม่ระบุแพ็กเกจ";
}

function getBangkokDateFilterDefaults(): { year: string; month: string; day: string } {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [y, mRaw, dRaw] = key.split("-");
  return {
    year: y ?? "",
    month: mRaw ? String(Number(mRaw)) : "",
    day: dRaw ? String(Number(dRaw)) : "",
  };
}

function visitDateKeyBangkok(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function visitPartsBangkok(iso: string): { y: number; m: number; d: number } {
  const key = visitDateKeyBangkok(iso);
  const [y, m, d] = key.split("-").map((x) => Number(x));
  return { y, m, d };
}

function matchesPeriod(iso: string, year: string, month: string, day: string): boolean {
  const { y, m, d } = visitPartsBangkok(iso);
  if (year) {
    const yN = Number(year);
    if (!Number.isFinite(yN) || y !== yN) return false;
  }
  if (month) {
    const mN = Number(month);
    if (!Number.isFinite(mN) || m !== mN) return false;
  }
  if (day) {
    const dN = Number(day);
    if (!Number.isFinite(dN) || d !== dN) return false;
  }
  return true;
}

function maxDayInMonthForFilter(yearStr: string, monthStr: string): number {
  const m = Number(monthStr);
  if (!monthStr || !Number.isFinite(m) || m < 1 || m > 12) return 31;
  const y =
    yearStr && Number.isFinite(Number(yearStr)) && Number(yearStr) >= 1900
      ? Number(yearStr)
      : 2024;
  return new Date(y, m, 0).getDate();
}

function matchesSearchVisit(v: ServiceVisit, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [v.customer_name, v.plate_number, v.package_name, v.note, v.recorded_by_name].join(" ").toLowerCase();
  return blob.includes(s);
}

function matchesSearchBundle(b: WashBundle, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [b.customer_name, b.plate_number, b.package_name, b.customer_phone].join(" ").toLowerCase();
  return blob.includes(s);
}

function matchesSearchCostEntry(e: CostEntry, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [e.category_name, e.item_label, e.note].join(" ").toLowerCase();
  return blob.includes(s);
}

function formatChartLabel(isoDateKey: string): string {
  const p = isoDateKey.split("-").map(Number);
  const d = p[2] ?? 0;
  const m = p[1] ?? 0;
  return `${d}/${m}`;
}

function visitStatusPillClass(s: ServiceVisit["service_status"]): string {
  switch (s) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80";
    case "PAID":
      return "bg-emerald-200 text-emerald-950 ring-1 ring-emerald-300/80";
    case "QUEUED":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
    case "WASHING":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80";
    case "VACUUMING":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80";
    case "WAXING":
      return "bg-teal-100 text-teal-900 ring-1 ring-teal-200/80";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80";
  }
}

function isoToDatetimeLocalInput(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tz);
  return local.toISOString().slice(0, 16);
}

function datetimeLocalToIso(localValue: string): string {
  if (!localValue.trim()) return new Date().toISOString();
  const d = new Date(localValue);
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

type EditFormState = {
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: string;
  listed_price: string;
  final_price: string;
  note: string;
  recorded_by_name: string;
  service_status: CarWashServiceStatus;
  visit_at_local: string;
};

type EditBundleFormState = {
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: string;
  paid_amount: string;
  total_uses: string;
  is_active: boolean;
};

function visitToEditForm(v: ServiceVisit): EditFormState {
  return {
    customer_name: v.customer_name,
    customer_phone: v.customer_phone,
    plate_number: v.plate_number,
    package_id: v.package_id != null ? String(v.package_id) : "",
    listed_price: String(v.listed_price),
    final_price: String(v.final_price),
    note: v.note,
    recorded_by_name: v.recorded_by_name,
    service_status: v.service_status,
    visit_at_local: isoToDatetimeLocalInput(v.visit_at),
  };
}

function bundleToEditForm(b: WashBundle): EditBundleFormState {
  return {
    customer_name: b.customer_name,
    customer_phone: b.customer_phone,
    plate_number: b.plate_number,
    package_id: String(b.package_id),
    paid_amount: String(b.paid_amount),
    total_uses: String(b.total_uses),
    is_active: b.is_active,
  };
}

export function CarWashSalesPanel({
  visits,
  bundles,
  packages,
  baseUrl,
  shopLabel,
  logoUrl = null,
  recorderDisplayName,
  onRefresh,
  updateVisit,
  deleteVisit,
  updateBundle,
  deleteBundle,
  costEntries = [],
}: {
  visits: ServiceVisit[];
  bundles: WashBundle[];
  packages: ServicePackage[];
  costEntries?: CostEntry[];
  baseUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  recorderDisplayName: string;
  onRefresh: () => Promise<void>;
  updateVisit: (id: number, patch: ServiceVisitPatch) => Promise<ServiceVisit | null>;
  deleteVisit: (id: number) => Promise<boolean>;
  updateBundle: (id: number, patch: WashBundlePatch) => Promise<WashBundle | null>;
  deleteBundle: (id: number) => Promise<boolean>;
}) {
  const lightbox = useAppImageLightbox();
  const bangkokFilterDefaults = useMemo(() => getBangkokDateFilterDefaults(), []);
  /** เดือนปัจจุบัน (ไทย) + ทุกวันในเดือน — ไม่ล็อกเป็นวันนี้ */
  const [filterYear, setFilterYear] = useState(bangkokFilterDefaults.year);
  const [filterMonth, setFilterMonth] = useState(bangkokFilterDefaults.month);
  const [filterDay, setFilterDay] = useState("");
  const [search, setSearch] = useState("");

  const photoTargetVisitIdRef = useRef<number | null>(null);
  const photoTargetBundleIdRef = useRef<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [listPhotoBusy, setListPhotoBusy] = useState(false);
  const [photoUploadVisitId, setPhotoUploadVisitId] = useState<number | null>(null);
  const [photoUploadBundleId, setPhotoUploadBundleId] = useState<number | null>(null);
  const [listCameraOpen, setListCameraOpen] = useState(false);
  const [busyVisitId, setBusyVisitId] = useState<number | null>(null);
  const [busyBundleId, setBusyBundleId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [salesRowDetail, setSalesRowDetail] = useState<
    { kind: "visit"; id: number } | { kind: "bundle"; id: number } | null
  >(null);

  const [editVisit, setEditVisit] = useState<ServiceVisit | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editFormRef = useRef<HTMLFormElement>(null);

  const [editBundle, setEditBundle] = useState<WashBundle | null>(null);
  const [editBundleForm, setEditBundleForm] = useState<EditBundleFormState | null>(null);
  const [editBundleSaving, setEditBundleSaving] = useState(false);
  const editBundleFormRef = useRef<HTMLFormElement>(null);

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    const nowKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    ys.add(Number(nowKey.slice(0, 4)));
    visits.forEach((v) => ys.add(visitPartsBangkok(v.visit_at).y));
    bundles.forEach((b) => ys.add(visitPartsBangkok(b.created_at).y));
    costEntries.forEach((e) => ys.add(visitPartsBangkok(e.spent_at).y));
    return Array.from(ys).sort((a, b) => b - a);
  }, [visits, bundles, costEntries]);

  const dayNumbers = useMemo(() => {
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (!filterDay) return;
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    if (Number(filterDay) > max) setFilterDay("");
  }, [filterYear, filterMonth, filterDay]);

  const filteredVisits = useMemo(() => {
    return visits.filter(
      (v) => matchesPeriod(v.visit_at, filterYear, filterMonth, filterDay) && matchesSearchVisit(v, search),
    );
  }, [visits, filterYear, filterMonth, filterDay, search]);

  const filteredBundles = useMemo(() => {
    return bundles.filter(
      (b) => matchesPeriod(b.created_at, filterYear, filterMonth, filterDay) && matchesSearchBundle(b, search),
    );
  }, [bundles, filterYear, filterMonth, filterDay, search]);

  const filteredCostEntries = useMemo(() => {
    return costEntries.filter(
      (e) => matchesPeriod(e.spent_at, filterYear, filterMonth, filterDay) && matchesSearchCostEntry(e, search),
    );
  }, [costEntries, filterYear, filterMonth, filterDay, search]);

  const salesDetailVisit = useMemo(() => {
    if (!salesRowDetail || salesRowDetail.kind !== "visit") return null;
    return visits.find((v) => v.id === salesRowDetail.id) ?? null;
  }, [salesRowDetail, visits]);

  const salesDetailBundle = useMemo(() => {
    if (!salesRowDetail || salesRowDetail.kind !== "bundle") return null;
    return bundles.find((b) => b.id === salesRowDetail.id) ?? null;
  }, [salesRowDetail, bundles]);

  useEffect(() => {
    if (!salesRowDetail) return;
    const ok =
      salesRowDetail.kind === "visit"
        ? visits.some((v) => v.id === salesRowDetail.id)
        : bundles.some((b) => b.id === salesRowDetail.id);
    if (!ok) setSalesRowDetail(null);
  }, [salesRowDetail, visits, bundles]);

  const completedForChart = useMemo(() => {
    return filteredVisits.filter((v) => v.service_status === "COMPLETED" || v.service_status === "PAID");
  }, [filteredVisits]);

  const revenueCostBuckets = useMemo(() => {
    const revenueByDay = new Map<string, number>();
    for (const v of completedForChart) {
      const k = visitDateKeyBangkok(v.visit_at);
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + v.final_price);
    }
    for (const b of filteredBundles) {
      const k = visitDateKeyBangkok(b.created_at);
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + b.paid_amount);
    }
    const costByDay = new Map<string, number>();
    for (const e of filteredCostEntries) {
      const k = visitDateKeyBangkok(e.spent_at);
      costByDay.set(k, (costByDay.get(k) ?? 0) + e.amount);
    }
    const allKeys = new Set<string>([...revenueByDay.keys(), ...costByDay.keys()]);
    const keys = Array.from(allKeys).sort();
    const maxBars = 36;
    const slice = keys.length > maxBars ? keys.slice(-maxBars) : keys;
    const maxVal = Math.max(
      1,
      ...slice.flatMap((k) => [revenueByDay.get(k) ?? 0, costByDay.get(k) ?? 0]),
    );
    return slice.map((k) => {
      const revenue = revenueByDay.get(k) ?? 0;
      const cost = costByDay.get(k) ?? 0;
      return {
        key: k,
        label: formatChartLabel(k),
        revenue,
        cost,
        revenuePct: Math.round((revenue / maxVal) * 100),
        costPct: Math.round((cost / maxVal) * 100),
      };
    });
  }, [completedForChart, filteredBundles, filteredCostEntries]);

  const periodTotalRevenue = useMemo(() => {
    let s = 0;
    for (const v of completedForChart) s += v.final_price;
    for (const b of filteredBundles) s += b.paid_amount;
    return s;
  }, [completedForChart, filteredBundles]);

  const periodTotalCost = useMemo(() => filteredCostEntries.reduce((a, e) => a + e.amount, 0), [filteredCostEntries]);

  /** เข้าลานแบบปกติ: รวมยอดสุดท้าย (final) ต่อชื่อแพ็กเกจ — ไม่รวมรายการที่ใช้สิทธิ์เหมา */
  const packageCompareRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const v of completedForChart) {
      if (isBundleConsumptionVisit(v)) continue;
      const label = v.package_name.trim() || "ไม่ระบุแพ็กเกจ";
      totals.set(label, (totals.get(label) ?? 0) + v.final_price);
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [completedForChart]);

  /** ใช้สิทธิ์แบบเหมา: นับจำนวนครั้งต่อชื่อแพ็กเกจ (รวมรายการที่ยังผูก bundle หรือปิดคิวแล้วแต่เป็นเหมาจ่าย) */
  const bundlePackageCompareRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const v of completedForChart) {
      if (!isBundleConsumptionVisit(v)) continue;
      const label = bundleVisitPackageLabel(v);
      totals.set(label, (totals.get(label) ?? 0) + 1);
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [completedForChart]);

  const mergedSalesRows = useMemo(() => {
    type Row =
      | { kind: "visit"; at: string; v: ServiceVisit }
      | { kind: "bundle"; at: string; b: WashBundle };
    const rows: Row[] = [
      ...filteredVisits.map((v) => ({ kind: "visit" as const, at: v.visit_at, v })),
      ...filteredBundles.map((b) => ({ kind: "bundle" as const, at: b.created_at, b })),
    ];
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return rows;
  }, [filteredVisits, filteredBundles]);

  const resolvedLogoForPrint = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const finalizeListPhoto = useCallback(
    async (file: File) => {
      const vid = photoTargetVisitIdRef.current;
      const bid = photoTargetBundleIdRef.current;
      photoTargetVisitIdRef.current = null;
      photoTargetBundleIdRef.current = null;
      if (vid == null && bid == null) return;
      setListPhotoBusy(true);
      if (vid != null) setPhotoUploadVisitId(vid);
      if (bid != null) setPhotoUploadBundleId(bid);
      setListError(null);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared);
        if (vid != null) await updateVisit(vid, { photo_url: url });
        else if (bid != null) await updateBundle(bid, { slip_photo_url: url });
        await onRefresh();
      } catch (e) {
        setListError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
        window.alert(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
      } finally {
        setListPhotoBusy(false);
        setPhotoUploadVisitId(null);
        setPhotoUploadBundleId(null);
      }
    },
    [onRefresh, updateBundle, updateVisit],
  );

  const onListGalleryChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeListPhoto(file);
    },
    [finalizeListPhoto],
  );

  const onListCameraCapture = useCallback(
    async (file: File) => {
      setListCameraOpen(false);
      await finalizeListPhoto(file);
    },
    [finalizeListPhoto],
  );

  function openPickGalleryForVisit(id: number) {
    photoTargetBundleIdRef.current = null;
    photoTargetVisitIdRef.current = id;
    galleryInputRef.current?.click();
  }

  function openCameraForVisit(id: number) {
    photoTargetBundleIdRef.current = null;
    photoTargetVisitIdRef.current = id;
    setListCameraOpen(true);
  }

  function openPickGalleryForBundle(id: number) {
    photoTargetVisitIdRef.current = null;
    photoTargetBundleIdRef.current = id;
    galleryInputRef.current?.click();
  }

  function openCameraForBundle(id: number) {
    photoTargetVisitIdRef.current = null;
    photoTargetBundleIdRef.current = id;
    setListCameraOpen(true);
  }

  async function clearPhotoForVisit(id: number) {
    if (!confirm("ลบรูปแนบออกจากรายการนี้?")) return;
    setBusyVisitId(id);
    setListError(null);
    try {
      await updateVisit(id, { photo_url: "" });
      await onRefresh();
    } catch {
      setListError("อัปเดตไม่สำเร็จ");
    } finally {
      setBusyVisitId(null);
    }
  }

  async function removeVisitRow(id: number) {
    if (!confirm("ยืนยันลบบันทึกการใช้บริการนี้?")) return;
    setSalesRowDetail((cur) => (cur?.kind === "visit" && cur.id === id ? null : cur));
    setBusyVisitId(id);
    setListError(null);
    try {
      await deleteVisit(id);
      await onRefresh();
    } catch {
      setListError("ลบไม่สำเร็จ");
    } finally {
      setBusyVisitId(null);
    }
  }

  async function clearBundleSlip(id: number) {
    if (!confirm("ลบสลิปแพ็กเหมาออกจากรายการนี้?")) return;
    setBusyBundleId(id);
    setListError(null);
    try {
      await updateBundle(id, { slip_photo_url: "" });
      await onRefresh();
    } catch {
      setListError("อัปเดตไม่สำเร็จ");
    } finally {
      setBusyBundleId(null);
    }
  }

  async function removeBundleRow(id: number) {
    if (!confirm("ยืนยันลบแพ็กเกจเหมารายการนี้? (การใช้สิทธิ์ที่ผูกไว้จะสูญหากลบ)")) return;
    setSalesRowDetail((cur) => (cur?.kind === "bundle" && cur.id === id ? null : cur));
    setBusyBundleId(id);
    setListError(null);
    try {
      await deleteBundle(id);
      await onRefresh();
    } catch {
      setListError("ลบไม่สำเร็จ");
    } finally {
      setBusyBundleId(null);
    }
  }

  function printBundleSlip(b: WashBundle, paper: PosTablePaperSize) {
    const printedAt = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour12: false,
    });
    const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
    const inner = buildCarWashBundleSlipInnerHtml({
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoForPrint,
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

  function openEdit(v: ServiceVisit) {
    setEditVisit(v);
    setEditForm(visitToEditForm(v));
  }

  async function submitEdit() {
    if (!editVisit || !editForm) return;
    const phoneDigits = editForm.customer_phone.replace(/\D/g, "").trim();
    if (phoneDigits.length > 0 && phoneDigits.length < 9) {
      window.alert("เบอร์โทรต้องอย่างน้อย 9 หลัก หรือเว้นว่าง");
      return;
    }
    const pkgId = editForm.package_id ? Number(editForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    const listedPrice = pkg?.price ?? Number(editForm.listed_price);
    const finalPriceRaw = Number(editForm.final_price);
    const finalPrice = Number.isFinite(finalPriceRaw) ? finalPriceRaw : listedPrice;

    setEditSaving(true);
    setListError(null);
    try {
      const patch: ServiceVisitPatch = {
        customer_name: editForm.customer_name.trim(),
        customer_phone: phoneDigits,
        plate_number: editForm.plate_number.trim(),
        package_id: pkg?.id ?? null,
        package_name: pkg?.name ?? editVisit.package_name,
        listed_price: Number.isFinite(listedPrice) ? listedPrice : 0,
        final_price: Number.isFinite(finalPrice) ? finalPrice : 0,
        note: editForm.note.trim(),
        recorded_by_name: editForm.recorded_by_name.trim() || recorderDisplayName,
        service_status: editForm.service_status,
        visit_at: datetimeLocalToIso(editForm.visit_at_local),
      };
      const updated = await updateVisit(editVisit.id, patch);
      if (!updated) {
        setListError("ไม่พบรายการหรืออัปเดตไม่สำเร็จ");
        return;
      }
      setEditVisit(null);
      setEditForm(null);
      await onRefresh();
    } catch {
      setListError("บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setEditSaving(false);
    }
  }

  function openEditBundle(b: WashBundle) {
    setEditBundle(b);
    setEditBundleForm(bundleToEditForm(b));
  }

  async function submitEditBundle() {
    if (!editBundle || !editBundleForm) return;
    const phoneDigits = editBundleForm.customer_phone.replace(/\D/g, "").trim();
    if (phoneDigits.length < 9) {
      window.alert("แพ็กเหมาต้องใส่เบอร์โทรลูกค้าอย่างน้อย 9 หลัก");
      return;
    }
    const pkgId = editBundleForm.package_id ? Number(editBundleForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    if (!pkg) {
      window.alert("เลือกแพ็กเกจบริการ");
      return;
    }
    const paidRaw = Number(editBundleForm.paid_amount);
    const usesRaw = Number(editBundleForm.total_uses);
    if (!Number.isFinite(paidRaw) || paidRaw < 0) {
      window.alert("ยอดชำระไม่ถูกต้อง");
      return;
    }
    if (!Number.isFinite(usesRaw) || usesRaw < 1) {
      window.alert("จำนวนครั้งไม่ถูกต้อง");
      return;
    }
    if (usesRaw < editBundle.used_uses) {
      window.alert("จำนวนครั้งรวมต้องไม่น้อยกว่าที่ใช้ไปแล้ว");
      return;
    }

    setEditBundleSaving(true);
    setListError(null);
    try {
      const patch: WashBundlePatch = {
        customer_name: editBundleForm.customer_name.trim(),
        customer_phone: phoneDigits,
        plate_number: editBundleForm.plate_number.trim(),
        package_id: pkg.id,
        package_name: pkg.name,
        paid_amount: paidRaw,
        total_uses: usesRaw,
        is_active: editBundleForm.is_active,
      };
      const updated = await updateBundle(editBundle.id, patch);
      if (!updated) {
        setListError("ไม่พบรายการหรืออัปเดตไม่สำเร็จ");
        return;
      }
      setEditBundle(null);
      setEditBundleForm(null);
      await onRefresh();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setEditBundleSaving(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="รูปแนบรายการ" />

      <AppDashboardSection tone="violet">
        <div className="border-b border-[#ecebff] pb-3">
          <h2 className="text-lg font-bold text-[#2e2a58]">กรองและกราฟยอดขาย</h2>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="cw-sales-filter-year-lbl">
              ปี
            </span>
            <select
              id="cw-sales-filter-year"
              aria-labelledby="cw-sales-filter-year-lbl"
              className="app-input min-h-[44px] w-full min-w-[7rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterMonth("");
                setFilterDay("");
              }}
            >
              <option value="">ทั้งหมด</option>
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="cw-sales-filter-month-lbl">
              เดือน
            </span>
            <select
              id="cw-sales-filter-month"
              aria-labelledby="cw-sales-filter-month-lbl"
              className="app-input min-h-[44px] w-full min-w-[8rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setFilterDay("");
              }}
            >
              <option value="">ทุกเดือน</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="cw-sales-filter-day-lbl">
              วัน
            </span>
            <select
              id="cw-sales-filter-day"
              aria-labelledby="cw-sales-filter-day-lbl"
              className="app-input min-h-[44px] w-full min-w-[6rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={dayNumbers.includes(Number(filterDay)) ? filterDay : ""}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="">ทุกวัน</option>
              {dayNumbers.map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <label className="min-w-0 flex-1 text-xs font-medium text-[#4d47b6] sm:min-w-[200px]">
            ค้นหา
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm touch-manipulation"
              placeholder="ชื่อลูกค้า, ทะเบียน, แพ็กเกจ, หมายเหตุ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <AppRevenueCostColumnChart
          className="mt-6"
          buckets={revenueCostBuckets}
          title="กราฟรายได้เทียบต้นทุน / รายจ่าย"
          emptyText="ไม่มีข้อมูลรายได้หรือต้นทุนในช่วงที่เลือก"
          formatTitle={(b) =>
            `${b.label}: รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
          }
        />
        <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-[#ecebff] bg-[#faf9ff]/80 px-4 py-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">รวมรายได้ (ช่วงที่กรอง)</p>
            <p className="font-bold tabular-nums text-[#2e2a58]">฿{periodTotalRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">รวมรายจ่าย / ต้นทุน</p>
            <p className="font-bold tabular-nums text-rose-700">฿{periodTotalCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สุทธิ</p>
            <p
              className={cn(
                "font-bold tabular-nums",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-700" : "text-rose-800",
              )}
            >
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6 border-t border-[#ecebff] pt-6">
          <p className="text-xs font-medium text-[#4d47b6]">
            สรุปเปรียบเทียบ — ซ้าย: รายได้ลานปกติตามแพ็กเกจ · ขวา: จำนวนครั้งใช้สิทธิ์เหมา (COMPLETED/PAID ในช่วงที่กรอง)
          </p>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
            <AppCompareBarList
              variant="brand"
              title="ยอดตามแพ็กเกจ (เข้าลานปกติ)"
              subtitle="รวมยอดสุดท้ายต่อครั้ง (final) ตามชื่อแพ็กเกจ — ไม่รวมรายการเหมาจ่าย"
              rows={packageCompareRows}
              emptyText="ไม่มีรายได้ลานปกติในช่วงที่เลือก"
              formatAmount={(a) => `฿ ${a.toLocaleString()}`}
            />
            <AppCompareBarList
              variant="brand"
              title="จำนวนตามแพ็กเกจเหมา"
              subtitle="นับครั้งที่ใช้สิทธิ์แพ็กเหมา (รวมรายการที่ปิดคิวแล้ว) แยกตามชื่อแพ็กเกจบริการ"
              rows={bundlePackageCompareRows}
              emptyText="ไม่มีการเข้าใช้แบบเหมาในช่วงที่เลือก"
              formatAmount={(a) => `${a.toLocaleString()} ครั้ง`}
            />
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="รายการในช่วงที่กรอง"
          description={
            <>
              แสดง {mergedSalesRows.length} รายการ (ลาน {filteredVisits.length} / เหมา {filteredBundles.length}) — กดไอคอน{" "}
              <span className="font-semibold text-[#2e2a58]">รายละเอียด</span> มุมขวาเพื่อดำเนินการ อัปโหลดสลิป แก้ไข
              พิมพ์ หรือลบ
            </>
          }
        />
        {listError ? <p className="mb-2 text-sm text-red-600">{listError}</p> : null}
        {mergedSalesRows.length === 0 ? (
          <AppEmptyState>ไม่พบรายการตามเงื่อนไข</AppEmptyState>
        ) : (
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white [-webkit-overflow-scrolling:touch]">
            <AppGalleryCameraFileInputs
              galleryInputRef={galleryInputRef}
              cameraInputRef={cameraInputRef}
              onChange={onListGalleryChange}
            />
            <ul className="divide-y divide-slate-100" aria-label="ประวัติยอดขายคาร์แคร์">
              {mergedSalesRows.map((row) => {
                if (row.kind === "visit") {
                  const v = row.v;
                  const timeStr = new Date(v.visit_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
                  const photoResolved = resolveAssetUrl(v.photo_url, baseUrl);
                  const rowBusy = busyVisitId === v.id;
                  return (
                    <li
                      key={`v-${v.id}`}
                      className="flex flex-row items-stretch gap-2.5 px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
                    >
                      <div className="flex shrink-0 items-center">
                        {photoResolved ?
                          <AppImageThumb
                            className="!h-12 !w-12 rounded-lg"
                            src={photoResolved}
                            alt="รูปแนบ"
                            onOpen={() => lightbox.open(photoResolved)}
                          />
                        : <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[8px] leading-tight text-slate-400">
                            ไม่มีรูป
                          </div>
                        }
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <time className="text-[10px] font-medium tabular-nums text-slate-500" dateTime={v.visit_at}>
                            {timeStr}
                          </time>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold leading-tight",
                              visitStatusPillClass(v.service_status),
                            )}
                          >
                            {carWashStatusLabelTh(v.service_status)}
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1 py-px font-mono text-[9px] text-slate-600">
                            #{v.id}
                          </span>
                        </div>
                        <p className="truncate text-base font-bold tabular-nums leading-tight text-[#2e2a58]">
                          {v.plate_number.trim() || "—"}
                        </p>
                        <p className="line-clamp-1 text-xs font-medium text-slate-800">{v.package_name}</p>
                        <p className="truncate text-[10px] text-slate-600">{v.customer_name.trim() || "—"}</p>
                        {v.note?.trim() ?
                          <p className="line-clamp-1 text-[10px] text-slate-500">{v.note}</p>
                        : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
                        <div className="text-right leading-tight">
                          <span className="text-sm font-bold tabular-nums text-slate-900">
                            ฿{v.final_price.toLocaleString()}
                          </span>
                          <span className="block text-[9px] font-normal text-slate-500">บาท</span>
                        </div>
                        <SalesRowOpenDetailButton
                          disabled={rowBusy}
                          onClick={() => setSalesRowDetail({ kind: "visit", id: v.id })}
                        />
                      </div>
                    </li>
                  );
                }
                const b = row.b;
                const timeStr = new Date(b.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
                const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
                const rowBusy = busyBundleId === b.id;
                const remaining = Math.max(0, b.total_uses - b.used_uses);
                return (
                  <li
                    key={`b-${b.id}`}
                    className="flex flex-row items-stretch gap-2.5 border-l-[3px] border-amber-300/90 bg-amber-50/35 px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
                  >
                    <div className="flex shrink-0 items-center">
                      {slipResolved ?
                        <AppImageThumb
                          className="!h-12 !w-12 rounded-lg"
                          src={slipResolved}
                          alt="สลิปแพ็กเหมา"
                          onOpen={() => lightbox.open(slipResolved)}
                        />
                      : <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-amber-200 bg-white text-[8px] leading-tight text-amber-700/80">
                          ไม่มีสลิป
                        </div>
                      }
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <time className="text-[10px] font-medium tabular-nums text-slate-500" dateTime={b.created_at}>
                          {timeStr}
                        </time>
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold text-amber-950 ring-1 ring-amber-200/80">
                          เหมา
                        </span>
                        <span className="shrink-0 rounded bg-slate-100 px-1 py-px font-mono text-[9px] text-slate-600">
                          #{b.id}
                        </span>
                      </div>
                      <p className="truncate text-base font-bold tabular-nums leading-tight text-[#2e2a58]">
                        {b.plate_number.trim() || "—"}
                      </p>
                      <p className="line-clamp-1 text-xs font-medium text-slate-800">{b.package_name}</p>
                      <p className="truncate text-[10px] text-slate-600">{b.customer_name.trim() || "—"}</p>
                      <p className="text-[10px] tabular-nums text-slate-500">
                        สิทธิ์ {remaining}/{b.total_uses}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
                      <div className="text-right leading-tight">
                        <span className="text-sm font-bold tabular-nums text-amber-900">
                          ฿{b.paid_amount.toLocaleString()}
                        </span>
                        <span className="block text-[9px] font-normal text-slate-500">ยอดแพ็ก</span>
                      </div>
                      <SalesRowOpenDetailButton
                        disabled={rowBusy}
                        onClick={() => setSalesRowDetail({ kind: "bundle", id: b.id })}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </AppDashboardSection>

      <FormModal
        open={salesRowDetail != null}
        onClose={() => setSalesRowDetail(null)}
        title={
          salesDetailVisit
            ? `รายการลาน #${salesDetailVisit.id}`
            : salesDetailBundle
              ? `แพ็กเหมา #${salesDetailBundle.id}`
              : "รายการ"
        }
        description="รายละเอียดและปุ่มไอคอน — ชี้ที่ปุ่มค้างไว้เพื่อดูคำอธิบาย (อัปโหลด/ถ่ายรูปใช้ช่องเดียวกับรายการหลัก)"
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setSalesRowDetail(null)}
            >
              ปิด
            </button>
          </div>
        }
      >
        {salesDetailVisit ?
          (() => {
            const v = salesDetailVisit;
            const photoResolved = resolveAssetUrl(v.photo_url, baseUrl);
            const rowBusy = busyVisitId === v.id;
            const rowPhotoBusy = listPhotoBusy && photoUploadVisitId === v.id;
            const timeStr = new Date(v.visit_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-3 text-sm">
                  <p className="text-xs font-medium tabular-nums text-slate-500">{timeStr}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#2e2a58]">{v.plate_number.trim() || "—"}</p>
                  <p className="mt-1 font-medium text-slate-800">{v.package_name}</p>
                  <p className="text-xs text-slate-600">{v.customer_name.trim() || "—"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        visitStatusPillClass(v.service_status),
                      )}
                    >
                      {carWashStatusLabelTh(v.service_status)}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      ฿{v.final_price.toLocaleString()}
                    </span>
                  </div>
                  {v.note?.trim() ?
                    <p className="mt-2 text-xs text-slate-500">{v.note}</p>
                  : null}
                </div>
                <div
                  className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
                  role="toolbar"
                  aria-label="ดำเนินการรายการลาน"
                >
                  <PopupIconButton
                    label="ดูรูป"
                    disabled={!photoResolved || rowBusy}
                    onClick={() => photoResolved && lightbox.open(photoResolved)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="อัปโหลดรูป"
                    busy={rowPhotoBusy}
                    disabled={rowBusy || rowPhotoBusy}
                    onClick={() => openPickGalleryForVisit(v.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ถ่ายรูป"
                    busy={rowPhotoBusy}
                    disabled={rowBusy || rowPhotoBusy}
                    onClick={() => openCameraForVisit(v.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </PopupIconButton>
                  {photoResolved ?
                    <PopupIconButton
                      label="ล้างรูป"
                      disabled={rowBusy || listPhotoBusy}
                      onClick={() => void clearPhotoForVisit(v.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6M9 9l6 6" />
                      </svg>
                    </PopupIconButton>
                  : null}
                  <PopupIconButton
                    label="แก้ไข"
                    disabled={rowBusy}
                    onClick={() => {
                      setSalesRowDetail(null);
                      openEdit(v);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ลบรายการ"
                    disabled={rowBusy}
                    className={popupIconBtnDanger}
                    onClick={() => void removeVisitRow(v.id)}
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
        : salesDetailBundle ?
          (() => {
            const b = salesDetailBundle;
            const slipResolved = b.slip_photo_url?.trim() ? resolveAssetUrl(b.slip_photo_url, baseUrl) : null;
            const rowBusy = busyBundleId === b.id;
            const rowPhotoBusy = listPhotoBusy && photoUploadBundleId === b.id;
            const timeStr = new Date(b.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            const remaining = Math.max(0, b.total_uses - b.used_uses);
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
                    disabled={!slipResolved || rowBusy}
                    onClick={() => slipResolved && lightbox.open(slipResolved)}
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
                    disabled={rowBusy}
                    onClick={() => printBundleSlip(b, "SLIP_80")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect width="12" height="8" x="6" y="14" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="อัปโหลดสลิป"
                    busy={rowPhotoBusy}
                    disabled={rowBusy || rowPhotoBusy}
                    onClick={() => openPickGalleryForBundle(b.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ถ่ายรูปสลิป"
                    busy={rowPhotoBusy}
                    disabled={rowBusy || rowPhotoBusy}
                    onClick={() => openCameraForBundle(b.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </PopupIconButton>
                  {slipResolved ?
                    <PopupIconButton
                      label="ล้างสลิป"
                      disabled={rowBusy || listPhotoBusy}
                      onClick={() => void clearBundleSlip(b.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6M9 9l6 6" />
                      </svg>
                    </PopupIconButton>
                  : null}
                  <PopupIconButton
                    label="แก้ไข"
                    disabled={rowBusy}
                    onClick={() => {
                      setSalesRowDetail(null);
                      openEditBundle(b);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </PopupIconButton>
                  <PopupIconButton
                    label="ลบแพ็กเหมา"
                    disabled={rowBusy}
                    className={popupIconBtnDanger}
                    onClick={() => void removeBundleRow(b.id)}
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
        : <p className="text-sm text-slate-500">ไม่พบรายการ</p>}
      </FormModal>

      <AppCameraCaptureModal
        open={listCameraOpen}
        onClose={() => {
          setListCameraOpen(false);
          photoTargetVisitIdRef.current = null;
          photoTargetBundleIdRef.current = null;
        }}
        onCapture={(file) => void onListCameraCapture(file)}
        onRequestLegacyPicker={() => {
          setListCameraOpen(false);
          requestAnimationFrame(() => cameraInputRef.current?.click());
        }}
        title="ถ่ายรูปสลิป / แนบรายการ"
      />

      <FormModal
        open={editVisit != null && editForm != null}
        onClose={() => {
          setEditVisit(null);
          setEditForm(null);
        }}
        title={editVisit ? `แก้ไขรายการ #${editVisit.id}` : "แก้ไข"}
        size="lg"
        footer={
          editForm ?
            <FormModalFooterActions
              cancelLabel="ปิด"
              onCancel={() => {
                setEditVisit(null);
                setEditForm(null);
              }}
              submitLabel="บันทึก"
              loading={editSaving}
              onSubmit={() => editFormRef.current?.requestSubmit()}
            />
          : null
        }
      >
        {editVisit && editForm ?
          <form
            ref={editFormRef}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitEdit();
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                ชื่อลูกค้า
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น คุณสมชาย"
                  autoComplete="name"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, customer_name: e.target.value } : s))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                เบอร์โทร
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="เว้นว่างได้"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={editForm.customer_phone}
                  onChange={(e) =>
                    setEditForm((s) => (s ? { ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) } : s))
                  }
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600">
              ทะเบียนรถ
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เช่น กข 1234"
                autoComplete="off"
                value={editForm.plate_number}
                onChange={(e) => setEditForm((s) => (s ? { ...s, plate_number: e.target.value } : s))}
                required
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              แพ็กเกจ / บริการ
              <select
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                value={editForm.package_id}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = pkgId ? packages.find((p) => p.id === Number(pkgId)) ?? null : null;
                  setEditForm((s) => {
                    if (!s) return s;
                    return {
                      ...s,
                      package_id: pkgId,
                      listed_price: pkg ? String(pkg.price) : s.listed_price,
                      final_price: pkg ? String(pkg.price) : s.final_price,
                    };
                  });
                }}
              >
                <option value="">บริการพิเศษ (ไม่ผูกแพ็กเกจ)</option>
                {packages
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (฿ {p.price})
                    </option>
                  ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                ราคาในแพ็กเกจ (บาท)
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={editForm.listed_price}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, listed_price: e.target.value } : s))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                ราคาที่คิดจริง (บาท)
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={editForm.final_price}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, final_price: e.target.value } : s))}
                  required
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600">
              เวลาเข้าใช้บริการ
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                type="datetime-local"
                value={editForm.visit_at_local}
                onChange={(e) => setEditForm((s) => (s ? { ...s, visit_at_local: e.target.value } : s))}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              สถานะลาน
              <select
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                value={editForm.service_status}
                onChange={(e) =>
                  setEditForm((s) =>
                    s ? { ...s, service_status: e.target.value as CarWashServiceStatus } : s,
                  )
                }
              >
                {CAR_WASH_SERVICE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {carWashStatusLabelTh(st)} ({st})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              ผู้บันทึก
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อพนักงานหรือผู้บันทึก"
                autoComplete="off"
                value={editForm.recorded_by_name}
                onChange={(e) => setEditForm((s) => (s ? { ...s, recorded_by_name: e.target.value } : s))}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              หมายเหตุ
              <textarea
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                rows={3}
                value={editForm.note}
                onChange={(e) => setEditForm((s) => (s ? { ...s, note: e.target.value } : s))}
              />
            </label>
            <p className="text-[11px] text-slate-500">แก้รูปได้จากปุ่มอัปโหลด / ถ่ายรูปในรายการ — หรือล้างรูปที่แถวนั้น</p>
          </form>
        : null}
      </FormModal>

      <FormModal
        open={editBundle != null && editBundleForm != null}
        onClose={() => {
          setEditBundle(null);
          setEditBundleForm(null);
        }}
        title={editBundle ? `แก้ไขแพ็กเหมา #${editBundle.id}` : "แก้ไข"}
        size="lg"
        footer={
          editBundleForm ?
            <FormModalFooterActions
              cancelLabel="ปิด"
              onCancel={() => {
                setEditBundle(null);
                setEditBundleForm(null);
              }}
              submitLabel="บันทึก"
              loading={editBundleSaving}
              onSubmit={() => editBundleFormRef.current?.requestSubmit()}
            />
          : null
        }
      >
        {editBundle && editBundleForm ?
          <form
            ref={editBundleFormRef}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitEditBundle();
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                ชื่อลูกค้า
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  value={editBundleForm.customer_name}
                  onChange={(e) =>
                    setEditBundleForm((s) => (s ? { ...s, customer_name: e.target.value } : s))
                  }
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                เบอร์โทร
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  inputMode="numeric"
                  value={editBundleForm.customer_phone}
                  onChange={(e) =>
                    setEditBundleForm((s) =>
                      s ? { ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) } : s,
                    )
                  }
                  required
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600">
              ทะเบียนรถ
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                value={editBundleForm.plate_number}
                onChange={(e) =>
                  setEditBundleForm((s) => (s ? { ...s, plate_number: e.target.value } : s))
                }
                required
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              แพ็กเกจบริการ
              <select
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                value={editBundleForm.package_id}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = pkgId ? packages.find((p) => p.id === Number(pkgId)) ?? null : null;
                  setEditBundleForm((s) => {
                    if (!s) return s;
                    return {
                      ...s,
                      package_id: pkgId,
                      paid_amount: pkg ? String(pkg.price) : s.paid_amount,
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
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                ยอดชำระรวม (บาท)
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  value={editBundleForm.paid_amount}
                  onChange={(e) =>
                    setEditBundleForm((s) => (s ? { ...s, paid_amount: e.target.value } : s))
                  }
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                จำนวนครั้งรวม
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  value={editBundleForm.total_uses}
                  onChange={(e) =>
                    setEditBundleForm((s) => (s ? { ...s, total_uses: e.target.value } : s))
                  }
                  required
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={editBundleForm.is_active}
                onChange={(e) =>
                  setEditBundleForm((s) => (s ? { ...s, is_active: e.target.checked } : s))
                }
              />
              เปิดใช้งานแพ็กนี้
            </label>
            <p className="text-[11px] text-slate-500">
              แก้สลิปได้จากปุ่มอัปโหลด / ถ่ายรูปในรายการยอดขาย — หรือพิมพ์ใบสรุปตามเทมเพลต
            </p>
          </form>
        : null}
      </FormModal>
    </div>
  );
}

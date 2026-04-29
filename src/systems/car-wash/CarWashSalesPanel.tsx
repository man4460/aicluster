"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
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
  AppPickGalleryImageButton,
  AppTakePhotoButton,
} from "@/components/app-templates";
import {
  uploadCarWashSessionImage,
  type CarWashRepository,
  type CarWashServiceStatus,
  type CostCategory,
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

function donutGradientFromRows(rows: AppCompareBarRow[]): string {
  if (rows.length === 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
  const palette = ["#5b61ff", "#8d64ff", "#f06dc8", "#22c55e", "#f59e0b", "#ef4444"];
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
  let acc = 0;
  const segments = rows.slice(0, 6).map((row, index) => {
    const start = Math.round((acc / total) * 360);
    acc += row.amount;
    const end = Math.round((acc / total) * 360);
    return `${palette[index % palette.length]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segments.join(", ")})`;
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

function CostSlipAttachmentZone({
  slipUrl,
  onSlipUrlChange,
  photoBusy,
  previewUrl,
  galleryInputRef,
  onFileInputChange,
  onOpenModalCamera,
  cameraOpen,
  onCloseCamera,
  onCameraCapture,
  onRequestLegacyPicker,
  disabled,
}: {
  slipUrl: string;
  onSlipUrlChange: (url: string) => void;
  photoBusy: boolean;
  previewUrl: string | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenModalCamera: () => void;
  cameraOpen: boolean;
  onCloseCamera: () => void;
  onCameraCapture: (file: File) => void;
  onRequestLegacyPicker: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-rose-50/40 p-4 shadow-sm ring-1 ring-violet-100/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/90">
            แนบสลิป / บิล (ไม่บังคับ)
          </p>
          <p className="mt-0.5 text-xs text-slate-600">อัปโหลดหรือถ่ายรูป — สไตล์เดียวกับสลิป POS</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <AppPickGalleryImageButton
            type="button"
            disabled={disabled || photoBusy}
            onClick={() => galleryInputRef.current?.click()}
            className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
            aria-label="อัปโหลดรูปสลิป"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </AppPickGalleryImageButton>
          <AppTakePhotoButton
            type="button"
            disabled={disabled || photoBusy}
            onClick={onOpenModalCamera}
            className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
            aria-label="ถ่ายรูปสลิป"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </AppTakePhotoButton>
        </div>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileInputChange}
      />

      {photoBusy ? (
        <p className="mt-2 text-xs font-medium text-violet-700">กำลังอัปโหลดรูป…</p>
      ) : null}

      {slipUrl.trim() && previewUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="สลิปแนบ"
            className="h-20 w-auto max-w-[min(100%,12rem)] rounded-lg object-cover object-center ring-1 ring-slate-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700">แนบแล้ว</p>
            <p className="truncate text-[11px] text-slate-500">
              {slipUrl.slice(0, 80)}
              {slipUrl.length > 80 ? "…" : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || photoBusy}
            onClick={() => onSlipUrlChange("")}
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            ลบรูป
          </button>
        </div>
      ) : null}

      <AppCameraCaptureModal
        open={cameraOpen}
        onClose={onCloseCamera}
        onCapture={(file) => onCameraCapture(file)}
        onRequestLegacyPicker={onRequestLegacyPicker}
      />
    </div>
  );
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
  costCategories = [],
  repo,
}: {
  visits: ServiceVisit[];
  bundles: WashBundle[];
  packages: ServicePackage[];
  costEntries?: CostEntry[];
  costCategories?: CostCategory[];
  repo: CarWashRepository;
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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
  const [activeListTab, setActiveListTab] = useState<"sales" | "costs">("sales");
  const [salesRowDetail, setSalesRowDetail] = useState<
    { kind: "visit"; id: number } | { kind: "bundle"; id: number } | null
  >(null);
  const [costEntryDetail, setCostEntryDetail] = useState<CostEntry | null>(null);

  const [busy, setBusy] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [editCat, setEditCat] = useState<CostCategory | null>(null);

  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryCategoryId, setEntryCategoryId] = useState("");
  const [entrySpentLocal, setEntrySpentLocal] = useState(() =>
    isoToDatetimeLocalInput(new Date().toISOString()),
  );
  const [entryAmount, setEntryAmount] = useState("");
  const [entryItemLabel, setEntryItemLabel] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySlipUrl, setEntrySlipUrl] = useState("");

  const [editEntry, setEditEntry] = useState<CostEntry | null>(null);
  const [editEntryForm, setEditEntryForm] = useState<{
    category_id: string;
    spent_at_local: string;
    amount: string;
    item_label: string;
    note: string;
    slip_photo_url: string;
  } | null>(null);

  const [entryCameraOpen, setEntryCameraOpen] = useState(false);
  const [entryPhotoBusy, setEntryPhotoBusy] = useState(false);
  const costGalleryInputRef = useRef<HTMLInputElement>(null);

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

  const openManageCategories = useCallback(() => {
    setCatName("");
    setEditCat(null);
    setManageCategoriesOpen(true);
  }, []);

  const openEditCategoryForm = useCallback((c: CostCategory) => {
    setEditCat(c);
    setCatName(c.name);
  }, []);

  const cancelCategoryForm = useCallback(() => {
    setCatName("");
    setEditCat(null);
  }, []);

  const submitCategory = useCallback(async () => {
    const n = catName.trim();
    if (!n) return;
    setBusy(true);
    setListError(null);
    try {
      if (editCat) await repo.updateCostCategory(editCat.id, { name: n });
      else await repo.createCostCategory(n);
      cancelCategoryForm();
      await onRefresh();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [catName, cancelCategoryForm, editCat, onRefresh, repo]);

  const removeCategory = useCallback(
    async (c: CostCategory) => {
      if (!confirm(`ลบหมวด «${c.name}» และรายการต้นทุนที่ผูกไว้ทั้งหมด?`)) return;
      setBusy(true);
      setListError(null);
      try {
        await repo.deleteCostCategory(c.id);
        await onRefresh();
      } catch (e) {
        setListError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, repo],
  );

  const resetAddEntryForm = useCallback(() => {
    setEntryCategoryId("");
    setEntrySpentLocal(isoToDatetimeLocalInput(new Date().toISOString()));
    setEntryAmount("");
    setEntryItemLabel("");
    setEntryNote("");
    setEntrySlipUrl("");
  }, []);

  const openAddEntry = useCallback(() => {
    resetAddEntryForm();
    setShowAddEntryModal(true);
  }, [resetAddEntryForm]);

  const finalizeCostSlipFile = useCallback(async (file: File, target: "add" | "edit") => {
    setEntryPhotoBusy(true);
    setListError(null);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      if (target === "add") setEntrySlipUrl(url);
      else setEditEntryForm((s) => (s ? { ...s, slip_photo_url: url } : s));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setEntryPhotoBusy(false);
    }
  }, []);

  const onCostSlipFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, target: "add" | "edit") => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeCostSlipFile(file, target);
    },
    [finalizeCostSlipFile],
  );

  const onCostModalCameraCapture = useCallback(
    async (file: File) => {
      setEntryCameraOpen(false);
      const target = editEntry != null && editEntryForm != null ? "edit" : "add";
      await finalizeCostSlipFile(file, target);
    },
    [editEntry, editEntryForm, finalizeCostSlipFile],
  );

  const submitCostEntry = useCallback(async () => {
    const cid = entryCategoryId ? Number(entryCategoryId) : NaN;
    const amt = Number(entryAmount.replace(/,/g, ""));
    if (!Number.isFinite(cid) || cid < 1) {
      setListError("เลือกหมวด");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setListError("จำนวนเงินไม่ถูกต้อง");
      return;
    }
    const item = entryItemLabel.trim();
    if (!item) {
      setListError("ระบุรายการค่าใช้จ่าย");
      return;
    }
    setBusy(true);
    setListError(null);
    try {
      await repo.createCostEntry({
        category_id: cid,
        spent_at: datetimeLocalToIso(entrySpentLocal),
        amount: Math.round(amt),
        item_label: item,
        note: entryNote.trim(),
        ...(entrySlipUrl.trim() ? { slip_photo_url: entrySlipUrl.trim() } : {}),
      });
      setShowAddEntryModal(false);
      resetAddEntryForm();
      await onRefresh();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [
    entryAmount,
    entryCategoryId,
    entryItemLabel,
    entryNote,
    entrySlipUrl,
    entrySpentLocal,
    onRefresh,
    repo,
    resetAddEntryForm,
  ]);

  const openEditCostEntry = useCallback((e: CostEntry) => {
    setEditEntry(e);
    setEditEntryForm({
      category_id: String(e.category_id),
      spent_at_local: isoToDatetimeLocalInput(e.spent_at),
      amount: String(e.amount),
      item_label: e.item_label ?? "",
      note: e.note,
      slip_photo_url: e.slip_photo_url ?? "",
    });
  }, []);

  const submitEditCostEntry = useCallback(async () => {
    if (!editEntry || !editEntryForm) return;
    const cid = Number(editEntryForm.category_id);
    const amt = Number(editEntryForm.amount.replace(/,/g, ""));
    if (!Number.isFinite(cid) || cid < 1) return;
    if (!Number.isFinite(amt) || amt < 0) return;
    const item = editEntryForm.item_label.trim();
    if (!item) {
      setListError("ระบุรายการค่าใช้จ่าย");
      return;
    }
    setBusy(true);
    setListError(null);
    try {
      await repo.updateCostEntry(editEntry.id, {
        category_id: cid,
        spent_at: datetimeLocalToIso(editEntryForm.spent_at_local),
        amount: Math.round(amt),
        item_label: item,
        note: editEntryForm.note.trim(),
        slip_photo_url: editEntryForm.slip_photo_url.trim(),
      });
      setEditEntry(null);
      setEditEntryForm(null);
      await onRefresh();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [editEntry, editEntryForm, onRefresh, repo]);

  const removeCostEntry = useCallback(
    async (e: CostEntry) => {
      if (!confirm("ลบรายการต้นทุนนี้?")) return;
      setBusy(true);
      setListError(null);
      try {
        await repo.deleteCostEntry(e.id);
        await onRefresh();
      } catch (er) {
        setListError(er instanceof Error ? er.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, repo],
  );

  const addSlipPreview = entrySlipUrl.trim() ? resolveAssetUrl(entrySlipUrl, baseUrl) : null;
  const editSlipPreview = editEntryForm?.slip_photo_url?.trim()
    ? resolveAssetUrl(editEntryForm.slip_photo_url, baseUrl)
    : null;

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
        {/* Header & Mobile Filter Toggle */}
        <div className="flex items-center justify-between gap-4 border-b border-violet-100 pb-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#1e1b4b]">ภาพรวมการเงิน</h2>
            <p className="text-xs font-medium text-slate-500">วิเคราะห์รายได้และรายจ่ายของระบบคาร์แคร์</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-600 shadow-sm transition-all active:scale-95 md:hidden"
            onClick={() => setMobileFilterOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {/* Desktop Filter Bar */}
        <div className="mt-5 hidden items-end gap-3 md:flex">
          <div className="grid flex-1 grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="cw-f-y">ปี</label>
              <select
                id="cw-f-y"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setFilterMonth(""); setFilterDay(""); }}
              >
                <option value="">ทั้งหมด</option>
                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="cw-f-m">เดือน</label>
              <select
                id="cw-f-m"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(""); }}
              >
                <option value="">ทุกเดือน</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="cw-f-d">วัน</label>
              <select
                id="cw-f-d"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
                value={dayNumbers.includes(Number(filterDay)) ? filterDay : ""}
                onChange={(e) => setFilterDay(e.target.value)}
              >
                <option value="">ทุกวัน</option>
                {dayNumbers.map(d => <option key={d} value={String(d)}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="cw-f-s">ค้นหา</label>
              <input
                id="cw-f-s"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold placeholder:text-slate-400 focus:ring-violet-500"
                placeholder="ชื่อ, ทะเบียน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Row (3 Columns on Mobile) */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          {/* Stat: Total Revenue */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 p-3 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[8px] font-bold uppercase tracking-wider text-violet-500 sm:text-[10px]">รายได้รวม</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-[10px] text-violet-600 sm:h-8 sm:w-8 sm:text-base">฿</span>
            </div>
            <p className="mt-2 text-sm font-black text-[#1e1b4b] sm:mt-3 sm:text-2xl">
              ฿{periodTotalRevenue.toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-slate-500">ยอดขายทั้งหมด</span>
            </div>
          </div>

          {/* Stat: Total Cost */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/30 p-3 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[8px] font-bold uppercase tracking-wider text-rose-500 sm:text-[10px]">ต้นทุนรวม</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 sm:h-8 sm:w-8">
                <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m19 9-7 7-7-7" /></svg>
              </span>
            </div>
            <p className="mt-2 text-sm font-black text-rose-900 sm:mt-3 sm:text-2xl">
              ฿{periodTotalCost.toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div className="h-1 w-1 rounded-full bg-rose-500" />
              <span className="text-[10px] font-medium text-slate-500">ค่าใช้จ่ายทั้งหมด</span>
            </div>
          </div>

          {/* Stat: Net Profit */}
          <div className={cn(
            "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 shadow-sm transition-colors sm:p-5",
            periodTotalRevenue - periodTotalCost >= 0 
              ? "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30" 
              : "border-orange-100 bg-gradient-to-br from-white to-orange-50/30"
          )}>
            <div className="flex items-center justify-between gap-1">
              <span className={cn(
                "truncate text-[8px] font-bold uppercase tracking-wider sm:text-[10px]",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-600" : "text-orange-600"
              )}>กำไรสุทธิ</span>
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                periodTotalRevenue - periodTotalCost >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
              )}>
                <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <p className={cn(
              "mt-2 text-sm font-black sm:mt-3 sm:text-2xl",
              periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-900" : "text-orange-900"
            )}>
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div className={cn("h-1 w-1 rounded-full", periodTotalRevenue - periodTotalCost >= 0 ? "bg-emerald-500" : "bg-orange-500")} />
              <span className="text-[10px] font-medium text-slate-500">กำไรสุทธิ</span>
            </div>
          </div>
        </div>

        {/* Charts & Analysis Row (Stack on Mobile, Grid on Large) */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main Chart: Revenue vs Cost */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-sm font-black text-[#1e1b4b] sm:text-base">แนวโน้มรายได้และรายจ่าย</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#5b61ff]" />
                  <span className="text-[10px] font-bold text-slate-400">รายได้</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-[10px] font-bold text-slate-400">รายจ่าย</span>
                </div>
              </div>
            </div>
            <div className="h-[220px] w-full sm:h-[280px]">
              <AppRevenueCostColumnChart
                className="h-full w-full"
                buckets={revenueCostBuckets}
                title=""
                emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                formatTitle={(b) =>
                  `${b.label}: รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
                }
              />
            </div>
          </div>

          {/* Package Analysis Cards */}
          <div className="flex flex-col gap-4">
            {/* Package Revenue Donut */}
            <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-black text-[#1e1b4b] sm:text-sm">สัดส่วนตามแพ็กเกจ</h3>
              {packageCompareRows.length > 0 ? (
                <div className="mt-4 flex items-center gap-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-full ring-4 ring-slate-50 sm:h-20 sm:w-20"
                    style={{ background: donutGradientFromRows(packageCompareRows) }}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {packageCompareRows.slice(0, 3).map((row, idx) => (
                      <div key={row.key} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="truncate font-medium text-slate-500">
                          <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", idx === 0 ? "bg-[#5b61ff]" : idx === 1 ? "bg-[#8d64ff]" : "bg-[#f06dc8]")} />
                          {row.label}
                        </span>
                        <span className="font-bold text-[#1e1b4b]">฿{row.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-center text-[10px] text-slate-400">ไม่มีข้อมูล</p>
              )}
            </div>

            {/* Bundle Usage Donut */}
            <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-black text-[#1e1b4b] sm:text-sm">สัดส่วนตามแพ็กเหมา</h3>
              {bundlePackageCompareRows.length > 0 ? (
                <div className="mt-4 flex items-center gap-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-full ring-4 ring-slate-50 sm:h-20 sm:w-20"
                    style={{ background: donutGradientFromRows(bundlePackageCompareRows) }}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {bundlePackageCompareRows.slice(0, 3).map((row, idx) => (
                      <div key={row.key} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="truncate font-medium text-slate-500">
                          <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", idx === 0 ? "bg-[#5b61ff]" : idx === 1 ? "bg-[#8d64ff]" : "bg-[#f06dc8]")} />
                          {row.label}
                        </span>
                        <span className="font-bold text-[#1e1b4b]">{row.amount} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-center text-[10px] text-slate-400">ไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>

      </AppDashboardSection>


      <AppDashboardSection tone="slate">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#1e1b4b]">รายการในช่วงที่กรอง</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {activeListTab === "sales" ?
                `รวม ${mergedSalesRows.length} รายการ (ลาน ${filteredVisits.length} / เหมา ${filteredBundles.length})`
              : `รวม ${filteredCostEntries.length} รายการต้นทุน`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1">

            {activeListTab === "costs" ? (
              <div className="mr-1.5 flex items-center gap-1 border-r border-slate-200 pr-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={openManageCategories}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="จัดการหมวด"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span className="hidden sm:inline">หมวด</span>
                </button>
                <button
                  type="button"
                  disabled={busy || costCategories.length === 0}
                  onClick={openAddEntry}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5b61ff] px-2.5 text-xs font-bold text-white shadow-sm ring-1 ring-[#5b61ff] hover:bg-[#4d47b6] disabled:opacity-50"
                  aria-label="บันทึกรายการ"
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
                  <span className="hidden sm:inline">เพิ่มรายการ</span>
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeListTab === "sales" ?
                  "bg-white text-[#5b61ff] shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setActiveListTab("sales")}
            >
              รายรับ
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeListTab === "costs" ?
                  "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setActiveListTab("costs")}
            >
              รายจ่าย
            </button>
          </div>
        </div>

        {listError ? <p className="mb-2 text-sm text-red-600">{listError}</p> : null}

        {activeListTab === "sales" ?
          mergedSalesRows.length === 0 ?
            <AppEmptyState>ไม่พบรายการตามเงื่อนไข</AppEmptyState>
          : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent">
              <AppGalleryCameraFileInputs
                galleryInputRef={galleryInputRef}
                cameraInputRef={cameraInputRef}
                onChange={onListGalleryChange}
              />
              <ul
                className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
                aria-label="ประวัติยอดขายคาร์แคร์"
              >
                {mergedSalesRows.map((row) => {
                  if (row.kind === "visit") {
                    const v = row.v;
                    const timeStr = new Date(v.visit_at).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                    });
                    const photoResolved = resolveAssetUrl(v.photo_url, baseUrl);
                    const rowBusy = busyVisitId === v.id;
                    return (
                      <li
                        key={`v-${v.id}`}
                        className="group/item relative flex flex-col gap-3 overflow-hidden px-3 py-3 transition-all duration-300 hover:bg-slate-50/80 sm:px-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm lg:hover:-translate-y-1 lg:hover:shadow-md"
                      >
                        {/* Left Indicator Bar — Gradient พริ้วๆ */}
                        <span
                          aria-hidden
                          className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff] via-[#8d64ff] to-[#f06dc8] opacity-80 transition-all group-hover/item:w-1.5"
                        />
                        
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          {photoResolved ?
                            <div className="relative shrink-0 transition-transform duration-300 group-hover/item:scale-105">
                              <AppImageThumb
                                className="h-14 w-14 rounded-xl shadow-sm ring-2 ring-slate-100"
                                src={photoResolved}
                                alt="รูปแนบ"
                                onOpen={() => lightbox.open(photoResolved)}
                              />
                            </div>
                          : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-[9px] font-medium leading-tight text-slate-400">
                              NO PHOTO
                            </div>
                          }
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <time
                                className="text-[10px] font-bold tabular-nums text-slate-400 uppercase tracking-tight"
                                dateTime={v.visit_at}
                              >
                                {timeStr}
                              </time>
                              <span
                                className={cn(
                                  "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black leading-tight shadow-sm ring-1 ring-inset",
                                  visitStatusPillClass(v.service_status),
                                )}
                              >
                                {carWashStatusLabelTh(v.service_status)}
                              </span>
                              <span className="shrink-0 rounded-md bg-slate-100/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                                #{v.id}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-lg font-black tabular-nums tracking-tight text-[#1e1b4b]">
                                {v.plate_number.trim() || "—"}
                              </p>
                              <div className="text-right">
                                <span className="text-lg font-black tabular-nums text-[#0000BF]">
                                  ฿{v.final_price.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <p className="line-clamp-1 text-xs font-bold text-slate-700">
                              {v.package_name}
                            </p>
                            
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] text-slate-400">👤</span>
                              <p className="truncate text-[11px] font-medium text-slate-500">
                                {v.customer_name.trim() || "ลูกค้าทั่วไป"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between border-t border-slate-100/60 pt-2">
                          {v.note?.trim() ?
                            <p className="line-clamp-1 flex-1 pr-4 text-[10px] italic text-slate-400">
                              &quot;{v.note}&quot;
                            </p>
                          : <div className="flex-1" />}
                          <SalesRowOpenDetailButton
                            disabled={rowBusy}
                            onClick={() => setSalesRowDetail({ kind: "visit", id: v.id })}
                            className="!h-9 !w-9 rounded-xl bg-slate-50 hover:bg-white"
                          />
                        </div>
                      </li>
                    );
                  }
                  const b = row.b;
                  const timeStr = new Date(b.created_at).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                  });
                  const slipResolved = b.slip_photo_url?.trim() ?
                    resolveAssetUrl(b.slip_photo_url, baseUrl)
                  : null;
                  const rowBusy = busyBundleId === b.id;
                  const remaining = Math.max(0, b.total_uses - b.used_uses);
                  return (
                    <li
                      key={`b-${b.id}`}
                      className="group/item relative flex flex-col gap-3 overflow-hidden border-l-[4px] border-amber-300 bg-amber-50/20 px-3 py-3 transition-all duration-300 hover:bg-amber-50/40 sm:px-4 lg:rounded-2xl lg:border lg:border-amber-200/60 lg:bg-amber-50/15 lg:shadow-sm lg:hover:-translate-y-1 lg:hover:shadow-md"
                    >
                      <span
                        aria-hidden
                        className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#f59e0b] via-[#fb7185] to-[#f06dc8] opacity-80"
                      />
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        {slipResolved ?
                          <div className="relative shrink-0 transition-transform duration-300 group-hover/item:scale-105">
                            <AppImageThumb
                              className="h-14 w-14 rounded-xl shadow-sm ring-2 ring-amber-100"
                              src={slipResolved}
                              alt="สลิปแพ็กเหมา"
                              onOpen={() => lightbox.open(slipResolved)}
                            />
                          </div>
                        : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-amber-200 bg-white/50 text-[9px] font-medium leading-tight text-amber-600">
                            NO SLIP
                          </div>
                        }
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <time
                              className="text-[10px] font-bold tabular-nums text-slate-400 uppercase tracking-tight"
                              dateTime={b.created_at}
                            >
                              {timeStr}
                            </time>
                            <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 shadow-sm ring-1 ring-amber-200">
                              เหมา
                            </span>
                            <span className="shrink-0 rounded-md bg-slate-100/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                              #{b.id}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-lg font-black tabular-nums tracking-tight text-[#1e1b4b]">
                              {b.plate_number.trim() || "—"}
                            </p>
                            <div className="text-right">
                              <span className="text-lg font-black tabular-nums text-amber-700">
                                ฿{b.paid_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <p className="line-clamp-1 text-xs font-bold text-slate-700">
                            {b.package_name}
                          </p>
                          
                          <div className="flex items-center gap-3 pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-amber-400">👤</span>
                              <p className="truncate text-[11px] font-medium text-slate-500">
                                {b.customer_name.trim() || "ลูกค้าเหมา"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-amber-100/50 px-2 py-0.5 ring-1 ring-amber-200/50">
                              <span className="text-[10px] text-amber-600">🎟️</span>
                              <p className="text-[10px] font-black tabular-nums text-amber-700">
                                {remaining}/{b.total_uses}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-end border-t border-amber-200/40 pt-2">
                        <SalesRowOpenDetailButton
                          disabled={rowBusy}
                          onClick={() => setSalesRowDetail({ kind: "bundle", id: b.id })}
                          className="!h-9 !w-9 rounded-xl bg-amber-50/80 hover:bg-white"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
        : filteredCostEntries.length === 0 ?
          <AppEmptyState>ไม่พบรายการต้นทุนตามเงื่อนไข</AppEmptyState>
        : <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white [-webkit-overflow-scrolling:touch] lg:border-0 lg:bg-transparent">
            <ul
              className="divide-y divide-slate-100 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2"
              aria-label="ประวัติรายจ่ายคาร์แคร์"
            >
              {filteredCostEntries.map((e) => {
                const timeStr = new Date(e.spent_at).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                });
                const slipResolved = e.slip_photo_url?.trim() ?
                  resolveAssetUrl(e.slip_photo_url, baseUrl)
                : null;
                return (
                  <li
                    key={`c-${e.id}`}
                    className="group/item relative flex flex-col gap-3 overflow-hidden px-3 py-3 transition-all duration-300 hover:bg-rose-50/30 sm:px-4 lg:rounded-2xl lg:border lg:border-rose-100 lg:bg-rose-50/10 lg:shadow-sm lg:hover:-translate-y-1 lg:hover:shadow-md"
                  >
                    <span
                      aria-hidden
                      className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#fb7185] via-[#f43f5e] to-[#e11d48] opacity-80"
                    />
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      {slipResolved ?
                        <div className="relative shrink-0 transition-transform duration-300 group-hover/item:scale-105">
                          <AppImageThumb
                            className="h-14 w-14 rounded-xl shadow-sm ring-2 ring-rose-100"
                            src={slipResolved}
                            alt="สลิปรายจ่าย"
                            onOpen={() => lightbox.open(slipResolved)}
                          />
                        </div>
                      : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 text-[9px] font-medium leading-tight text-rose-400">
                          NO SLIP
                        </div>
                      }
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <time
                            className="text-[10px] font-bold tabular-nums text-slate-400 uppercase tracking-tight"
                            dateTime={e.spent_at}
                          >
                            {timeStr}
                          </time>
                          <span className="shrink-0 rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-950 shadow-sm ring-1 ring-rose-200">
                            รายจ่าย
                          </span>
                          <span className="shrink-0 rounded-md bg-slate-100/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                            #{e.id}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-lg font-black tabular-nums tracking-tight text-[#1e1b4b]">
                            {e.item_label.trim() || "—"}
                          </p>
                          <div className="text-right">
                            <span className="text-lg font-black tabular-nums text-rose-700">
                              ฿{e.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <p className="line-clamp-1 text-xs font-bold text-slate-600">
                          {e.category_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between border-t border-rose-100/40 pt-2">
                      {e.note?.trim() ?
                        <p className="line-clamp-1 flex-1 pr-4 text-[10px] italic text-slate-400">
                          &quot;{e.note}&quot;
                        </p>
                      : <div className="flex-1" />}
                      <div className="flex shrink-0 gap-1.5">
                        <PopupIconButton
                          label="แก้ไข"
                          onClick={() => openEditCostEntry(e)}
                          disabled={busy}
                          className="!h-9 !w-9 rounded-xl bg-slate-50 hover:bg-white"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </PopupIconButton>
                        <PopupIconButton
                          label="ลบ"
                          className={cn(popupIconBtnDanger, "!h-9 !w-9 rounded-xl")}
                          onClick={() => void removeCostEntry(e)}
                          disabled={busy}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </PopupIconButton>
                        <SalesRowOpenDetailButton
                          onClick={() => setCostEntryDetail(e)}
                          className="!h-9 !w-9 rounded-xl bg-rose-50/80 hover:bg-white"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        }
      </AppDashboardSection>

      <FormModal
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="ตัวกรองข้อมูลการเงิน"
        description="เลือกช่วงเวลาและคำค้นหาเพื่อดูผลลัพธ์"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setMobileFilterOpen(false)}
            onSubmit={() => setMobileFilterOpen(false)}
            submitLabel="ดูผลลัพธ์"
          />
        }
      >
        <div className="space-y-4 md:hidden">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ปี</label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">เดือน</label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วัน</label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-violet-500"
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
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ค้นหา</label>
            <input
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold placeholder:text-slate-400 focus:ring-violet-500"
              placeholder="ชื่อลูกค้า, ทะเบียน, แพ็กเกจ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </FormModal>

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
              className="cw-btn rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setSalesRowDetail(null)}
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
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

      <FormModal
        open={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        title="จัดการหมวดต้นทุน"
        description="สร้างหรือลบหมวดหมู่สำหรับรายจ่าย"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setManageCategoriesOpen(false)}
            onSubmit={() => setManageCategoriesOpen(false)}
            submitLabel="เสร็จสิ้น"
          />
        }
      >
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCategory();
            }}
            className="flex items-end gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {editCat ? "แก้ไขชื่อหมวด" : "ชื่อหมวดใหม่"}
              </label>
              <input
                className="w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                placeholder="เช่น ค่าไฟ, ค่าน้ำ"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={busy || !catName.trim()}
              className="flex h-[42px] shrink-0 items-center justify-center rounded-xl bg-[#5b61ff] px-6 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-[#4d47b6] active:scale-95 disabled:opacity-50"
            >
              {editCat ? "บันทึก" : "เพิ่ม"}
            </button>
            {editCat && (
              <button
                type="button"
                className="flex h-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 hover:bg-slate-50 active:scale-95"
                onClick={cancelCategoryForm}
              >
                ยกเลิก
              </button>
            )}
          </form>

          <div className="space-y-3">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              หมวดที่มีอยู่ ({costCategories.length})
            </p>
            <div className="grid grid-cols-1 gap-2">
              {costCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 py-8 text-slate-400">
                  <svg viewBox="0 0 24 24" className="mb-2 h-8 w-8 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3h18v18H3zM9 9h6M9 13h6M9 17h3" />
                  </svg>
                  <p className="text-xs font-medium">ยังไม่มีหมวดหมู่</p>
                </div>
              ) : (
                costCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#5b61ff]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#5b61ff]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <span className="truncate text-sm font-black text-[#1e1b4b]">{c.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-indigo-50 hover:text-[#5b61ff]"
                        onClick={() => openEditCategoryForm(c)}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => void removeCategory(c)}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        title="บันทึกต้นทุน / รายจ่าย"
        description="กรอกข้อมูลรายจ่ายและเลือกหมวดหมู่ — รูปภาพสลิปจะถูกอัปโหลดทันที"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setShowAddEntryModal(false)}
            onSubmit={submitCostEntry}
            submitLabel="บันทึกรายการ"
            submitDisabled={busy || entryPhotoBusy || !entryCategoryId || !entryAmount || !entryItemLabel}
            loading={busy}
          />
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมวดหมู่</label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                value={entryCategoryId}
                onChange={(e) => setEntryCategoryId(e.target.value)}
              >
                <option value="">เลือกหมวด…</option>
                {costCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วันที่และเวลา</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                value={entrySpentLocal}
                onChange={(e) => setEntrySpentLocal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รายการ / ชื่อค่าใช้จ่าย</label>
              <input
                className="w-full rounded-xl border-slate-200 bg-white text-sm font-semibold placeholder:text-slate-400 focus:ring-[#5b61ff]"
                placeholder="เช่น ค่าไฟเดือน เม.ย."
                value={entryItemLabel}
                onChange={(e) => setEntryItemLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนเงิน (บาท)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-500">฿</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 py-2.5 text-lg font-black tabular-nums text-rose-600 focus:ring-rose-500"
                  placeholder="0.00"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมายเหตุ</label>
            <textarea
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium placeholder:text-slate-400 focus:ring-[#5b61ff]"
              rows={2}
              placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)…"
              value={entryNote}
              onChange={(e) => setEntryNote(e.target.value)}
            />
          </div>

          <CostSlipAttachmentZone
            slipUrl={entrySlipUrl}
            onSlipUrlChange={setEntrySlipUrl}
            photoBusy={entryPhotoBusy}
            previewUrl={addSlipPreview}
            galleryInputRef={costGalleryInputRef}
            onFileInputChange={(e) => void onCostSlipFileChange(e, "add")}
            onOpenModalCamera={() => setEntryCameraOpen(true)}
            cameraOpen={entryCameraOpen}
            onCloseCamera={() => setEntryCameraOpen(false)}
            onCameraCapture={onCostModalCameraCapture}
            onRequestLegacyPicker={() => costGalleryInputRef.current?.click()}
          />
        </div>
      </FormModal>

      <FormModal
        open={editEntry != null && editEntryForm != null}
        onClose={() => {
          setEditEntry(null);
          setEditEntryForm(null);
        }}
        title={`แก้ไขรายการต้นทุน #${editEntry?.id}`}
        description="อัปเดตข้อมูลรายจ่าย"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setEditEntry(null);
              setEditEntryForm(null);
            }}
            onSubmit={submitEditCostEntry}
            submitLabel="บันทึกการแก้ไข"
            submitDisabled={
              busy ||
              entryPhotoBusy ||
              !editEntryForm?.category_id ||
              !editEntryForm?.amount ||
              !editEntryForm?.item_label
            }
            loading={busy}
          />
        }
      >
        {editEntryForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
                หมวดหมู่
                <select
                  className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.category_id}
                  onChange={(e) =>
                    setEditEntryForm((s) => (s ? { ...s, category_id: e.target.value } : s))
                  }
                >
                  <option value="">เลือกหมวด…</option>
                  {costCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                วันที่และเวลาที่จ่าย
                <input
                  type="datetime-local"
                  className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.spent_at_local}
                  onChange={(e) =>
                    setEditEntryForm((s) => (s ? { ...s, spent_at_local: e.target.value } : s))
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
                รายการ / ชื่อค่าใช้จ่าย
                <input
                  className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น ค่าไฟเดือน เม.ย."
                  value={editEntryForm.item_label}
                  onChange={(e) =>
                    setEditEntryForm((s) => (s ? { ...s, item_label: e.target.value } : s))
                  }
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                จำนวนเงิน (บาท)
                <input
                  type="text"
                  inputMode="decimal"
                  className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold tabular-nums text-rose-700"
                  placeholder="0.00"
                  value={editEntryForm.amount}
                  onChange={(e) =>
                    setEditEntryForm((s) => (s ? { ...s, amount: e.target.value } : s))
                  }
                />
              </label>
            </div>

            <label className="block text-xs font-medium text-slate-700">
              หมายเหตุ
              <textarea
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                rows={2}
                placeholder="ข้อมูลเพิ่มเติม…"
                value={editEntryForm.note}
                onChange={(e) => setEditEntryForm((s) => (s ? { ...s, note: e.target.value } : s))}
              />
            </label>

            <CostSlipAttachmentZone
              slipUrl={editEntryForm.slip_photo_url}
              onSlipUrlChange={(url) =>
                setEditEntryForm((s) => (s ? { ...s, slip_photo_url: url } : s))
              }
              photoBusy={entryPhotoBusy}
              previewUrl={editSlipPreview}
              galleryInputRef={costGalleryInputRef}
              onFileInputChange={(e) => void onCostSlipFileChange(e, "edit")}
              onOpenModalCamera={() => setEntryCameraOpen(true)}
              cameraOpen={entryCameraOpen}
              onCloseCamera={() => setEntryCameraOpen(false)}
              onCameraCapture={onCostModalCameraCapture}
              onRequestLegacyPicker={() => costGalleryInputRef.current?.click()}
            />
          </div>
        ) : null}
      </FormModal>

      <FormModal
        open={costEntryDetail != null}
        onClose={() => setCostEntryDetail(null)}
        title={costEntryDetail ? `รายการต้นทุน #${costEntryDetail.id}` : "ต้นทุน"}
        description="รายละเอียดรายการรายจ่าย/ต้นทุน"
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="cw-btn rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setCostEntryDetail(null)}
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
            </button>
          </div>
        }
      >
        {costEntryDetail ?
          (() => {
            const e = costEntryDetail;
            const slipResolved = e.slip_photo_url?.trim() ? resolveAssetUrl(e.slip_photo_url, baseUrl) : null;
            const timeStr = new Date(e.spent_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-3 text-sm">
                  <p className="text-xs font-medium tabular-nums text-slate-500">{timeStr}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#2e2a58]">{e.item_label.trim() || "—"}</p>
                  <p className="mt-1 font-medium text-slate-800">{e.category_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-950">
                      รายจ่าย
                    </span>
                    <span className="text-sm font-bold tabular-nums text-rose-700">
                      ฿{e.amount.toLocaleString()}
                    </span>
                  </div>
                  {e.note?.trim() ?
                    <p className="mt-2 text-xs text-slate-500">{e.note}</p>
                  : null}
                </div>
                <div
                  className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
                  role="toolbar"
                  aria-label="ดำเนินการรายการต้นทุน"
                >
                  <PopupIconButton
                    label="ดูสลิป"
                    disabled={!slipResolved}
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
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * หากต้องการแก้ไขหรือลบรายการต้นทุน กรุณาไปที่แท็บ «ต้นทุน»
                </p>
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

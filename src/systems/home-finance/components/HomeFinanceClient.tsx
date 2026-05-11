"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppColumnBarSparkChart,
  AppCompareBarList,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSparkChartPanel,
  AppSparkChartsTwoColumnGrid,
  openPrintableHtml,
  useAppImageLightbox,
  type AppColumnBarBucket,
  type AppCompareBarRow,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import {
  hfHistoryListShellClass,
  HomeFinanceEmptyState,
  HomeFinanceEntityActions,
  HomeFinanceEntityMain,
  HomeFinanceEntityRow,
  HomeFinanceFilterCard,
  HomeFinanceHeroCta,
  HomeFinanceList,
  HomeFinanceListHeading,
  HomeFinanceModalActionBar,
  HomeFinanceModalBackdrop,
  HomeFinanceModalPanel,
  HomeFinancePageSection,
  HomeFinancePanelHeading,
  HomeFinancePrimaryButton,
  HomeFinanceRowActionButton,
  HomeFinanceRowActionIconButton,
  HomeFinanceRowIconActivate,
  HomeFinanceRowIconDeactivate,
  HomeFinanceRowIconEdit,
  HomeFinanceRowIconTrash,
  HomeFinanceSecondaryButton,
  HomeFinanceSectionHeader,
  HomeFinanceToolbarButton,
  HomeFinanceUploadTrigger,
  HomeFinanceVehicleCoverUpload,
} from "@/systems/home-finance/components/HomeFinanceUi";
import {
  HomeFinanceFormAttachmentsBlock,
  HomeFinanceHistoryAttachmentStrip,
  HomeFinanceVehicleRowAttachments,
  revokeHomeFinancePendingObjectUrls,
  type HomeFinancePendingUpload,
} from "@/systems/home-finance/components/HomeFinanceEntryAttachmentsUi";
import {
  encodeHomeFinancePublicAssetHref,
  isHomeFinancePdfUrl,
  MAX_HOME_FINANCE_ATTACHMENTS,
  normalizeVehicleAttachmentUrls,
} from "@/lib/home-finance/attachments";
import { cn } from "@/lib/cn";
import {
  deriveHomeFinanceSection,
  type HomeFinanceSection,
} from "@/systems/home-finance/homeFinanceSection";
import {
  DEFAULT_HOME_FINANCE_BUDGETS,
  loadHomeFinanceBudgets,
  loadHomeFinanceFilterPrefs,
  saveHomeFinanceBudgets,
  saveHomeFinanceFilterPrefs,
  type HomeFinanceBudgetItem,
} from "@/systems/home-finance/lib/home-finance-prefs";

type Entry = {
  id: number;
  entryDate: string;
  type: "INCOME" | "EXPENSE";
  categoryKey: string;
  categoryLabel: string;
  title: string;
  amount: number;
  dueDate: string | null;
  billNumber: string | null;
  vehicleType: string | null;
  serviceCenter: string | null;
  paymentMethod: string | null;
  note: string | null;
  slipImageUrl: string | null;
  attachmentUrls: string[];
  linkedUtilityId: number | null;
  linkedVehicleId: number | null;
  linkedUtility: { id: number; label: string; utilityType: string } | null;
  linkedVehicle: { id: number; label: string; plateNumber: string | null; vehicleType: string } | null;
};

type Category = { id: number; name: string; isActive: boolean; sortOrder: number };
type Utility = {
  id: number;
  utilityType: "ELECTRIC" | "WATER";
  label: string;
  accountNumber: string | null;
  dueDate: string | null;
  isActive: boolean;
  photoUrl?: string | null;
};
type Vehicle = {
  id: number;
  vehicleType: "CAR" | "MOTORCYCLE";
  label: string;
  plateNumber: string | null;
  taxDueDate: string | null;
  serviceDueDate: string | null;
  insuranceDueDate: string | null;
  isActive: boolean;
  photoUrl?: string | null;
  attachmentUrls: string[];
};
type Reminder = {
  id: number;
  title: string;
  dueDate: string;
  note: string | null;
  isDone: boolean;
};

/** ผูกแถวจาก API หลัง POST/PATCH ให้ attachmentUrls ตรงกับที่บันทึกในฐานข้อมูล */
function vehicleFromHomeFinanceApiItem(item: unknown): Vehicle | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Vehicle & { attachmentUrls?: unknown };
  if (typeof r.id !== "number") return null;
  return {
    ...r,
    attachmentUrls: normalizeVehicleAttachmentUrls(r),
  };
}

function mergeVehicleWithHomeFinanceApiItem(prev: Vehicle, item: unknown): Vehicle {
  const next = vehicleFromHomeFinanceApiItem(item);
  if (!next) return prev;
  return { ...prev, ...next, attachmentUrls: next.attachmentUrls };
}

function homeFinanceEntryLinkLabel(e: Entry): string {
  if (e.linkedUtility != null) {
    return `${e.linkedUtility.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"} · ${e.linkedUtility.label}`;
  }
  if (e.linkedVehicle != null) {
    return `${e.linkedVehicle.vehicleType === "CAR" ? "รถยนต์" : "จยย."} · ${e.linkedVehicle.label}${e.linkedVehicle.plateNumber ? ` (${e.linkedVehicle.plateNumber})` : ""}`;
  }
  return "";
}

function homeFinanceTypePillClass(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME"
    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70"
    : "bg-rose-100 text-rose-800 ring-1 ring-rose-200/70";
}

function entryAutoTitleFromUtility(u: Utility): string {
  return `${u.label} (${u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"})`;
}

function entryAutoTitleFromVehicle(v: Vehicle): string {
  const plate = v.plateNumber ? ` · ${v.plateNumber}` : "";
  const kind = v.vehicleType === "CAR" ? "รถยนต์" : "จยย.";
  return `${v.label}${plate} (${kind})`;
}

const CATEGORIES = [
  { key: "UTILITIES_ELECTRIC", label: "ค่าไฟฟ้า" },
  { key: "UTILITIES_WATER", label: "ค่าน้ำประปา" },
  { key: "VEHICLE_CAR", label: "รถยนต์" },
  { key: "VEHICLE_MOTORCYCLE", label: "รถจักรยานยนต์" },
  { key: "VEHICLE_SERVICE", label: "ซ่อม/เข้าศูนย์รถ" },
  { key: "GENERAL_FOOD", label: "ค่าอาหาร" },
  { key: "GENERAL_HOME_REPAIR", label: "ค่าซ่อมบ้าน" },
  { key: "GENERAL_SHOPPING", label: "ของใช้ในบ้าน" },
  { key: "GENERAL_HEALTH", label: "สุขภาพ/ยา" },
  { key: "GENERAL_EDUCATION", label: "การศึกษา" },
  { key: "GENERAL_TRAVEL", label: "เดินทาง" },
  { key: "GENERAL_INCOME", label: "รายรับทั่วไป" },
  { key: "OTHER", label: "อื่นๆ" },
] as const;

/** โยนเมื่ออัปโหลดถูกยกเลิกเพราะหมดเวลา (ไฟล์ใหญ่/เน็ตช้า) */
const HOME_FINANCE_UPLOAD_TIMEOUT = "HOME_FINANCE_UPLOAD_TIMEOUT";
const HOME_FINANCE_UPLOAD_MS = 120_000;

function newHomeFinancePendingRow(file: File): HomeFinancePendingUpload {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return {
    id,
    objectUrl: URL.createObjectURL(file),
    name: file.name,
    isPdf: file.type === "application/pdf" || /\.pdf$/i.test(file.name),
  };
}

async function uploadHomeFinanceFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.set("file", file);
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), HOME_FINANCE_UPLOAD_MS);
  try {
    const res = await fetch("/api/home-finance/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
      signal: ctrl.signal,
    });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!res.ok) {
      console.error(j.error ?? "upload failed");
      return null;
    }
    return j.imageUrl ?? null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(HOME_FINANCE_UPLOAD_TIMEOUT);
    }
    console.error(e);
    return null;
  } finally {
    window.clearTimeout(tid);
  }
}

function isUtilityCategoryKey(key: string) {
  return key === "UTILITIES_ELECTRIC" || key === "UTILITIES_WATER";
}

function utilityTypeForCategoryKey(key: string): "ELECTRIC" | "WATER" | null {
  if (key === "UTILITIES_ELECTRIC") return "ELECTRIC";
  if (key === "UTILITIES_WATER") return "WATER";
  return null;
}

function isVehicleCategoryKey(key: string) {
  return key.startsWith("VEHICLE_");
}

function vehicleTypeForCategoryKey(key: string): "CAR" | "MOTORCYCLE" | null {
  if (key === "VEHICLE_CAR") return "CAR";
  if (key === "VEHICLE_MOTORCYCLE") return "MOTORCYCLE";
  return null;
}

/** หมวดรถยนต์ / รถจักรยานยนต์ — ไม่มีช่องประเภทรถ และไม่เติมชื่อรายการอัตโนมัติเมื่อเลือกยานพาหนะ */
function isStandaloneVehicleCategoryKey(key: string) {
  return key === "VEHICLE_CAR" || key === "VEHICLE_MOTORCYCLE";
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** รองรับพิมพ์คั่นหลักพัน เช่น 1,500.50 */
function parseAmountInput(raw: string): number {
  const s = raw.replace(/,/g, "").replace(/\s/g, "").trim();
  return Number(s);
}

function formatMoneyCompact(thb: (n: number) => string, amount: number): string {
  return `฿ ${thb(amount)}`;
}

function categoryIcon(categoryLabel: string): string {
  const s = categoryLabel.toLowerCase();
  if (s.includes("ไฟ")) return "⚡";
  if (s.includes("น้ำ")) return "💧";
  if (s.includes("น้ำมัน")) return "⛽";
  if (s.includes("เงินเดือน")) return "💼";
  return "•";
}

const HOME_FINANCE_FETCH_MS = 45_000;

function fetchErrorMessage(e: unknown): string {
  if (e instanceof DOMException && e.name === "AbortError") {
    return `หมดเวลารอเซิร์ฟเวอร์ (${HOME_FINANCE_FETCH_MS / 1000} วินาที) — ตรวจสอบเน็ตหรือลองใหม่`;
  }
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ — ตรวจสอบเน็ตหรือลองใหม่";
}

/** ส่งคุกกี้เซสชัน + ตัดการค้างถ้าเซิร์ฟเวอร์ไม่ตอบนาน */
async function homeFinanceFetch(input: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), HOME_FINANCE_FETCH_MS);
  try {
    return await fetch(input, {
      ...init,
      /** ให้สอดคล้องกับอัปโหลดไฟล์ — ส่งคุกกี้เซสชันในทุกกรณีที่เบราว์เซอร์ยอมรับ */
      credentials: "include",
      signal: ctrl.signal,
    });
  } finally {
    window.clearTimeout(tid);
  }
}

async function readHomeFinanceJsonResponse(
  res: Response,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const status = res.status;
  const text = await res.text();
  if (!text.trim()) {
    return { ok: res.ok, status, data: {} };
  }
  try {
    return { ok: res.ok, status, data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      ok: res.ok,
      status,
      data: {
        error: snippet ? `ตอบกลับไม่ใช่ JSON: ${snippet}` : `ตอบกลับไม่ใช่ JSON (รหัส ${status})`,
      },
    };
  }
}

function metaEndpointFailureLine(label: string, res: Response, data: Record<string, unknown>): string {
  const err = typeof data.error === "string" ? data.error.trim() : "";
  if (err) return `${label}: ${err}`;
  if (res.status === 401) return `${label}: เซสชันหมดอายุ — ลองล็อกอินใหม่`;
  if (res.status === 403) {
    return `${label}: ไม่มีสิทธิ์ — ถ้าเป็นบัญชีพนักงานให้เข้าด้วยบัญชีเจ้าของ หรือตรวจสอบการเปิดโมดูลรายรับ–รายจ่าย`;
  }
  if (res.status >= 500) return `${label}: เซิร์ฟเวอร์/ฐานข้อมูลผิดพลาด (รหัส ${res.status})`;
  return `${label}: โหลดไม่สำเร็จ (รหัส ${res.status})`;
}

function monthStartKey() {
  const now = new Date();
  const y = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4);
  const m = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(5, 7);
  return `${y}-${m}-01`;
}

function yearStartKeyBangkok() {
  const y = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4);
  return `${y}-01-01`;
}

function parseYmdParts(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function compareYmd(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** บวกวันตามปฏิทิน (UTC date parts — สอดคล้องกับ entryDate YYYY-MM-DD) */
function addDaysYmd(ymd: string, deltaDays: number): string {
  const p = parseYmdParts(ymd);
  if (!p) return ymd;
  const t = Date.UTC(p.y, p.m - 1, p.d + deltaDays);
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function eachDayYmd(fromYmd: string, toYmd: string): string[] {
  const out: string[] = [];
  let cur = fromYmd;
  let guard = 0;
  while (compareYmd(cur, toYmd) <= 0 && guard++ < 400) {
    out.push(cur);
    if (cur === toYmd) break;
    cur = addDaysYmd(cur, 1);
  }
  return out;
}

function dayCountInclusive(fromYmd: string, toYmd: string): number {
  const p1 = parseYmdParts(fromYmd);
  const p2 = parseYmdParts(toYmd);
  if (!p1 || !p2) return 1;
  const t1 = Date.UTC(p1.y, p1.m - 1, p1.d);
  const t2 = Date.UTC(p2.y, p2.m - 1, p2.d);
  return Math.max(1, Math.round((t2 - t1) / 86400000) + 1);
}

function previousRangeYmd(fromYmd: string, toYmd: string): { from: string; to: string } {
  const days = dayCountInclusive(fromYmd, toYmd);
  const prevTo = addDaysYmd(fromYmd, -1);
  const prevFrom = addDaysYmd(prevTo, -(days - 1));
  return { from: prevFrom, to: prevTo };
}

type WeekBucket = { start: string; end: string; label: string };

function eachWeekBucket(fromYmd: string, toYmd: string): WeekBucket[] {
  const out: WeekBucket[] = [];
  let start = fromYmd;
  let guard = 0;
  while (compareYmd(start, toYmd) <= 0 && guard++ < 60) {
    const candEnd = addDaysYmd(start, 6);
    const end = compareYmd(candEnd, toYmd) > 0 ? toYmd : candEnd;
    out.push({
      start,
      end,
      label: `${start.slice(8)}/${start.slice(5, 7)}–${end.slice(8)}/${end.slice(5, 7)}`,
    });
    if (end === toYmd) break;
    start = addDaysYmd(end, 1);
  }
  return out;
}

type TrendBucket = { key: string; label: string; income: number; expense: number };

function aggregateByMonthKeys(entries: Entry[], fromYmd: string, toYmd: string): TrendBucket[] {
  const fromKey = fromYmd.slice(0, 7);
  const toKey = toYmd.slice(0, 7);
  if (fromKey > toKey) return [];
  const map = new Map<string, { income: number; expense: number }>();
  for (const e of entries) {
    const k = e.entryDate.slice(0, 7);
    if (k < fromKey || k > toKey) continue;
    const cur = map.get(k) ?? { income: 0, expense: 0 };
    if (e.type === "INCOME") cur.income += e.amount;
    else cur.expense += e.amount;
    map.set(k, cur);
  }
  const keys: string[] = [];
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  let y = fy;
  let mo = fm;
  let g = 0;
  while ((y < ty || (y === ty && mo <= tm)) && g++ < 48) {
    keys.push(`${y}-${String(mo).padStart(2, "0")}`);
    mo++;
    if (mo > 12) {
      mo = 1;
      y++;
    }
  }
  return keys.map((k) => {
    const v = map.get(k) ?? { income: 0, expense: 0 };
    const [, mm] = k.split("-");
    return { key: k, label: `${mm}/${k.slice(0, 4)}`, income: v.income, expense: v.expense };
  });
}

function buildTrendBuckets(fromYmd: string, toYmd: string, entries: Entry[]): { mode: "day" | "week" | "month"; buckets: TrendBucket[] } {
  const dc = dayCountInclusive(fromYmd, toYmd);
  if (dc <= 35) {
    const days = eachDayYmd(fromYmd, toYmd);
    const byDay = new Map<string, { income: number; expense: number }>();
    for (const d of days) byDay.set(d, { income: 0, expense: 0 });
    for (const e of entries) {
      if (!byDay.has(e.entryDate)) continue;
      const b = byDay.get(e.entryDate)!;
      if (e.type === "INCOME") b.income += e.amount;
      else b.expense += e.amount;
    }
    return {
      mode: "day",
      buckets: days.map((d) => {
        const v = byDay.get(d)!;
        return { key: d, label: `${d.slice(8)}/${d.slice(5, 7)}`, income: v.income, expense: v.expense };
      }),
    };
  }
  if (dc <= 120) {
    const weeks = eachWeekBucket(fromYmd, toYmd);
    return {
      mode: "week",
      buckets: weeks.map((w) => {
        let income = 0;
        let expense = 0;
        for (const e of entries) {
          if (compareYmd(e.entryDate, w.start) < 0 || compareYmd(e.entryDate, w.end) > 0) continue;
          if (e.type === "INCOME") income += e.amount;
          else expense += e.amount;
        }
        return { key: `${w.start}_${w.end}`, label: w.label, income, expense };
      }),
    };
  }
  return { mode: "month", buckets: aggregateByMonthKeys(entries, fromYmd, toYmd) };
}

const inputClz =
  "min-h-[46px] w-full rounded-2xl border border-white/70 bg-white/78 px-3.5 py-2.5 text-sm text-[#28254a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[#9a98b5] focus:border-[#5a57d8]/45 focus:bg-white focus:ring-2 focus:ring-[#5a57d8]/15";

type HomeFinanceClientProps = {
  /** ส่งจากแต่ละ page.tsx — กันพลาดจาก pathname / hydration */
  section?: HomeFinanceSection;
  /** snapshot จาก Server Component — กัน hydration mismatch ของช่องวันที่ */
  calendarDefaults: { monthStartYmd: string; todayYmd: string };
};

export function HomeFinanceClient({ section: sectionFromRoute, calendarDefaults }: HomeFinanceClientProps) {
  const pathname = usePathname() ?? "";
  const section = sectionFromRoute ?? deriveHomeFinanceSection(pathname);
  const editSlipFileInputId = useId();
  const vehicleAddAttachInputId = useId();
  const vehicleEditAttachInputId = useId();
  const [from, setFrom] = useState(calendarDefaults.monthStartYmd);
  const [to, setTo] = useState(calendarDefaults.todayYmd);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [q, setQ] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [densityMode, setDensityMode] = useState<"compact" | "comfortable">("comfortable");
  /** เริ่ม false → กลายเป็น true หลัง read prefs จาก localStorage ครั้งแรก เพื่อกัน save ทับด้วย default ระหว่าง hydration */
  const [filterPrefsHydrated, setFilterPrefsHydrated] = useState(false);
  const [budgets, setBudgets] = useState<HomeFinanceBudgetItem[]>(DEFAULT_HOME_FINANCE_BUDGETS);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<HomeFinanceBudgetItem[]>(DEFAULT_HOME_FINANCE_BUDGETS);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState({ count: 0, income: 0, expense: 0, balance: 0 });
  const [previousPeriodBalance, setPreviousPeriodBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** โหลดหมวด/บิล/รถ/เตือน — แยกจาก error ของรายการรายรับ–รายจ่าย */
  const [metaError, setMetaError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleCounts, setVehicleCounts] = useState({ cars: 0, motorcycles: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [entryDate, setEntryDate] = useState(calendarDefaults.todayYmd);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryKey, setCategoryKey] = useState<string>("UTILITIES_ELECTRIC");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [serviceCenter, setServiceCenter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  /** ฟอร์มเพิ่มรายการ — สลิปได้ 1 รูปเท่านั้น */
  const [entrySlipImageUrl, setEntrySlipImageUrl] = useState<string | null>(null);
  const [entrySlipUploading, setEntrySlipUploading] = useState(false);
  const [entrySlipAiSaving, setEntrySlipAiSaving] = useState(false);
  const [linkedUtilityId, setLinkedUtilityId] = useState<number | "">("");
  const [linkedVehicleId, setLinkedVehicleId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const imageLightbox = useAppImageLightbox();
  const [editForm, setEditForm] = useState({
    entryDate: calendarDefaults.todayYmd,
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryKey: "UTILITIES_ELECTRIC",
    title: "",
    amount: "",
    note: "",
    attachmentUrls: [] as string[],
    linkedUtilityId: null as number | null,
    linkedVehicleId: null as number | null,
  });

  const setEditEntryAttachmentUrls = useCallback((action: SetStateAction<string[]>) => {
    setEditForm((s) => ({
      ...s,
      attachmentUrls: typeof action === "function" ? action(s.attachmentUrls) : action,
    }));
  }, []);

  const [categoryAddModalOpen, setCategoryAddModalOpen] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [utilityForm, setUtilityForm] = useState({
    utilityType: "ELECTRIC" as "ELECTRIC" | "WATER",
    label: "",
    accountNumber: "",
    dueDate: "",
  });
  const [utilityAddModalOpen, setUtilityAddModalOpen] = useState(false);
  const [utilityEditModalId, setUtilityEditModalId] = useState<number | null>(null);
  const [utilityModalForm, setUtilityModalForm] = useState({
    utilityType: "ELECTRIC" as "ELECTRIC" | "WATER",
    label: "",
    accountNumber: "",
    dueDate: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: "CAR" as "CAR" | "MOTORCYCLE",
    label: "",
    plateNumber: "",
    taxDueDate: "",
    serviceDueDate: "",
    insuranceDueDate: "",
  });
  const [vehicleAddModalOpen, setVehicleAddModalOpen] = useState(false);
  const [vehicleAddAttachmentUrls, setVehicleAddAttachmentUrls] = useState<string[]>([]);
  const [vehicleEditModalId, setVehicleEditModalId] = useState<number | null>(null);
  const [vehicleEditAttachmentUrls, setVehicleEditAttachmentUrls] = useState<string[]>([]);
  const [vehicleModalForm, setVehicleModalForm] = useState({
    vehicleType: "CAR" as "CAR" | "MOTORCYCLE",
    label: "",
    plateNumber: "",
    taxDueDate: "",
    serviceDueDate: "",
    insuranceDueDate: "",
  });
  const [reminderAddModalOpen, setReminderAddModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    dueDate: calendarDefaults.todayYmd,
    note: "",
  });

  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [editEntryAttachmentPending, setEditEntryAttachmentPending] = useState<HomeFinancePendingUpload[]>([]);
  const [vehicleAddAttachmentPending, setVehicleAddAttachmentPending] = useState<HomeFinancePendingUpload[]>([]);
  const [vehicleEditAttachmentPending, setVehicleEditAttachmentPending] = useState<HomeFinancePendingUpload[]>([]);
  /** แยก epoch ต่อบริบท — อย่าใช้ตัวเดียวกันทั้งหมด เดี๋ยวปิดฟอร์มหนึ่งแล้วอัปโหลดในอีกฟอร์มถูกยกเลิก */
  const hfAttachEpochEntryRef = useRef(0);
  const hfAttachEpochVehicleAddRef = useRef(0);
  const hfAttachEpochVehicleEditRef = useRef(0);
  /** อัปเดตทุก render — appendFilesToList อ่านตอนเริ่มคลิกเลือกไฟล์ กันค่า length จาก closure เก่า (หลายไฟล์ + แก้ไขรถ) */
  const hfAttachEntryUrlCountRef = useRef(0);
  const hfAttachEntryPendingCountRef = useRef(0);
  const hfAttachVehicleAddUrlCountRef = useRef(0);
  const hfAttachVehicleAddPendingCountRef = useRef(0);
  const hfAttachVehicleEditUrlCountRef = useRef(0);
  const hfAttachVehicleEditPendingCountRef = useRef(0);
  const lastEditEntryIdRef = useRef<number | null>(null);
  const lastVehicleEditIdRef = useRef<number | null>(null);
  const [coverPhotoUploadingVehicleId, setCoverPhotoUploadingVehicleId] = useState<number | null>(null);
  const [coverPhotoUploadingUtilityId, setCoverPhotoUploadingUtilityId] = useState<number | null>(null);
  const [vehicleFormSaving, setVehicleFormSaving] = useState(false);
  const filterSearchInputRef = useRef<HTMLInputElement | null>(null);

  /** โหลดค่าตัวกรองที่จำไว้ — รันครั้งเดียวหลัง mount เพื่อกัน hydration mismatch */
  useEffect(() => {
    const prefs = loadHomeFinanceFilterPrefs();
    if (prefs.from) setFrom(prefs.from);
    if (prefs.to) setTo(prefs.to);
    if (typeof prefs.typeFilter === "string") setTypeFilter(prefs.typeFilter);
    if (typeof prefs.categoryFilter === "string") setCategoryFilter(prefs.categoryFilter);
    if (typeof prefs.q === "string") setQ(prefs.q);
    if (prefs.densityMode === "compact" || prefs.densityMode === "comfortable") {
      setDensityMode(prefs.densityMode);
    }
    setFilterPrefsHydrated(true);
  }, []);

  /** บันทึกค่าตัวกรองทุกครั้งที่เปลี่ยน (หลัง hydrate แล้ว) */
  useEffect(() => {
    if (!filterPrefsHydrated) return;
    saveHomeFinanceFilterPrefs({ from, to, typeFilter, categoryFilter, q, densityMode });
  }, [filterPrefsHydrated, from, to, typeFilter, categoryFilter, q, densityMode]);

  /** โหลดงบเดือนที่ผู้ใช้ตั้งไว้ */
  useEffect(() => {
    setBudgets(loadHomeFinanceBudgets());
  }, []);

  useEffect(() => {
    if (!editingEntry) {
      if (lastEditEntryIdRef.current != null) {
        hfAttachEpochEntryRef.current += 1;
        lastEditEntryIdRef.current = null;
        setEditEntryAttachmentPending((p) => {
          revokeHomeFinancePendingObjectUrls(p);
          return [];
        });
      }
      return;
    }
    const id = editingEntry.id;
    if (lastEditEntryIdRef.current === null) {
      setEditEntryAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
      lastEditEntryIdRef.current = id;
      return;
    }
    if (lastEditEntryIdRef.current !== id) {
      hfAttachEpochEntryRef.current += 1;
      setEditEntryAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
      lastEditEntryIdRef.current = id;
    }
  }, [editingEntry]);

  const prevVehicleAddOpenRef = useRef(false);
  useEffect(() => {
    if (prevVehicleAddOpenRef.current && !vehicleAddModalOpen) {
      hfAttachEpochVehicleAddRef.current += 1;
      setVehicleAddAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
    }
    if (!prevVehicleAddOpenRef.current && vehicleAddModalOpen) {
      setVehicleAddAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
    }
    prevVehicleAddOpenRef.current = vehicleAddModalOpen;
  }, [vehicleAddModalOpen]);

  useEffect(() => {
    if (vehicleEditModalId == null) {
      if (lastVehicleEditIdRef.current != null) {
        hfAttachEpochVehicleEditRef.current += 1;
        lastVehicleEditIdRef.current = null;
        setVehicleEditAttachmentPending((p) => {
          revokeHomeFinancePendingObjectUrls(p);
          return [];
        });
      }
      return;
    }
    const id = vehicleEditModalId;
    if (lastVehicleEditIdRef.current === null) {
      setVehicleEditAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
      lastVehicleEditIdRef.current = id;
      return;
    }
    if (lastVehicleEditIdRef.current !== id) {
      hfAttachEpochVehicleEditRef.current += 1;
      setVehicleEditAttachmentPending((p) => {
        revokeHomeFinancePendingObjectUrls(p);
        return [];
      });
      lastVehicleEditIdRef.current = id;
    }
  }, [vehicleEditModalId]);

  const categoryOptions = useMemo(
    () => [
      ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
      ...categories.filter((c) => c.isActive).map((c) => ({ key: `CUSTOM_${c.id}`, label: c.name })),
    ],
    [categories],
  );
  const showVehicleFields = categoryKey.startsWith("VEHICLE_");
  const showVehicleTypeField = showVehicleFields && !isStandaloneVehicleCategoryKey(categoryKey);

  const utilitiesForCategory = useMemo(() => {
    const t = utilityTypeForCategoryKey(categoryKey);
    if (!t) return utilities.filter((u) => u.isActive);
    return utilities.filter((u) => u.isActive && u.utilityType === t);
  }, [utilities, categoryKey]);

  const vehiclesForCategory = useMemo(() => {
    const t = vehicleTypeForCategoryKey(categoryKey);
    if (!t) return vehicles.filter((v) => v.isActive);
    return vehicles.filter((v) => v.isActive && v.vehicleType === t);
  }, [vehicles, categoryKey]);

  const editUtilitiesForCategory = useMemo(() => {
    const t = utilityTypeForCategoryKey(editForm.categoryKey);
    if (!t) return utilities.filter((u) => u.isActive);
    return utilities.filter((u) => u.isActive && u.utilityType === t);
  }, [utilities, editForm.categoryKey]);

  const editVehiclesForCategory = useMemo(() => {
    const t = vehicleTypeForCategoryKey(editForm.categoryKey);
    if (!t) return vehicles.filter((v) => v.isActive);
    return vehicles.filter((v) => v.isActive && v.vehicleType === t);
  }, [vehicles, editForm.categoryKey]);

  useEffect(() => {
    if (!isUtilityCategoryKey(categoryKey)) setLinkedUtilityId("");
    if (!isVehicleCategoryKey(categoryKey)) setLinkedVehicleId("");
  }, [categoryKey]);

  useEffect(() => {
    setSelectedHistoryIds([]);
  }, [entries, from, to, typeFilter, categoryFilter, q]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (ev.key === "Escape" && (entryModalOpen || editingEntry != null)) {
        setEntryModalOpen(false);
        setEditingEntry(null);
        return;
      }
      if (isTyping) return;
      if (ev.key.toLowerCase() === "n") {
        ev.preventDefault();
        setEntryModalOpen(true);
      }
      if (ev.key.toLowerCase() === "f" && section === "history") {
        ev.preventDefault();
        setMobileFilterOpen(true);
        window.setTimeout(() => filterSearchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [section, entryModalOpen, editingEntry]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveFrom = section === "dashboard" ? monthStartKey() : from;
      const effectiveTo = section === "dashboard" ? todayKey() : to;
      const sp = new URLSearchParams({ from: effectiveFrom, to: effectiveTo });
      if (section === "history") {
        if (typeFilter) sp.set("type", typeFilter);
        if (categoryFilter) sp.set("category", categoryFilter);
        if (q.trim()) sp.set("q", q.trim());
      }
      const res = await homeFinanceFetch(`/api/home-finance/entries?${sp}`);
      const parsed = await readHomeFinanceJsonResponse(res);
      const j = parsed.data as {
        error?: string;
        entries?: Entry[];
        summary?: { count: number; income: number; expense: number; balance: number };
      };
      if (!parsed.ok) {
        const msg =
          typeof j.error === "string" && j.error.trim()
            ? j.error.trim()
            : metaEndpointFailureLine("รายการรายรับ–รายจ่าย", res, parsed.data);
        setError(msg);
        /* ไม่ล้าง entries — กันรายการหายทั้งที่บันทึกสำเร็จแต่รีเฟรชชั่วคราวล้มเหลว */
        return;
      }
      setError(null);
      const raw = j.entries ?? [];
      setEntries(
        raw.map((row) => {
          const att = row.attachmentUrls;
          const attachmentUrls =
            Array.isArray(att) && att.length > 0
              ? att.filter((u): u is string => typeof u === "string")
              : row.slipImageUrl
                ? [row.slipImageUrl]
                : [];
          return { ...row, attachmentUrls } as Entry;
        }),
      );
      setSummary(j.summary ?? { count: 0, income: 0, expense: 0, balance: 0 });
      if (section === "dashboard") {
        try {
          const prev = previousRangeYmd(effectiveFrom, effectiveTo);
          const prevSp = new URLSearchParams({ from: prev.from, to: prev.to });
          const prevRes = await homeFinanceFetch(`/api/home-finance/entries?${prevSp}`);
          const prevParsed = await readHomeFinanceJsonResponse(prevRes);
          const prevData = prevParsed.data as {
            summary?: { balance?: number };
          };
          if (prevParsed.ok) {
            const prevBal =
              typeof prevData.summary?.balance === "number" ? prevData.summary.balance : null;
            setPreviousPeriodBalance(prevBal);
          } else {
            setPreviousPeriodBalance(null);
          }
        } catch {
          setPreviousPeriodBalance(null);
        }
      } else {
        setPreviousPeriodBalance(null);
      }
    } catch (e) {
      setError(fetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [section, from, to, typeFilter, categoryFilter, q]);

  const loadMeta = useCallback(async () => {
    try {
      const [cRes, uRes, vRes, rRes] = await Promise.all([
        homeFinanceFetch("/api/home-finance/categories"),
        homeFinanceFetch("/api/home-finance/utilities"),
        homeFinanceFetch("/api/home-finance/vehicles"),
        homeFinanceFetch("/api/home-finance/reminders"),
      ]);
      const [cP, uP, vP, rP] = await Promise.all([
        readHomeFinanceJsonResponse(cRes),
        readHomeFinanceJsonResponse(uRes),
        readHomeFinanceJsonResponse(vRes),
        readHomeFinanceJsonResponse(rRes),
      ]);
      const failures: string[] = [];
      if (cP.ok) {
        setCategories((cP.data.categories as Category[] | undefined) ?? []);
      } else {
        failures.push(metaEndpointFailureLine("หมวดกำหนดเอง", cRes, cP.data));
      }
      if (uP.ok) {
        setUtilities((uP.data.items as Utility[] | undefined) ?? []);
      } else {
        failures.push(metaEndpointFailureLine("ค่าไฟ/ค่าน้ำ", uRes, uP.data));
      }
      if (vP.ok) {
        const rawItems = (vP.data.items as Array<Vehicle & { attachmentUrls?: unknown }> | undefined) ?? [];
        const items: Vehicle[] = rawItems.map((row) => ({
          ...row,
          attachmentUrls: normalizeVehicleAttachmentUrls(row),
        }));
        const counts = (vP.data.counts as { cars: number; motorcycles: number } | undefined) ?? {
          cars: 0,
          motorcycles: 0,
        };
        setVehicles(items);
        setVehicleCounts(counts);
      } else {
        failures.push(metaEndpointFailureLine("ยานพาหนะ", vRes, vP.data));
      }
      if (rP.ok) {
        setReminders((rP.data.items as Reminder[] | undefined) ?? []);
      } else {
        failures.push(metaEndpointFailureLine("แจ้งเตือน", rRes, rP.data));
      }
      setMetaError(failures.length > 0 ? failures.join(" · ") : null);
    } catch (e) {
      setMetaError(fetchErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);
  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    setSaveNotice(null);
  }, [section]);

  function isYmdInCurrentBangkokMonth(ymd: string) {
    const ms = monthStartKey();
    const te = todayKey();
    return ymd >= ms && ymd <= te;
  }

  function setSaveNoticeAfterEntrySaved(entryDateSaved: string) {
    if (!isYmdInCurrentBangkokMonth(entryDateSaved)) {
      setSaveNotice(
        "บันทึกแล้ว — วันที่ไม่อยู่ในเดือนนี้ (ไทย) แดชบอร์ดจะไม่แสดง; ดูที่ «ประวัติ» แล้วตั้งช่วงวันที่",
      );
    } else {
      setSaveNotice("บันทึกแล้ว");
    }
    window.setTimeout(() => setSaveNotice(null), 14000);
  }

  async function uploadEntrySlipFile(file: File) {
    setEntrySlipUploading(true);
    setError(null);
    try {
      let url: string | null;
      try {
        url = await uploadHomeFinanceFile(file);
      } catch (err) {
        setError(
          err instanceof Error && err.message === HOME_FINANCE_UPLOAD_TIMEOUT
            ? "อัปโหลดรูปหมดเวลา — ลองรูปเล็กลงหรือเน็ตที่เร็วขึ้น"
            : "อัปโหลดรูปไม่สำเร็จ",
        );
        return;
      }
      if (!url) {
        setError("อัปโหลดรูปไม่สำเร็จ — ใช้ JPG/PNG/WebP/GIF ไม่เกิน 3MB");
        return;
      }
      setEntrySlipImageUrl(url);
    } finally {
      setEntrySlipUploading(false);
    }
  }

  async function ingestSlipWithAiAndSave(file: File) {
    setEntrySlipAiSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("preferredType", type);
      fd.set("defaultCategoryKey", categoryKey);
      let res: Response;
      try {
        res = await homeFinanceFetch("/api/home-finance/entries/ingest-slip", {
          method: "POST",
          body: fd,
        });
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      const parsed = await readHomeFinanceJsonResponse(res);
      const j = parsed.data as {
        error?: string;
        status?: "saved" | "needs_review";
        confidence?: number;
        imageUrl?: string;
        entry?: { entryDate?: string };
        suggestion?: {
          entryDate?: string;
          type?: "INCOME" | "EXPENSE";
          categoryKey?: string;
          title?: string;
          amount?: number;
          note?: string | null;
          paymentMethod?: string | null;
          billNumber?: string | null;
        };
      };
      if (!parsed.ok) {
        if (j.suggestion) {
          if (typeof j.suggestion.entryDate === "string") setEntryDate(j.suggestion.entryDate);
          if (j.suggestion.type === "INCOME" || j.suggestion.type === "EXPENSE") setType(j.suggestion.type);
          if (typeof j.suggestion.categoryKey === "string" && j.suggestion.categoryKey) {
            setCategoryKey(j.suggestion.categoryKey);
          }
          if (typeof j.suggestion.title === "string") setTitle(j.suggestion.title);
          if (typeof j.suggestion.amount === "number" && Number.isFinite(j.suggestion.amount)) {
            setAmount(String(j.suggestion.amount));
          }
          if (typeof j.suggestion.note === "string") setNote(j.suggestion.note);
          if (typeof j.suggestion.paymentMethod === "string") setPaymentMethod(j.suggestion.paymentMethod);
          if (typeof j.suggestion.billNumber === "string") setBillNumber(j.suggestion.billNumber);
        }
        if (typeof j.imageUrl === "string" && j.imageUrl) {
          setEntrySlipImageUrl(j.imageUrl);
        }
        const msg =
          typeof j.error === "string" && j.error.trim()
            ? j.error.trim()
            : metaEndpointFailureLine("อ่านสลิปด้วย AI", res, parsed.data);
        setError(msg);
        return;
      }
      if (typeof j.imageUrl === "string" && j.imageUrl) {
        setEntrySlipImageUrl(j.imageUrl);
      }
      const savedDate = j.entry?.entryDate ?? entryDate;
      setSaveNoticeAfterEntrySaved(savedDate);
      if (j.status === "saved") {
        setTitle("");
        setAmount("");
        setDueDate("");
        setBillNumber("");
        setVehicleType("");
        setServiceCenter("");
        setPaymentMethod("");
        setNote("");
        setEntrySlipImageUrl(null);
        setLinkedUtilityId("");
        setLinkedVehicleId("");
        setEntryModalOpen(false);
        void loadEntries();
      }
    } finally {
      setEntrySlipAiSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (entrySlipUploading) {
      setError("รอให้อัปโหลดรูปสลิปให้เสร็จก่อน แล้วค่อยบันทึก");
      return;
    }
    setSaving(true);
    setError(null);
    let savedOk = false;
    try {
      const ed = entryDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ed)) {
        setError("กรุณาเลือกวันที่รายการให้ครบ");
        return;
      }
      if (!title.trim()) {
        setError("กรุณากรอกชื่อรายการ");
        return;
      }
      const n = parseAmountInput(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องเป็นตัวเลขมากกว่า 0 (ใช้จุดทศนิยมได้ ไม่บังคับคั่นหลักพัน)");
        return;
      }
      const uLink = isUtilityCategoryKey(categoryKey) && linkedUtilityId !== "" ? Number(linkedUtilityId) : null;
      const vLink = isVehicleCategoryKey(categoryKey) && linkedVehicleId !== "" ? Number(linkedVehicleId) : null;
      let res: Response;
      try {
        res = await homeFinanceFetch("/api/home-finance/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          entryDate: ed,
          type,
          categoryKey,
          categoryLabel: categoryOptions.find((c) => c.key === categoryKey)?.label ?? categoryKey,
          title: title.trim(),
            amount: n,
            dueDate: dueDate || null,
            billNumber: billNumber || null,
            vehicleType: showVehicleTypeField ? vehicleType || null : null,
            serviceCenter: showVehicleFields ? serviceCenter || null : null,
            paymentMethod: paymentMethod || null,
            note: note || null,
            attachmentUrls: entrySlipImageUrl ? [entrySlipImageUrl] : [],
            linkedUtilityId: uLink,
            linkedVehicleId: vLink,
          }),
        });
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      const parsed = await readHomeFinanceJsonResponse(res);
      const j = parsed.data as { error?: string; entry?: { entryDate: string } };
      if (!parsed.ok) {
        const msg =
          typeof j.error === "string" && j.error.trim()
            ? j.error.trim()
            : metaEndpointFailureLine("บันทึกรายการ", res, parsed.data);
        setError(msg);
        return;
      }
      const savedDate = j.entry?.entryDate ?? ed;
      setSaveNoticeAfterEntrySaved(savedDate);
      setTitle("");
      setAmount("");
      setDueDate("");
      setBillNumber("");
      setVehicleType("");
      setServiceCenter("");
      setPaymentMethod("");
      setNote("");
      setEntrySlipImageUrl(null);
      setLinkedUtilityId("");
      setLinkedVehicleId("");
      setEntryModalOpen(false);
      savedOk = true;
    } finally {
      setSaving(false);
    }
    if (savedOk) void loadEntries();
  }

  async function removeEntry(id: number) {
    if (!confirm("ลบรายการนี้?")) return;
    try {
      const res = await homeFinanceFetch(`/api/home-finance/entries/${id}`, { method: "DELETE" });
      const parsed = await readHomeFinanceJsonResponse(res);
      const j = parsed.data as { error?: string };
      if (!parsed.ok) {
        setError(
          typeof j.error === "string" && j.error.trim()
            ? j.error.trim()
            : metaEndpointFailureLine("ลบรายการ", res, parsed.data),
        );
        return;
      }
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    await loadEntries();
  }

  async function removeEntriesBulk(ids: number[]) {
    if (ids.length === 0) return;
    if (!confirm(`ลบ ${ids.length} รายการที่เลือก?`)) return;
    for (const id of ids) {
      const res = await homeFinanceFetch(`/api/home-finance/entries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const parsed = await readHomeFinanceJsonResponse(res);
        setError(metaEndpointFailureLine("ลบหลายรายการ", res, parsed.data));
        break;
      }
    }
    setSelectedHistoryIds([]);
    await loadEntries();
  }

  function openEdit(entry: Entry) {
    setError(null);
    setEditingEntry(entry);
    setEditForm({
      entryDate: entry.entryDate,
      type: entry.type,
      categoryKey: entry.categoryKey,
      title: entry.title,
      amount: String(entry.amount),
      note: entry.note ?? "",
      attachmentUrls:
        entry.attachmentUrls?.length > 0
          ? entry.attachmentUrls
          : entry.slipImageUrl
            ? [entry.slipImageUrl]
            : [],
      linkedUtilityId: entry.linkedUtilityId,
      linkedVehicleId: entry.linkedVehicleId,
    });
  }

  function applyQuickRange(mode: "7d" | "30d" | "quarter" | "year" | "custom") {
    const today = todayKey();
    if (mode === "7d") {
      setFrom(addDaysYmd(today, -6));
      setTo(today);
      return;
    }
    if (mode === "30d") {
      setFrom(addDaysYmd(today, -29));
      setTo(today);
      return;
    }
    if (mode === "quarter") {
      setFrom(addDaysYmd(today, -89));
      setTo(today);
      return;
    }
    if (mode === "year") {
      setFrom(yearStartKeyBangkok());
      setTo(today);
      return;
    }
    setMobileFilterOpen(true);
  }

  async function onSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    if (editEntryAttachmentPending.length > 0) {
      setError("รอให้อัปโหลดไฟล์แนบให้เสร็จก่อน แล้วค่อยบันทึก");
      return;
    }
    setSaving(true);
    setError(null);
    let savedOk = false;
    try {
      const ed = editForm.entryDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ed)) {
        setError("กรุณาเลือกวันที่รายการให้ครบ");
        return;
      }
      if (!editForm.title.trim()) {
        setError("กรุณากรอกชื่อรายการ");
        return;
      }
      const n = parseAmountInput(editForm.amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องเป็นตัวเลขมากกว่า 0 (ใช้จุดทศนิยมได้ ไม่บังคับคั่นหลักพัน)");
        return;
      }
      const uLink = isUtilityCategoryKey(editForm.categoryKey) ? editForm.linkedUtilityId : null;
      const vLink = isVehicleCategoryKey(editForm.categoryKey) ? editForm.linkedVehicleId : null;
      let res: Response;
      try {
        res = await homeFinanceFetch(`/api/home-finance/entries/${editingEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: ed,
            type: editForm.type,
            categoryKey: editForm.categoryKey,
            categoryLabel: categoryOptions.find((c) => c.key === editForm.categoryKey)?.label ?? editForm.categoryKey,
            title: editForm.title.trim(),
            amount: n,
            note: editForm.note.trim() || null,
            attachmentUrls: editForm.attachmentUrls,
            linkedUtilityId: uLink,
            linkedVehicleId: vLink,
          }),
        });
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      const parsed = await readHomeFinanceJsonResponse(res);
      const j = parsed.data as { error?: string };
      if (!parsed.ok) {
        const msg =
          typeof j.error === "string" && j.error.trim()
            ? j.error.trim()
            : metaEndpointFailureLine("แก้ไขรายการ", res, parsed.data);
        setError(msg);
        return;
      }
      setSaveNoticeAfterEntrySaved(ed);
      setEditingEntry(null);
      savedOk = true;
    } finally {
      setSaving(false);
    }
    if (savedOk) void loadEntries();
  }

  function openCategoryAddModal() {
    setError(null);
    setCustomCategoryName("");
    setCategoryAddModalOpen(true);
  }

  function closeCategoryAddModal() {
    setCategoryAddModalOpen(false);
    setCustomCategoryName("");
    setError(null);
  }

  async function addCategory() {
    if (!customCategoryName.trim()) return;
    setError(null);
    let res: Response;
    try {
      res = await fetch("/api/home-finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customCategoryName.trim() }),
      });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      const msg = typeof j.error === "string" && j.error.trim() ? j.error.trim() : "";
      setError(msg || `เพิ่มหมวดไม่สำเร็จ (รหัส ${res.status})`);
      return;
    }
    closeCategoryAddModal();
    await loadMeta();
  }

  async function renameCategory(id: number, current: string) {
    const name = prompt("ชื่อหมวดใหม่", current);
    if (!name || !name.trim()) return;
    await fetch(`/api/home-finance/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    await loadMeta();
  }

  async function deleteCategory(id: number) {
    if (!confirm("ลบหมวดนี้?")) return;
    await fetch(`/api/home-finance/categories/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  async function addUtility() {
    if (!utilityForm.label.trim()) return;
    setError(null);
    const body = {
      utilityType: utilityForm.utilityType,
      label: utilityForm.label.trim(),
      accountNumber: utilityForm.accountNumber.trim() || null,
      dueDate: utilityForm.dueDate.trim() || null,
    };
    let res: Response;
    try {
      res = await homeFinanceFetch("/api/home-finance/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const parsed = await readHomeFinanceJsonResponse(res);
    if (!parsed.ok) {
      const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
      setError(err || metaEndpointFailureLine("เพิ่มค่าไฟ/ค่าน้ำ", res, parsed.data));
      return;
    }
    closeUtilityAddModal();
    await loadMeta();
  }

  function openUtilityAddModal() {
    setError(null);
    setUtilityForm({ utilityType: "ELECTRIC", label: "", accountNumber: "", dueDate: "" });
    setUtilityAddModalOpen(true);
  }

  function closeUtilityAddModal() {
    setUtilityAddModalOpen(false);
    setUtilityForm({ utilityType: "ELECTRIC", label: "", accountNumber: "", dueDate: "" });
    setError(null);
  }

  function openUtilityEditModal(item: Utility) {
    setError(null);
    setUtilityEditModalId(item.id);
    setUtilityModalForm({
      utilityType: item.utilityType,
      label: item.label,
      accountNumber: item.accountNumber ?? "",
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
    });
  }

  function closeUtilityEditModal() {
    setUtilityEditModalId(null);
    setUtilityModalForm({ utilityType: "ELECTRIC", label: "", accountNumber: "", dueDate: "" });
  }

  async function saveUtilityEdit() {
    if (utilityEditModalId == null) return;
    if (!utilityModalForm.label.trim()) return;
    setError(null);
    const body = {
      utilityType: utilityModalForm.utilityType,
      label: utilityModalForm.label.trim(),
      accountNumber: utilityModalForm.accountNumber.trim() || null,
      dueDate: utilityModalForm.dueDate.trim() || null,
    };
    let res: Response;
    try {
      res = await homeFinanceFetch(`/api/home-finance/utilities/${utilityEditModalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const parsed = await readHomeFinanceJsonResponse(res);
    if (!parsed.ok) {
      const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
      setError(err || metaEndpointFailureLine("แก้ไขค่าไฟ/ค่าน้ำ", res, parsed.data));
      return;
    }
    closeUtilityEditModal();
    await loadMeta();
  }

  async function removeUtility(id: number) {
    if (!confirm("ลบรายการบิลนี้?")) return;
    setError(null);
    let res: Response;
    try {
      res = await homeFinanceFetch(`/api/home-finance/utilities/${id}`, { method: "DELETE" });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const parsed = await readHomeFinanceJsonResponse(res);
    if (!parsed.ok) {
      const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
      setError(err || metaEndpointFailureLine("ลบค่าไฟ/ค่าน้ำ", res, parsed.data));
      return;
    }
    await loadMeta();
  }

  async function patchUtilityPhoto(id: number, file: File) {
    setCoverPhotoUploadingUtilityId(id);
    setError(null);
    try {
      let url: string | null;
      try {
        url = await uploadHomeFinanceFile(file);
      } catch (err) {
        setError(
          err instanceof Error && err.message === HOME_FINANCE_UPLOAD_TIMEOUT
            ? "อัปโหลดรูปหมดเวลา — ลองรูปเล็กลงหรือเน็ตที่เร็วขึ้น"
            : "อัปโหลดรูปไม่สำเร็จ",
        );
        return;
      }
      if (!url) {
        setError("อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      try {
        const res = await homeFinanceFetch(`/api/home-finance/utilities/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: url }),
        });
        const pr = await readHomeFinanceJsonResponse(res);
        if (!pr.ok) {
          const err = typeof pr.data.error === "string" ? pr.data.error.trim() : "";
          setError(err || metaEndpointFailureLine("บันทึกรูปบิล", res, pr.data));
          return;
        }
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      await loadMeta();
    } finally {
      setCoverPhotoUploadingUtilityId(null);
    }
  }

  async function patchVehiclePhoto(id: number, file: File) {
    setCoverPhotoUploadingVehicleId(id);
    setError(null);
    try {
      let url: string | null;
      try {
        url = await uploadHomeFinanceFile(file);
      } catch (err) {
        setError(
          err instanceof Error && err.message === HOME_FINANCE_UPLOAD_TIMEOUT
            ? "อัปโหลดรูปหมดเวลา — ลองรูปเล็กลงหรือเน็ตที่เร็วขึ้น"
            : "อัปโหลดรูปไม่สำเร็จ",
        );
        return;
      }
      if (!url) {
        setError("อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      try {
        const res = await homeFinanceFetch(`/api/home-finance/vehicles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: url }),
        });
        const pr = await readHomeFinanceJsonResponse(res);
        if (!pr.ok) {
          const err = typeof pr.data.error === "string" ? pr.data.error.trim() : "";
          setError(err || metaEndpointFailureLine("บันทึกรูปยานพาหนะ", res, pr.data));
          return;
        }
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      await loadMeta();
    } finally {
      setCoverPhotoUploadingVehicleId(null);
    }
  }

  async function addVehicle() {
    if (!vehicleForm.label.trim()) return;
    if (attachmentUploadProgress) return;
    if (vehicleAddAttachmentPending.length > 0) {
      setError("รอให้อัปโหลดเอกสารให้เสร็จก่อน แล้วค่อยบันทึก");
      return;
    }
    setError(null);
    setVehicleFormSaving(true);
    const body = {
      vehicleType: vehicleForm.vehicleType,
      label: vehicleForm.label.trim(),
      plateNumber: vehicleForm.plateNumber.trim() || null,
      taxDueDate: vehicleForm.taxDueDate.trim() || null,
      serviceDueDate: vehicleForm.serviceDueDate.trim() || null,
      insuranceDueDate: vehicleForm.insuranceDueDate.trim() || null,
      attachmentUrls: vehicleAddAttachmentUrls,
    };
    try {
      let res: Response;
      try {
        res = await homeFinanceFetch("/api/home-finance/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      const parsed = await readHomeFinanceJsonResponse(res);
      if (!parsed.ok) {
        const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
        setError(err || metaEndpointFailureLine("เพิ่มยานพาหนะ", res, parsed.data));
        return;
      }
      const created = vehicleFromHomeFinanceApiItem(parsed.data.item);
      if (created) setVehicles((prev) => [created, ...prev]);
      closeVehicleAddModal();
      await loadMeta();
    } finally {
      setVehicleFormSaving(false);
    }
  }

  function openVehicleAddModal() {
    setError(null);
    setVehicleAddAttachmentUrls([]);
    setVehicleForm({
      vehicleType: "CAR",
      label: "",
      plateNumber: "",
      taxDueDate: "",
      serviceDueDate: "",
      insuranceDueDate: "",
    });
    setVehicleAddModalOpen(true);
  }

  function closeVehicleAddModal() {
    setVehicleAddModalOpen(false);
    setVehicleAddAttachmentUrls([]);
    setVehicleForm({
      vehicleType: "CAR",
      label: "",
      plateNumber: "",
      taxDueDate: "",
      serviceDueDate: "",
      insuranceDueDate: "",
    });
    setError(null);
  }

  function openVehicleEditModal(item: Vehicle) {
    setError(null);
    setVehicleEditModalId(item.id);
    setVehicleEditAttachmentUrls([...item.attachmentUrls]);
    setVehicleModalForm({
      vehicleType: item.vehicleType,
      label: item.label,
      plateNumber: item.plateNumber ?? "",
      taxDueDate: item.taxDueDate ? item.taxDueDate.slice(0, 10) : "",
      serviceDueDate: item.serviceDueDate ? item.serviceDueDate.slice(0, 10) : "",
      insuranceDueDate: item.insuranceDueDate ? item.insuranceDueDate.slice(0, 10) : "",
    });
  }

  function closeVehicleEditModal() {
    setError(null);
    setVehicleEditModalId(null);
    setVehicleEditAttachmentUrls([]);
    setVehicleModalForm({
      vehicleType: "CAR",
      label: "",
      plateNumber: "",
      taxDueDate: "",
      serviceDueDate: "",
      insuranceDueDate: "",
    });
  }

  async function saveVehicleEdit() {
    if (vehicleEditModalId == null) return;
    if (!vehicleModalForm.label.trim()) return;
    if (attachmentUploadProgress) return;
    if (vehicleEditAttachmentPending.length > 0) {
      setError("รอให้อัปโหลดเอกสารให้เสร็จก่อน แล้วค่อยบันทึก");
      return;
    }
    setError(null);
    setVehicleFormSaving(true);
    const body = {
      vehicleType: vehicleModalForm.vehicleType,
      label: vehicleModalForm.label.trim(),
      plateNumber: vehicleModalForm.plateNumber.trim() || null,
      taxDueDate: vehicleModalForm.taxDueDate.trim() || null,
      serviceDueDate: vehicleModalForm.serviceDueDate.trim() || null,
      insuranceDueDate: vehicleModalForm.insuranceDueDate.trim() || null,
      attachmentUrls: vehicleEditAttachmentUrls,
    };
    try {
      let res: Response;
      try {
        res = await homeFinanceFetch(`/api/home-finance/vehicles/${vehicleEditModalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        setError(fetchErrorMessage(e));
        return;
      }
      const parsed = await readHomeFinanceJsonResponse(res);
      if (!parsed.ok) {
        const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
        setError(err || metaEndpointFailureLine("แก้ไขยานพาหนะ", res, parsed.data));
        return;
      }
      const savedId = vehicleEditModalId;
      const item = parsed.data.item;
      if (savedId != null && item != null) {
        setVehicles((prev) => prev.map((x) => (x.id === savedId ? mergeVehicleWithHomeFinanceApiItem(x, item) : x)));
      }
      setError(null);
      closeVehicleEditModal();
      await loadMeta();
    } finally {
      setVehicleFormSaving(false);
    }
  }

  async function toggleVehicleActive(id: number, isActive: boolean) {
    setError(null);
    let res: Response;
    try {
      res = await homeFinanceFetch(`/api/home-finance/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const parsed = await readHomeFinanceJsonResponse(res);
    if (!parsed.ok) {
      const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
      setError(err || metaEndpointFailureLine("อัปเดตสถานะยานพาหนะ", res, parsed.data));
      return;
    }
    await loadMeta();
  }

  async function removeVehicle(id: number) {
    if (!confirm("ลบรายการรถนี้?")) return;
    setError(null);
    let res: Response;
    try {
      res = await homeFinanceFetch(`/api/home-finance/vehicles/${id}`, { method: "DELETE" });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const parsed = await readHomeFinanceJsonResponse(res);
    if (!parsed.ok) {
      const err = typeof parsed.data.error === "string" ? parsed.data.error.trim() : "";
      setError(err || metaEndpointFailureLine("ลบยานพาหนะ", res, parsed.data));
      return;
    }
    await loadMeta();
  }

  function openReminderAddModal() {
    setError(null);
    setReminderForm({ title: "", dueDate: todayKey(), note: "" });
    setReminderAddModalOpen(true);
  }

  function closeReminderAddModal() {
    setReminderAddModalOpen(false);
    setReminderForm({ title: "", dueDate: todayKey(), note: "" });
    setError(null);
  }

  async function addReminder() {
    if (!reminderForm.title.trim() || !reminderForm.dueDate) return;
    setError(null);
    let res: Response;
    try {
      res = await fetch("/api/home-finance/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reminderForm.title.trim(),
          dueDate: reminderForm.dueDate,
          note: reminderForm.note.trim() || null,
        }),
      });
    } catch (e) {
      setError(fetchErrorMessage(e));
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      const msg = typeof j.error === "string" && j.error.trim() ? j.error.trim() : "";
      setError(msg || `เพิ่มแจ้งเตือนไม่สำเร็จ (รหัส ${res.status})`);
      return;
    }
    closeReminderAddModal();
    await loadMeta();
  }

  async function toggleReminderDone(id: number, isDone: boolean) {
    await fetch(`/api/home-finance/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !isDone }),
    });
    await loadMeta();
  }

  async function removeReminder(id: number) {
    if (!confirm("ลบรายการแจ้งเตือนนี้?")) return;
    await fetch(`/api/home-finance/reminders/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  const thb = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const today = todayKey();

  hfAttachEntryUrlCountRef.current = editForm.attachmentUrls.length;
  hfAttachEntryPendingCountRef.current = editEntryAttachmentPending.length;
  hfAttachVehicleAddUrlCountRef.current = vehicleAddAttachmentUrls.length;
  hfAttachVehicleAddPendingCountRef.current = vehicleAddAttachmentPending.length;
  hfAttachVehicleEditUrlCountRef.current = vehicleEditAttachmentUrls.length;
  hfAttachVehicleEditPendingCountRef.current = vehicleEditAttachmentPending.length;

  /** แสดงตัวอย่าง blob ในฟอร์มทันที แล้วอัปโหลดทีละไฟล์ */
  async function appendFilesToList(
    files: FileList | File[],
    setList: Dispatch<SetStateAction<string[]>>,
    setPending: Dispatch<SetStateAction<HomeFinancePendingUpload[]>>,
    getUrlCount: () => number,
    getPendingCount: () => number,
    epochRef: MutableRefObject<number>,
  ) {
    const epochAtStart = epochRef.current;
    const isStale = () => epochRef.current !== epochAtStart;

    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    const urlCount = getUrlCount();
    const pendingCount = getPendingCount();
    const room = Math.max(0, MAX_HOME_FINANCE_ATTACHMENTS - urlCount - pendingCount);
    if (room === 0) {
      setError(`แนบได้สูงสุด ${MAX_HOME_FINANCE_ATTACHMENTS} ไฟล์`);
      return;
    }
    const batch = fileArr.slice(0, room);
    if (fileArr.length > room) {
      setError(
        `แนบได้สูงสุด ${MAX_HOME_FINANCE_ATTACHMENTS} ไฟล์ — จะอัปโหลด ${batch.length} ไฟล์แรกจากที่เลือก (${fileArr.length} ไฟล์)`,
      );
    } else {
      setError(null);
    }

    const rows = batch.map((f) => newHomeFinancePendingRow(f));
    if (isStale()) {
      revokeHomeFinancePendingObjectUrls(rows);
      return;
    }
    setPending((prev) => [...prev, ...rows]);

    setAttachmentUploadProgress({ current: 0, total: batch.length });
    try {
      for (let i = 0; i < batch.length; i++) {
        const row = rows[i];
        const file = batch[i];
        setAttachmentUploadProgress({ current: i + 1, total: batch.length });
        try {
          const url = await uploadHomeFinanceFile(file);
          if (isStale()) {
            URL.revokeObjectURL(row.objectUrl);
            setPending((p) => p.filter((x) => x.id !== row.id));
            break;
          }
          if (!url) {
            setError("อัปโหลดไม่สำเร็จ — ตรวจสอบชนิดไฟล์ (JPG/PNG/WebP/GIF/PDF) และขนาด");
            URL.revokeObjectURL(row.objectUrl);
            setPending((p) => p.filter((x) => x.id !== row.id));
            break;
          }
          URL.revokeObjectURL(row.objectUrl);
          setPending((p) => p.filter((x) => x.id !== row.id));
          setList((prev) => {
            if (prev.length >= MAX_HOME_FINANCE_ATTACHMENTS) return prev;
            return [...prev, url];
          });
        } catch (err) {
          URL.revokeObjectURL(row.objectUrl);
          setPending((p) => p.filter((x) => x.id !== row.id));
          setError(
            err instanceof Error && err.message === HOME_FINANCE_UPLOAD_TIMEOUT
              ? "อัปโหลดหมดเวลา — ลองไฟล์เล็กลงหรือเน็ตที่เร็วขึ้น"
              : "อัปโหลดไม่สำเร็จ",
          );
          break;
        }
      }
    } finally {
      setAttachmentUploadProgress(null);
    }
  }

  function openFinanceAttachmentUrl(url: string) {
    if (isHomeFinancePdfUrl(url)) window.open(encodeHomeFinancePublicAssetHref(url), "_blank", "noopener,noreferrer");
    else imageLightbox.open(encodeHomeFinancePublicAssetHref(url));
  }

  const openLocalFinancePreview = useCallback((objectUrl: string, isPdf: boolean) => {
    if (isPdf) window.open(objectUrl, "_blank", "noopener,noreferrer");
    else imageLightbox.open(objectUrl);
  }, [imageLightbox]);
  const dueAlerts = useMemo(() => {
    const items: Array<{ kind: string; title: string; dueDate: string; note?: string | null }> = [];
    for (const u of utilities) {
      if (u.isActive && u.dueDate) items.push({ kind: u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ", title: u.label, dueDate: u.dueDate.slice(0, 10) });
    }
    for (const v of vehicles) {
      if (!v.isActive) continue;
      if (v.taxDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (ต่อภาษี)`, dueDate: v.taxDueDate.slice(0, 10) });
      if (v.serviceDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (เข้าศูนย์)`, dueDate: v.serviceDueDate.slice(0, 10) });
      if (v.insuranceDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (ประกันภัย)`, dueDate: v.insuranceDueDate.slice(0, 10) });
    }
    for (const r of reminders) {
      if (!r.isDone) items.push({ kind: "อื่นๆ", title: r.title, dueDate: r.dueDate.slice(0, 10), note: r.note });
    }
    return items
      .map((x) => ({ ...x, diff: Math.ceil((new Date(`${x.dueDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000)) }))
      .filter((x) => x.diff <= 7)
      .sort((a, b) => a.diff - b.diff);
  }, [utilities, vehicles, reminders, today]);

  const showFinanceMain = section === "history" || section === "dashboard";
  const dashboardFrom = monthStartKey();
  const dashboardTo = todayKey();

  const dashboardRecentEntries = useMemo(() => {
    if (section !== "dashboard") return [];
    return [...entries]
      .sort((a, b) => {
        if (a.entryDate !== b.entryDate) return a.entryDate < b.entryDate ? 1 : -1;
        return b.id - a.id;
      })
      .slice(0, 15);
  }, [entries, section]);

  const filterMatchesThisMonth = from === monthStartKey() && to === todayKey();
  const filterMatchesThisYear = from === yearStartKeyBangkok() && to === todayKey();
  const filterMatches7d = from === addDaysYmd(todayKey(), -6) && to === todayKey();
  const filterMatches30d = from === addDaysYmd(todayKey(), -29) && to === todayKey();
  const filterMatchesQuarter = from === addDaysYmd(todayKey(), -89) && to === todayKey();

  const monthEntries = useMemo(() => {
    const mk = monthStartKey().slice(0, 7);
    return entries.filter((e) => e.entryDate.startsWith(mk));
  }, [entries]);

  const insightChips = useMemo(() => {
    const chips: string[] = [];
    const spend = monthEntries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
    const prevSpend =
      previousPeriodBalance == null ? null : Math.max(0, summary.income - previousPeriodBalance);
    if (prevSpend != null && prevSpend > 0) {
      const pct = ((spend - prevSpend) / prevSpend) * 100;
      chips.push(`เดือนนี้รายจ่าย${pct >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(pct).toFixed(1)}% เทียบช่วงก่อน`);
    }
    const fuel = monthEntries
      .filter((e) => e.type === "EXPENSE" && (e.categoryLabel.includes("น้ำมัน") || e.title.includes("น้ำมัน")))
      .sort((a, b) => b.amount - a.amount)[0];
    if (fuel) chips.push(`ค่าน้ำมันสูงสุด: ${fuel.title} (${formatMoneyCompact(thb, fuel.amount)})`);
    const salaryDays = monthEntries
      .filter((e) => e.type === "INCOME" && e.categoryLabel.includes("เงินเดือน"))
      .map((e) => e.entryDate.slice(8, 10));
    if (salaryDays.length > 0 && salaryDays.every((d) => d === "01")) {
      chips.push("รายรับเงินเดือนเข้าวันที่ 1 สม่ำเสมอ");
    }
    return chips.slice(0, 3);
  }, [monthEntries, previousPeriodBalance, summary.income, thb]);

  const suggestedEntries = useMemo(() => {
    const mk = monthStartKey().slice(0, 7);
    const top = entries
      .filter((e) => e.entryDate.startsWith(mk))
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .slice(0, 6);
    const uniq = new Map<string, Entry>();
    for (const e of top) {
      const k = `${e.type}|${e.categoryKey}|${e.title}|${e.amount}`;
      if (!uniq.has(k)) uniq.set(k, e);
    }
    return Array.from(uniq.values());
  }, [entries]);

  const monthlyBudgetRows = useMemo(() => {
    return budgets.map(({ label, amount }) => {
      const stripped = label.replace(/^ค่า/, "").trim();
      const used = monthEntries
        .filter(
          (e) =>
            e.type === "EXPENSE" &&
            (e.categoryLabel === label ||
              (stripped.length > 0 && e.categoryLabel.includes(stripped))),
        )
        .reduce((s, e) => s + e.amount, 0);
      const pct = amount > 0 ? (used / amount) * 100 : 0;
      return { label, budget: amount, used, pct };
    });
  }, [budgets, monthEntries]);

  const openBudgetEditor = useCallback(() => {
    setBudgetDraft(budgets.length > 0 ? budgets.map((b) => ({ ...b })) : DEFAULT_HOME_FINANCE_BUDGETS.map((b) => ({ ...b })));
    setBudgetEditOpen(true);
  }, [budgets]);

  const saveBudgetDraft = useCallback(() => {
    const cleaned = budgetDraft
      .map((b) => ({ label: b.label.trim(), amount: Number.isFinite(b.amount) ? Math.max(0, b.amount) : 0 }))
      .filter((b) => b.label.length > 0);
    setBudgets(cleaned);
    saveHomeFinanceBudgets(cleaned);
    setBudgetEditOpen(false);
  }, [budgetDraft]);

  return (
    <div className="space-y-6">
      {saveNotice ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm"
        >
          {saveNotice}
        </div>
      ) : null}
      {(metaError || error) &&
      !entryModalOpen &&
      !editingEntry &&
      utilityEditModalId == null &&
      !utilityAddModalOpen &&
      vehicleEditModalId == null &&
      !vehicleAddModalOpen &&
      !categoryAddModalOpen &&
      !reminderAddModalOpen ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
        >
          {metaError ? (
            <div className={error ? "border-b border-amber-200/80 pb-3" : ""}>
              <p className="font-semibold">หมวด / บิล / รถ / แจ้งเตือน โหลดไม่ครบ</p>
              <p className="mt-1">{metaError}</p>
              {showFinanceMain ? (
                <p className="mt-2 text-xs text-amber-900/85">
                  รายการรายรับ–รายจ่ายอาจยังแสดงได้ — ลองรีเฟรชหน้า ล็อกอินใหม่ หรือตรวจว่าใช้บัญชีเจ้าของและเปิดโมดูลแล้ว
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void loadMeta()}
                className="mt-2 text-xs font-semibold text-[#0000BF] hover:underline"
              >
                ลองโหลดข้อมูลเสริมอีกครั้ง
              </button>
            </div>
          ) : null}
          {error ? (
            <div className={metaError ? "pt-3" : ""}>
              <p className="font-semibold">
                {showFinanceMain ? "รายการรายรับ–รายจ่าย" : "บันทึกหรือโหลดข้อมูล"}
              </p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {showFinanceMain ? (
        <>
          {section === "dashboard" ? (
            <>
              <HomeFinanceHeroCta
                hint="เพิ่มรายการ · ประวัติเต็มที่เมนู «ประวัติ»"
                buttonLabel="+ เพิ่มรายการ"
                onAddClick={() => {
                  setError(null);
                  setEntrySlipImageUrl(null);
                  setLinkedUtilityId("");
                  setLinkedVehicleId("");
                  setEntryModalOpen(true);
                }}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <div className="col-span-2 sm:col-span-2">
                  <Stat
                    title="รายการวันนี้"
                    value={String(summary.count)}
                    icon={<IconUsers className="h-4 w-4" />}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Stat
                    title="รายรับ"
                    value={formatMoneyCompact(thb, summary.income)}
                    tone="green"
                    icon={<IconRevenue className="h-4 w-4" />}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Stat
                    title="รายจ่าย"
                    value={formatMoneyCompact(thb, summary.expense)}
                    tone="red"
                    icon={<IconExpense className="h-4 w-4" />}
                  />
                </div>
                <div className="col-span-2 sm:col-span-6">
                  <Stat
                    title="คงเหลือสุทธิ"
                    value={formatMoneyCompact(thb, summary.balance)}
                    tone={summary.balance >= 0 ? "blue" : "red"}
                    icon={<IconPackage className="h-4 w-4" />}
                  />
                </div>
              </div>
              {insightChips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {insightChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/75 bg-white/75 px-3 py-1 text-[11px] font-medium text-[#4f4a7a] shadow-sm"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
              <section className="rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66638c]">งบเดือนนี้</p>
                  <button
                    type="button"
                    onClick={openBudgetEditor}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#d8d6ec] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#4d47b6] shadow-sm transition hover:border-[#4d47b6]/40 hover:bg-[#ecebff]"
                    aria-label="ปรับงบเดือน"
                    title="ปรับงบเดือน"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 20h9" strokeLinecap="round" />
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <span>ปรับงบ</span>
                  </button>
                </div>
                {monthlyBudgetRows.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/60 p-3 text-center text-xs text-slate-500">
                    ยังไม่มีงบรายการ — กด «ปรับงบ» เพื่อเพิ่มหมวด
                  </p>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {monthlyBudgetRows.map((row) => (
                      <div key={row.label} className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5">
                        <p className="text-[11px] font-medium text-slate-600">{row.label}</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatMoneyCompact(thb, row.used)} / {formatMoneyCompact(thb, row.budget)}
                        </p>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              row.pct >= 100 ? "bg-rose-500" : row.pct >= 80 ? "bg-amber-500" : "bg-emerald-500",
                            )}
                            style={{ width: `${Math.min(100, Math.max(6, row.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <HomeFinanceAnalyticsSection
                entries={entries}
                from={dashboardFrom}
                to={dashboardTo}
                loading={loading}
                thb={thb}
                context="dashboard"
                previousBalance={previousPeriodBalance}
                onAddFirstEntry={() => setEntryModalOpen(true)}
              />
              {!loading ? (
                <HomeFinanceRecentSummary entries={dashboardRecentEntries} thb={thb} />
              ) : null}
            </>
          ) : (
            <>
              <HomeFinanceHeroCta
                hint="เพิ่ม/แก้ไข · สลิปและเชื่อมบิล/รถในตาราง"
                buttonLabel="+ เพิ่มรายการ"
                onAddClick={() => {
                  setError(null);
                  setEntrySlipImageUrl(null);
                  setLinkedUtilityId("");
                  setLinkedVehicleId("");
                  setEntryModalOpen(true);
                }}
              />
              <div className="flex items-center justify-end sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen((prev) => !prev)}
                  className="app-btn-soft inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#d8d6ec] px-3 py-2.5 text-[#4d47b6]"
                  aria-label={mobileFilterOpen ? "ซ่อนตัวกรองประวัติ" : "แสดงตัวกรองประวัติ"}
                  title={mobileFilterOpen ? "ซ่อนตัวกรองประวัติ" : "แสดงตัวกรองประวัติ"}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <QuickChip active={filterMatches7d} onClick={() => applyQuickRange("7d")}>7 วัน</QuickChip>
                <QuickChip active={filterMatches30d} onClick={() => applyQuickRange("30d")}>30 วัน</QuickChip>
                <QuickChip active={filterMatchesQuarter} onClick={() => applyQuickRange("quarter")}>ไตรมาส</QuickChip>
                <QuickChip active={filterMatchesThisYear} onClick={() => applyQuickRange("year")}>ปีนี้</QuickChip>
                <QuickChip active={!filterMatches7d && !filterMatches30d && !filterMatchesQuarter && !filterMatchesThisYear && !filterMatchesThisMonth} onClick={() => applyQuickRange("custom")}>กำหนดเอง</QuickChip>
              </div>
              <HomeFinanceFilterCard className={mobileFilterOpen ? "block" : "hidden sm:block"}>
                <HomeFinancePanelHeading
                  title="กรองช่วงและรายการ"
                  description="กราฟ/ตารางตามช่วงและตัวกรอง — ไม่เห็นรายการใหม่ ลอง «เดือนนี้» หรือขยายช่วง"
                  aside={
                    <>
                      <span className="text-[11px] font-medium text-slate-500">ด่วน:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFrom(monthStartKey());
                          setTo(todayKey());
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                          filterMatchesThisMonth
                            ? "border-[#4d47b6]/40 bg-[#ecebff] text-[#4d47b6]"
                            : "border-[#0000BF]/25 bg-[#0000BF]/[0.06] text-[#0000BF] hover:bg-[#0000BF]/10",
                        )}
                        suppressHydrationWarning
                      >
                        เดือนนี้
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFrom(yearStartKeyBangkok());
                          setTo(todayKey());
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                          filterMatchesThisYear
                            ? "border-[#4d47b6]/40 bg-[#ecebff] text-[#4d47b6]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                        )}
                        suppressHydrationWarning
                      >
                        ปีนี้
                      </button>
                    </>
                  }
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="block text-xs font-medium text-slate-600">
                    ตั้งแต่วันที่
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClz} mt-1`} suppressHydrationWarning />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    ถึงวันที่
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClz} mt-1`} suppressHydrationWarning />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    ประเภท
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputClz} mt-1`} suppressHydrationWarning>
                      <option value="">ทุกประเภท</option>
                      <option value="INCOME">รายรับ</option>
                      <option value="EXPENSE">รายจ่าย</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    หมวด
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClz} mt-1`} suppressHydrationWarning>
                      <option value="">ทุกหมวด</option>
                      {categoryOptions.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    ค้นหา (พิมพ์)
                    <input
                      ref={filterSearchInputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className={`${inputClz} mt-1`}
                      placeholder="ชื่อรายการ / หมวด / เลขบิล / หมายเหตุ"
                      suppressHydrationWarning
                    />
                  </label>
                </div>
              </HomeFinanceFilterCard>
              <div className="sticky top-2 z-20 rounded-2xl border border-white/75 bg-white/80 p-2 shadow-[0_12px_30px_-20px_rgba(38,28,112,0.55)] backdrop-blur-xl sm:hidden">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">รับ</p>
                    <p className="text-sm font-bold text-emerald-700">{formatMoneyCompact(thb, summary.income)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">จ่าย</p>
                    <p className="text-sm font-bold text-rose-700">{formatMoneyCompact(thb, summary.expense)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">คงเหลือ</p>
                    <p className="text-sm font-bold text-[#2f2b58]">{formatMoneyCompact(thb, summary.balance)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat title="รายการ" value={String(summary.count)} />
                <Stat title="รายรับ" value={formatMoneyCompact(thb, summary.income)} tone="green" />
                <Stat title="รายจ่าย" value={formatMoneyCompact(thb, summary.expense)} tone="red" />
                <Stat title="คงเหลือ" value={formatMoneyCompact(thb, summary.balance)} tone={summary.balance >= 0 ? "blue" : "red"} />
              </div>

              <HomeFinanceAnalyticsSection
                entries={entries}
                from={from}
                to={to}
                loading={loading}
                thb={thb}
                context="history"
                previousBalance={null}
                onAddFirstEntry={() => setEntryModalOpen(true)}
              />
            </>
          )}

          {section === "history" ? (
            <div className={hfHistoryListShellClass}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDensityMode("compact")}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                      densityMode === "compact" ? "border-[#4d47b6]/40 bg-[#ecebff] text-[#4d47b6]" : "border-slate-200 bg-white text-slate-700",
                    )}
                  >
                    กระชับ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensityMode("comfortable")}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                      densityMode === "comfortable" ? "border-[#4d47b6]/40 bg-[#ecebff] text-[#4d47b6]" : "border-slate-200 bg-white text-slate-700",
                    )}
                  >
                    สบายตา
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const rows = entries.map((e) => `${e.entryDate},${e.type},${e.categoryLabel},${e.title},${e.amount}`).join("\n");
                      const csv = `date,type,category,title,amount\n${rows}`;
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `home-finance-${from}-to-${to}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    ส่งออก CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const html = `<!doctype html><html><head><meta charset="utf-8"><title>รายรับรายจ่าย</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f4f4ff}</style></head><body><h2>รายรับรายจ่าย ${from} - ${to}</h2><table><thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวด</th><th>รายการ</th><th>จำนวน</th></tr></thead><tbody>${entries.map((e)=>`<tr><td>${e.entryDate}</td><td>${e.type==="INCOME"?"รายรับ":"รายจ่าย"}</td><td>${e.categoryLabel}</td><td>${e.title}</td><td style="text-align:right">${thb(e.amount)}</td></tr>`).join("")}</tbody></table></body></html>`;
                      openPrintableHtml(html);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    พิมพ์/ส่งออก PDF
                  </button>
                </div>
              </div>
              {selectedHistoryIds.length > 0 ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#4d47b6]/20 bg-[#f5f4ff] p-2.5">
                  <span className="text-xs font-semibold text-[#4d47b6]">เลือกแล้ว {selectedHistoryIds.length} รายการ</span>
                  <button
                    type="button"
                    onClick={() => void removeEntriesBulk(selectedHistoryIds)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    ลบที่เลือก
                  </button>
                </div>
              ) : null}
              {loading ? (
                <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p>
              ) : entries.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">ยังไม่มีรายการในช่วงที่เลือก</p>
              ) : (
                <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5">
                  <ul className="grid grid-cols-1 gap-2" aria-label="รายการในช่วงที่เลือก">
                    {entries.map((e) => (
                      <li key={e.id}>
                        <HomeFinanceEntryHistoryCard
                          entry={e}
                          thb={thb}
                          densityMode={densityMode}
                          selected={selectedHistoryIds.includes(e.id)}
                          onToggleSelected={() =>
                            setSelectedHistoryIds((prev) =>
                              prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id],
                            )
                          }
                          onOpenImage={(url) => openFinanceAttachmentUrl(url)}
                          onEdit={() => openEdit(e)}
                          onDelete={() => void removeEntry(e.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {entryModalOpen ? (
        <HomeFinanceModalBackdrop
          onBackdropClick={() => {
            setError(null);
            setEntryModalOpen(false);
          }}
        >
          <HomeFinanceModalPanel
            title="เพิ่มรายการใหม่"
            titleId="hf-entry-add-title"
            onClose={() => {
              setError(null);
              setEntryModalOpen(false);
            }}
            error={error}
            maxWidthClassName="max-w-4xl"
          >
            <form noValidate onSubmit={onSubmit} className="space-y-4">
                <FormGroup title="ข้อมูลหลัก">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="วันที่รายการ"><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClz} /></Field>
                    <Field label="ประเภท">
                      <select value={type} onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")} className={inputClz}>
                        <option value="EXPENSE">รายจ่าย</option><option value="INCOME">รายรับ</option>
                      </select>
                    </Field>
                    <Field label="หมวด">
                      <select
                        value={categoryKey}
                        onChange={(e) => {
                          const k = e.target.value;
                          setCategoryKey(k);
                          if (isStandaloneVehicleCategoryKey(k)) setVehicleType("");
                        }}
                        className={inputClz}
                      >
                        {categoryOptions.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <AmountField label="จำนวนเงิน" value={amount} onChange={setAmount} />
                  </div>
                </FormGroup>
                <FormGroup title="รายละเอียดรายการ">
                  <Field label="ชื่อรายการ">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClz}
                      placeholder={
                        isStandaloneVehicleCategoryKey(categoryKey)
                          ? "เช่น ค่าน้ำมัน / ค่าประกัน / ค่าจอดรถ"
                          : "เช่น ค่าไฟฟ้าเดือนนี้ / ค่าเข้าศูนย์รถ"
                      }
                      required
                    />
                  </Field>
                  {suggestedEntries.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6792]">แนะนำจากเดือนนี้</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {suggestedEntries.map((s) => (
                          <button
                            key={`${s.id}-${s.title}`}
                            type="button"
                            className="rounded-full border border-[#d8d6ec] bg-white/80 px-3 py-1 text-xs font-medium text-[#4d47b6]"
                            onClick={() => {
                              setType(s.type);
                              setCategoryKey(s.categoryKey);
                              setTitle(s.title);
                              setAmount(String(s.amount));
                            }}
                          >
                            {s.title} · {formatMoneyCompact(thb, s.amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {showVehicleTypeField ? (
                      <Field label="ประเภทรถ">
                        <input
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className={inputClz}
                          placeholder="รถยนต์/มอเตอร์ไซค์"
                        />
                      </Field>
                    ) : null}
                  </div>
                  {showVehicleFields ? <Field label="ศูนย์บริการ/อู่"><input value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} className={inputClz} /></Field> : null}
                </FormGroup>
                <FormGroup title="การเชื่อมโยงและเอกสาร">
                  {isUtilityCategoryKey(categoryKey) ? (
                    <Field label="เชื่อมบิลค่าไฟ/ค่าน้ำ">
                      <select
                        value={linkedUtilityId === "" ? "" : String(linkedUtilityId)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const id = raw === "" ? "" : Number(raw);
                          setLinkedUtilityId(id);
                          if (id === "") return;
                          const u = utilitiesForCategory.find((x) => x.id === id);
                          if (u) setTitle(entryAutoTitleFromUtility(u));
                        }}
                        className={inputClz}
                      >
                        <option value="">— ไม่ระบุ —</option>
                        {utilitiesForCategory.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label} ({u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  {isVehicleCategoryKey(categoryKey) ? (
                    <Field label="เชื่อมยานพาหนะ">
                      <select
                        value={linkedVehicleId === "" ? "" : String(linkedVehicleId)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const id = raw === "" ? "" : Number(raw);
                          setLinkedVehicleId(id);
                          if (id === "") return;
                          const v = vehiclesForCategory.find((x) => x.id === id);
                          if (v && !isStandaloneVehicleCategoryKey(categoryKey)) {
                            setTitle(entryAutoTitleFromVehicle(v));
                          }
                        }}
                        className={inputClz}
                      >
                        <option value="">— ไม่ระบุ —</option>
                        {vehiclesForCategory.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                            {v.plateNumber ? ` · ${v.plateNumber}` : ""} (
                            {v.vehicleType === "CAR" ? "รถยนต์" : "จยย."})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  <Field label="สลิป / รูปแนบ (ได้ 1 รูป)">
                    <div className="flex flex-wrap items-center gap-3">
                      {entrySlipImageUrl ? (
                        <>
                          <AppImageThumb
                            src={encodeHomeFinancePublicAssetHref(entrySlipImageUrl)}
                            onOpen={() => imageLightbox.open(encodeHomeFinancePublicAssetHref(entrySlipImageUrl))}
                          />
                          <HomeFinanceSecondaryButton type="button" onClick={() => setEntrySlipImageUrl(null)}>
                            ลบรูป
                          </HomeFinanceSecondaryButton>
                        </>
                      ) : null}
                      <HomeFinanceUploadTrigger
                        busy={entrySlipUploading}
                        disabled={saving || entrySlipAiSaving}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onFile={(f) => void uploadEntrySlipFile(f)}
                      >
                        {entrySlipImageUrl ? "เปลี่ยนรูป" : "เลือกรูป"}
                      </HomeFinanceUploadTrigger>
                    </div>
                  </Field>
                  <Field label="หมายเหตุ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClz} /></Field>
                </FormGroup>
                  <HomeFinanceModalActionBar>
                    <HomeFinanceSecondaryButton type="button" onClick={() => setEntryModalOpen(false)}>
                      ยกเลิก
                    </HomeFinanceSecondaryButton>
                    <HomeFinancePrimaryButton
                      type="submit"
                      disabled={saving || entrySlipUploading || entrySlipAiSaving}
                      className="disabled:opacity-60"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
                    </HomeFinancePrimaryButton>
                  </HomeFinanceModalActionBar>
                </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
          ) : null}

          {editingEntry ? (
        <HomeFinanceModalBackdrop
          onBackdropClick={() => {
            setError(null);
            setEditingEntry(null);
          }}
        >
          <HomeFinanceModalPanel
            title="แก้ไขรายการ"
            titleId="hf-entry-edit-title"
            onClose={() => {
              setError(null);
              setEditingEntry(null);
            }}
            error={error}
            maxWidthClassName="max-w-3xl"
          >
                <form noValidate onSubmit={onSubmitEdit} className="space-y-4">
                  <FormGroup title="ข้อมูลหลัก">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="วันที่รายการ"><input type="date" value={editForm.entryDate} onChange={(e) => setEditForm((s) => ({ ...s, entryDate: e.target.value }))} className={inputClz} /></Field>
                    <Field label="ประเภท">
                      <select value={editForm.type} onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value as "INCOME" | "EXPENSE" }))} className={inputClz}>
                        <option value="EXPENSE">รายจ่าย</option><option value="INCOME">รายรับ</option>
                      </select>
                    </Field>
                    <Field label="หมวด">
                      <select
                        value={editForm.categoryKey}
                        onChange={(e) =>
                          setEditForm((s) => ({
                            ...s,
                            categoryKey: e.target.value,
                            linkedUtilityId: null,
                            linkedVehicleId: null,
                          }))
                        }
                        className={inputClz}
                      >
                        {categoryOptions.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <AmountField
                      label="จำนวนเงิน"
                      value={editForm.amount}
                      onChange={(value) => setEditForm((s) => ({ ...s, amount: value }))}
                    />
                  </div>
                  </FormGroup>
                  <FormGroup title="รายละเอียดรายการ">
                  <Field label="ชื่อรายการ"><input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} className={inputClz} required /></Field>
                  {isUtilityCategoryKey(editForm.categoryKey) ? (
                    <Field label="เชื่อมบิลค่าไฟ/ค่าน้ำ">
                      <select
                        value={editForm.linkedUtilityId == null ? "" : String(editForm.linkedUtilityId)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const id = raw === "" ? null : Number(raw);
                          const u = id != null ? editUtilitiesForCategory.find((x) => x.id === id) : undefined;
                          setEditForm((s) => ({
                            ...s,
                            linkedUtilityId: id,
                            linkedVehicleId: null,
                            title: u ? entryAutoTitleFromUtility(u) : s.title,
                          }));
                        }}
                        className={inputClz}
                      >
                        <option value="">— ไม่ระบุ —</option>
                        {editUtilitiesForCategory.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label} ({u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  {isVehicleCategoryKey(editForm.categoryKey) ? (
                    <Field label="เชื่อมยานพาหนะ">
                      <select
                        value={editForm.linkedVehicleId == null ? "" : String(editForm.linkedVehicleId)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const id = raw === "" ? null : Number(raw);
                          const v = id != null ? editVehiclesForCategory.find((x) => x.id === id) : undefined;
                          setEditForm((s) => ({
                            ...s,
                            linkedVehicleId: id,
                            linkedUtilityId: null,
                            title:
                              v && !isStandaloneVehicleCategoryKey(editForm.categoryKey)
                                ? entryAutoTitleFromVehicle(v)
                                : s.title,
                          }));
                        }}
                        className={inputClz}
                      >
                        <option value="">— ไม่ระบุ —</option>
                        {editVehiclesForCategory.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                            {v.plateNumber ? ` · ${v.plateNumber}` : ""} (
                            {v.vehicleType === "CAR" ? "รถยนต์" : "จยย."})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  </FormGroup>
                  <FormGroup title="เอกสารและหมายเหตุ">
                  <Field label="แนบเอกสาร / สลิป (หลายไฟล์)">
                    <HomeFinanceFormAttachmentsBlock
                      urls={editForm.attachmentUrls}
                      pendingUploads={editEntryAttachmentPending}
                      onChange={(next) => setEditForm((s) => ({ ...s, attachmentUrls: next }))}
                      inputId={editSlipFileInputId}
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      hint="รูป JPG/PNG/WebP/GIF สูงสุด 3MB ต่อไฟล์ · PDF สูงสุด 5MB · สูงสุด 20 ไฟล์"
                      uploadProgress={attachmentUploadProgress}
                      onUploadFiles={(files) =>
                        appendFilesToList(
                          files,
                          setEditEntryAttachmentUrls,
                          setEditEntryAttachmentPending,
                          () => hfAttachEntryUrlCountRef.current,
                          () => hfAttachEntryPendingCountRef.current,
                          hfAttachEpochEntryRef,
                        )
                      }
                      onOpenUrl={openFinanceAttachmentUrl}
                      onOpenLocalPreview={openLocalFinancePreview}
                    />
                  </Field>
                  <Field label="หมายเหตุ"><textarea value={editForm.note} onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))} rows={2} className={inputClz} /></Field>
                  </FormGroup>
                  <HomeFinanceModalActionBar>
                    <HomeFinanceSecondaryButton type="button" onClick={() => setEditingEntry(null)}>
                      ยกเลิก
                    </HomeFinanceSecondaryButton>
                    <HomeFinancePrimaryButton
                      type="submit"
                      disabled={saving || editEntryAttachmentPending.length > 0 || attachmentUploadProgress != null}
                      className="disabled:opacity-60"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    </HomeFinancePrimaryButton>
                  </HomeFinanceModalActionBar>
                </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
          ) : null}

      <AppImageLightbox src={imageLightbox.src} onClose={imageLightbox.close} />

      {section === "categories" ? (
        <HomeFinancePageSection>
          <HomeFinanceSectionHeader
            title="หมวดกำหนดเอง"
            description="เพิ่มชื่อหมวดเพื่อใช้ในฟอร์มรายรับ–รายจ่าย"
            action={
              <HomeFinanceToolbarButton type="button" onClick={() => openCategoryAddModal()}>
                เพิ่มหมวด
              </HomeFinanceToolbarButton>
            }
          />
          <div>
            <HomeFinanceListHeading>รายการหมวด ({categories.length})</HomeFinanceListHeading>
            {categories.length === 0 ? (
              <HomeFinanceEmptyState>ยังไม่มีหมวด — กด &quot;เพิ่มหมวด&quot;</HomeFinanceEmptyState>
            ) : (
              <HomeFinanceList as="ul" listRole="รายการหมวด">
                {categories.map((c) => (
                  <li key={c.id}>
                    <HomeFinanceEntityRow>
                      <HomeFinanceEntityMain className="flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight",
                            c.isActive
                              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70"
                              : "bg-slate-200 text-slate-600 ring-1 ring-slate-300/60",
                          )}
                        >
                          {c.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </HomeFinanceEntityMain>
                      <HomeFinanceEntityActions>
                        <HomeFinanceRowActionButton
                          variant="primary"
                          onClick={() => void renameCategory(c.id, c.name)}
                        >
                          แก้ไข
                        </HomeFinanceRowActionButton>
                        <HomeFinanceRowActionButton variant="danger" onClick={() => void deleteCategory(c.id)}>
                          ลบ
                        </HomeFinanceRowActionButton>
                      </HomeFinanceEntityActions>
                    </HomeFinanceEntityRow>
                  </li>
                ))}
              </HomeFinanceList>
            )}
          </div>
        </HomeFinancePageSection>
      ) : null}

      {budgetEditOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => setBudgetEditOpen(false)}>
          <HomeFinanceModalPanel
            title="ปรับงบเดือน"
            titleId="hf-budget-edit-title"
            onClose={() => setBudgetEditOpen(false)}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveBudgetDraft();
              }}
            >
              <p className="text-xs text-slate-600">
                ตั้งวงเงินงบรายเดือนของแต่ละหมวด — ระบบจะใช้ <strong>label</strong> เทียบกับชื่อหมวดของรายการในเดือนปัจจุบัน
              </p>
              <div className="space-y-2">
                {budgetDraft.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                    ยังไม่มีงบ — กด «+ เพิ่มงบ» เพื่อเริ่มต้น
                  </p>
                ) : (
                  budgetDraft.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 rounded-xl border border-slate-200/70 bg-white/70 p-2"
                    >
                      <label className="col-span-7 block text-[11px] font-medium text-slate-600">
                        ชื่อหมวด
                        <input
                          value={row.label}
                          onChange={(e) =>
                            setBudgetDraft((d) =>
                              d.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)),
                            )
                          }
                          className={`${inputClz} mt-1`}
                          placeholder="เช่น ค่าไฟฟ้า"
                        />
                      </label>
                      <label className="col-span-4 block text-[11px] font-medium text-slate-600">
                        งบ/เดือน (บาท)
                        <input
                          type="number"
                          inputMode="decimal"
                          step="100"
                          min={0}
                          value={Number.isFinite(row.amount) ? row.amount : 0}
                          onChange={(e) =>
                            setBudgetDraft((d) =>
                              d.map((it, i) =>
                                i === idx
                                  ? { ...it, amount: e.target.value === "" ? 0 : Number(e.target.value) }
                                  : it,
                              ),
                            )
                          }
                          className={`${inputClz} mt-1`}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBudgetDraft((d) => d.filter((_, i) => i !== idx))
                        }
                        aria-label={`ลบงบ ${row.label || "รายการ"}`}
                        className="col-span-1 mt-[18px] inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M3 6h18" strokeLinecap="round" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setBudgetDraft((d) => [...d, { label: "", amount: 0 }])}
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#0000BF]/40 bg-[#0000BF]/[0.04] px-3 py-2 text-xs font-semibold text-[#0000BF] hover:bg-[#0000BF]/[0.08]"
              >
                + เพิ่มงบ
              </button>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" onClick={() => setBudgetEditOpen(false)}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit">บันทึกงบ</HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {categoryAddModalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeCategoryAddModal()}>
          <HomeFinanceModalPanel
            title="เพิ่มหมวดใหม่"
            titleId="category-add-title"
            onClose={() => closeCategoryAddModal()}
            error={error}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void addCategory();
              }}
            >
              <Field label="ชื่อหมวด">
                <input
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className={inputClz}
                  placeholder="เช่น เบ็ดเตล็ด / เงินเดือน"
                  required
                  autoFocus
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" onClick={() => closeCategoryAddModal()}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit">เพิ่มหมวด</HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {section === "utilities" ? (
        <HomeFinancePageSection>
          <HomeFinanceSectionHeader
            title="บิลค่าไฟ / ค่าน้ำ"
            action={<HomeFinanceToolbarButton onClick={() => openUtilityAddModal()}>เพิ่มบิลใหม่</HomeFinanceToolbarButton>}
          />
          <div>
            <HomeFinanceListHeading>รายการบิล ({utilities.length})</HomeFinanceListHeading>
            <HomeFinanceList>
              {utilities.length === 0 ? (
                <HomeFinanceEmptyState>ยังไม่มีบิล — กด &quot;เพิ่มบิลใหม่&quot;</HomeFinanceEmptyState>
              ) : (
                utilities.map((u) => (
                  <HomeFinanceEntityRow key={u.id} className="flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <HomeFinanceEntityMain className="w-full items-start gap-3 sm:gap-4">
                      <HomeFinanceVehicleCoverUpload
                        photoUrl={u.photoUrl}
                        onOpenPhoto={() => u.photoUrl && imageLightbox.open(u.photoUrl)}
                        onFile={(f) => void patchUtilityPhoto(u.id, f)}
                        busy={coverPhotoUploadingUtilityId === u.id}
                        disabled={coverPhotoUploadingUtilityId !== null}
                        idleUploadLabel="อัปโหลดรูปหรือสลิปบิล"
                        busyUploadLabel="กำลังอัปโหลดรูป…"
                      />
                      <div className="min-w-0 w-full flex-1 space-y-1.5">
                        <span className="inline-flex rounded-full bg-[#0000BF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0000BF]">
                          {u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{u.label}</p>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-3">
                          {u.accountNumber ? (
                            <span>
                              <span className="text-slate-400">เลขผู้ใช้</span> {u.accountNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">ไม่มีเลขผู้ใช้</span>
                          )}
                          {u.dueDate ? (
                            <span className="tabular-nums">
                              <span className="text-slate-400">ครบชำระ</span> {u.dueDate.slice(0, 10)}
                            </span>
                          ) : (
                            <span className="text-slate-400">ยังไม่ระบุวันครบชำระ</span>
                          )}
                        </div>
                      </div>
                    </HomeFinanceEntityMain>
                    <HomeFinanceEntityActions className="w-full justify-end border-t border-slate-100 pt-2 sm:w-auto sm:border-0 sm:pt-0">
                      <HomeFinanceRowActionIconButton
                        variant="primary"
                        title="แก้ไข"
                        onClick={() => openUtilityEditModal(u)}
                      >
                        <HomeFinanceRowIconEdit />
                      </HomeFinanceRowActionIconButton>
                      <HomeFinanceRowActionIconButton
                        variant="danger"
                        title="ลบ"
                        onClick={() => void removeUtility(u.id)}
                      >
                        <HomeFinanceRowIconTrash />
                      </HomeFinanceRowActionIconButton>
                    </HomeFinanceEntityActions>
                  </HomeFinanceEntityRow>
                ))
              )}
            </HomeFinanceList>
          </div>
        </HomeFinancePageSection>
      ) : null}

      {utilityAddModalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeUtilityAddModal()}>
          <HomeFinanceModalPanel
            title="เพิ่มบิลใหม่"
            titleId="utility-add-title"
            onClose={() => closeUtilityAddModal()}
            error={error}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void addUtility();
              }}
            >
              <Field label="ประเภทบิล">
                <select
                  value={utilityForm.utilityType}
                  onChange={(e) =>
                    setUtilityForm((s) => ({ ...s, utilityType: e.target.value as "ELECTRIC" | "WATER" }))
                  }
                  className={inputClz}
                >
                  <option value="ELECTRIC">ค่าไฟ</option>
                  <option value="WATER">ค่าน้ำ</option>
                </select>
              </Field>
              <Field label="ชื่อเรียกบิล">
                <input
                  value={utilityForm.label}
                  onChange={(e) => setUtilityForm((s) => ({ ...s, label: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น บ้านหลัก"
                  required
                />
              </Field>
              <Field label="เลขผู้ใช้น้ำ/ไฟ">
                <input
                  value={utilityForm.accountNumber}
                  onChange={(e) => setUtilityForm((s) => ({ ...s, accountNumber: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น 1234567890"
                />
              </Field>
              <Field label="วันครบชำระ">
                <input
                  type="date"
                  value={utilityForm.dueDate}
                  onChange={(e) => setUtilityForm((s) => ({ ...s, dueDate: e.target.value }))}
                  className={inputClz}
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" onClick={() => closeUtilityAddModal()}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit">เพิ่มบิล</HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {utilityEditModalId != null ? (
        <HomeFinanceModalBackdrop
          onBackdropClick={() => {
            setError(null);
            closeUtilityEditModal();
          }}
        >
          <HomeFinanceModalPanel
            title="แก้ไขบิล"
            titleId="utility-edit-title"
            onClose={() => {
              setError(null);
              closeUtilityEditModal();
            }}
            error={error}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void saveUtilityEdit();
              }}
            >
              <Field label="ประเภทบิล">
                <select
                  value={utilityModalForm.utilityType}
                  onChange={(e) =>
                    setUtilityModalForm((s) => ({ ...s, utilityType: e.target.value as "ELECTRIC" | "WATER" }))
                  }
                  className={inputClz}
                >
                  <option value="ELECTRIC">ค่าไฟ</option>
                  <option value="WATER">ค่าน้ำ</option>
                </select>
              </Field>
              <Field label="ชื่อเรียกบิล">
                <input
                  value={utilityModalForm.label}
                  onChange={(e) => setUtilityModalForm((s) => ({ ...s, label: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น บ้านหลัก"
                  required
                />
              </Field>
              <Field label="เลขผู้ใช้น้ำ/ไฟ">
                <input
                  value={utilityModalForm.accountNumber}
                  onChange={(e) => setUtilityModalForm((s) => ({ ...s, accountNumber: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น 1234567890"
                />
              </Field>
              <Field label="วันครบชำระ">
                <input
                  type="date"
                  value={utilityModalForm.dueDate}
                  onChange={(e) => setUtilityModalForm((s) => ({ ...s, dueDate: e.target.value }))}
                  className={inputClz}
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton
                  type="button"
                  onClick={() => {
                    setError(null);
                    closeUtilityEditModal();
                  }}
                >
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit">บันทึก</HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {section === "vehicles" ? (
        <HomeFinancePageSection tight>
          <HomeFinanceSectionHeader
            title="ยานพาหนะ"
            description="แก้ไขรถเพื่อแนบเอกสาร (ทีละไฟล์) · รูปหน้าปกอัปโหลดจากไอคอนกล้องมุมรูปในแต่ละการ์ด"
            action={<HomeFinanceToolbarButton onClick={() => openVehicleAddModal()}>เพิ่มรถใหม่</HomeFinanceToolbarButton>}
          />
          <div className="grid grid-cols-2 gap-3">
            <Stat title="รถยนต์ (ใช้งาน)" value={String(vehicleCounts.cars)} />
            <Stat title="จักรยานยนต์ (ใช้งาน)" value={String(vehicleCounts.motorcycles)} />
          </div>
          <div>
            <HomeFinanceListHeading>รายการรถ ({vehicles.length})</HomeFinanceListHeading>
            <HomeFinanceList>
              {vehicles.length === 0 ? (
                <HomeFinanceEmptyState>ยังไม่มีรถ — กด &quot;เพิ่มรถใหม่&quot;</HomeFinanceEmptyState>
              ) : (
                vehicles.map((v) => (
                  <HomeFinanceEntityRow
                    key={v.id}
                    className="flex-col items-stretch gap-4 rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/70 via-[#f6f5ff]/72 to-[#edf0ff]/70 p-4 shadow-[0_14px_34px_-20px_rgba(30,27,75,0.34)] backdrop-blur-xl ring-1 ring-white/60 sm:flex-row sm:items-center sm:gap-3 sm:rounded-[2.5rem] sm:p-5"
                  >
                    <HomeFinanceEntityMain className="w-full items-start gap-3 sm:gap-4">
                      <HomeFinanceVehicleCoverUpload
                        photoUrl={v.photoUrl}
                        onOpenPhoto={() => v.photoUrl && imageLightbox.open(v.photoUrl)}
                        onFile={(f) => void patchVehiclePhoto(v.id, f)}
                        busy={coverPhotoUploadingVehicleId === v.id}
                        disabled={coverPhotoUploadingVehicleId !== null}
                      />
                      <div className="min-w-0 w-full flex-1 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold leading-tight text-[#1f2240]">
                              {v.vehicleType === "CAR" ? "รถยนต์" : "รถจักรยานยนต์"} · {v.label}
                            </p>
                            {v.plateNumber ? (
                              <p className="text-xs font-medium text-[#66638c]">ทะเบียน · {v.plateNumber}</p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right text-[11px] leading-snug text-[#5f6287]">
                            <p className="font-semibold text-[#2e2a58]">กำหนดการ</p>
                            {v.taxDueDate || v.serviceDueDate || v.insuranceDueDate ? (
                              <div className="mt-1 space-y-1">
                                {v.taxDueDate ? <p>ภาษี {v.taxDueDate.slice(0, 10)}</p> : null}
                                {v.serviceDueDate ? <p>ศูนย์ {v.serviceDueDate.slice(0, 10)}</p> : null}
                                {v.insuranceDueDate ? <p>ประกัน {v.insuranceDueDate.slice(0, 10)}</p> : null}
                              </div>
                            ) : (
                              <p className="mt-1 text-[#8b8fb3]">ยังไม่กำหนด</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5 border-t border-white/70 pt-2">
                          <span className="block text-[10px] font-semibold tracking-wide text-[#66638c]">
                            เอกสารแนบ
                          </span>
                          <HomeFinanceVehicleRowAttachments
                            urls={v.attachmentUrls}
                            onOpenAttachment={openFinanceAttachmentUrl}
                          />
                        </div>
                      </div>
                    </HomeFinanceEntityMain>
                    <HomeFinanceEntityActions className="w-full justify-end border-t border-white/75 pt-2 sm:w-auto sm:border-0 sm:pt-0">
                      <HomeFinanceRowActionIconButton
                        variant="primary"
                        title="แก้ไข"
                        onClick={() => openVehicleEditModal(v)}
                      >
                        <HomeFinanceRowIconEdit />
                      </HomeFinanceRowActionIconButton>
                      <HomeFinanceRowActionIconButton
                        variant="muted"
                        title={v.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        onClick={() => void toggleVehicleActive(v.id, v.isActive)}
                      >
                        {v.isActive ? <HomeFinanceRowIconDeactivate /> : <HomeFinanceRowIconActivate />}
                      </HomeFinanceRowActionIconButton>
                      <HomeFinanceRowActionIconButton
                        variant="danger"
                        title="ลบ"
                        onClick={() => void removeVehicle(v.id)}
                      >
                        <HomeFinanceRowIconTrash />
                      </HomeFinanceRowActionIconButton>
                    </HomeFinanceEntityActions>
                  </HomeFinanceEntityRow>
                ))
              )}
            </HomeFinanceList>
          </div>
        </HomeFinancePageSection>
      ) : null}

      {vehicleAddModalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeVehicleAddModal()}>
          <HomeFinanceModalPanel
            title="เพิ่มรถใหม่"
            titleId="vehicle-add-title"
            onClose={() => closeVehicleAddModal()}
            error={error}
            maxWidthClassName="max-w-3xl"
          >
            <div className="space-y-4">
              <form
                id="hf-vehicle-add-form"
                noValidate
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addVehicle();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="ประเภทยานพาหนะ">
                    <select
                      value={vehicleForm.vehicleType}
                      onChange={(e) =>
                        setVehicleForm((s) => ({ ...s, vehicleType: e.target.value as "CAR" | "MOTORCYCLE" }))
                      }
                      className={inputClz}
                    >
                      <option value="CAR">รถยนต์</option>
                      <option value="MOTORCYCLE">รถจักรยานยนต์</option>
                    </select>
                  </Field>
                  <Field label="ชื่อเรียกรถ">
                    <input
                      value={vehicleForm.label}
                      onChange={(e) => setVehicleForm((s) => ({ ...s, label: e.target.value }))}
                      className={inputClz}
                      placeholder="เช่น คันหลัก"
                      required
                    />
                  </Field>
                  <Field label="ทะเบียนรถ">
                    <input
                      value={vehicleForm.plateNumber}
                      onChange={(e) => setVehicleForm((s) => ({ ...s, plateNumber: e.target.value }))}
                      className={inputClz}
                      placeholder="เช่น กข 1234"
                    />
                  </Field>
                  <Field label="วันครบต่อภาษี">
                    <input
                      type="date"
                      value={vehicleForm.taxDueDate}
                      onChange={(e) => setVehicleForm((s) => ({ ...s, taxDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                  <Field label="วันเข้าศูนย์บริการ">
                    <input
                      type="date"
                      value={vehicleForm.serviceDueDate}
                      onChange={(e) => setVehicleForm((s) => ({ ...s, serviceDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                  <Field label="วันครบประกันภัย">
                    <input
                      type="date"
                      value={vehicleForm.insuranceDueDate}
                      onChange={(e) => setVehicleForm((s) => ({ ...s, insuranceDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                </div>
              </form>
              <Field label="เอกสารแนบ (PDF หรือรูป)">
                <HomeFinanceFormAttachmentsBlock
                  urls={vehicleAddAttachmentUrls}
                  pendingUploads={vehicleAddAttachmentPending}
                  onChange={setVehicleAddAttachmentUrls}
                  inputId={vehicleAddAttachInputId}
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                  hint="PDF สูงสุด 5MB · รูปสูงสุด 3MB ต่อไฟล์ · รวมได้สูงสุด 20 ไฟล์ — แนบทีละ 1 ไฟล์"
                  emptyStateVariant="vehicle"
                  attachUiMode="vehicle-single"
                  uploadProgress={attachmentUploadProgress}
                  onUploadFiles={(files) =>
                    appendFilesToList(
                      files,
                      setVehicleAddAttachmentUrls,
                      setVehicleAddAttachmentPending,
                      () => hfAttachVehicleAddUrlCountRef.current,
                      () => hfAttachVehicleAddPendingCountRef.current,
                      hfAttachEpochVehicleAddRef,
                    )
                  }
                  onOpenUrl={openFinanceAttachmentUrl}
                  onOpenLocalPreview={openLocalFinancePreview}
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton
                  type="button"
                  disabled={
                    vehicleFormSaving ||
                    attachmentUploadProgress != null ||
                    vehicleAddAttachmentPending.length > 0
                  }
                  onClick={() => closeVehicleAddModal()}
                >
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton
                  type="submit"
                  form="hf-vehicle-add-form"
                  disabled={
                    vehicleFormSaving ||
                    attachmentUploadProgress != null ||
                    vehicleAddAttachmentPending.length > 0
                  }
                  className="disabled:opacity-60"
                >
                  {vehicleFormSaving ? "กำลังบันทึก…" : "เพิ่มรถ"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </div>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {vehicleEditModalId != null ? (
        <HomeFinanceModalBackdrop
          onBackdropClick={() => {
            setError(null);
            closeVehicleEditModal();
          }}
        >
          <HomeFinanceModalPanel
            title="แก้ไขรถ"
            titleId="vehicle-edit-title"
            onClose={() => {
              setError(null);
              closeVehicleEditModal();
            }}
            error={error}
            maxWidthClassName="max-w-3xl"
          >
            <div className="space-y-4">
              <form
                id="hf-vehicle-edit-form"
                noValidate
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveVehicleEdit();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="ประเภทยานพาหนะ">
                    <select
                      value={vehicleModalForm.vehicleType}
                      onChange={(e) =>
                        setVehicleModalForm((s) => ({
                          ...s,
                          vehicleType: e.target.value as "CAR" | "MOTORCYCLE",
                        }))
                      }
                      className={inputClz}
                    >
                      <option value="CAR">รถยนต์</option>
                      <option value="MOTORCYCLE">รถจักรยานยนต์</option>
                    </select>
                  </Field>
                  <Field label="ชื่อเรียกรถ">
                    <input
                      value={vehicleModalForm.label}
                      onChange={(e) => setVehicleModalForm((s) => ({ ...s, label: e.target.value }))}
                      className={inputClz}
                      placeholder="เช่น คันหลัก"
                      required
                    />
                  </Field>
                  <Field label="ทะเบียนรถ">
                    <input
                      value={vehicleModalForm.plateNumber}
                      onChange={(e) => setVehicleModalForm((s) => ({ ...s, plateNumber: e.target.value }))}
                      className={inputClz}
                      placeholder="เช่น กข 1234"
                    />
                  </Field>
                  <Field label="วันครบต่อภาษี">
                    <input
                      type="date"
                      value={vehicleModalForm.taxDueDate}
                      onChange={(e) => setVehicleModalForm((s) => ({ ...s, taxDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                  <Field label="วันเข้าศูนย์บริการ">
                    <input
                      type="date"
                      value={vehicleModalForm.serviceDueDate}
                      onChange={(e) => setVehicleModalForm((s) => ({ ...s, serviceDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                  <Field label="วันครบประกันภัย">
                    <input
                      type="date"
                      value={vehicleModalForm.insuranceDueDate}
                      onChange={(e) => setVehicleModalForm((s) => ({ ...s, insuranceDueDate: e.target.value }))}
                      className={inputClz}
                    />
                  </Field>
                </div>
              </form>
              <Field label="เอกสารแนบ (PDF หรือรูป)">
                <HomeFinanceFormAttachmentsBlock
                  urls={vehicleEditAttachmentUrls}
                  pendingUploads={vehicleEditAttachmentPending}
                  onChange={setVehicleEditAttachmentUrls}
                  inputId={vehicleEditAttachInputId}
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                  hint="PDF สูงสุด 5MB · รูปสูงสุด 3MB ต่อไฟล์ · รวมได้สูงสุด 20 ไฟล์ — แนบทีละ 1 ไฟล์"
                  emptyStateVariant="vehicle"
                  attachUiMode="vehicle-single"
                  uploadProgress={attachmentUploadProgress}
                  onUploadFiles={(files) =>
                    appendFilesToList(
                      files,
                      setVehicleEditAttachmentUrls,
                      setVehicleEditAttachmentPending,
                      () => hfAttachVehicleEditUrlCountRef.current,
                      () => hfAttachVehicleEditPendingCountRef.current,
                      hfAttachEpochVehicleEditRef,
                    )
                  }
                  onOpenUrl={openFinanceAttachmentUrl}
                  onOpenLocalPreview={openLocalFinancePreview}
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton
                  type="button"
                  disabled={
                    vehicleFormSaving ||
                    attachmentUploadProgress != null ||
                    vehicleEditAttachmentPending.length > 0
                  }
                  onClick={() => {
                    setError(null);
                    closeVehicleEditModal();
                  }}
                >
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton
                  type="submit"
                  form="hf-vehicle-edit-form"
                  disabled={
                    vehicleFormSaving ||
                    attachmentUploadProgress != null ||
                    vehicleEditAttachmentPending.length > 0
                  }
                  className="disabled:opacity-60"
                >
                  {vehicleFormSaving ? "กำลังบันทึก…" : "บันทึก"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </div>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {section === "reminders" ? (
        <HomeFinancePageSection>
          <HomeFinanceSectionHeader
            title="แจ้งเตือน"
            description="เตือนความจำที่บันทึกเอง · ด้านล่างรวมรายการใกล้ครบจากบิลและรถด้วย"
            action={
              <HomeFinanceToolbarButton type="button" onClick={() => openReminderAddModal()}>
                เพิ่มแจ้งเตือน
              </HomeFinanceToolbarButton>
            }
          />
          <div>
            <HomeFinanceListHeading>ใกล้ครบกำหนด (7 วัน)</HomeFinanceListHeading>
            <HomeFinanceList>
              {dueAlerts.length === 0 ? (
                <HomeFinanceEmptyState>ยังไม่มีรายการครบกำหนดในช่วงนี้</HomeFinanceEmptyState>
              ) : (
                dueAlerts.map((a, i) => (
                  <HomeFinanceEntityRow key={`${a.kind}-${a.title}-${a.dueDate}-${i}`}>
                    <div className="min-w-0 flex-1 text-sm text-slate-800">
                      <span className="font-semibold text-[#0000BF]">{a.kind}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="font-medium text-slate-900">{a.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 tabular-nums">
                        ครบกำหนด {a.dueDate}{" "}
                        {a.diff < 0
                          ? `(เกินกำหนด ${Math.abs(a.diff)} วัน)`
                          : a.diff === 0
                            ? "(ครบวันนี้)"
                            : `(อีก ${a.diff} วัน)`}
                      </span>
                    </div>
                  </HomeFinanceEntityRow>
                ))
              )}
            </HomeFinanceList>
          </div>
          <div>
            <HomeFinanceListHeading>รายการแจ้งเตือน ({reminders.length})</HomeFinanceListHeading>
            <HomeFinanceList>
              {reminders.length === 0 ? (
                <HomeFinanceEmptyState>ยังไม่มีรายการ — กด &quot;เพิ่มแจ้งเตือน&quot;</HomeFinanceEmptyState>
              ) : (
                reminders.map((r) => (
                  <HomeFinanceEntityRow key={r.id}>
                    <HomeFinanceEntityMain className="items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                        <p className="text-xs text-slate-500">
                          ครบกำหนด {r.dueDate.slice(0, 10)}
                          {r.note ? ` · ${r.note}` : ""}
                          {r.isDone ? " · เสร็จแล้ว" : ""}
                        </p>
                      </div>
                    </HomeFinanceEntityMain>
                    <HomeFinanceEntityActions>
                      <HomeFinanceRowActionButton
                        variant="primary"
                        onClick={() => void toggleReminderDone(r.id, r.isDone)}
                      >
                        {r.isDone ? "เปิดใหม่" : "ทำเสร็จแล้ว"}
                      </HomeFinanceRowActionButton>
                      <HomeFinanceRowActionButton variant="danger" onClick={() => void removeReminder(r.id)}>
                        ลบ
                      </HomeFinanceRowActionButton>
                    </HomeFinanceEntityActions>
                  </HomeFinanceEntityRow>
                ))
              )}
            </HomeFinanceList>
          </div>
        </HomeFinancePageSection>
      ) : null}

      {reminderAddModalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeReminderAddModal()}>
          <HomeFinanceModalPanel
            title="เพิ่มแจ้งเตือน"
            titleId="reminder-add-title"
            onClose={() => closeReminderAddModal()}
            error={error}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void addReminder();
              }}
            >
              <Field label="หัวข้อแจ้งเตือน">
                <input
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm((s) => ({ ...s, title: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น ค่าส่วนกลางหมู่บ้าน"
                  required
                  autoFocus
                />
              </Field>
              <Field label="วันครบกำหนด">
                <input
                  type="date"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm((s) => ({ ...s, dueDate: e.target.value }))}
                  className={inputClz}
                  required
                />
              </Field>
              <Field label="หมายเหตุ">
                <input
                  value={reminderForm.note}
                  onChange={(e) => setReminderForm((s) => ({ ...s, note: e.target.value }))}
                  className={inputClz}
                  placeholder="ไม่บังคับ"
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" onClick={() => closeReminderAddModal()}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit">เพิ่มแจ้งเตือน</HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}
    </div>
  );
}

type HomeFinanceAnalyticsSectionProps = {
  entries: Entry[];
  from: string;
  to: string;
  loading: boolean;
  thb: (n: number) => string;
  context: "dashboard" | "history";
  previousBalance: number | null;
  onAddFirstEntry: () => void;
};

function HomeFinanceIncomeExpenseRing({
  income,
  expense,
  thb,
}: {
  income: number;
  expense: number;
  thb: (n: number) => string;
}) {
  const total = Math.max(0, income + expense);
  const incomePct = total > 0 ? (income / total) * 100 : 0;
  const expensePct = 100 - incomePct;
  return (
    <AppSparkChartPanel>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#2e2a58]">สัดส่วนรายรับ/รายจ่าย</h4>
      <div className="mt-3 flex items-center gap-4">
        <div
          className="relative h-24 w-24 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(#10b981 0 ${incomePct}%, #f43f5e ${incomePct}% 100%)`,
          }}
          aria-label={`รายรับ ${incomePct.toFixed(1)} เปอร์เซ็นต์ รายจ่าย ${expensePct.toFixed(1)} เปอร์เซ็นต์`}
        >
          <div className="absolute inset-[13px] grid place-items-center rounded-full bg-white/90 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">รวม</span>
            <span className="text-xs font-bold text-[#2e2a58]">{thb(total)} ฿</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            <span>รายรับ {incomePct.toFixed(1)}% · {thb(income)} ฿</span>
          </div>
          <div className="flex items-center gap-2 text-rose-700">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
            <span>รายจ่าย {expensePct.toFixed(1)}% · {thb(expense)} ฿</span>
          </div>
        </div>
      </div>
    </AppSparkChartPanel>
  );
}

function HomeFinanceAnalyticsSection({
  entries,
  from,
  to,
  loading,
  thb,
  context,
  previousBalance,
  onAddFirstEntry,
}: HomeFinanceAnalyticsSectionProps) {
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      if (e.type === "INCOME") income += e.amount;
      else expense += e.amount;
    }
    return { income, expense };
  }, [entries]);

  const trend = useMemo(() => buildTrendBuckets(from, to, entries), [from, to, entries]);

  const incomeByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (e.type !== "INCOME") continue;
      m.set(e.categoryLabel, (m.get(e.categoryLabel) ?? 0) + e.amount);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [entries]);

  const expenseByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (e.type !== "EXPENSE") continue;
      m.set(e.categoryLabel, (m.get(e.categoryLabel) ?? 0) + e.amount);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [entries]);

  const revenueCostBuckets = useMemo<AppRevenueCostBucket[]>(() => {
    const maxVal = Math.max(1, ...trend.buckets.flatMap((b) => [b.income, b.expense]));
    return trend.buckets.map((b) => ({
      key: b.key,
      label: b.label,
      revenue: b.income,
      cost: b.expense,
      revenuePct: (b.income / maxVal) * 100,
      costPct: (b.expense / maxVal) * 100,
    }));
  }, [trend.buckets]);

  const incomeRowsTop5 = useMemo<AppCompareBarRow[]>(() => {
    const top = incomeByCat.slice(0, 5);
    const others = incomeByCat.slice(5).reduce((s, [, amt]) => s + amt, 0);
    const rows = others > 0 ? [...top, ["อื่นๆ", others] as const] : top;
    const max = Math.max(1, ...rows.map(([, amt]) => amt));
    return rows.map(([label, amount]) => ({
      key: label,
      label,
      amount,
      pct: (amount / max) * 100,
    }));
  }, [incomeByCat]);

  const expenseRowsTop5 = useMemo<AppCompareBarRow[]>(() => {
    const top = expenseByCat.slice(0, 5);
    const others = expenseByCat.slice(5).reduce((s, [, amt]) => s + amt, 0);
    const rows = others > 0 ? [...top, ["อื่นๆ", others] as const] : top;
    const max = Math.max(1, ...rows.map(([, amt]) => amt));
    return rows.map(([label, amount]) => ({
      key: label,
      label,
      amount,
      pct: (amount / max) * 100,
    }));
  }, [expenseByCat]);

  const sparkBuckets = useMemo<AppColumnBarBucket[]>(() => {
    const gross = trend.buckets.map((b) => ({ key: b.key, label: b.label, amount: b.income + b.expense }));
    const max = Math.max(1, ...gross.map((b) => b.amount));
    return gross.map((b) => ({ ...b, pct: (b.amount / max) * 100 }));
  }, [trend.buckets]);

  const net = totals.income - totals.expense;
  const deltaPct =
    previousBalance == null || previousBalance === 0 ? null : ((net - previousBalance) / Math.abs(previousBalance)) * 100;

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm sm:p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-200/60" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/55" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/55" />
        </div>
      </section>
    );
  }

  const empty = entries.length === 0;

  const rangeLine =
    context === "dashboard" ? (
      <>
        <strong className="font-semibold text-slate-800">เดือนนี้</strong> ·{" "}
        <span className="font-medium text-slate-800">{from}</span> – <span className="font-medium text-slate-800">{to}</span>{" "}
        <span className="text-slate-400">(ไทย)</span>
      </>
    ) : (
      <>
        <span className="font-medium text-slate-800">{from}</span> – <span className="font-medium text-slate-800">{to}</span>{" "}
        <span className="text-slate-400">(ไทย)</span>
      </>
    );

  const emptyHint =
    context === "dashboard"
      ? "ยังไม่มีรายการเดือนนี้ — เพิ่มด้านล่าง"
      : "ไม่มีรายการในช่วงนี้ — ปรับกรองหรือเพิ่มรายการ";

  const compareTitle =
    context === "dashboard" ? "เปรียบเทียบรับ–จ่าย (เดือนนี้)" : "เปรียบเทียบรับ–จ่าย (ช่วงที่เลือก)";

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm sm:p-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-semibold text-slate-900">กราฟและสรุป</h3>
        <p className="mt-0.5 text-sm text-slate-600">{rangeLine}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <p className="text-xs text-slate-500">มุมมองสะอาด: แท่งรายวัน + สัดส่วน + Top 5 หมวด</p>
          <div className="rounded-2xl border border-white/75 bg-white/75 px-3 py-2 text-right shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66638c]">คงเหลือสุทธิ</p>
            <p className="text-lg font-black tracking-tight text-[#2e2a58]">{thb(net)} ฿</p>
            <p className={cn("text-[11px] font-semibold", deltaPct != null && deltaPct >= 0 ? "text-emerald-700" : "text-rose-700")}>
              {deltaPct == null ? "เทียบเดือนก่อน: —" : `${deltaPct >= 0 ? "▲" : "▼"} ${Math.abs(deltaPct).toFixed(1)}% เทียบเดือนก่อน`}
            </p>
          </div>
        </div>
      </div>

      {empty ? (
        <div className="mt-4">
          <AppEmptyState tone="violet" className="py-8">
            <span className="block text-2xl" aria-hidden>📊</span>
            <span className="mt-2 block">{emptyHint}</span>
            <button
              type="button"
              onClick={onAddFirstEntry}
              className="mt-3 inline-flex min-h-[42px] items-center rounded-xl bg-[#4d47b6] px-4 text-sm font-semibold text-white"
            >
              + เพิ่มรายการแรก
            </button>
          </AppEmptyState>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            <AppSparkChartPanel>
              <AppRevenueCostColumnChart
                buckets={revenueCostBuckets}
                title={compareTitle}
                subtitle="แท่งคู่รายวัน/รายช่วง พร้อมเส้นกริดบางและ tick สั้น"
                emptyText="ไม่มีข้อมูลรายรับ/รายจ่ายในช่วงนี้"
                compact
              />
            </AppSparkChartPanel>

            <AppSparkChartsTwoColumnGrid>
              <HomeFinanceIncomeExpenseRing income={totals.income} expense={totals.expense} thb={thb} />
              <AppSparkChartPanel>
                <AppColumnBarSparkChart
                  buckets={sparkBuckets}
                  title="แนวโน้มมูลค่ารวมต่อช่วง"
                  subtitle={trend.mode === "day" ? "รายวัน" : trend.mode === "week" ? "รายสัปดาห์" : "รายเดือน"}
                  emptyText="ไม่มีแนวโน้มให้แสดง"
                  variant="brand"
                  compact
                />
              </AppSparkChartPanel>
            </AppSparkChartsTwoColumnGrid>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">สรุปตามหมวดหมู่ (Top 5 + อื่นๆ)</p>
            <AppSparkChartsTwoColumnGrid className="mt-3">
              <AppSparkChartPanel>
                <AppCompareBarList
                  title="รายรับ"
                  subtitle="หมวดที่มีมูลค่าสูงสุดเพื่ออ่านเร็ว"
                  emptyText="ไม่มีรายรับในช่วงนี้"
                  rows={incomeRowsTop5}
                  formatAmount={(amount) => `${thb(amount)} ฿`}
                  variant="emerald"
                />
              </AppSparkChartPanel>
              <AppSparkChartPanel>
                <AppCompareBarList
                  title="รายจ่าย"
                  subtitle="หมวดที่มีมูลค่าสูงสุดเพื่ออ่านเร็ว"
                  emptyText="ไม่มีรายจ่ายในช่วงนี้"
                  rows={expenseRowsTop5}
                  formatAmount={(amount) => `${thb(amount)} ฿`}
                  variant="brand"
                />
              </AppSparkChartPanel>
            </AppSparkChartsTwoColumnGrid>
          </div>
        </>
      )}
    </section>
  );
}

/** การ์ดรายการแบบเต็ม — หน้าประวัติ */
function HomeFinanceEntryHistoryCard({
  entry: e,
  thb,
  densityMode,
  selected,
  onToggleSelected,
  onOpenImage,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  thb: (n: number) => string;
  densityMode: "compact" | "comfortable";
  selected: boolean;
  onToggleSelected: () => void;
  onOpenImage: (url: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const link = homeFinanceEntryLinkLabel(e);
  const attachmentList =
    e.attachmentUrls?.length > 0
      ? e.attachmentUrls
      : e.slipImageUrl
        ? [e.slipImageUrl]
        : [];
  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300",
        densityMode === "compact" ? "px-3 py-2" : "px-3 py-2.5",
        selected && "ring-2 ring-[#4d47b6]/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <input type="checkbox" checked={selected} onChange={onToggleSelected} className="h-4 w-4 rounded border-slate-300" />
          <time
            className="text-[11px] font-medium tabular-nums text-slate-500"
            dateTime={e.entryDate}
          >
            {e.entryDate}
          </time>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight",
              homeFinanceTypePillClass(e.type),
            )}
          >
            {e.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
          {formatMoneyCompact(thb, e.amount)}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold leading-tight text-slate-900">{e.title}</p>
      <p className="truncate text-[11px] leading-tight text-slate-600">
        <span className="text-slate-400">หมวด</span> · {categoryIcon(e.categoryLabel)} {e.categoryLabel}
      </p>
      {link ? (
        <p className="truncate text-[11px] leading-tight text-slate-600">
          <span className="text-slate-400">เชื่อม</span> · {link}
        </p>
      ) : null}
      {e.note ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">{e.note}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="shrink-0 pt-0.5 text-[10px] font-medium text-slate-400">เอกสาร</span>
          <HomeFinanceHistoryAttachmentStrip urls={attachmentList} onOpenImage={onOpenImage} />
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="touch-manipulation rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#0000BF] hover:bg-[#0000BF]/10"
          >
            แก้ไข
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="touch-manipulation rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
          >
            ลบ
          </button>
        </div>
      </div>
    </article>
  );
}

/** การ์ดรายการแบบย่อ — แดชบอร์ด (แนวยาว คอลัมน์เดียว กระชับ) */
function HomeFinanceEntryRecentCard({ entry: e, thb }: { entry: Entry; thb: (n: number) => string }) {
  return (
    <article className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <time
            className="text-[11px] font-medium tabular-nums text-slate-500"
            dateTime={e.entryDate}
          >
            {e.entryDate}
          </time>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight",
              homeFinanceTypePillClass(e.type),
            )}
          >
            {e.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm font-semibold leading-tight text-slate-900">{e.title}</p>
        <p className="truncate text-[11px] leading-tight text-slate-500">
          {categoryIcon(e.categoryLabel)} {e.categoryLabel}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold tabular-nums tracking-tight text-slate-900">
          {formatMoneyCompact(thb, e.amount)}
        </span>
      </div>
    </article>
  );
}

function HomeFinanceRecentSummary({ entries, thb }: { entries: Entry[]; thb: (n: number) => string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">รายการล่าสุด (เดือนนี้)</h3>
          <p className="mt-0.5 text-xs text-slate-500">ล่าสุดก่อน · สูงสุด 15 รายการ</p>
        </div>
        <Link
          href="/dashboard/home-finance/history"
          className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[#0000BF] touch-manipulation hover:underline sm:min-h-0"
        >
          ประวัติเต็ม →
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">ยังไม่มีรายการในเดือนนี้</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2" aria-label="รายการล่าสุด">
          {entries.map((e) => (
            <li key={e.id}>
              <HomeFinanceEntryRecentCard entry={e} thb={thb} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** ใช้ div ไม่ใช่ <label> ห่อทั้งก้อน — ลูกข้างใน (เช่นปุ่มเลือกไฟล์ที่เป็น <label htmlFor>) จะได้ไม่ nested label ซึ่งทำให้เบราว์เซอร์คลิก/เลือกหลายไฟล์พัง */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6792]">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function FormGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-3 rounded-[1.4rem] border border-white/70 bg-gradient-to-br from-white/84 via-white/76 to-[#eef2ff]/74 p-3.5 shadow-[0_18px_34px_-28px_rgba(37,28,113,0.5)] ring-1 ring-white/65 sm:p-4",
        className,
      )}
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#66638c]">{title}</h3>
      {children}
    </section>
  );
}

function AmountField({
  label,
  value,
  onChange,
  placeholder = "0.00",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#59558b]">
          ฿
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className={cn(inputClz, "pl-8")}
          placeholder={placeholder}
        />
      </div>
    </Field>
  );
}

function Stat({
  title,
  value,
  icon,
  tone = "blue",
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "blue" | "green" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200/75 bg-gradient-to-br from-emerald-50/88 via-white/75 to-emerald-100/75 text-emerald-950"
      : tone === "red"
        ? "border-rose-200/75 bg-gradient-to-br from-rose-50/88 via-white/75 to-rose-100/75 text-rose-950"
        : "border-[#5a57d8]/25 bg-gradient-to-br from-[#eef0ff]/90 via-white/78 to-[#e8ebff]/76 text-[#201d46]";
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border p-4 shadow-[0_16px_34px_-24px_rgba(35,30,94,0.45)] ring-1 ring-white/65 backdrop-blur-xl",
        toneClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-current/70">{title}</p>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/65 text-current">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-current">{value}</p>
    </div>
  );
}

function QuickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[#0000BF] px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
      }
    >
      {children}
    </button>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M16 19a4 4 0 0 0-8 0" strokeLinecap="round" />
      <circle cx="12" cy="11" r="3" />
      <path d="M18 19a3 3 0 0 0-3-3" strokeLinecap="round" />
      <path d="M6 16a3 3 0 0 0-3 3" strokeLinecap="round" />
    </svg>
  );
}

function IconRevenue({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 18h16" strokeLinecap="round" />
      <path d="M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8h2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExpense({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 18h16" strokeLinecap="round" />
      <path d="M7 9l3 3 3-2 4 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 16h2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPackage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" strokeLinejoin="round" />
      <path d="M4 7.5V16.5L12 20l8-3.5V7.5" strokeLinejoin="round" />
      <path d="M12 11v9" strokeLinecap="round" />
    </svg>
  );
}

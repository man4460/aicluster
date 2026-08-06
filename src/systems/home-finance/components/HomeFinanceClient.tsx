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
  AppRevenueCostColumnChart,
  AppSparkChartPanel,
  AppSparkChartsTwoColumnGrid,
  openPrintableHtml,
  prepareUploadFile,
  useAppImageLightbox,
  type AppColumnBarBucket,
  type AppCompareBarRow,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import {
  HomeFinanceEmptyState,
  HomeFinanceEntityActions,
  HomeFinanceEntityMain,
  HomeFinanceEntityRow,
  HomeFinanceList,
  HomeFinanceListHeading,
  HomeFinanceModalActionBar,
  HomeFinanceModalBackdrop,
  HomeFinanceModalPanel,
  HomeFinancePageSection,
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
  HomeFinanceVehicleCoverUpload,
} from "@/systems/home-finance/components/HomeFinanceUi";
import { HomeFinanceStatCard } from "@/systems/home-finance/components/HomeFinanceStatCard";
import {
  hfFilterChipClass,
  hfPanelGlassClass,
} from "@/systems/home-finance/components/home-finance-ui-tokens";
import {
  HomeFinanceFormAttachmentsBlock,
  HomeFinanceVehicleRowAttachments,
  revokeHomeFinancePendingObjectUrls,
  type HomeFinancePendingUpload,
} from "@/systems/home-finance/components/HomeFinanceEntryAttachmentsUi";
import { HomeFinanceSlipUploadField } from "@/systems/home-finance/components/HomeFinanceSlipUploadField";
import { HomeFinanceEntryRowCard } from "@/systems/home-finance/components/HomeFinanceEntryRowCard";
import { HomeFinanceRemindersSection } from "@/systems/home-finance/components/HomeFinanceRemindersSection";
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

type Category = {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
  /** built-in key คงที่ (เช่น `UTILITIES_ELECTRIC`) — null สำหรับหมวดที่ผู้ใช้สร้างเอง */
  systemKey: string | null;
  /** ลบไม่ได้ ปิดใช้งานได้ */
  isSystem: boolean;
};
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

function entryAutoTitleFromUtility(u: Utility): string {
  return `${u.label} (${u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"})`;
}

function entryAutoTitleFromVehicle(v: Vehicle): string {
  const plate = v.plateNumber ? ` · ${v.plateNumber}` : "";
  const kind = v.vehicleType === "CAR" ? "รถยนต์" : "จยย.";
  return `${v.label}${plate} (${kind})`;
}

/**
 * ตัวเลือกหมวด — จากหมวดที่ผู้ใช้สร้างเองเท่านั้น
 */
function categoryKeyFromRow(c: Category): string {
  return c.systemKey ?? `CUSTOM_${c.id}`;
}

function firstActiveCategoryKey(rows: Category[]): string {
  const active = rows.filter((c) => c.isActive);
  return active[0] ? categoryKeyFromRow(active[0]) : "";
}

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
  const toSend = await prepareUploadFile(file, { accept: "image-or-pdf", maxPdfBytes: 5 * 1024 * 1024 });
  const fd = new FormData();
  fd.set("file", toSend);
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
  const vehicleAddAttachInputId = useId();
  const vehicleEditAttachInputId = useId();
  const [from, setFrom] = useState(calendarDefaults.monthStartYmd);
  const [to, setTo] = useState(calendarDefaults.todayYmd);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [q, setQ] = useState("");
  const [historyTab, setHistoryTab] = useState<"list" | "filter" | "charts">("list");
  const [dashboardTab, setDashboardTab] = useState<"list" | "charts" | "budget">("list");
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
  const [categoryKey, setCategoryKey] = useState<string>("");
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
    categoryKey: "",
    title: "",
    amount: "",
    note: "",
    slipImageUrl: null as string | null,
  });
  const [editSlipUploading, setEditSlipUploading] = useState(false);

  /** โมดัลเพิ่ม/แก้ไขหมวดกำหนดเอง — id=null คือโหมดเพิ่ม */
  const [categoryFormModalOpen, setCategoryFormModalOpen] = useState(false);
  const [categoryFormId, setCategoryFormId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    sortOrder: "100",
    isActive: true,
  });
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryFormBusy, setCategoryFormBusy] = useState(false);
  /** โมดัลยืนยันการลบหมวด */
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteBusy, setCategoryDeleteBusy] = useState(false);
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
  const [vehicleAddAttachmentPending, setVehicleAddAttachmentPending] = useState<HomeFinancePendingUpload[]>([]);
  const [vehicleEditAttachmentPending, setVehicleEditAttachmentPending] = useState<HomeFinancePendingUpload[]>([]);
  /** แยก epoch ต่อบริบท — อย่าใช้ตัวเดียวกันทั้งหมด เดี๋ยวปิดฟอร์มหนึ่งแล้วอัปโหลดในอีกฟอร์มถูกยกเลิก */
  const hfAttachEpochVehicleAddRef = useRef(0);
  const hfAttachEpochVehicleEditRef = useRef(0);
  /** อัปเดตทุก render — appendFilesToList อ่านตอนเริ่มคลิกเลือกไฟล์ กันค่า length จาก closure เก่า (หลายไฟล์ + แก้ไขรถ) */
  const hfAttachVehicleAddUrlCountRef = useRef(0);
  const hfAttachVehicleAddPendingCountRef = useRef(0);
  const hfAttachVehicleEditUrlCountRef = useRef(0);
  const hfAttachVehicleEditPendingCountRef = useRef(0);
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
    setFilterPrefsHydrated(true);
  }, []);

  /** บันทึกค่าตัวกรองทุกครั้งที่เปลี่ยน (หลัง hydrate แล้ว) */
  useEffect(() => {
    if (!filterPrefsHydrated) return;
    saveHomeFinanceFilterPrefs({ from, to, typeFilter, categoryFilter, q });
  }, [filterPrefsHydrated, from, to, typeFilter, categoryFilter, q]);

  /** โหลดงบเดือนที่ผู้ใช้ตั้งไว้ */
  useEffect(() => {
    setBudgets(loadHomeFinanceBudgets());
  }, []);

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

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.isActive)
      .map((c) => ({
        key: categoryKeyFromRow(c),
        label: c.name,
      }));
  }, [categories]);

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    if (!categoryOptions.some((c) => c.key === categoryKey)) {
      setCategoryKey(categoryOptions[0]!.key);
    }
  }, [categoryOptions, categoryKey]);
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
        setHistoryTab("filter");
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
      const [cRes, rRes] = await Promise.all([
        homeFinanceFetch("/api/home-finance/categories"),
        homeFinanceFetch("/api/home-finance/reminders"),
      ]);
      const [cP, rP] = await Promise.all([
        readHomeFinanceJsonResponse(cRes),
        readHomeFinanceJsonResponse(rRes),
      ]);
      const failures: string[] = [];
      if (cP.ok) {
        const loaded = (cP.data.categories as Category[] | undefined) ?? [];
        setCategories(loaded);
        const firstKey = firstActiveCategoryKey(loaded);
        if (firstKey) {
          setCategoryKey((prev) => (prev && loaded.some((c) => categoryKeyFromRow(c) === prev && c.isActive) ? prev : firstKey));
        }
      } else {
        failures.push(metaEndpointFailureLine("หมวดหมู่", cRes, cP.data));
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

  async function uploadEditSlipFile(file: File) {
    setEditSlipUploading(true);
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
      setEditForm((s) => ({ ...s, slipImageUrl: url }));
    } finally {
      setEditSlipUploading(false);
    }
  }

  async function ingestSlipWithAiAndSave(file: File) {
    setEntrySlipAiSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      const prepared = await prepareUploadFile(file, { accept: "image-or-pdf", maxPdfBytes: 5 * 1024 * 1024 });
      fd.set("file", prepared);
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
      if (!categoryKey) {
        setError("กรุณาสร้างหมวดหมู่ก่อน — ไปที่เมนู «หมวดหมู่»");
        return;
      }
      const n = parseAmountInput(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องเป็นตัวเลขมากกว่า 0 (ใช้จุดทศนิยมได้ ไม่บังคับคั่นหลักพัน)");
        return;
      }
      const uLink = null;
      const vLink = null;
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
            dueDate: null,
            billNumber: null,
            vehicleType: null,
            serviceCenter: null,
            paymentMethod: null,
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
    setEditSlipUploading(false);
    setEditingEntry(entry);
    const slip =
      entry.attachmentUrls?.length > 0
        ? entry.attachmentUrls[0]
        : entry.slipImageUrl ?? null;
    setEditForm({
      entryDate: entry.entryDate,
      type: entry.type,
      categoryKey: entry.categoryKey,
      title: entry.title,
      amount: String(entry.amount),
      note: entry.note ?? "",
      slipImageUrl: slip,
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
    setHistoryTab("filter");
  }

  async function onSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    if (editSlipUploading) {
      setError("รอให้อัปโหลดรูปสลิปให้เสร็จก่อน แล้วค่อยบันทึก");
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
      if (!editForm.categoryKey) {
        setError("กรุณาสร้างหมวดหมู่ก่อน — ไปที่เมนู «หมวดหมู่»");
        return;
      }
      const n = parseAmountInput(editForm.amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องเป็นตัวเลขมากกว่า 0 (ใช้จุดทศนิยมได้ ไม่บังคับคั่นหลักพัน)");
        return;
      }
      const uLink = null;
      const vLink = null;
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
            attachmentUrls: editForm.slipImageUrl ? [editForm.slipImageUrl] : [],
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

  function openCategoryCreateModal() {
    setCategoryFormError(null);
    setCategoryFormId(null);
    setCategoryForm({ name: "", sortOrder: "100", isActive: true });
    setCategoryFormModalOpen(true);
  }

  function openCategoryEditModal(c: Category) {
    setCategoryFormError(null);
    setCategoryFormId(c.id);
    setCategoryForm({
      name: c.name,
      sortOrder: String(c.sortOrder ?? 100),
      isActive: c.isActive,
    });
    setCategoryFormModalOpen(true);
  }

  function closeCategoryFormModal() {
    if (categoryFormBusy) return;
    setCategoryFormModalOpen(false);
    setCategoryFormError(null);
    setCategoryFormId(null);
  }

  async function submitCategoryForm() {
    const name = categoryForm.name.trim();
    if (!name) {
      setCategoryFormError("กรอกชื่อหมวด");
      return;
    }
    if (name.length > 100) {
      setCategoryFormError("ชื่อหมวดยาวเกินไป (สูงสุด 100 ตัวอักษร)");
      return;
    }
    const rawOrder = categoryForm.sortOrder.trim();
    let sortOrder: number | undefined;
    if (rawOrder !== "") {
      const parsed = Number(rawOrder);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
        setCategoryFormError("ลำดับต้องเป็นจำนวนเต็ม 1–999");
        return;
      }
      sortOrder = parsed;
    }

    setCategoryFormError(null);
    setCategoryFormBusy(true);
    try {
      const isEdit = categoryFormId !== null;
      const url = isEdit
        ? `/api/home-finance/categories/${categoryFormId}`
        : "/api/home-finance/categories";
      const body: Record<string, unknown> = { name };
      if (sortOrder !== undefined) body.sortOrder = sortOrder;
      if (isEdit) body.isActive = categoryForm.isActive;

      let res: Response;
      try {
        res = await fetch(url, {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        setCategoryFormError(fetchErrorMessage(e));
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const msg = typeof j.error === "string" && j.error.trim() ? j.error.trim() : "";
        setCategoryFormError(
          msg || `${isEdit ? "แก้ไข" : "เพิ่ม"}หมวดไม่สำเร็จ (รหัส ${res.status})`,
        );
        return;
      }
      setCategoryFormModalOpen(false);
      setCategoryFormId(null);
      await loadMeta();
    } finally {
      setCategoryFormBusy(false);
    }
  }

  function openCategoryDeleteModal(c: Category) {
    setCategoryDeleteError(null);
    setCategoryDeleteTarget(c);
  }

  function closeCategoryDeleteModal() {
    if (categoryDeleteBusy) return;
    setCategoryDeleteTarget(null);
    setCategoryDeleteError(null);
  }

  async function confirmCategoryDelete() {
    const target = categoryDeleteTarget;
    if (!target) return;
    setCategoryDeleteError(null);
    setCategoryDeleteBusy(true);
    try {
      let res: Response;
      try {
        res = await fetch(`/api/home-finance/categories/${target.id}`, { method: "DELETE" });
      } catch (e) {
        setCategoryDeleteError(fetchErrorMessage(e));
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = typeof j.error === "string" && j.error.trim() ? j.error.trim() : "";
        setCategoryDeleteError(msg || `ลบหมวดไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setCategoryDeleteTarget(null);
      await loadMeta();
    } finally {
      setCategoryDeleteBusy(false);
    }
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

  const dashboardSortedEntries = useMemo(() => {
    if (section !== "dashboard") return [];
    return [...entries].sort((a, b) => {
      if (a.entryDate !== b.entryDate) return a.entryDate < b.entryDate ? 1 : -1;
      return b.id - a.id;
    });
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

  const openAddEntryModal = useCallback(() => {
    setError(null);
    setEntrySlipImageUrl(null);
    setLinkedUtilityId("");
    setLinkedVehicleId("");
    setEntryModalOpen(true);
  }, []);

  const exportHistoryCsv = useCallback(() => {
    const rows = entries.map((e) => `${e.entryDate},${e.type},${e.categoryLabel},${e.title},${e.amount}`).join("\n");
    const csv = `date,type,category,title,amount\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home-finance-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, from, to]);

  const exportHistoryPdf = useCallback(() => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>รายรับรายจ่าย</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f4f4ff}</style></head><body><h2>รายรับรายจ่าย ${from} - ${to}</h2><table><thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวด</th><th>รายการ</th><th>จำนวน</th></tr></thead><tbody>${entries.map((e) => `<tr><td>${e.entryDate}</td><td>${e.type === "INCOME" ? "รายรับ" : "รายจ่าย"}</td><td>${e.categoryLabel}</td><td>${e.title}</td><td style="text-align:right">${thb(e.amount)}</td></tr>`).join("")}</tbody></table></body></html>`;
    openPrintableHtml(html);
  }, [entries, from, to, thb]);

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
      !categoryFormModalOpen &&
      !categoryDeleteTarget &&
      !reminderAddModalOpen ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
        >
          {metaError ? (
            <div className={error ? "border-b border-amber-200/80 pb-3" : ""}>
              <p className="font-semibold">หมวด / แจ้งเตือน โหลดไม่ครบ</p>
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
            <section className={hfPanelGlassClass}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/50 pb-3">
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-[#1e1b4b]">สรุปเดือนนี้</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dashboardFrom} – {dashboardTo} · {summary.count} รายการ
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <HistoryToolbarButton
                    active={dashboardTab === "charts"}
                    onClick={() => setDashboardTab((t) => (t === "charts" ? "list" : "charts"))}
                    ariaLabel="ดูกราฟสรุป"
                  >
                    กราฟ
                  </HistoryToolbarButton>
                  <HistoryToolbarButton
                    active={dashboardTab === "budget"}
                    onClick={() => setDashboardTab((t) => (t === "budget" ? "list" : "budget"))}
                    ariaLabel="ดูงบเดือน"
                  >
                    งบ
                  </HistoryToolbarButton>
                  <Link
                    href="/dashboard/home-finance/history"
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-3 text-xs font-semibold text-slate-700 transition hover:border-[#4d47b6]/25 hover:bg-white"
                    aria-label="ดูประวัติเต็ม"
                  >
                    ประวัติ
                  </Link>
                  <HomeFinancePrimaryButton type="button" onClick={openAddEntryModal} className="min-h-[40px] px-3 text-xs sm:px-4">
                    + เพิ่ม
                  </HomeFinancePrimaryButton>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <Stat title="รายการ" value={String(summary.count)} />
                <Stat title="รายรับ" value={formatMoneyCompact(thb, summary.income)} tone="green" />
                <Stat title="รายจ่าย" value={formatMoneyCompact(thb, summary.expense)} tone="red" />
                <Stat title="คงเหลือ" value={formatMoneyCompact(thb, summary.balance)} tone={summary.balance >= 0 ? "blue" : "red"} />
              </div>

              {dashboardTab === "list" ? (
                <div className="mt-3" role="tabpanel">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
                  ) : entries.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายการในเดือนนี้ — กด «+ เพิ่ม» เพื่อบันทึก</p>
                  ) : (
                    <div className="max-h-[min(65vh,36rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                      <ul className="grid grid-cols-1 gap-1" aria-label="รายการเดือนนี้">
                        {dashboardSortedEntries.map((e) => (
                          <li key={e.id}>
                            <HomeFinanceEntryRowCard
                              variant="dashboard"
                              entry={e}
                              thb={thb}
                              onOpenSlip={(url) => openFinanceAttachmentUrl(url)}
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

              {dashboardTab === "charts" ? (
                <div className="mt-3" role="tabpanel">
                  <HomeFinanceAnalyticsSection
                    entries={entries}
                    from={dashboardFrom}
                    to={dashboardTo}
                    loading={loading}
                    thb={thb}
                    context="dashboard"
                    placement="history-tab"
                    previousBalance={previousPeriodBalance}
                    onAddFirstEntry={openAddEntryModal}
                  />
                </div>
              ) : null}

              {dashboardTab === "budget" ? (
                <div className="mt-3 space-y-3" role="tabpanel">
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
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-3 text-center text-xs text-slate-500">
                      ยังไม่มีงบรายการ — กด «ปรับงบ» เพื่อเพิ่มหมวด
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
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
                  {insightChips.length > 0 ? (
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
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
                </div>
              ) : null}
            </section>
          ) : null}

          {section === "history" ? (
            <section className={hfPanelGlassClass}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/50 pb-3">
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-[#1e1b4b]">ประวัติรายการ</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {from} – {to} · {summary.count} รายการ
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <HistoryToolbarButton
                    active={historyTab === "filter"}
                    onClick={() => setHistoryTab((t) => (t === "filter" ? "list" : "filter"))}
                    ariaLabel="กรองรายการ"
                  >
                    กรอง
                  </HistoryToolbarButton>
                  <HistoryToolbarButton
                    active={historyTab === "charts"}
                    onClick={() => setHistoryTab((t) => (t === "charts" ? "list" : "charts"))}
                    ariaLabel="ดูกราฟสรุป"
                  >
                    กราฟ
                  </HistoryToolbarButton>
                  <HistoryToolbarButton onClick={exportHistoryCsv} ariaLabel="ส่งออก CSV">
                    CSV
                  </HistoryToolbarButton>
                  <HistoryToolbarButton onClick={exportHistoryPdf} ariaLabel="พิมพ์หรือส่งออก PDF">
                    PDF
                  </HistoryToolbarButton>
                  <HomeFinancePrimaryButton type="button" onClick={openAddEntryModal} className="min-h-[40px] px-3 text-xs sm:px-4">
                    + เพิ่ม
                  </HomeFinancePrimaryButton>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <Stat title="รายการ" value={String(summary.count)} />
                <Stat title="รายรับ" value={formatMoneyCompact(thb, summary.income)} tone="green" />
                <Stat title="รายจ่าย" value={formatMoneyCompact(thb, summary.expense)} tone="red" />
                <Stat title="คงเหลือ" value={formatMoneyCompact(thb, summary.balance)} tone={summary.balance >= 0 ? "blue" : "red"} />
              </div>

              {historyTab === "list" ? (
                <div className="mt-3" role="tabpanel">
                  {selectedHistoryIds.length > 0 ? (
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#4d47b6]/20 bg-[#f5f4ff] p-2">
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
                    <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
                  ) : entries.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายการในช่วงที่เลือก — ลองขยายช่วงที่ปุ่ม «กรอง»</p>
                  ) : (
                    <div className="max-h-[min(65vh,36rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                      <ul className="grid grid-cols-1 gap-1" aria-label="รายการในช่วงที่เลือก">
                        {entries.map((e) => (
                          <li key={e.id}>
                            <HomeFinanceEntryRowCard
                              variant="history"
                              entry={e}
                              thb={thb}
                              selected={selectedHistoryIds.includes(e.id)}
                              onToggleSelected={() =>
                                setSelectedHistoryIds((prev) =>
                                  prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id],
                                )
                              }
                              onOpenSlip={(url) => openFinanceAttachmentUrl(url)}
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

              {historyTab === "filter" ? (
                <div className="mt-3 space-y-3" role="tabpanel">
                  <div className="flex flex-wrap gap-1.5">
                    <QuickChip active={filterMatches7d} onClick={() => applyQuickRange("7d")}>
                      7 วัน
                    </QuickChip>
                    <QuickChip active={filterMatches30d} onClick={() => applyQuickRange("30d")}>
                      30 วัน
                    </QuickChip>
                    <QuickChip active={filterMatchesQuarter} onClick={() => applyQuickRange("quarter")}>
                      ไตรมาส
                    </QuickChip>
                    <QuickChip active={filterMatchesThisYear} onClick={() => applyQuickRange("year")}>
                      ปีนี้
                    </QuickChip>
                    <QuickChip
                      active={filterMatchesThisMonth}
                      onClick={() => {
                        setFrom(monthStartKey());
                        setTo(todayKey());
                      }}
                    >
                      เดือนนี้
                    </QuickChip>
                    <QuickChip
                      active={
                        !filterMatches7d &&
                        !filterMatches30d &&
                        !filterMatchesQuarter &&
                        !filterMatchesThisYear &&
                        !filterMatchesThisMonth
                      }
                      onClick={() => applyQuickRange("custom")}
                    >
                      กำหนดเอง
                    </QuickChip>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
                      ค้นหา
                      <input
                        ref={filterSearchInputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className={`${inputClz} mt-1`}
                        placeholder="ชื่อ / หมวด / หมายเหตุ"
                        suppressHydrationWarning
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">ลัด: กด F เพื่อเปิดกรอง · ดูกราฟที่ปุ่ม «กราฟ»</p>
                </div>
              ) : null}

              {historyTab === "charts" ? (
                <div className="mt-3" role="tabpanel">
                  <HomeFinanceAnalyticsSection
                    entries={entries}
                    from={from}
                    to={to}
                    loading={loading}
                    thb={thb}
                    context="history"
                    placement="history-tab"
                    previousBalance={null}
                    onAddFirstEntry={openAddEntryModal}
                  />
                </div>
              ) : null}
            </section>
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="วันที่">
                    <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClz} />
                  </Field>
                  <AmountField label="จำนวนเงิน (บาท)" value={amount} onChange={setAmount} />
                </div>
                <Field label="ประเภท">
                  <select value={type} onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")} className={inputClz}>
                    <option value="EXPENSE">รายจ่าย</option>
                    <option value="INCOME">รายรับ</option>
                  </select>
                </Field>
                <Field label="หมวดหมู่">
                  {categoryOptions.length === 0 ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      ยังไม่มีหมวด — ไปที่เมนู «หมวดหมู่» เพื่อสร้างก่อนบันทึก
                    </p>
                  ) : (
                    <select
                      value={categoryKey}
                      onChange={(e) => setCategoryKey(e.target.value)}
                      className={inputClz}
                    >
                      {categoryOptions.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="ชื่อรายการ">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClz}
                    placeholder="เช่น ค่าอาหารกลางวัน / เงินเดือน"
                    required
                  />
                </Field>
                <Field label="อัปโหลดสลิป">
                  <HomeFinanceSlipUploadField
                    slipUrl={entrySlipImageUrl}
                    onSlipUrlChange={setEntrySlipImageUrl}
                    onFile={uploadEntrySlipFile}
                    uploading={entrySlipUploading}
                    disabled={saving}
                    onOpenPreview={(url) => imageLightbox.open(url)}
                  />
                </Field>
                <Field label="หมายเหตุ">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClz} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />
                </Field>
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
            maxWidthClassName="max-w-lg"
          >
                <form noValidate onSubmit={onSubmitEdit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="วันที่">
                      <input
                        type="date"
                        value={editForm.entryDate}
                        onChange={(e) => setEditForm((s) => ({ ...s, entryDate: e.target.value }))}
                        className={inputClz}
                      />
                    </Field>
                    <AmountField
                      label="จำนวนเงิน (บาท)"
                      value={editForm.amount}
                      onChange={(value) => setEditForm((s) => ({ ...s, amount: value }))}
                    />
                  </div>
                  <Field label="ประเภท">
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value as "INCOME" | "EXPENSE" }))}
                      className={inputClz}
                    >
                      <option value="EXPENSE">รายจ่าย</option>
                      <option value="INCOME">รายรับ</option>
                    </select>
                  </Field>
                  <Field label="หมวดหมู่">
                    {categoryOptions.length === 0 ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        ยังไม่มีหมวด — ไปที่เมนู «หมวดหมู่» เพื่อสร้างก่อนบันทึก
                      </p>
                    ) : (
                      <select
                        value={editForm.categoryKey}
                        onChange={(e) => setEditForm((s) => ({ ...s, categoryKey: e.target.value }))}
                        className={inputClz}
                      >
                        {categoryOptions.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="ชื่อรายการ">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                      className={inputClz}
                      placeholder="เช่น ค่าอาหารกลางวัน / เงินเดือน"
                      required
                    />
                  </Field>
                  <Field label="อัปโหลดสลิป">
                    <HomeFinanceSlipUploadField
                      slipUrl={editForm.slipImageUrl}
                      onSlipUrlChange={(url) => setEditForm((s) => ({ ...s, slipImageUrl: url }))}
                      onFile={uploadEditSlipFile}
                      uploading={editSlipUploading}
                      disabled={saving}
                      onOpenPreview={(url) => imageLightbox.open(url)}
                    />
                  </Field>
                  <Field label="หมายเหตุ">
                    <textarea
                      value={editForm.note}
                      onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                      rows={2}
                      className={inputClz}
                      placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    />
                  </Field>
                  <HomeFinanceModalActionBar>
                    <HomeFinanceSecondaryButton type="button" onClick={() => setEditingEntry(null)}>
                      ยกเลิก
                    </HomeFinanceSecondaryButton>
                    <HomeFinancePrimaryButton
                      type="submit"
                      disabled={saving || editSlipUploading}
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
            title="หมวดหมู่"
            description="สร้างและจัดการหมวดรายรับ–รายจ่ายเองทั้งหมด — ไม่มีหมวดบังคับจากระบบ"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                onClick={() => openCategoryCreateModal()}
                aria-label="เพิ่มหมวด"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[#0000BF] px-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a6] sm:min-w-0 sm:px-4"
              >
                <span className="text-lg leading-none sm:hidden" aria-hidden>
                  +
                </span>
                <span className="hidden sm:inline">+ เพิ่มหมวด</span>
              </button>
            }
          />
          <div>
            <HomeFinanceListHeading>รายการหมวด ({categories.length})</HomeFinanceListHeading>
            {categories.length === 0 ? (
              <HomeFinanceEmptyState>ยังไม่มีหมวด — กดปุ่ม &quot;+ เพิ่มหมวด&quot;</HomeFinanceEmptyState>
            ) : (
              <HomeFinanceList as="ul" listRole="รายการหมวด">
                {categories.map((c) => (
                  <li key={c.id}>
                    <HomeFinanceEntityRow>
                      <HomeFinanceEntityMain className="flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-slate-600 ring-1 ring-slate-200/80">
                          ลำดับ {c.sortOrder}
                        </span>
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
                        <HomeFinanceRowActionIconButton
                          variant="primary"
                          title="แก้ไข"
                          aria-label={`แก้ไขหมวด ${c.name}`}
                          onClick={() => openCategoryEditModal(c)}
                        >
                          <HomeFinanceRowIconEdit />
                        </HomeFinanceRowActionIconButton>
                        <HomeFinanceRowActionIconButton
                          variant="danger"
                          title="ลบ"
                          aria-label={`ลบหมวด ${c.name}`}
                          onClick={() => openCategoryDeleteModal(c)}
                        >
                          <HomeFinanceRowIconTrash />
                        </HomeFinanceRowActionIconButton>
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

      {categoryFormModalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeCategoryFormModal()}>
          <HomeFinanceModalPanel
            title={categoryFormId === null ? "เพิ่มหมวดใหม่" : "แก้ไขหมวด"}
            titleId="category-form-title"
            onClose={() => closeCategoryFormModal()}
            error={categoryFormError}
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submitCategoryForm();
              }}
            >
              <Field label="ชื่อหมวด">
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((s) => ({ ...s, name: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น เบ็ดเตล็ด / เงินเดือน"
                  maxLength={100}
                  required
                  autoFocus
                  disabled={categoryFormBusy}
                />
              </Field>
              <Field label="ลำดับการแสดง (1–999)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  step={1}
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm((s) => ({ ...s, sortOrder: e.target.value }))}
                  className={inputClz}
                  placeholder="100"
                  disabled={categoryFormBusy}
                />
              </Field>
              {categoryFormId !== null ? (
                <label className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-sm font-medium text-[#3a3666] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#0000BF] focus:ring-[#5a57d8]/30"
                    checked={categoryForm.isActive}
                    onChange={(e) =>
                      setCategoryForm((s) => ({ ...s, isActive: e.target.checked }))
                    }
                    disabled={categoryFormBusy}
                  />
                  <span>เปิดใช้งาน (แสดงในตัวเลือกหมวดบนฟอร์มรายการ)</span>
                </label>
              ) : null}
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton
                  type="button"
                  onClick={() => closeCategoryFormModal()}
                  disabled={categoryFormBusy}
                >
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit" disabled={categoryFormBusy}>
                  {categoryFormBusy
                    ? "กำลังบันทึก…"
                    : categoryFormId === null
                      ? "เพิ่มหมวด"
                      : "บันทึก"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {categoryDeleteTarget ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => closeCategoryDeleteModal()}>
          <HomeFinanceModalPanel
            title="ยืนยันลบหมวด"
            titleId="category-delete-title"
            onClose={() => closeCategoryDeleteModal()}
            error={categoryDeleteError}
            maxWidthClassName="max-w-md"
          >
            <div className="space-y-4">
              <p className="text-sm text-[#3a3666]">
                ต้องการลบหมวด{" "}
                <span className="font-semibold text-[#0000BF]">
                  &quot;{categoryDeleteTarget.name}&quot;
                </span>{" "}
                หรือไม่?
              </p>
              <p className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
                รายการรายรับ–รายจ่ายเดิมที่เคยใช้หมวดนี้จะยังคงอยู่
                แต่จะไม่สามารถเลือกหมวดนี้ในการบันทึกรายการใหม่
                หากต้องการเก็บประวัติแล้วซ่อนจากตัวเลือก แนะนำให้ &quot;แก้ไข&quot; แล้วปิดใช้งานแทน
              </p>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton
                  type="button"
                  onClick={() => closeCategoryDeleteModal()}
                  disabled={categoryDeleteBusy}
                >
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton
                  type="button"
                  className="from-rose-500 to-rose-600 shadow-[0_16px_26px_-18px_rgba(190,18,60,0.7)]"
                  onClick={() => void confirmCategoryDelete()}
                  disabled={categoryDeleteBusy}
                >
                  {categoryDeleteBusy ? "กำลังลบ…" : "ลบหมวด"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </div>
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
        <HomeFinanceRemindersSection
          reminders={reminders}
          dueAlerts={dueAlerts}
          todayYmd={today}
          onAdd={() => openReminderAddModal()}
          onToggleDone={(id, isDone) => void toggleReminderDone(id, isDone)}
          onRemove={(id) => void removeReminder(id)}
        />
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
  /** หน้าประวัติ — ฝังในการ์ดกรองแทนการ์ดแยก */
  placement?: "standalone" | "filter-card" | "history-tab";
};

function HomeFinanceIncomeExpenseRing({
  income,
  expense,
  thb,
  layout = "horizontal",
}: {
  income: number;
  expense: number;
  thb: (n: number) => string;
  layout?: "horizontal" | "vertical";
}) {
  const total = Math.max(0, income + expense);
  const incomePct = total > 0 ? (income / total) * 100 : 0;
  const expensePct = 100 - incomePct;
  const vertical = layout === "vertical";
  return (
    <AppSparkChartPanel>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#2e2a58]">สัดส่วนรายรับ/รายจ่าย</h4>
      <div className={cn("mt-3", vertical ? "flex flex-col items-center gap-3 text-center" : "flex items-center gap-4")}>
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
        <div className={cn("space-y-2 text-xs", vertical && "w-full max-w-xs")}>
          <div className={cn("flex items-center gap-2 text-emerald-800", vertical && "justify-center")}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            <span>รายรับ {incomePct.toFixed(1)}% · {thb(income)} ฿</span>
          </div>
          <div className={cn("flex items-center gap-2 text-rose-700", vertical && "justify-center")}>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
            <span>รายจ่าย {expensePct.toFixed(1)}% · {thb(expense)} ฿</span>
          </div>
        </div>
      </div>
    </AppSparkChartPanel>
  );
}

function HomeFinanceChartSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#66638c]">{children}</p>
  );
}

function HomeFinanceChartsToggleButton({
  open,
  onClick,
  disabled,
}: {
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={open}
      aria-label={open ? "ซ่อนกราฟ" : "แสดงกราฟ"}
      className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-[#d8d6ec] bg-white/85 px-3 py-2 text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:border-[#4d47b6]/35 hover:bg-[#ecebff]/60 disabled:opacity-60 sm:px-4"
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{open ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
    </button>
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
  placement = "standalone",
}: HomeFinanceAnalyticsSectionProps) {
  const isHistory = context === "history";
  const embeddedInFilter = isHistory && placement === "filter-card";
  const tabChartsPlacement = placement === "history-tab";
  const [historyChartsOpen, setHistoryChartsOpen] = useState(false);
  const [chartsPrefsHydrated, setChartsPrefsHydrated] = useState(false);

  useEffect(() => {
    if (!isHistory) {
      setChartsPrefsHydrated(true);
      return;
    }
    const prefs = loadHomeFinanceFilterPrefs();
    setHistoryChartsOpen(prefs.historyChartsOpen === true);
    setChartsPrefsHydrated(true);
  }, [isHistory]);

  const toggleHistoryCharts = useCallback(() => {
    setHistoryChartsOpen((prev) => {
      const next = !prev;
      const prefs = loadHomeFinanceFilterPrefs();
      saveHomeFinanceFilterPrefs({ ...prefs, historyChartsOpen: next });
      return next;
    });
  }, []);

  const chartsVisible = tabChartsPlacement || !isHistory || historyChartsOpen;

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
    if (embeddedInFilter) {
      return (
        <div className="mt-4 border-t border-slate-200/80 pt-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <p className="text-xs font-bold text-[#1e1b4b]">กราฟสรุป</p>
            <HomeFinanceChartsToggleButton open={false} onClick={() => {}} disabled />
          </div>
          {chartsVisible ? (
            <div className="mt-3 grid gap-3">
              <div className="h-32 animate-pulse rounded-2xl bg-slate-200/55" />
              <div className="h-32 animate-pulse rounded-2xl bg-slate-200/55" />
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <section className={hfPanelGlassClass}>
        <div className="flex flex-row items-start justify-between gap-3 border-b border-white/50 pb-3">
          <div className="min-w-0 flex-1">
            <div className="h-5 w-40 animate-pulse rounded bg-white/40" />
            <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-200/60" />
          </div>
          {isHistory ? <HomeFinanceChartsToggleButton open={false} onClick={() => {}} disabled /> : null}
        </div>
        {chartsVisible ? (
          <div className="mt-4 grid gap-3">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200/55" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200/55" />
          </div>
        ) : null}
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

  const formatBucketTitle = (b: AppColumnBarBucket) => `${b.label}: ${thb(b.amount)} ฿`;

  const historyCharts = (
    <div className={cn(embeddedInFilter ? "mt-3 space-y-4" : "mt-4 space-y-5")}>
      <div className="space-y-2">
        <HomeFinanceChartSectionLabel>แนวโน้มรับ–จ่าย</HomeFinanceChartSectionLabel>
        <AppSparkChartPanel>
          <AppRevenueCostColumnChart
            buckets={revenueCostBuckets}
            title={compareTitle}
            subtitle={trend.mode === "day" ? "รายวัน" : trend.mode === "week" ? "รายสัปดาห์" : "รายเดือน"}
            emptyText="ไม่มีข้อมูลรายรับ/รายจ่ายในช่วงนี้"
            compact
          />
        </AppSparkChartPanel>
      </div>

      <div className="space-y-2">
        <HomeFinanceChartSectionLabel>ภาพรวมช่วง</HomeFinanceChartSectionLabel>
        <div className="space-y-3">
          <HomeFinanceIncomeExpenseRing income={totals.income} expense={totals.expense} thb={thb} layout="vertical" />
          <AppSparkChartPanel>
            <AppColumnBarSparkChart
              buckets={sparkBuckets}
              title="มูลค่ารวมต่อช่วง"
              subtitle={trend.mode === "day" ? "รายวัน" : trend.mode === "week" ? "รายสัปดาห์" : "รายเดือน"}
              emptyText="ไม่มีแนวโน้มให้แสดง"
              variant="brand"
              compact
            />
          </AppSparkChartPanel>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <HomeFinanceChartSectionLabel>ตามหมวดหมู่ (Top 5)</HomeFinanceChartSectionLabel>
        <div className="space-y-3">
          <AppSparkChartPanel>
            <AppColumnBarSparkChart
              buckets={incomeRowsTop5}
              title="รายรับ"
              subtitle="หมวดที่มีมูลค่าสูงสุด"
              emptyText="ไม่มีรายรับในช่วงนี้"
              formatTitle={formatBucketTitle}
              variant="emerald"
              evenDistribution
            />
          </AppSparkChartPanel>
          <AppSparkChartPanel>
            <AppColumnBarSparkChart
              buckets={expenseRowsTop5}
              title="รายจ่าย"
              subtitle="หมวดที่มีมูลค่าสูงสุด"
              emptyText="ไม่มีรายจ่ายในช่วงนี้"
              formatTitle={formatBucketTitle}
              variant="brand"
              evenDistribution
            />
          </AppSparkChartPanel>
        </div>
      </div>
    </div>
  );

  const dashboardCharts = (
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
  );

  const historyChartsBody =
    empty ? (
      <div className={embeddedInFilter ? "mt-3" : "mt-4"}>
        {embeddedInFilter ? (
          <p className="rounded-xl border border-dashed border-[#d8d6ec] bg-[#faf9ff]/80 px-3 py-6 text-center text-xs text-[#66638c]">
            {emptyHint}
          </p>
        ) : (
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
        )}
      </div>
    ) : (
      historyCharts
    );

  if (embeddedInFilter) {
    return (
      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1e1b4b]">กราฟสรุป</p>
            <p className="mt-0.5 text-[11px] text-slate-500">ตามช่วงและตัวกรองด้านบน · คงเหลือ {thb(net)} ฿</p>
          </div>
          {chartsPrefsHydrated ? (
            <HomeFinanceChartsToggleButton open={historyChartsOpen} onClick={toggleHistoryCharts} />
          ) : null}
        </div>
        {!chartsVisible ? (
          <p className="mt-2 text-xs text-slate-500">กด «แสดงกราฟ» เพื่อดูแนวโน้มและหมวดหมู่</p>
        ) : (
          historyChartsBody
        )}
      </div>
    );
  }

  if (tabChartsPlacement) {
    if (loading) {
      return (
        <div className="grid gap-3">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200/55" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200/55" />
        </div>
      );
    }
    const net = totals.income - totals.expense;
    return (
      <div>
        <p className="text-[11px] text-slate-500">
          {context === "dashboard" ? (
            <>
              สรุปเดือนนี้ · คงเหลือ <span className="font-semibold text-[#2e2a58]">{thb(net)} ฿</span>
            </>
          ) : (
            <>
              สรุปตามช่วงที่กรอง · คงเหลือ <span className="font-semibold text-[#2e2a58]">{thb(net)} ฿</span>
            </>
          )}
        </p>
        {historyChartsBody}
      </div>
    );
  }

  return (
    <section className={hfPanelGlassClass}>
      <div className="border-b border-white/50 pb-3">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black tracking-tight text-[#1e1b4b]">กราฟและสรุป</h3>
            <p className="mt-0.5 text-sm text-slate-600">{rangeLine}</p>
            {isHistory ? (
              <p className="mt-2 text-xs text-slate-500">
                คงเหลือสุทธิ <span className="font-bold text-[#2e2a58]">{thb(net)} ฿</span>
              </p>
            ) : null}
          </div>
          {isHistory && chartsPrefsHydrated && !empty ? (
            <HomeFinanceChartsToggleButton open={historyChartsOpen} onClick={toggleHistoryCharts} />
          ) : null}
        </div>
        {isHistory && !chartsVisible && !empty ? (
          <p className="mt-2 text-xs text-slate-500">กด «แสดงกราฟ» เพื่อดูแนวโน้มและหมวดหมู่</p>
        ) : null}
        {!isHistory ? (
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
        ) : null}
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
      ) : !chartsVisible ? null : isHistory ? (
        historyCharts
      ) : (
        dashboardCharts
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
        {!value ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#59558b]">
            ฿
          </span>
        ) : null}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className={cn(inputClz, value ? "pl-3" : "pl-8")}
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
  const toneMap = { blue: "blue" as const, green: "green" as const, red: "rose" as const };
  return <HomeFinanceStatCard title={title} value={value} tone={toneMap[tone]} icon={icon} />;
}

function HistoryToolbarButton({
  active = false,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border px-3 text-xs font-semibold transition",
        active
          ? "border-[#4d47b6]/40 bg-[#ecebff] text-[#4d47b6]"
          : "border-slate-200 bg-white/90 text-slate-700 hover:border-[#4d47b6]/25 hover:bg-white",
      )}
      suppressHydrationWarning
    >
      {children}
    </button>
  );
}

function QuickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full px-3 py-1.5 text-xs font-bold", hfFilterChipClass(active))}
      suppressHydrationWarning
    >
      {children}
    </button>
  );
}

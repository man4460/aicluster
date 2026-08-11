"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSlipPrintIconButton,
  AppSparkChartPanel,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortStayPrintModal } from "@/systems/hotel-resort/components/HotelResortStayPrintModal";
import { IconFilter, IconRefresh } from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  HOTEL_BOOKING_STATUS_LABELS,
  HOTEL_PAYMENT_STATUS_LABELS,
} from "@/systems/hotel-resort/lib/booking-status";
import { hotelResortFetchErrorMessage, type HotelResortRoomRow } from "@/systems/hotel-resort/lib/client-data";
import {
  HOTEL_RESORT_PAYMENT_METHODS,
  hotelResortPaymentMethodLabel,
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
  type HotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import {
  hotelResortFieldClass,
  hotelResortFilterChipClass,
  hotelResortFinanceStatTailClass,
  hotelResortFinanceStatsGridClass,
  hotelResortFinanceSubTabShellClass,
  hotelResortNavActiveClass,
  hotelResortNavIdleClass,
  hotelResortSectionRadiusClass,
  hotelResortSkeletonClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import type { HotelResortBookingStatus, HotelResortPaymentStatus } from "@/generated/prisma/client";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";
type FinancePanel = "history" | "expenses";

type FinanceBucket = {
  key: string;
  label: string;
  revenueBaht: number;
  costBaht: number;
};

type FinanceStay = {
  id: string;
  guestName: string;
  guestPhone: string | null;
  roomId?: string | null;
  roomNumber: string | null;
  roomTypeName: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: HotelResortBookingStatus;
  totalBaht: number;
  amountPaidBaht: number;
  paymentStatus: HotelResortPaymentStatus;
  paymentMethod: string | null;
  paymentSlipUrl?: string | null;
  depositSlipUrl?: string | null;
  note?: string | null;
  guestAddress?: string | null;
  guestTaxId?: string | null;
};

type FinanceCost = {
  id: string;
  label: string;
  amountBaht: number;
  spentAt: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  paymentSlipUrl?: string | null;
};

type FinanceIncome = {
  id: string;
  label: string;
  amountBaht: number;
  earnedAt: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
  categoryKind?: "ROOM_STAY" | "CUSTOM" | string;
  paymentSlipUrl?: string | null;
};

type CostCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

type IncomeCategory = {
  id: string;
  name: string;
  kind: "ROOM_STAY" | "CUSTOM";
  isBuiltin: boolean;
  sortOrder: number;
};

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function bangkokTodayYmd(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatThb(n: number): string {
  return Math.round(n).toLocaleString("th-TH");
}

function formatThaiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function FinanceRangeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        hotelResortFilterChipClass(active),
        "inline-flex h-10 shrink-0 items-center justify-center px-3.5 sm:px-4",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

const PANEL_TABS: { id: FinancePanel; label: string }[] = [
  { id: "history", label: "ประวัติ / รายรับ" },
  { id: "expenses", label: "รายจ่าย" },
];

export function HotelResortFinanceClient() {
  const today = bangkokTodayYmd();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [panel, setPanel] = useState<FinancePanel>("history");
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${today.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(today);
  const [keyword, setKeyword] = useState("");
  const [buckets, setBuckets] = useState<FinanceBucket[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [financeRangeLabel, setFinanceRangeLabel] = useState("เดือนนี้");
  const [stays, setStays] = useState<FinanceStay[]>([]);
  const [costs, setCosts] = useState<FinanceCost[]>([]);
  const [incomes, setIncomes] = useState<FinanceIncome[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [incomeFilterCat, setIncomeFilterCat] = useState<"all" | "ROOM_STAY" | string>("all");

  const slipLb = useAppImageLightbox();
  const notice = useAppNoticePopup();
  const galleryRef = useRef<HTMLInputElement>(null);
  const incomeGalleryRef = useRef<HTMLInputElement>(null);
  const costCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายจ่าย" });
  const stayCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายรับ" });
  const incomeCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายรับอื่น" });

  const [stayEdit, setStayEdit] = useState<FinanceStay | null>(null);
  const [stayPrint, setStayPrint] = useState<FinanceStay | null>(null);
  const [stayGuestName, setStayGuestName] = useState("");
  const [stayGuestPhone, setStayGuestPhone] = useState("");
  const [stayNationalId, setStayNationalId] = useState("");
  const [stayNationality, setStayNationality] = useState("ไทย");
  const [stayGuestAddress, setStayGuestAddress] = useState("");
  const [stayGuestTaxId, setStayGuestTaxId] = useState("");
  const [stayIdCardImageUrl, setStayIdCardImageUrl] = useState<string | null>(null);
  const [stayRoomId, setStayRoomId] = useState("");
  const [stayCheckIn, setStayCheckIn] = useState("");
  const [stayCheckOut, setStayCheckOut] = useState("");
  const [stayStatus, setStayStatus] = useState<HotelResortBookingStatus>("RESERVED");
  const [stayPaymentMethod, setStayPaymentMethod] = useState<HotelResortPaymentMethod>("CASH");
  const [stayNote, setStayNote] = useState("");
  const [stayTotal, setStayTotal] = useState("");
  const [stayPaid, setStayPaid] = useState("");
  const [staySlipUrl, setStaySlipUrl] = useState("");
  const [staySlipBusy, setStaySlipBusy] = useState(false);
  const [stayBusy, setStayBusy] = useState(false);
  const [stayLoadBusy, setStayLoadBusy] = useState(false);
  const [stayErr, setStayErr] = useState<string | null>(null);
  const [stayRooms, setStayRooms] = useState<HotelResortRoomRow[]>([]);
  const stayGalleryRef = useRef<HTMLInputElement>(null);
  const stayIdGalleryRef = useRef<HTMLInputElement>(null);
  const stayIdCamera = useAppCameraCapture({ title: "ถ่ายรูปบัตรประชาชน" });

  const [costOpen, setCostOpen] = useState(false);
  const [costBusy, setCostBusy] = useState(false);
  const [costEditing, setCostEditing] = useState<FinanceCost | null>(null);
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costCategoryId, setCostCategoryId] = useState("");
  const [costNote, setCostNote] = useState("");
  const [costSlipUrl, setCostSlipUrl] = useState("");
  const [costSlipBusy, setCostSlipBusy] = useState(false);
  const [costFilterCat, setCostFilterCat] = useState<string | "all">("all");

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<CostCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeBusy, setIncomeBusy] = useState(false);
  const [incomeEditing, setIncomeEditing] = useState<FinanceIncome | null>(null);
  const [incomeLabel, setIncomeLabel] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");
  const [incomeNote, setIncomeNote] = useState("");
  const [incomeSlipUrl, setIncomeSlipUrl] = useState("");
  const [incomeSlipBusy, setIncomeSlipBusy] = useState(false);

  const [incomeCatModalOpen, setIncomeCatModalOpen] = useState(false);
  const [incomeCatFormOpen, setIncomeCatFormOpen] = useState(false);
  const [incomeCatEdit, setIncomeCatEdit] = useState<IncomeCategory | null>(null);
  const [incomeCatName, setIncomeCatName] = useState("");
  const [incomeCatBusy, setIncomeCatBusy] = useState(false);
  const [incomeCatErr, setIncomeCatErr] = useState<string | null>(null);

  const filtersActive = financeRange !== "MONTH" || Boolean(keyword.trim());

  const customIncomeCategories = useMemo(
    () => incomeCategories.filter((c) => c.kind === "CUSTOM" && !c.isBuiltin),
    [incomeCategories],
  );

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/hotel-resort/cost-categories", { cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
    const j = (await res.json()) as { categories?: CostCategory[] };
    const list = Array.isArray(j.categories) ? j.categories : [];
    setCategories(list);
    setCostCategoryId((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ""));
    return list;
  }, []);

  const loadIncomeCategories = useCallback(async () => {
    const res = await fetch("/api/hotel-resort/income-categories", {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
    const j = (await res.json()) as { categories?: IncomeCategory[] };
    const list = Array.isArray(j.categories) ? j.categories : [];
    setIncomeCategories(list);
    const customs = list.filter((c) => c.kind === "CUSTOM" && !c.isBuiltin);
    setIncomeCategoryId((prev) =>
      prev && customs.some((c) => c.id === prev) ? prev : customs[0]?.id ?? "",
    );
    return list;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ range: financeRange });
      if (financeRange === "CUSTOM") {
        if (dateFrom) qs.set("from", dateFrom);
        if (dateTo) qs.set("to", dateTo);
      }
      const [finRes] = await Promise.all([
        fetch(`/api/hotel-resort/finance-summary?${qs}`, { cache: "no-store", credentials: "include" }),
        loadCategories().catch(() => [] as CostCategory[]),
        loadIncomeCategories().catch(() => [] as IncomeCategory[]),
      ]);
      if (!finRes.ok) throw new Error(await hotelResortFetchErrorMessage(finRes));
      const j = (await finRes.json()) as {
        buckets?: FinanceBucket[];
        totalRevenue?: number;
        totalCost?: number;
        totalRevenue7d?: number;
        totalCost7d?: number;
        rangeLabel?: string;
        stays?: FinanceStay[];
        costs?: FinanceCost[];
        incomes?: FinanceIncome[];
      };
      setBuckets(Array.isArray(j.buckets) ? j.buckets : []);
      setTotalRevenue(j.totalRevenue ?? j.totalRevenue7d ?? 0);
      setTotalCost(j.totalCost ?? j.totalCost7d ?? 0);
      setFinanceRangeLabel(j.rangeLabel ?? "ช่วงที่เลือก");
      setStays(Array.isArray(j.stays) ? j.stays : []);
      setCosts(Array.isArray(j.costs) ? j.costs : []);
      setIncomes(Array.isArray(j.incomes) ? j.incomes : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดการเงินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [financeRange, dateFrom, dateTo, loadCategories, loadIncomeCategories]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectFinanceRange(next: FinanceRange) {
    setFinanceRange(next);
    if (next === "CUSTOM" && !dateFrom && !dateTo) {
      const t = bangkokTodayYmd();
      setDateFrom(`${t.slice(0, 7)}-01`);
      setDateTo(t);
    }
  }

  function resetFilters() {
    const t = bangkokTodayYmd();
    setFinanceRange("MONTH");
    setDateFrom(`${t.slice(0, 7)}-01`);
    setDateTo(t);
    setKeyword("");
  }

  const kw = keyword.trim().toLowerCase();

  const filteredStays = useMemo(() => {
    if (!kw) return stays;
    return stays.filter((s) => {
      const hay = [s.guestName, s.guestPhone, s.roomNumber, s.roomTypeName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [stays, kw]);

  const filteredCosts = useMemo(() => {
    let list = costs;
    if (costFilterCat !== "all") {
      list = list.filter((c) => c.categoryId === costFilterCat);
    }
    if (!kw) return list;
    return list.filter((c) => {
      const hay = [c.label, c.note, c.categoryName].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(kw);
    });
  }, [costs, kw, costFilterCat]);

  const filteredHistoryRows = useMemo(() => {
    type Row =
      | { key: string; sortAt: string; kind: "stay"; stay: FinanceStay }
      | { key: string; sortAt: string; kind: "income"; income: FinanceIncome };

    const rows: Row[] = [];
    const showStays = incomeFilterCat === "all" || incomeFilterCat === "ROOM_STAY";
    const showIncomes = incomeFilterCat !== "ROOM_STAY";

    if (showStays) {
      for (const s of filteredStays) {
        rows.push({ key: `stay-${s.id}`, sortAt: s.checkInAt || s.checkOutAt, kind: "stay", stay: s });
      }
    }
    if (showIncomes) {
      let list = incomes;
      if (incomeFilterCat !== "all") {
        list = list.filter((row) => row.categoryId === incomeFilterCat);
      }
      if (kw) {
        list = list.filter((row) => {
          const hay = [row.label, row.note, row.categoryName].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(kw);
        });
      }
      for (const row of list) {
        rows.push({ key: `income-${row.id}`, sortAt: row.earnedAt, kind: "income", income: row });
      }
    }
    return rows.sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0));
  }, [filteredStays, incomes, incomeFilterCat, kw]);

  const chartBuckets = useMemo(() => {
    const max = Math.max(1, ...buckets.map((x) => Math.max(x.revenueBaht, x.costBaht)));
    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      revenue: b.revenueBaht,
      cost: b.costBaht,
      revenuePct: (b.revenueBaht / max) * 100,
      costPct: (b.costBaht / max) * 100,
    }));
  }, [buckets]);

  function resetCostForm() {
    setCostEditing(null);
    const preferred =
      costFilterCat !== "all" && categories.some((c) => c.id === costFilterCat)
        ? costFilterCat
        : categories[0]?.id ?? "";
    setCostCategoryId(preferred);
    setCostLabel("");
    setCostAmount("");
    setCostNote("");
    setCostSlipUrl("");
  }

  function openCostCreate() {
    if (categories.length === 0) {
      setCatErr(null);
      setCatFormOpen(false);
      setCatModalOpen(true);
      return;
    }
    resetCostForm();
    setCostOpen(true);
  }

  function openCostEdit(c: FinanceCost) {
    setCostEditing(c);
    setCostCategoryId(c.categoryId ?? categories[0]?.id ?? "");
    setCostLabel(c.label);
    setCostAmount(String(c.amountBaht));
    setCostNote(c.note ?? "");
    setCostSlipUrl(c.paymentSlipUrl?.trim() ?? "");
    setCostOpen(true);
  }

  async function uploadCostSlip(file: File) {
    setCostSlipBusy(true);
    setError(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/hotel-resort/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { url?: string; imageUrl?: string; error?: string } | null;
      const url = j?.url ?? j?.imageUrl;
      if (!res.ok || typeof url !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setCostSlipUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setCostSlipBusy(false);
    }
  }

  async function onPickSlipFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadCostSlip(file);
  }

  async function submitCost() {
    setCostBusy(true);
    setError(null);
    try {
      if (!costCategoryId) throw new Error("เลือกหมวดหมู่รายจ่าย หรือเพิ่มหมวดก่อน");
      const label = costLabel.trim();
      const amount = Math.round(Number(costAmount || 0));
      if (!label) throw new Error("กรอกรายละเอียดรายการ");
      if (amount < 1) throw new Error("กรอกจำนวนเงินให้ถูกต้อง");
      const payload = {
        label,
        amountBaht: amount,
        categoryId: costCategoryId,
        note: costNote.trim() || null,
        paymentSlipUrl: costSlipUrl.trim() || null,
      };
      const res = await fetch(
        costEditing ? `/api/hotel-resort/costs/${costEditing.id}` : "/api/hotel-resort/costs",
        {
          method: costEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setCostOpen(false);
      resetCostForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกต้นทุนไม่สำเร็จ");
    } finally {
      setCostBusy(false);
    }
  }

  async function deleteCost(c: FinanceCost) {
    const ok = await notice.confirm(`ลบรายจ่าย «${c.label}» ใช่หรือไม่?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/costs/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบรายจ่ายไม่สำเร็จ";
      setError(msg);
      notice.error(msg);
    }
  }

  function openCatCreate() {
    setCatEdit(null);
    setCatName("");
    setCatErr(null);
    setCatFormOpen(true);
  }

  function openCatEdit(c: CostCategory) {
    setCatEdit(c);
    setCatName(c.name);
    setCatErr(null);
    setCatFormOpen(true);
  }

  async function submitCategory() {
    setCatBusy(true);
    setCatErr(null);
    try {
      const name = catName.trim();
      if (!name) {
        setCatErr("กรอกชื่อหมวดหมู่");
        return;
      }
      if (catEdit) {
        const res = await fetch(`/api/hotel-resort/cost-categories/${catEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      } else {
        const res = await fetch("/api/hotel-resort/cost-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      }
      setCatFormOpen(false);
      setCatEdit(null);
      setCatName("");
      await loadCategories();
      await load();
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setCatBusy(false);
    }
  }

  async function deleteCategory(c: CostCategory) {
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${c.name}» ใช่หรือไม่?\n(ถ้ามีรายจ่ายในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    setCatErr(null);
    try {
      const res = await fetch(`/api/hotel-resort/cost-categories/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      if (costFilterCat === c.id) setCostFilterCat("all");
      await loadCategories();
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ";
      setCatErr(msg);
      notice.error(msg);
    }
  }

  function resetIncomeForm() {
    setIncomeEditing(null);
    const preferred =
      incomeFilterCat !== "all" &&
      incomeFilterCat !== "ROOM_STAY" &&
      customIncomeCategories.some((c) => c.id === incomeFilterCat)
        ? incomeFilterCat
        : customIncomeCategories[0]?.id ?? "";
    setIncomeCategoryId(preferred);
    setIncomeLabel("");
    setIncomeAmount("");
    setIncomeNote("");
    setIncomeSlipUrl("");
  }

  function openIncomeCreate() {
    if (customIncomeCategories.length === 0) {
      setIncomeCatErr(null);
      setIncomeCatFormOpen(false);
      setIncomeCatModalOpen(true);
      return;
    }
    resetIncomeForm();
    setIncomeOpen(true);
  }

  function openIncomeEdit(row: FinanceIncome) {
    setIncomeEditing(row);
    setIncomeCategoryId(row.categoryId);
    setIncomeLabel(row.label);
    setIncomeAmount(String(row.amountBaht));
    setIncomeNote(row.note ?? "");
    setIncomeSlipUrl(row.paymentSlipUrl?.trim() ?? "");
    setIncomeOpen(true);
  }

  async function uploadIncomeSlip(file: File) {
    setIncomeSlipBusy(true);
    setError(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/hotel-resort/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { url?: string; imageUrl?: string; error?: string } | null;
      const url = j?.url ?? j?.imageUrl;
      if (!res.ok || typeof url !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setIncomeSlipUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setIncomeSlipBusy(false);
    }
  }

  async function onPickIncomeSlipFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadIncomeSlip(file);
  }

  async function submitIncome() {
    setIncomeBusy(true);
    setError(null);
    try {
      if (!incomeCategoryId) throw new Error("เลือกหมวดหมู่รายรับ หรือเพิ่มหมวดก่อน");
      const label = incomeLabel.trim();
      const amount = Math.round(Number(incomeAmount || 0));
      if (!label) throw new Error("กรอกรายละเอียดรายการ");
      if (amount < 1) throw new Error("กรอกจำนวนเงินให้ถูกต้อง");
      const payload = {
        label,
        amountBaht: amount,
        categoryId: incomeCategoryId,
        note: incomeNote.trim() || null,
        paymentSlipUrl: incomeSlipUrl.trim() || null,
      };
      const res = await fetch(
        incomeEditing ? `/api/hotel-resort/incomes/${incomeEditing.id}` : "/api/hotel-resort/incomes",
        {
          method: incomeEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setIncomeOpen(false);
      resetIncomeForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกรายรับไม่สำเร็จ");
    } finally {
      setIncomeBusy(false);
    }
  }

  async function deleteIncome(row: FinanceIncome) {
    const ok = await notice.confirm(`ลบรายรับ «${row.label}» ใช่หรือไม่?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/incomes/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบรายรับไม่สำเร็จ";
      setError(msg);
      notice.error(msg);
    }
  }

  function openIncomeCatCreate() {
    setIncomeCatEdit(null);
    setIncomeCatName("");
    setIncomeCatErr(null);
    setIncomeCatFormOpen(true);
  }

  function openIncomeCatEdit(c: IncomeCategory) {
    if (c.isBuiltin || c.kind !== "CUSTOM") return;
    setIncomeCatEdit(c);
    setIncomeCatName(c.name);
    setIncomeCatErr(null);
    setIncomeCatFormOpen(true);
  }

  async function submitIncomeCategory() {
    setIncomeCatBusy(true);
    setIncomeCatErr(null);
    try {
      const name = incomeCatName.trim();
      if (!name) {
        setIncomeCatErr("กรอกชื่อหมวดหมู่");
        return;
      }
      if (incomeCatEdit) {
        const res = await fetch(`/api/hotel-resort/income-categories/${incomeCatEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      } else {
        const res = await fetch("/api/hotel-resort/income-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      }
      setIncomeCatFormOpen(false);
      setIncomeCatEdit(null);
      setIncomeCatName("");
      await loadIncomeCategories();
      await load();
    } catch (e) {
      setIncomeCatErr(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setIncomeCatBusy(false);
    }
  }

  async function deleteIncomeCategory(c: IncomeCategory) {
    if (c.isBuiltin || c.kind !== "CUSTOM") return;
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${c.name}» ใช่หรือไม่?\n(ถ้ามีรายรับในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    setIncomeCatErr(null);
    try {
      const res = await fetch(`/api/hotel-resort/income-categories/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      if (incomeFilterCat === c.id) setIncomeFilterCat("all");
      await loadIncomeCategories();
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ";
      setIncomeCatErr(msg);
      notice.error(msg);
    }
  }

  function openStayEdit(s: FinanceStay) {
    setStayEdit(s);
    setStayGuestName(s.guestName);
    setStayGuestPhone(s.guestPhone ?? "");
    setStayNationalId("");
    setStayNationality("ไทย");
    setStayGuestAddress(s.guestAddress ?? "");
    setStayGuestTaxId(s.guestTaxId ?? "");
    setStayIdCardImageUrl(null);
    setStayRoomId(s.roomId ?? "");
    setStayCheckIn(toDateInput(s.checkInAt));
    setStayCheckOut(toDateInput(s.checkOutAt));
    setStayStatus(s.status);
    setStayPaymentMethod(isHotelResortPaymentMethod(s.paymentMethod) ? s.paymentMethod : "CASH");
    setStayNote(s.note ?? "");
    setStayTotal(String(s.totalBaht));
    setStayPaid(String(s.amountPaidBaht));
    setStaySlipUrl(s.paymentSlipUrl?.trim() ?? "");
    setStayErr(null);
    setStayLoadBusy(true);
    void (async () => {
      try {
        const [roomsRes, bookingRes] = await Promise.all([
          fetch("/api/hotel-resort/rooms", { cache: "no-store", credentials: "include" }),
          fetch(`/api/hotel-resort/bookings/${s.id}`, { cache: "no-store", credentials: "include" }),
        ]);
        if (roomsRes.ok) {
          const j = (await roomsRes.json()) as { rooms?: HotelResortRoomRow[] };
          setStayRooms(Array.isArray(j.rooms) ? j.rooms : []);
        }
        if (!bookingRes.ok) throw new Error(await hotelResortFetchErrorMessage(bookingRes));
        const detail = (await bookingRes.json()) as {
          booking?: {
            guestName?: string;
            guestPhone?: string | null;
            roomId?: string | null;
            checkInAt?: string;
            checkOutAt?: string;
            status?: HotelResortBookingStatus;
            paymentMethod?: string | null;
            note?: string | null;
            totalBaht?: number;
            amountPaidBaht?: number;
            paymentSlipUrl?: string | null;
            idCardImageUrl?: string | null;
            nationalId?: string | null;
            nationality?: string | null;
            guestAddress?: string | null;
            guestTaxId?: string | null;
          };
        };
        const b = detail.booking;
        if (!b) return;
        setStayGuestName(b.guestName ?? s.guestName);
        setStayGuestPhone(b.guestPhone ?? s.guestPhone ?? "");
        setStayNationalId(b.nationalId ?? "");
        setStayNationality(b.nationality?.trim() || "ไทย");
        setStayGuestAddress(b.guestAddress ?? s.guestAddress ?? "");
        setStayGuestTaxId(b.guestTaxId ?? s.guestTaxId ?? "");
        setStayIdCardImageUrl(b.idCardImageUrl ?? null);
        setStayRoomId(b.roomId ?? s.roomId ?? "");
        setStayCheckIn(toDateInput(b.checkInAt ?? s.checkInAt));
        setStayCheckOut(toDateInput(b.checkOutAt ?? s.checkOutAt));
        if (b.status) setStayStatus(b.status);
        setStayPaymentMethod(isHotelResortPaymentMethod(b.paymentMethod) ? b.paymentMethod : "CASH");
        setStayNote(b.note ?? "");
        setStayTotal(String(b.totalBaht ?? s.totalBaht));
        setStayPaid(String(b.amountPaidBaht ?? s.amountPaidBaht));
        setStaySlipUrl(b.paymentSlipUrl?.trim() ?? "");
      } catch (e) {
        setStayErr(e instanceof Error ? e.message : "โหลดข้อมูลการจองไม่สำเร็จ");
      } finally {
        setStayLoadBusy(false);
      }
    })();
  }

  async function uploadStayIdCard(file: File) {
    setStaySlipBusy(true);
    setStayErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/hotel-resort/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { url?: string; imageUrl?: string; error?: string } | null;
      const url = j?.url ?? j?.imageUrl;
      if (!res.ok || typeof url !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดรูปบัตรไม่สำเร็จ");
      }
      setStayIdCardImageUrl(url);
    } catch (err) {
      setStayErr(err instanceof Error ? err.message : "อัปโหลดรูปบัตรไม่สำเร็จ");
    } finally {
      setStaySlipBusy(false);
    }
  }

  async function uploadStaySlip(file: File) {
    setStaySlipBusy(true);
    setStayErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/hotel-resort/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { url?: string; imageUrl?: string; error?: string } | null;
      const url = j?.url ?? j?.imageUrl;
      if (!res.ok || typeof url !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setStaySlipUrl(url);
    } catch (err) {
      setStayErr(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setStaySlipBusy(false);
    }
  }

  async function onPickStaySlipFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadStaySlip(file);
  }

  async function submitStayEdit() {
    if (!stayEdit) return;
    const name = stayGuestName.trim();
    if (!name) {
      setStayErr("กรอกชื่อแขก");
      return;
    }
    const phone = stayGuestPhone.trim();
    if (!phone) {
      setStayErr("กรอกเบอร์โทร");
      return;
    }
    if (!stayRoomId) {
      setStayErr("เลือกห้อง");
      return;
    }
    if (!stayCheckIn || !stayCheckOut) {
      setStayErr("กรอกวันเช็คอินและเช็คเอาท์");
      return;
    }
    if (stayCheckOut <= stayCheckIn) {
      setStayErr("วันเช็คเอาท์ต้องหลังวันเช็คอิน");
      return;
    }
    const total = Number(stayTotal);
    const paid = Number(stayPaid);
    if (!Number.isFinite(total) || total < 0) {
      setStayErr("ยอดรวมไม่ถูกต้อง");
      return;
    }
    if (!Number.isFinite(paid) || paid < 0) {
      setStayErr("ยอดชำระไม่ถูกต้อง");
      return;
    }
    const slip = staySlipUrl.trim() || null;
    if (hotelResortPaymentRequiresSlip(stayPaymentMethod, Math.round(paid)) && !slip) {
      setStayErr("แนบสลิปชำระเงินก่อนบันทึก");
      return;
    }
    setStayBusy(true);
    setStayErr(null);
    try {
      const res = await fetch(`/api/hotel-resort/bookings/${stayEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guestName: name,
          guestPhone: phone,
          nationalId: stayNationalId.trim() || null,
          nationality: stayNationality.trim() || null,
          guestAddress: stayGuestAddress.trim() || null,
          guestTaxId: stayGuestTaxId.trim() || null,
          idCardImageUrl: stayIdCardImageUrl,
          roomId: stayRoomId,
          checkInAt: stayCheckIn,
          checkOutAt: stayCheckOut,
          status: stayStatus,
          paymentMethod: stayPaymentMethod,
          note: stayNote.trim() || null,
          totalBaht: Math.round(total),
          amountPaidBaht: Math.round(paid),
          paymentSlipUrl: slip,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setStayEdit(null);
      await load();
    } catch (e) {
      setStayErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setStayBusy(false);
    }
  }

  async function deleteStay(s: FinanceStay) {
    const ok = await notice.confirm(`ลบรายรับของ «${s.guestName}» ใช่หรือไม่?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/bookings/${s.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบรายรับไม่สำเร็จ";
      setError(msg);
      notice.error(msg);
    }
  }

  const listItemClass =
    "rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4";

  function tabPillClass(active: boolean) {
    return cn(
      "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:min-h-[44px] sm:px-3 sm:text-sm",
      active ? cn(hotelResortNavActiveClass) : cn("ring-1 ring-transparent", hotelResortNavIdleClass),
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {notice.popup}
      {error ? <HotelResortErrorBanner message={error} /> : null}

      <section aria-label={`สรุปการเงิน ${financeRangeLabel}`}>
        <ul className={hotelResortFinanceStatsGridClass}>
          <li className="rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              รายได้ · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              ฿{formatThb(totalRevenue)}
            </p>
          </li>
          <li className="rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              ต้นทุน · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              ฿{formatThb(totalCost)}
            </p>
          </li>
          <li
            className={cn(
              "rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40",
              hotelResortFinanceStatTailClass,
            )}
          >
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              กำไรโดยประมาณ
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-[#1e1b4b] sm:text-3xl">
              ฿{formatThb(totalRevenue - totalCost)}
            </p>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="hotel-resort-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 text-xs font-black text-[#4d47b6]",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span>{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="hotel-resort-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center px-3 text-xs font-black text-[#4d47b6]",
                  chartsOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                )}
              >
                {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void load()}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชข้อมูลรายงาน"
                title="รีเฟรช"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[1rem] px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                  "disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-1.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </HotelResortButton>
            </div>
          }
        />

        <div
          id="hotel-resort-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            <FinanceRangeChip label="วันนี้" active={financeRange === "TODAY"} onClick={() => selectFinanceRange("TODAY")} />
            <FinanceRangeChip label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => selectFinanceRange("MONTH")} />
            <FinanceRangeChip label="ปีนี้" active={financeRange === "YEAR"} onClick={() => selectFinanceRange("YEAR")} />
            <FinanceRangeChip
              label="กำหนดเอง"
              active={financeRange === "CUSTOM"}
              onClick={() => selectFinanceRange("CUSTOM")}
            />
          </div>
          {financeRange === "CUSTOM" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="ตั้งแต่วันที่ กรุงเทพ"
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="ถึงวันที่ กรุงเทพ"
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
            </div>
          ) : null}
          <div
            className={cn(
              "grid gap-3",
              filtersActive ? "sm:grid-cols-12" : undefined,
            )}
          >
            <label className={cn("min-w-0", filtersActive ? "sm:col-span-9" : undefined)}>
              <span className="sr-only">ค้นหาชื่อแขก เบอร์โทร หรือห้อง</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาชื่อแขก เบอร์โทร หรือห้อง…"
                aria-label="ค้นหาชื่อแขก เบอร์โทร หรือห้อง"
                inputMode="search"
                className={cn(hotelResortFieldClass, "mt-0")}
              />
            </label>
            {filtersActive ? (
              <div className="flex items-stretch sm:col-span-3">
                <HotelResortButton
                  type="button"
                  onClick={() => resetFilters()}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6]",
                  )}
                  aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
                >
                  รีเซ็ต · เดือนนี้
                </HotelResortButton>
              </div>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
        </div>
          {chartsOpen ? (
            <div id="hotel-resort-finance-charts" className="space-y-4">
              <p className="text-sm font-black text-[#1e1b4b]">รายได้เทียบต้นทุน · {financeRangeLabel}</p>
              {loading ? (
                <div className={`h-40 ${hotelResortSkeletonClass}`} aria-hidden />
              ) : (
                <AppSparkChartPanel className="w-full min-w-0">
                  <AppRevenueCostColumnChart
                    className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                    compact
                    title=""
                    subtitle=""
                    emptyText="ยังไม่มีข้อมูลในช่วงนี้"
                    buckets={chartBuckets}
                    formatTitle={(b) =>
                      `${b.label}: รายได้ ฿${formatThb(b.revenue)} · ต้นทุน ฿${formatThb(b.cost)}`
                    }
                  />
                </AppSparkChartPanel>
              )}
            </div>
          ) : null}

        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          <nav className={hotelResortFinanceSubTabShellClass} aria-label="เมนูการเงิน">
            <div className="flex w-full min-w-0 gap-1" role="tablist">
              {PANEL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={panel === t.id}
                  id={`hotel-finance-tab-${t.id}`}
                  aria-controls={`hotel-finance-panel-${t.id}`}
                  onClick={() => setPanel(t.id)}
                  className={tabPillClass(panel === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-4">
            {panel === "history" ? (
              <div id="hotel-finance-panel-history" role="tabpanel" aria-labelledby="hotel-finance-tab-history">
                <AppSectionHeader
                  tone="slate"
                  title="ประวัติ / รายรับ"
                  className="flex flex-row items-start justify-between gap-3 sm:items-center"
                  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                  action={
                    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                      <HotelResortButton
                        type="button"
                        onClick={() => {
                          setIncomeCatErr(null);
                          setIncomeCatFormOpen(false);
                          setIncomeCatModalOpen(true);
                        }}
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
                        )}
                        aria-label="จัดการหมวดหมู่รายรับ"
                        title="หมวดหมู่"
                      >
                        หมวดหมู่
                      </HotelResortButton>
                      <HotelResortButton
                        type="button"
                        onClick={openIncomeCreate}
                        className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
                        aria-label="เพิ่มรายรับ"
                      >
                        <span className="sm:hidden">+</span>
                        <span className="hidden sm:inline">+ เพิ่มรายรับ</span>
                      </HotelResortButton>
                    </div>
                  }
                />
                <p className="mt-2 text-xs font-semibold text-[#66638c]">
                  ตามช่วง · {financeRangeLabel}
                  {kw ? ` · ค้นหา «${keyword.trim()}»` : ""}
                </p>

                <div
                  className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
                  role="group"
                  aria-label="กรองตามหมวดหมู่รายรับ — เลื่อนซ้ายขวาได้"
                >
                  <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
                    <button
                      type="button"
                      onClick={() => setIncomeFilterCat("all")}
                      className={cn(
                        "shrink-0 snap-start transition",
                        hotelResortFilterChipClass(incomeFilterCat === "all"),
                      )}
                      aria-pressed={incomeFilterCat === "all"}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeFilterCat("ROOM_STAY")}
                      className={cn(
                        "shrink-0 snap-start transition",
                        hotelResortFilterChipClass(incomeFilterCat === "ROOM_STAY"),
                      )}
                      aria-pressed={incomeFilterCat === "ROOM_STAY"}
                    >
                      ค่าห้อง / ที่พัก
                    </button>
                    {customIncomeCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setIncomeFilterCat(c.id)}
                        className={cn(
                          "shrink-0 snap-start transition",
                          hotelResortFilterChipClass(incomeFilterCat === c.id),
                        )}
                        aria-pressed={incomeFilterCat === c.id}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className={`mt-4 h-32 ${hotelResortSkeletonClass}`} aria-hidden />
                ) : filteredHistoryRows.length === 0 ? (
                  <AppEmptyState tone="slate" className="mt-4">
                    {customIncomeCategories.length === 0 && incomeFilterCat !== "ROOM_STAY"
                      ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายรับ — หรือดูค่าห้องจากการจอง"
                      : "ไม่พบรายการในช่วงนี้"}
                  </AppEmptyState>
                ) : (
                  <div
                    className={cn("mt-4 max-h-[min(70vh,40rem)] min-h-0", appDashboardInnerScrollClass)}
                    role="region"
                    aria-label="ประวัติรายรับ"
                  >
                    <ul className="space-y-2 pr-0.5">
                      {filteredHistoryRows.map((row) => {
                        if (row.kind === "income") {
                          const item = row.income;
                          const slip = item.paymentSlipUrl?.trim() || "";
                          return (
                            <li key={row.key} className={cn(listItemClass, "flex items-start gap-2")}>
                              {slip ? (
                                <AppImageThumb
                                  src={slip}
                                  alt={`สลิป ${item.label}`}
                                  onOpen={() => slipLb.open(slip)}
                                  className="h-14 w-14 shrink-0"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#66638c]">
                                  {formatThaiDateTime(item.earnedAt)}
                                </p>
                                <p className="mt-0.5 text-sm font-black text-[#1e1b4b]">{item.label}</p>
                                <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                                  {item.categoryName}
                                </p>
                                {item.note ? (
                                  <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{item.note}</p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <p className="text-lg font-black tabular-nums text-emerald-700">
                                  ฿{formatThb(item.amountBaht)}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openIncomeEdit(item)}
                                    className={assetRowEditIconButtonClass}
                                    aria-label={`แก้ไขรายรับ ${item.label}`}
                                    title="แก้ไข"
                                  >
                                    <IconRowEdit className="h-4 w-4" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteIncome(item)}
                                    className={assetRowRemoveIconButtonClass}
                                    aria-label={`ลบรายรับ ${item.label}`}
                                    title="ลบ"
                                  >
                                    <IconRowRemove className="h-4 w-4" aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        }

                        const s = row.stay;
                        const depositSlip = s.depositSlipUrl?.trim() || "";
                        const slip = s.paymentSlipUrl?.trim() || "";
                        return (
                          <li key={row.key} className={listItemClass}>
                            <div className="flex items-start gap-2">
                              {depositSlip || slip ? (
                                <div className="flex shrink-0 flex-col gap-1">
                                  {depositSlip ? (
                                    <AppImageThumb
                                      src={depositSlip}
                                      alt={`สลิปมัดจำ ${s.guestName}`}
                                      onOpen={() => slipLb.open(depositSlip)}
                                      className="h-14 w-14 shrink-0"
                                    />
                                  ) : null}
                                  {slip ? (
                                    <AppImageThumb
                                      src={slip}
                                      alt={`สลิปชำระเพิ่ม ${s.guestName}`}
                                      onOpen={() => slipLb.open(slip)}
                                      className="h-14 w-14 shrink-0"
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-[#1e1b4b]">{s.guestName}</p>
                                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                                  {s.roomNumber ? `ห้อง ${s.roomNumber}` : "ยังไม่ผูกห้อง"}
                                  {s.roomTypeName ? ` · ${s.roomTypeName}` : ""}
                                  {s.guestPhone ? ` · ${s.guestPhone}` : ""}
                                </p>
                                <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                                  ค่าห้อง / ที่พัก · {formatThaiDate(s.checkInAt)} → {formatThaiDate(s.checkOutAt)} ·{" "}
                                  {HOTEL_BOOKING_STATUS_LABELS[s.status]}
                                  {s.paymentMethod ? ` · ${hotelResortPaymentMethodLabel(s.paymentMethod)}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <p className="text-lg font-black tabular-nums text-emerald-700">
                                  ฿{formatThb(s.amountPaidBaht)}
                                </p>
                                <p className="text-[11px] font-semibold text-[#66638c]">
                                  จากยอด ฿{formatThb(s.totalBaht)} · {HOTEL_PAYMENT_STATUS_LABELS[s.paymentStatus]}
                                </p>
                                <div className="flex items-center gap-1">
                                  <AppSlipPrintIconButton
                                    onClick={() => setStayPrint(s)}
                                    aria-label={`พิมพ์เอกสาร ${s.guestName}`}
                                    title="พิมพ์เอกสาร"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openStayEdit(s)}
                                    className={assetRowEditIconButtonClass}
                                    aria-label={`แก้ไขรายรับ ${s.guestName}`}
                                    title="แก้ไข"
                                  >
                                    <IconRowEdit className="h-4 w-4" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteStay(s)}
                                    className={assetRowRemoveIconButtonClass}
                                    aria-label={`ลบรายรับ ${s.guestName}`}
                                    title="ลบ"
                                  >
                                    <IconRowRemove className="h-4 w-4" aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {panel === "expenses" ? (
              <div id="hotel-finance-panel-expenses" role="tabpanel" aria-labelledby="hotel-finance-tab-expenses">
                <AppSectionHeader
                  tone="slate"
                  title="รายจ่าย"
                  className="flex flex-row items-start justify-between gap-3 sm:items-center"
                  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                  action={
                    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                      <HotelResortButton
                        type="button"
                        onClick={() => {
                          setCatErr(null);
                          setCatFormOpen(false);
                          setCatModalOpen(true);
                        }}
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
                        )}
                        aria-label="จัดการหมวดหมู่รายจ่าย"
                        title="หมวดหมู่"
                      >
                        หมวดหมู่
                      </HotelResortButton>
                      <HotelResortButton
                        type="button"
                        onClick={openCostCreate}
                        className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
                        aria-label="เพิ่มรายจ่าย"
                      >
                        <span className="sm:hidden">+</span>
                        <span className="hidden sm:inline">+ เพิ่มรายจ่าย</span>
                      </HotelResortButton>
                    </div>
                  }
                />
                <p className="mt-2 text-xs font-semibold text-[#66638c]">ต้นทุน · {financeRangeLabel}</p>

                <div
                  className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
                  role="group"
                  aria-label="กรองตามหมวดหมู่ — เลื่อนซ้ายขวาได้"
                >
                  <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
                    <button
                      type="button"
                      onClick={() => setCostFilterCat("all")}
                      className={cn("shrink-0 snap-start transition", hotelResortFilterChipClass(costFilterCat === "all"))}
                      aria-pressed={costFilterCat === "all"}
                    >
                      ทั้งหมด
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCostFilterCat(c.id)}
                        className={cn(
                          "shrink-0 snap-start transition",
                          hotelResortFilterChipClass(costFilterCat === c.id),
                        )}
                        aria-pressed={costFilterCat === c.id}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {categories.length === 0 ? (
                  <p className="mt-3 text-xs font-semibold text-amber-800">
                    สร้างหมวดก่อนจึงจะบันทึกรายจ่ายได้ — กด «หมวดหมู่»
                  </p>
                ) : null}

                {loading ? (
                  <div className={`mt-4 h-28 ${hotelResortSkeletonClass}`} aria-hidden />
                ) : filteredCosts.length === 0 ? (
                  <AppEmptyState tone="slate" className="mt-4">
                    {categories.length === 0
                      ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายจ่าย"
                      : costs.length === 0
                        ? "ยังไม่มีรายจ่ายในช่วงนี้"
                        : "ไม่มีรายจ่ายในหมวดนี้"}
                  </AppEmptyState>
                ) : (
                  <div
                    className={cn("mt-4 max-h-[min(70vh,40rem)] min-h-0", appDashboardInnerScrollClass)}
                    role="region"
                    aria-label="รายการรายจ่าย"
                  >
                    <ul className="space-y-2 pr-0.5">
                      {filteredCosts.map((c) => {
                        const slip = c.paymentSlipUrl?.trim() || "";
                        return (
                          <li key={c.id} className={cn(listItemClass, "flex items-start gap-2")}>
                            {slip ? (
                              <AppImageThumb
                                src={slip}
                                alt={`สลิป ${c.label}`}
                                onOpen={() => slipLb.open(slip)}
                                className="h-14 w-14 shrink-0"
                              />
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#66638c]">{formatThaiDateTime(c.spentAt)}</p>
                              <p className="mt-0.5 text-sm font-black text-[#1e1b4b]">{c.label}</p>
                              <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                                {c.categoryName ?? "ไม่มีหมวด"}
                              </p>
                              {c.note ? (
                                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{c.note}</p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <p className="text-base font-black tabular-nums text-rose-600">
                                ฿{formatThb(c.amountBaht)}
                              </p>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className={assetRowEditIconButtonClass}
                                  aria-label={`แก้ไขรายจ่าย ${c.label}`}
                                  title="แก้ไข"
                                  onClick={() => openCostEdit(c)}
                                >
                                  <IconRowEdit className="h-4 w-4" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  className={assetRowRemoveIconButtonClass}
                                  aria-label={`ลบรายจ่าย ${c.label}`}
                                  title="ลบ"
                                  onClick={() => void deleteCost(c)}
                                >
                                  <IconRowRemove className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </AppDashboardSection>

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิป" />

      <FormModal
        open={costOpen}
        onClose={() => !costBusy && !costSlipBusy && setCostOpen(false)}
        title={costEditing ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}
        mobileCentered
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (!costBusy && !costSlipBusy) {
                setCostOpen(false);
                resetCostForm();
              }
            }}
            onSubmit={() => void submitCost()}
            submitLabel="บันทึก"
            loading={costBusy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมวดหมู่
            <select
              value={costCategoryId}
              onChange={(e) => setCostCategoryId(e.target.value)}
              className={cn(hotelResortFieldClass, "mt-1")}
              aria-label="หมวดหมู่รายจ่าย"
            >
              {categories.length === 0 ? <option value="">ยังไม่มีหมวด</option> : null}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            รายละเอียดรายการ
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={costLabel}
              onChange={(e) => setCostLabel(e.target.value)}
              placeholder="เช่น ค่าไฟ · ซื้อผ้าเช็ดตัว · ค่าซ่อม"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            จำนวนเงิน (บาท)
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              type="number"
              min={1}
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={costNote}
              onChange={(e) => setCostNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </label>
          <div>
            <p className="text-sm font-bold text-[#1e1b4b]">
              รูปสลิป <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            </p>
            <AppGalleryCameraFileInputs
              galleryInputRef={galleryRef}
              cameraInputRef={costCamera.cameraInputRef}
              onChange={(e) => void onPickSlipFile(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => galleryRef.current?.click()}
                onPickCamera={() => costCamera.openCamera((file) => void uploadCostSlip(file))}
                disabled={costBusy || costSlipBusy}
                busy={costSlipBusy}
              />
            </div>
            {costCamera.cameraModal}
            {costSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={costSlipUrl}
                  alt="สลิปรายจ่าย"
                  onOpen={() => slipLb.open(costSlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setCostSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={catModalOpen}
        onClose={() => !catBusy && setCatModalOpen(false)}
        title={catFormOpen ? (catEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่") : "หมวดหมู่รายจ่าย"}
        mobileCentered
        footer={
          catFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                setCatFormOpen(false);
                setCatEdit(null);
                setCatName("");
                setCatErr(null);
              }}
              onSubmit={() => void submitCategory()}
              submitLabel={catEdit ? "บันทึก" : "เพิ่มหมวด"}
              loading={catBusy}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <HotelResortButton
                type="button"
                onClick={() => openCatCreate()}
                className="app-btn-primary rounded-[1rem] px-4 py-2 text-sm font-bold"
              >
                + เพิ่มหมวดหมู่
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setCatModalOpen(false)}
                className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-4 py-2 text-sm font-bold")}
              >
                ปิด
              </HotelResortButton>
            </div>
          )
        }
      >
        {catErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{catErr}</p> : null}
        {catFormOpen ? (
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            ชื่อหมวดหมู่
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="เช่น สาธารณูปโภค · วัสดุสิ้นเปลือง"
              autoFocus
            />
          </label>
        ) : categories.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-6 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/50 bg-white/70 px-3 py-2.5"
              >
                <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{c.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    title="แก้ไข"
                    onClick={() => openCatEdit(c)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    title="ลบ"
                    onClick={() => void deleteCategory(c)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={incomeOpen}
        onClose={() => !incomeBusy && !incomeSlipBusy && setIncomeOpen(false)}
        title={incomeEditing ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
        mobileCentered
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (!incomeBusy && !incomeSlipBusy) {
                setIncomeOpen(false);
                resetIncomeForm();
              }
            }}
            onSubmit={() => void submitIncome()}
            submitLabel="บันทึก"
            loading={incomeBusy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมวดหมู่
            <select
              value={incomeCategoryId}
              onChange={(e) => setIncomeCategoryId(e.target.value)}
              className={cn(hotelResortFieldClass, "mt-1")}
              aria-label="หมวดหมู่รายรับ"
            >
              {customIncomeCategories.length === 0 ? <option value="">ยังไม่มีหมวด</option> : null}
              {customIncomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] font-semibold text-[#8b87b8]">
            ค่าห้อง / ที่พักมาจากการจอง — เพิ่มรายรับอื่นผ่านหมวดที่สร้างเอง
          </p>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            รายละเอียดรายการ
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={incomeLabel}
              onChange={(e) => setIncomeLabel(e.target.value)}
              placeholder="เช่น เช่าห้องประชุม · ขายของฝาก"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            จำนวนเงิน (บาท)
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              type="number"
              min={1}
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={incomeNote}
              onChange={(e) => setIncomeNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </label>
          <div>
            <p className="text-sm font-bold text-[#1e1b4b]">
              รูปสลิป <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            </p>
            <AppGalleryCameraFileInputs
              galleryInputRef={incomeGalleryRef}
              cameraInputRef={incomeCamera.cameraInputRef}
              onChange={(e) => void onPickIncomeSlipFile(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => incomeGalleryRef.current?.click()}
                onPickCamera={() => incomeCamera.openCamera((file) => void uploadIncomeSlip(file))}
                disabled={incomeBusy || incomeSlipBusy}
                busy={incomeSlipBusy}
              />
            </div>
            {incomeCamera.cameraModal}
            {incomeSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={incomeSlipUrl}
                  alt="สลิปรายรับ"
                  onOpen={() => slipLb.open(incomeSlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setIncomeSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={incomeCatModalOpen}
        onClose={() => !incomeCatBusy && setIncomeCatModalOpen(false)}
        title={
          incomeCatFormOpen
            ? incomeCatEdit
              ? "แก้ไขหมวดหมู่รายรับ"
              : "เพิ่มหมวดหมู่รายรับ"
            : "หมวดหมู่รายรับ"
        }
        mobileCentered
        footer={
          incomeCatFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                setIncomeCatFormOpen(false);
                setIncomeCatEdit(null);
                setIncomeCatName("");
                setIncomeCatErr(null);
              }}
              onSubmit={() => void submitIncomeCategory()}
              submitLabel={incomeCatEdit ? "บันทึก" : "เพิ่มหมวด"}
              loading={incomeCatBusy}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <HotelResortButton
                type="button"
                onClick={() => openIncomeCatCreate()}
                className="app-btn-primary rounded-[1rem] px-4 py-2 text-sm font-bold"
              >
                + เพิ่มหมวดหมู่
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setIncomeCatModalOpen(false)}
                className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-4 py-2 text-sm font-bold")}
              >
                ปิด
              </HotelResortButton>
            </div>
          )
        }
      >
        {incomeCatErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{incomeCatErr}</p> : null}
        {incomeCatFormOpen ? (
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            ชื่อหมวดหมู่
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={incomeCatName}
              onChange={(e) => setIncomeCatName(e.target.value)}
              placeholder="เช่น เช่าห้องประชุม · ขายของฝาก"
              autoFocus
            />
          </label>
        ) : incomeCategories.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-6 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="space-y-2">
            {incomeCategories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/50 bg-white/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1e1b4b]">{c.name}</p>
                  {c.isBuiltin ? (
                    <p className="mt-0.5 text-[10px] font-bold text-[#8b87b8]">หมวดหลัก · จากจองห้อง</p>
                  ) : null}
                </div>
                {c.isBuiltin || c.kind !== "CUSTOM" ? (
                  <span className="shrink-0 text-[10px] font-black text-[#9b98c4]">ล็อก</span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไขหมวด ${c.name}`}
                      title="แก้ไข"
                      onClick={() => openIncomeCatEdit(c)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบหมวด ${c.name}`}
                      title="ลบ"
                      onClick={() => void deleteIncomeCategory(c)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={stayEdit != null}
        onClose={() => {
          if (!stayBusy && !stayLoadBusy) setStayEdit(null);
        }}
        title="แก้ไขรายรับ"
        description="ข้อมูลลูกค้า · ใบกำกับภาษี · ห้อง · ยอดชำระ และสลิป"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setStayEdit(null)}
            onSubmit={() => void submitStayEdit()}
            submitLabel={stayBusy ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={stayBusy || staySlipBusy || stayLoadBusy}
            loading={stayBusy}
          />
        }
      >
        <div className="space-y-3">
          {stayLoadBusy ? (
            <p className="text-sm font-semibold text-[#66638c]">กำลังโหลดข้อมูลครบ…</p>
          ) : null}
          {stayErr ? <p className="text-sm font-semibold text-rose-600">{stayErr}</p> : null}
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อแขก</span>
            <input
              value={stayGuestName}
              onChange={(e) => setStayGuestName(e.target.value)}
              className={cn(hotelResortFieldClass, "mt-1")}
              autoComplete="name"
              disabled={stayLoadBusy}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
            <input
              value={stayGuestPhone}
              onChange={(e) => setStayGuestPhone(e.target.value)}
              className={cn(hotelResortFieldClass, "mt-1")}
              inputMode="tel"
              autoComplete="tel"
              disabled={stayLoadBusy}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">เลขบัตรประชาชน</span>
              <input
                value={stayNationalId}
                onChange={(e) => setStayNationalId(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                inputMode="numeric"
                disabled={stayLoadBusy}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">สัญชาติ</span>
              <input
                value={stayNationality}
                onChange={(e) => setStayNationality(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                disabled={stayLoadBusy}
              />
            </label>
          </div>

          <div className="space-y-2 rounded-[1rem] border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
            <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลใบกำกับภาษี</p>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">ที่อยู่ลูกค้า</span>
              <textarea
                value={stayGuestAddress}
                onChange={(e) => setStayGuestAddress(e.target.value)}
                rows={3}
                className={cn(hotelResortFieldClass, "mt-1 min-h-[4.5rem] py-2")}
                placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                disabled={stayLoadBusy}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">เลขประจำตัวผู้เสียภาษี</span>
              <input
                value={stayGuestTaxId}
                onChange={(e) => setStayGuestTaxId(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                inputMode="numeric"
                placeholder="เช่น 0-1234-56789-01-2"
                disabled={stayLoadBusy}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-bold text-[#4d47b6]">รูปบัตรประชาชน</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={stayIdGalleryRef}
              cameraInputRef={stayIdCamera.cameraInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadStayIdCard(file);
              }}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => stayIdGalleryRef.current?.click()}
                onPickCamera={() => stayIdCamera.openCamera((file) => void uploadStayIdCard(file))}
                disabled={stayBusy || staySlipBusy || stayLoadBusy}
                busy={staySlipBusy}
                labels={{ gallery: "เลือกรูปบัตร", camera: "ถ่ายรูปบัตร" }}
              />
            </div>
            {stayIdCamera.cameraModal}
            {stayIdCardImageUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={stayIdCardImageUrl}
                  alt="บัตรประชาชน"
                  onOpen={() => slipLb.open(stayIdCardImageUrl)}
                  className="h-20 w-28"
                />
                <button
                  type="button"
                  onClick={() => setStayIdCardImageUrl(null)}
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold")}
                >
                  ลบรูปบัตร
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีรูปบัตร</p>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ห้อง</span>
            <select
              value={stayRoomId}
              onChange={(e) => {
                const id = e.target.value;
                setStayRoomId(id);
                const room = stayRooms.find((r) => r.id === id);
                if (room && (!stayTotal || stayTotal === "0")) {
                  setStayTotal(String(room.basePriceBaht || ""));
                }
              }}
              className={cn(hotelResortFieldClass, "mt-1 cursor-pointer")}
              disabled={stayLoadBusy}
            >
              <option value="">— เลือกห้อง —</option>
              {stayRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber}
                  {r.roomTypeName ? ` · ${r.roomTypeName}` : ""}
                  {r.basePriceBaht ? ` · ฿${formatThb(r.basePriceBaht)}` : ""}
                </option>
              ))}
              {stayRoomId && !stayRooms.some((r) => r.id === stayRoomId) ? (
                <option value={stayRoomId}>
                  {stayEdit?.roomNumber ?? stayRoomId}
                  {stayEdit?.roomTypeName ? ` · ${stayEdit.roomTypeName}` : ""}
                </option>
              ) : null}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">เช็คอิน</span>
              <input
                type="date"
                value={stayCheckIn}
                onChange={(e) => setStayCheckIn(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                disabled={stayLoadBusy}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">เช็คเอาท์</span>
              <input
                type="date"
                value={stayCheckOut}
                onChange={(e) => setStayCheckOut(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                disabled={stayLoadBusy}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">สถานะการจอง</span>
            <select
              value={stayStatus}
              onChange={(e) => setStayStatus(e.target.value as HotelResortBookingStatus)}
              className={cn(hotelResortFieldClass, "mt-1 cursor-pointer")}
              disabled={stayLoadBusy}
            >
              {(Object.keys(HOTEL_BOOKING_STATUS_LABELS) as HotelResortBookingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {HOTEL_BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ช่องทางชำระ</span>
            <select
              value={stayPaymentMethod}
              onChange={(e) => setStayPaymentMethod(e.target.value as HotelResortPaymentMethod)}
              className={cn(hotelResortFieldClass, "mt-1 cursor-pointer")}
              disabled={stayLoadBusy}
            >
              {HOTEL_RESORT_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {hotelResortPaymentMethodLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">ยอดรวม (บาท)</span>
              <input
                value={stayTotal}
                onChange={(e) => setStayTotal(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                inputMode="decimal"
                disabled={stayLoadBusy}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">ยอดชำระแล้ว</span>
              <input
                value={stayPaid}
                onChange={(e) => setStayPaid(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
                inputMode="decimal"
                disabled={stayLoadBusy}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>
            <textarea
              value={stayNote}
              onChange={(e) => setStayNote(e.target.value)}
              rows={2}
              className={cn(hotelResortFieldClass, "mt-1 min-h-[4rem] py-2")}
              disabled={stayLoadBusy}
            />
          </label>
          <div>
            <p className="text-xs font-bold text-[#4d47b6]">สลิปชำระ (ไม่บังคับ)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={stayGalleryRef}
              cameraInputRef={stayCamera.cameraInputRef}
              onChange={(e) => void onPickStaySlipFile(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => stayGalleryRef.current?.click()}
                onPickCamera={() => stayCamera.openCamera((file) => void uploadStaySlip(file))}
                disabled={stayBusy || staySlipBusy || stayLoadBusy}
                busy={staySlipBusy}
              />
            </div>
            {stayCamera.cameraModal}
            {staySlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={staySlipUrl}
                  alt="สลิปรายรับ"
                  onOpen={() => slipLb.open(staySlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setStaySlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีสลิป — อัปโหลดหรือถ่ายใหม่ได้</p>
            )}
          </div>
        </div>
      </FormModal>

      <HotelResortStayPrintModal
        open={stayPrint != null}
        stay={stayPrint}
        onClose={() => setStayPrint(null)}
      />
    </div>
  );
}

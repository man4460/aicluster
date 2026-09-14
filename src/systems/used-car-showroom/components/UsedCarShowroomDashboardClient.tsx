"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Car, CalendarClock, Filter, Landmark, ClipboardList, TrendingUp, Wallet } from "lucide-react";
import {
  AppEmptyState,
  AppImageThumb,
  AppLabeledImageThumb,
  AppTime24Input,
  prepareImageFileForUpload,
  useAppImageLightbox,
  AppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  USED_CAR_SHOWROOM_DASHBOARD_TAB_ITEMS,
  USED_CAR_SHOWROOM_MANAGE_PATH,
  parseUsedCarShowroomDashboardTab,
  usedCarShowroomDashboardTabHref,
  type UsedCarShowroomDashboardTabKey,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";
import { UsedCarShowroomPageSubNav } from "@/systems/used-car-showroom/components/UsedCarShowroomPageSubNav";
import {
  usedCarShowroomCardIconTileClass,
  usedCarShowroomTonedRowCardClass,
} from "@/systems/used-car-showroom/lib/card-tones";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import { computeFlatInstallment } from "@/systems/used-car-showroom/lib/installment";
import {
  USED_CAR_PAYMENT_METHODS,
  usedCarPaymentMethodLabel,
  type UsedCarPaymentMethod,
} from "@/systems/used-car-showroom/lib/payment-method";
import {
  usedCarShowroomDashboardTabIcon,
  usedCarShowroomPageTitleIcon,
  usedCarShowroomPageTitleTone,
} from "@/systems/used-car-showroom/lib/page-menu-icons";
import {
  USED_CAR_APPOINTMENT_STATUSES,
  USED_CAR_FINANCE_PENDING_STATUSES,
  USED_CAR_RESERVATION_STATUSES,
  USED_CAR_VEHICLE_STATUSES,
  usedCarAppointmentKindLabel,
  usedCarAppointmentStatusLabel,
  usedCarFinanceCaseStatusLabel,
  usedCarReservationSourceLabel,
  usedCarReservationStatusLabel,
  usedCarReservationStatusTone,
  usedCarVehicleStatusLabel,
  usedCarVehicleStatusTone,
} from "@/systems/used-car-showroom/lib/status";
import {
  usedCarShowroomFieldClass,
  usedCarShowroomFilterChipClass,
  usedCarShowroomFilterChipShellClass,
  usedCarShowroomFinanceStatsGridClass,
  usedCarShowroomInlineSubNavBtnClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomPageStackClass,
  usedCarShowroomPrimaryButtonClass,
  usedCarShowroomSectionHeadingClass,
  usedCarShowroomStatInlineClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";

type Stats = {
  stockCount: number;
  prepCount: number;
  salesMonthBaht: number;
  salesMonthCount: number;
  projectedProfitBaht: number;
  financePendingCount: number;
  appointmentsTodayCount: number;
  reservationsPendingCount: number;
};

type ReservationRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: string;
  vehicleTitle: string | null;
  vehicleCoverImageUrl?: string | null;
  depositBaht: number;
  paymentMethod?: string;
  slipImageUrl?: string | null;
  source?: string;
  expiresOn?: string | null;
  note?: string | null;
  createdAt?: string;
};

type AppointmentRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  appointmentOn: string;
  appointmentHm: string;
  kind: string;
  status: string;
  note?: string | null;
  vehicleId?: string | null;
  vehicleTitle: string | null;
  vehicleColor?: string | null;
  vehiclePlateNumber?: string | null;
  vehicleCoverImageUrl?: string | null;
  vehicleAskingPriceBaht?: number | null;
};

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  statusLabel: string;
  askingPriceBaht: number;
  purchaseCostBaht?: number;
  prepCostBaht?: number;
  coverImageUrl: string | null;
  title: string;
  color?: string | null;
  mileageKm?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  bodyType?: string | null;
  plateNumber?: string | null;
  vin?: string | null;
  engineNumber?: string | null;
  hasRegistrationBook?: boolean;
  description?: string | null;
  note?: string | null;
  purchasedAt?: string | null;
  soldAt?: string | null;
  images?: { id: string; imageUrl: string; isCover: boolean; sortOrder: number }[];
  videos?: { id: string; youtubeUrl: string; title: string | null; youtubeId?: string | null }[];
  costLines?: { id: string; kind: string; label: string; amountBaht: number }[];
};

function vehicleStatusPillClass(status: string): string {
  const tone = usedCarVehicleStatusTone(status);
  const map: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return cn(
    "inline-flex max-w-full items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold",
    map[tone] ?? map.sky,
  );
}

type StockEditForm = {
  brand: string;
  model: string;
  year: string;
  color: string;
  mileageKm: string;
  transmission: string;
  fuelType: string;
  plateNumber: string;
  vin: string;
  purchaseCostBaht: string;
  askingPriceBaht: string;
  status: string;
  description: string;
  note: string;
  hasRegistrationBook: boolean;
};

function emptyStockEditForm(): StockEditForm {
  return {
    brand: "",
    model: "",
    year: "",
    color: "",
    mileageKm: "",
    transmission: "",
    fuelType: "",
    plateNumber: "",
    vin: "",
    purchaseCostBaht: "",
    askingPriceBaht: "",
    status: "PREP",
    description: "",
    note: "",
    hasRegistrationBook: false,
  };
}

function vehicleToStockEditForm(v: VehicleRow): StockEditForm {
  return {
    brand: v.brand,
    model: v.model,
    year: v.year != null ? String(v.year) : "",
    color: v.color ?? "",
    mileageKm: v.mileageKm != null ? String(v.mileageKm) : "",
    transmission: v.transmission ?? "",
    fuelType: v.fuelType ?? "",
    plateNumber: v.plateNumber ?? "",
    vin: v.vin ?? "",
    purchaseCostBaht: String(v.purchaseCostBaht ?? 0),
    askingPriceBaht: String(v.askingPriceBaht ?? 0),
    status: v.status,
    description: v.description ?? "",
    note: v.note ?? "",
    hasRegistrationBook: Boolean(v.hasRegistrationBook),
  };
}

function reservationStatusPillClass(status: string): string {
  const tone = usedCarReservationStatusTone(status);
  const map: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
  };
  return cn(
    "inline-flex max-w-full items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold",
    map[tone] ?? map.sky,
  );
}

const DASHBOARD_TAB_ITEMS = USED_CAR_SHOWROOM_DASHBOARD_TAB_ITEMS.map((item) => ({
  ...item,
  icon: usedCarShowroomDashboardTabIcon(item.key),
}));

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

/** จำนวนรถต่อหน้าในแท็บสต็อก */
const STOCK_PAGE_SIZE = 10;

export function UsedCarShowroomDashboardClient({ initialShop }: { initialShop: UsedCarShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseUsedCarShowroomDashboardTab(searchParams.get("tab"));
  const statusFilter = searchParams.get("status");
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();

  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [financeCases, setFinanceCases] = useState<
    {
      id: string;
      status: string;
      financedAmountBaht: number;
      vehicleTitle?: string | null;
      companyName?: string | null;
      note?: string | null;
    }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveSaving, setReserveSaving] = useState(false);
  const [stockDetail, setStockDetail] = useState<VehicleRow | null>(null);
  const [stockEditing, setStockEditing] = useState(false);
  const [stockEditForm, setStockEditForm] = useState<StockEditForm>(emptyStockEditForm);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockUploading, setStockUploading] = useState(false);
  const [stockPage, setStockPage] = useState(0);
  const [stockFilterOpen, setStockFilterOpen] = useState(true);
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("ALL");
  const [stockKeyword, setStockKeyword] = useState("");
  const [reserveFilterOpen, setReserveFilterOpen] = useState(true);
  const [reserveStatusFilter, setReserveStatusFilter] = useState<string>("ALL");
  const [reserveKeyword, setReserveKeyword] = useState("");
  const [apptFilterOpen, setApptFilterOpen] = useState(true);
  const [apptStatusFilter, setApptStatusFilter] = useState<string>("ALL");
  const [apptKeyword, setApptKeyword] = useState("");
  const [financeFilterOpen, setFinanceFilterOpen] = useState(true);
  const [financeStatusFilter, setFinanceStatusFilter] = useState<string>("ALL");
  const [financeKeyword, setFinanceKeyword] = useState("");
  const [reserveDetail, setReserveDetail] = useState<ReservationRow | null>(null);
  const [reserveDetailStatus, setReserveDetailStatus] = useState("PENDING");
  const [reserveDetailNote, setReserveDetailNote] = useState("");
  const [reserveDetailSaving, setReserveDetailSaving] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    customerName: "",
    customerPhone: "",
    vehicleId: "",
    depositMode: "NONE" as "NONE" | "DEPOSIT" | "FULL",
    paymentMethod: "CASH" as UsedCarPaymentMethod,
    depositBaht: "",
  });
  const [apptOpen, setApptOpen] = useState(false);
  const [apptSaving, setApptSaving] = useState(false);
  const [apptDetail, setApptDetail] = useState<AppointmentRow | null>(null);
  const [apptDetailStatus, setApptDetailStatus] = useState("SCHEDULED");
  const [apptDetailNote, setApptDetailNote] = useState("");
  const [apptDetailSaving, setApptDetailSaving] = useState(false);
  const [apptForm, setApptForm] = useState({
    customerName: "",
    customerPhone: "",
    vehicleId: "",
    appointmentOn: bangkokDateKey(),
    appointmentHm: "10:00",
    kind: "VIEW" as "VIEW" | "TEST_DRIVE",
  });

  const [instPrice, setInstPrice] = useState("500000");
  const [instDown, setInstDown] = useState("100000");
  const [instRate, setInstRate] = useState("3.5");
  const [instMonths, setInstMonths] = useState("48");

  const installment = useMemo(
    () =>
      computeFlatInstallment({
        priceBaht: Number(instPrice) || 0,
        downPaymentBaht: Number(instDown) || 0,
        annualInterestPercent: Number(instRate) || 0,
        months: Number(instMonths) || 1,
      }),
    [instPrice, instDown, instRate, instMonths],
  );

  const setTab = useCallback(
    (next: UsedCarShowroomDashboardTabKey, extra?: Record<string, string | null>) => {
      const href = usedCarShowroomDashboardTabHref(next);
      const url = new URL(href, "http://local");
      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v) url.searchParams.set(k, v);
          else url.searchParams.delete(k);
        }
      }
      const q = url.searchParams.toString();
      router.push(q ? `${url.pathname}?${q}` : url.pathname);
    },
    [router],
  );

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [ov, veh, res, appt, fin] = await Promise.all([
        fetch("/api/used-car-showroom/session/overview", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/vehicles", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/reservations", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/appointments", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/finance-cases", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (ov.error || veh.error || res.error || appt.error || fin.error) {
        notice.error(
          ov.error || veh.error || res.error || appt.error || fin.error || "โหลดแดชบอร์ดไม่สำเร็จ",
        );
      }
      if (ov.stats) setStats(ov.stats);
      setVehicles(Array.isArray(veh.vehicles) ? veh.vehicles : []);
      setReservations(Array.isArray(res.reservations) ? res.reservations : []);
      setAppointments(Array.isArray(appt.appointments) ? appt.appointments : []);
      setFinanceCases(Array.isArray(fin.cases) ? fin.cases : []);
    } catch (e) {
      console.error(e);
      notice.error("โหลดแดชบอร์ดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const stockBaseVehicles = useMemo(
    () =>
      vehicles.filter((v) =>
        ["PREP", "FOR_SALE", "RESERVED", "SOLD", "DELIVERED"].includes(v.status),
      ),
    [vehicles],
  );

  const stockFiltersActive =
    stockStatusFilter !== "ALL" || Boolean(stockKeyword.trim());

  const stockVehicles = useMemo(() => {
    let list = stockBaseVehicles;
    if (stockStatusFilter !== "ALL") {
      list = list.filter((v) => v.status === stockStatusFilter);
    }
    const q = stockKeyword.trim().toLowerCase();
    if (q) {
      list = list.filter((v) => {
        const hay = [
          v.title,
          v.brand,
          v.model,
          v.plateNumber ?? "",
          v.color ?? "",
          v.vin ?? "",
          v.statusLabel,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [stockBaseVehicles, stockStatusFilter, stockKeyword]);

  const stockStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: stockBaseVehicles.length };
    for (const s of USED_CAR_VEHICLE_STATUSES) {
      counts[s] = stockBaseVehicles.filter((v) => v.status === s).length;
    }
    return counts;
  }, [stockBaseVehicles]);

  const stockTotalPages = Math.max(1, Math.ceil(stockVehicles.length / STOCK_PAGE_SIZE));
  const stockSafePage = Math.min(stockPage, stockTotalPages - 1);
  const stockPageVehicles = useMemo(() => {
    const start = stockSafePage * STOCK_PAGE_SIZE;
    return stockVehicles.slice(start, start + STOCK_PAGE_SIZE);
  }, [stockVehicles, stockSafePage]);

  useEffect(() => {
    if (tab !== "stock") return;
    setStockStatusFilter(statusFilter || "ALL");
  }, [tab, statusFilter]);

  useEffect(() => {
    setStockPage(0);
  }, [stockStatusFilter, stockKeyword, tab]);

  useEffect(() => {
    setStockPage((p) => Math.min(p, Math.max(0, stockTotalPages - 1)));
  }, [stockTotalPages]);

  function clearStockFilters() {
    setStockStatusFilter("ALL");
    setStockKeyword("");
    setTab("stock", { status: null });
  }

  function setStockStatus(next: string) {
    setStockStatusFilter(next);
    setTab("stock", { status: next === "ALL" ? null : next });
  }

  const apptFiltersActive =
    apptStatusFilter !== "ALL" || Boolean(apptKeyword.trim());

  const filteredAppointments = useMemo(() => {
    const q = apptKeyword.trim().toLowerCase();
    return appointments.filter((a) => {
      if (apptStatusFilter !== "ALL" && a.status !== apptStatusFilter) return false;
      if (!q) return true;
      const hay = [
        a.customerName,
        a.customerPhone,
        a.vehicleTitle ?? "",
        a.vehiclePlateNumber ?? "",
        a.note ?? "",
        usedCarAppointmentKindLabel(a.kind),
        usedCarAppointmentStatusLabel(a.status),
        a.appointmentOn,
        a.appointmentHm,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [appointments, apptStatusFilter, apptKeyword]);

  const apptStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: appointments.length };
    for (const s of USED_CAR_APPOINTMENT_STATUSES) {
      counts[s] = appointments.filter((a) => a.status === s).length;
    }
    return counts;
  }, [appointments]);

  const appointmentsToday = useMemo(() => {
    const today = bangkokDateKey();
    return filteredAppointments
      .filter((a) => {
        if (a.appointmentOn !== today) return false;
        if (apptStatusFilter === "ALL" && a.status === "CANCELLED") return false;
        return true;
      })
      .slice()
      .sort((a, b) => a.appointmentHm.localeCompare(b.appointmentHm));
  }, [filteredAppointments, apptStatusFilter]);

  /** นัดวันนี้บนภาพรวม — ไม่ผูกกับตัวกรองแท็บนัดหมาย */
  const overviewAppointmentsToday = useMemo(() => {
    const today = bangkokDateKey();
    return appointments
      .filter((a) => a.appointmentOn === today && a.status !== "CANCELLED")
      .slice()
      .sort((a, b) => a.appointmentHm.localeCompare(b.appointmentHm));
  }, [appointments]);

  /** นัดวันถัดไป (ยังไม่ถึงวันตามปฏิทินไทย) */
  const appointmentsUpcoming = useMemo(() => {
    const today = bangkokDateKey();
    return filteredAppointments
      .filter((a) => {
        if (a.appointmentOn <= today) return false;
        if (apptStatusFilter === "ALL" && a.status === "CANCELLED") return false;
        return true;
      })
      .slice()
      .sort((a, b) =>
        a.appointmentOn === b.appointmentOn
          ? a.appointmentHm.localeCompare(b.appointmentHm)
          : a.appointmentOn.localeCompare(b.appointmentOn),
      );
  }, [filteredAppointments, apptStatusFilter]);

  /** นัดวันก่อนหน้า (อ้างอิงย้อนหลัง) */
  const appointmentsPast = useMemo(() => {
    const today = bangkokDateKey();
    return filteredAppointments
      .filter((a) => a.appointmentOn < today)
      .slice()
      .sort((a, b) =>
        a.appointmentOn === b.appointmentOn
          ? b.appointmentHm.localeCompare(a.appointmentHm)
          : b.appointmentOn.localeCompare(a.appointmentOn),
      );
  }, [filteredAppointments]);

  const pendingFinanceBase = useMemo(
    () =>
      financeCases.filter((c) =>
        (USED_CAR_FINANCE_PENDING_STATUSES as readonly string[]).includes(c.status),
      ),
    [financeCases],
  );

  const financeFiltersActive =
    financeStatusFilter !== "ALL" || Boolean(financeKeyword.trim());

  const pendingFinance = useMemo(() => {
    const q = financeKeyword.trim().toLowerCase();
    return pendingFinanceBase.filter((c) => {
      if (financeStatusFilter !== "ALL" && c.status !== financeStatusFilter) return false;
      if (!q) return true;
      const hay = [
        c.vehicleTitle ?? "",
        c.companyName ?? "",
        c.note ?? "",
        c.id,
        usedCarFinanceCaseStatusLabel(c.status),
        String(c.financedAmountBaht),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [pendingFinanceBase, financeStatusFilter, financeKeyword]);

  const financeStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: pendingFinanceBase.length };
    for (const s of USED_CAR_FINANCE_PENDING_STATUSES) {
      counts[s] = pendingFinanceBase.filter((c) => c.status === s).length;
    }
    return counts;
  }, [pendingFinanceBase]);

  function clearApptFilters() {
    setApptStatusFilter("ALL");
    setApptKeyword("");
  }

  function clearFinanceFilters() {
    setFinanceStatusFilter("ALL");
    setFinanceKeyword("");
  }

  const reserveFiltersActive =
    reserveStatusFilter !== "ALL" || Boolean(reserveKeyword.trim());

  const filteredReservations = useMemo(() => {
    const q = reserveKeyword.trim().toLowerCase();
    return reservations.filter((r) => {
      if (reserveStatusFilter !== "ALL" && r.status !== reserveStatusFilter) return false;
      if (!q) return true;
      const hay = [r.customerName, r.customerPhone, r.vehicleTitle ?? "", r.note ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reservations, reserveStatusFilter, reserveKeyword]);

  const reserveStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: reservations.length };
    for (const s of USED_CAR_RESERVATION_STATUSES) {
      counts[s] = reservations.filter((r) => r.status === s).length;
    }
    return counts;
  }, [reservations]);

  function clearReserveFilters() {
    setReserveStatusFilter("ALL");
    setReserveKeyword("");
  }

  const reservableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === "PREP" || v.status === "FOR_SALE"),
    [vehicles],
  );

  function openStockDetail(v: VehicleRow) {
    setStockDetail(v);
    setStockEditForm(vehicleToStockEditForm(v));
    setStockEditing(false);
  }

  function startStockEdit() {
    if (!stockDetail) return;
    setStockEditForm(vehicleToStockEditForm(stockDetail));
    setStockEditing(true);
  }

  function cancelStockEdit() {
    if (!stockDetail) return;
    setStockEditForm(vehicleToStockEditForm(stockDetail));
    setStockEditing(false);
  }

  function closeStockDetail() {
    setStockDetail(null);
    setStockEditing(false);
    setStockEditForm(emptyStockEditForm());
  }

  async function saveStockDetail() {
    if (!stockDetail) return;
    const brand = stockEditForm.brand.trim();
    const model = stockEditForm.model.trim();
    if (!brand || !model) {
      notice.error("กรอกยี่ห้อและรุ่น");
      return;
    }
    setStockSaving(true);
    try {
      const yearRaw = stockEditForm.year.trim();
      const year = yearRaw ? Number(yearRaw) : null;
      const mileageRaw = stockEditForm.mileageKm.trim();
      const mileageKm = mileageRaw ? Number(mileageRaw) : null;
      const res = await fetch(`/api/used-car-showroom/session/vehicles/${stockDetail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year: Number.isFinite(year) ? year : null,
          color: stockEditForm.color.trim() || null,
          mileageKm: Number.isFinite(mileageKm) ? Math.max(0, Math.round(mileageKm!)) : null,
          transmission: stockEditForm.transmission.trim() || null,
          fuelType: stockEditForm.fuelType.trim() || null,
          plateNumber: stockEditForm.plateNumber.trim() || null,
          vin: stockEditForm.vin.trim() || null,
          purchaseCostBaht: Math.max(0, Math.round(Number(stockEditForm.purchaseCostBaht) || 0)),
          askingPriceBaht: Math.max(0, Math.round(Number(stockEditForm.askingPriceBaht) || 0)),
          status: stockEditForm.status,
          description: stockEditForm.description.trim() || null,
          note: stockEditForm.note.trim() || null,
          hasRegistrationBook: stockEditForm.hasRegistrationBook,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notice.error(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      if (data.vehicle) {
        setStockDetail(data.vehicle);
        setStockEditForm(vehicleToStockEditForm(data.vehicle));
      }
      notice.show("บันทึกรถแล้ว");
      await load();
      setStockEditing(false);
    } catch (e) {
      console.error(e);
      notice.error("บันทึกไม่สำเร็จ");
    } finally {
      setStockSaving(false);
    }
  }

  async function uploadStockImage(file: File) {
    if (!stockDetail) return;
    setStockUploading(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch(`/api/used-car-showroom/session/vehicles/${stockDetail.id}/images`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notice.error(data.error || "อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      const refreshed = await fetch(`/api/used-car-showroom/session/vehicles/${stockDetail.id}`, {
        credentials: "include",
      }).then((r) => r.json());
      if (refreshed.vehicle) {
        setStockDetail(refreshed.vehicle);
      }
      await load();
      notice.show("อัปโหลดรูปแล้ว");
    } catch (e) {
      console.error(e);
      notice.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setStockUploading(false);
    }
  }

  async function createReservation() {
    const name = reserveForm.customerName.trim();
    const phone = reserveForm.customerPhone.trim();
    if (!name || !phone || !reserveForm.vehicleId) {
      notice.error("กรอกชื่อ เบอร์ และเลือกรถ");
      return;
    }
    const depositBaht =
      reserveForm.depositMode === "NONE"
        ? 0
        : reserveForm.depositMode === "FULL"
          ? Math.max(
              0,
              Math.round(
                Number(reserveForm.depositBaht) ||
                  reservableVehicles.find((v) => v.id === reserveForm.vehicleId)?.askingPriceBaht ||
                  0,
              ),
            )
          : Math.max(0, Math.round(Number(reserveForm.depositBaht) || 0));
    setReserveSaving(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/reservations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          vehicleId: reserveForm.vehicleId,
          depositBaht,
          paymentMethod: reserveForm.depositMode === "NONE" ? "NONE" : reserveForm.paymentMethod,
          source: "STAFF",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notice.error(data.error || "จองไม่สำเร็จ");
        return;
      }
      setReserveOpen(false);
      setReserveForm({
        customerName: "",
        customerPhone: "",
        vehicleId: "",
        depositMode: "NONE",
        paymentMethod: "CASH",
        depositBaht: "",
      });
      notice.show("บันทึกการจองแล้ว");
      await load();
    } finally {
      setReserveSaving(false);
    }
  }

  function openReserveDetail(r: ReservationRow) {
    setReserveDetail(r);
    setReserveDetailStatus(r.status);
    setReserveDetailNote(r.note ?? "");
  }

  async function saveReserveDetail() {
    if (!reserveDetail) return;
    setReserveDetailSaving(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/reservations", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reserveDetail.id,
          status: reserveDetailStatus,
          note: reserveDetailNote.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string; reservation?: ReservationRow };
      if (!res.ok) {
        notice.error(data.error || "บันทึกสถานะไม่สำเร็จ");
        return;
      }
      if (data.reservation) {
        setReservations((list) =>
          list.map((row) => (row.id === data.reservation!.id ? { ...row, ...data.reservation! } : row)),
        );
        setReserveDetail({ ...reserveDetail, ...data.reservation });
      }
      notice.show("อัปเดตการจองแล้ว");
      await load();
    } finally {
      setReserveDetailSaving(false);
    }
  }

  function openApptDetail(a: AppointmentRow) {
    setApptDetail(a);
    setApptDetailStatus(a.status);
    setApptDetailNote(a.note ?? "");
  }

  async function saveApptDetail() {
    if (!apptDetail) return;
    setApptDetailSaving(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/appointments", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: apptDetail.id,
          status: apptDetailStatus,
          note: apptDetailNote.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string; appointment?: AppointmentRow };
      if (!res.ok) {
        notice.error(data.error || "บันทึกสถานะไม่สำเร็จ");
        return;
      }
      if (data.appointment) {
        setAppointments((list) =>
          list.map((row) => (row.id === data.appointment!.id ? { ...row, ...data.appointment! } : row)),
        );
        setApptDetail({ ...apptDetail, ...data.appointment });
      }
      notice.show("อัปเดตนัดหมายแล้ว");
      await load();
    } finally {
      setApptDetailSaving(false);
    }
  }

  async function createAppointment() {
    const name = apptForm.customerName.trim();
    const phone = apptForm.customerPhone.trim();
    if (!name || !phone || !apptForm.appointmentOn || !apptForm.appointmentHm) {
      notice.error("กรอกชื่อ เบอร์ วัน และเวลา");
      return;
    }
    setApptSaving(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          vehicleId: apptForm.vehicleId || null,
          appointmentOn: apptForm.appointmentOn,
          appointmentHm: apptForm.appointmentHm,
          kind: apptForm.kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notice.error(data.error || "นัดไม่สำเร็จ");
        return;
      }
      setApptOpen(false);
      setApptForm({
        customerName: "",
        customerPhone: "",
        vehicleId: "",
        appointmentOn: bangkokDateKey(),
        appointmentHm: "10:00",
        kind: "VIEW",
      });
      notice.show("บันทึกนัดหมายแล้ว");
      await load();
    } finally {
      setApptSaving(false);
    }
  }

  const backBtn =
    tab !== "overview" ? (
      <button
        type="button"
        className={usedCarShowroomOutlineButtonClass}
        onClick={() => setTab("overview")}
        aria-label="กลับภาพรวม"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">กลับภาพรวม</span>
      </button>
    ) : (
      <Link href={USED_CAR_SHOWROOM_MANAGE_PATH} className={usedCarShowroomPrimaryButtonClass}>
        จัดการรถ
      </Link>
    );

  return (
    <div className={usedCarShowroomPageStackClass}>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปรถ" />
      <UsedCarShowroomPageSubNav
        title="แดชบอร์ด"
        titleIcon={usedCarShowroomPageTitleIcon("dashboard")}
        titleTone={usedCarShowroomPageTitleTone("dashboard")}
        items={DASHBOARD_TAB_ITEMS}
        activeKey={tab}
        onSelect={(k) => setTab(k as UsedCarShowroomDashboardTabKey)}
        ariaLabel="เมนูย่อยแดชบอร์ด"
        action={backBtn}
      >
        {tab === "overview" ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#66638c]">{initialShop.displayName}</p>
            <div className={usedCarShowroomFinanceStatsGridClass}>
              {[
                {
                  key: "stock",
                  label: "รถในสต็อก",
                  value: stats?.stockCount ?? "—",
                  tone: "sky" as const,
                  icon: <Car className="h-4 w-4" />,
                  onClick: () => setTab("stock"),
                },
                {
                  key: "prep",
                  label: "กำลังปรับสภาพ",
                  value: stats?.prepCount ?? "—",
                  tone: "amber" as const,
                  icon: <Car className="h-4 w-4" />,
                  onClick: () => setTab("stock", { status: "PREP" }),
                },
                {
                  key: "sales",
                  label: "ยอดขายเดือนนี้",
                  value: stats ? baht(stats.salesMonthBaht) : "—",
                  tone: "emerald" as const,
                  icon: <Wallet className="h-4 w-4" />,
                  onClick: () => router.push("/dashboard/used-car-showroom/finance"),
                },
                {
                  key: "profit",
                  label: "กำไรคาดการณ์",
                  value: stats ? baht(stats.projectedProfitBaht) : "—",
                  tone: "violet" as const,
                  icon: <TrendingUp className="h-4 w-4" />,
                  onClick: () => router.push(`${USED_CAR_SHOWROOM_MANAGE_PATH}?tab=pnl`),
                },
                {
                  key: "fin",
                  label: "ไฟแนนซ์รอ",
                  value: stats?.financePendingCount ?? "—",
                  tone: "indigo" as const,
                  icon: <Landmark className="h-4 w-4" />,
                  onClick: () => setTab("finance-pending"),
                },
                {
                  key: "appt",
                  label: "นัดวันนี้",
                  value: stats?.appointmentsTodayCount ?? "—",
                  tone: "cyan" as const,
                  icon: <CalendarClock className="h-4 w-4" />,
                  onClick: () => setTab("appointments"),
                },
                {
                  key: "res",
                  label: "จองรอดำเนินการ",
                  value: stats?.reservationsPendingCount ?? "—",
                  tone: "fuchsia" as const,
                  icon: <ClipboardList className="h-4 w-4" />,
                  onClick: () => setTab("reservations"),
                  tail: true,
                },
              ].map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={card.onClick}
                  className={cn(
                    usedCarShowroomStatInlineClass,
                    "border-l-[3px] text-left transition hover:shadow-sm",
                    card.tone === "sky" && "border-l-sky-500 bg-sky-50/60",
                    card.tone === "amber" && "border-l-amber-500 bg-amber-50/60",
                    card.tone === "emerald" && "border-l-emerald-500 bg-emerald-50/60",
                    card.tone === "violet" && "border-l-violet-500 bg-violet-50/60",
                    card.tone === "indigo" && "border-l-indigo-500 bg-indigo-50/60",
                    card.tone === "cyan" && "border-l-cyan-500 bg-cyan-50/60",
                    card.tone === "fuchsia" && "border-l-fuchsia-500 bg-fuchsia-50/60",
                    card.tail && "col-span-2 sm:col-span-1",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                    <span className={usedCarShowroomCardIconTileClass(card.tone)}>{card.icon}</span>
                    {card.label}
                  </span>
                  <span className="text-lg font-black tabular-nums text-[#1e1b4b] sm:text-xl">{card.value}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#1e1b4b]">นัดวันนี้</h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    className={usedCarShowroomOutlineButtonClass}
                    onClick={() => setTab("appointments")}
                  >
                    ดูทั้งหมด
                  </button>
                  <button
                    type="button"
                    className={usedCarShowroomPrimaryButtonClass}
                    onClick={() => setApptOpen(true)}
                  >
                    นัดใหม่
                  </button>
                </div>
              </div>
              {overviewAppointmentsToday.length === 0 ? (
                <AppEmptyState>วันนี้ยังไม่มีนัดหมาย</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {overviewAppointmentsToday.map((a) => (
                    <li key={a.id} className={usedCarShowroomTonedRowCardClass("cyan")}>
                      <button
                        type="button"
                        className="w-full min-w-0 text-left"
                        onClick={() => openApptDetail(a)}
                        aria-label={`ดูรายละเอียดนัด ${a.customerName}`}
                      >
                        <p className="text-sm font-black text-[#1e1b4b]">
                          {a.appointmentHm} · {a.customerName}
                        </p>
                        <p className="text-xs font-semibold text-[#66638c]">
                          {usedCarAppointmentKindLabel(a.kind)}
                          {a.vehicleTitle ? ` · ${a.vehicleTitle}` : ""}
                          {a.status !== "SCHEDULED" ? ` · ${usedCarAppointmentStatusLabel(a.status)}` : ""}
                        </p>
                        <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {busy ? <p className="text-xs text-[#66638c]">กำลังโหลด…</p> : null}
          </div>
        ) : null}

        {tab === "stock" ? (
          <div className="space-y-3">
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
              <button
                type="button"
                aria-expanded={stockFilterOpen}
                aria-controls="ucs-stock-filter-panel"
                aria-label={stockFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={stockFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  usedCarShowroomInlineSubNavBtnClass(stockFilterOpen),
                  "relative",
                  stockFiltersActive && !stockFilterOpen && "ring-1 ring-amber-300/80",
                )}
                onClick={() => setStockFilterOpen((o) => !o)}
              >
                <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{stockFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {stockFiltersActive && !stockFilterOpen ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <Link
                href={`${USED_CAR_SHOWROOM_MANAGE_PATH}?tab=vehicles`}
                className={usedCarShowroomPrimaryButtonClass}
              >
                + เพิ่มรถ
              </Link>
            </div>

            <div
              id="ucs-stock-filter-panel"
              className={cn("space-y-3", stockFilterOpen ? "block" : "hidden")}
            >
              <div
                className={usedCarShowroomFilterChipShellClass}
                role="tablist"
                aria-label="กรองสถานะสต็อก"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={stockStatusFilter === "ALL"}
                  className={usedCarShowroomFilterChipClass(stockStatusFilter === "ALL")}
                  onClick={() => setStockStatus("ALL")}
                >
                  ทั้งหมด ({stockStatusCounts.ALL ?? 0})
                </button>
                {USED_CAR_VEHICLE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={stockStatusFilter === s}
                    className={usedCarShowroomFilterChipClass(stockStatusFilter === s)}
                    onClick={() => setStockStatus(s)}
                  >
                    {usedCarVehicleStatusLabel(s)} ({stockStatusCounts[s] ?? 0})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor="ucs-stock-kw">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    id="ucs-stock-kw"
                    className={cn(usedCarShowroomFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="ยี่ห้อ · รุ่น · ทะเบียน · สี"
                    value={stockKeyword}
                    onChange={(e) => setStockKeyword(e.target.value)}
                  />
                </label>
                {stockFiltersActive ? (
                  <button
                    type="button"
                    className={usedCarShowroomOutlineButtonClass}
                    onClick={clearStockFilters}
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] font-semibold text-[#66638c]">
                แสดง {stockVehicles.length}/{stockBaseVehicles.length}
              </p>
            </div>

            {stockBaseVehicles.length === 0 ? (
              <AppEmptyState>ยังไม่มีรถ — กดเพิ่มรถที่เมนูการจัดการ</AppEmptyState>
            ) : stockVehicles.length === 0 ? (
              <AppEmptyState>ไม่พบรถตามตัวกรอง</AppEmptyState>
            ) : (
              <>
                <p className="text-[11px] font-semibold text-[#66638c]">
                  หน้านี้ {stockSafePage * STOCK_PAGE_SIZE + 1}–
                  {Math.min((stockSafePage + 1) * STOCK_PAGE_SIZE, stockVehicles.length)} จาก{" "}
                  {stockVehicles.length} คัน
                </p>
                <ul className="space-y-2">
                  {stockPageVehicles.map((v) => {
                    const tone = usedCarVehicleStatusTone(v.status);
                    return (
                      <li key={v.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(usedCarShowroomTonedRowCardClass(tone), "cursor-pointer")}
                          onClick={() => openStockDetail(v)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openStockDetail(v);
                            }
                          }}
                          aria-label={`ดูรายละเอียด ${v.title}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {v.coverImageUrl ? (
                              <AppImageThumb
                                src={v.coverImageUrl}
                                alt={v.title}
                                className="pointer-events-none h-14 w-14 shrink-0"
                              />
                            ) : (
                              <span className={cn(usedCarShowroomCardIconTileClass(tone, "lg"), "shrink-0")}>
                                <Car className="h-6 w-6" aria-hidden />
                              </span>
                            )}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-sm font-black text-[#1e1b4b]">{v.title}</p>
                                <span className={vehicleStatusPillClass(v.status)}>{v.statusLabel}</span>
                              </div>
                              <p className="text-xs font-semibold text-[#66638c]">
                                {baht(v.askingPriceBaht)}
                                {v.plateNumber ? ` · ทะเบียน ${v.plateNumber}` : ""}
                                {v.color ? ` · ${v.color}` : ""}
                              </p>
                              <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {stockTotalPages > 1 ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      className={usedCarShowroomOutlineButtonClass}
                      disabled={stockSafePage <= 0}
                      onClick={() => setStockPage((p) => Math.max(0, p - 1))}
                      aria-label="หน้าก่อนหน้า"
                    >
                      ก่อนหน้า
                    </button>
                    <p className="text-xs font-semibold text-[#66638c]" aria-live="polite">
                      หน้า {stockSafePage + 1} / {stockTotalPages}
                    </p>
                    <button
                      type="button"
                      className={usedCarShowroomOutlineButtonClass}
                      disabled={stockSafePage >= stockTotalPages - 1}
                      onClick={() => setStockPage((p) => Math.min(stockTotalPages - 1, p + 1))}
                      aria-label="หน้าถัดไป"
                    >
                      ถัดไป
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {tab === "reservations" ? (
          <div className="space-y-3">
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
              <button
                type="button"
                aria-expanded={reserveFilterOpen}
                aria-controls="ucs-reservations-filter-panel"
                aria-label={reserveFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={reserveFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  usedCarShowroomInlineSubNavBtnClass(reserveFilterOpen),
                  "relative",
                  reserveFiltersActive && !reserveFilterOpen && "ring-1 ring-amber-300/80",
                )}
                onClick={() => setReserveFilterOpen((o) => !o)}
              >
                <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{reserveFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {reserveFiltersActive && !reserveFilterOpen ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                className={usedCarShowroomPrimaryButtonClass}
                onClick={() => setReserveOpen(true)}
              >
                จองให้ลูกค้า
              </button>
            </div>

            <div
              id="ucs-reservations-filter-panel"
              className={cn("space-y-3", reserveFilterOpen ? "block" : "hidden")}
            >
              <div
                className={usedCarShowroomFilterChipShellClass}
                role="tablist"
                aria-label="กรองสถานะการจอง"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={reserveStatusFilter === "ALL"}
                  className={usedCarShowroomFilterChipClass(reserveStatusFilter === "ALL")}
                  onClick={() => setReserveStatusFilter("ALL")}
                >
                  ทั้งหมด ({reserveStatusCounts.ALL ?? 0})
                </button>
                {USED_CAR_RESERVATION_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={reserveStatusFilter === s}
                    className={usedCarShowroomFilterChipClass(reserveStatusFilter === s)}
                    onClick={() => setReserveStatusFilter(s)}
                  >
                    {usedCarReservationStatusLabel(s)} ({reserveStatusCounts[s] ?? 0})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor="ucs-reserve-kw">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    id="ucs-reserve-kw"
                    className={cn(usedCarShowroomFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="ชื่อ · เบอร์ · รถ"
                    value={reserveKeyword}
                    onChange={(e) => setReserveKeyword(e.target.value)}
                  />
                </label>
                {reserveFiltersActive ? (
                  <button
                    type="button"
                    className={usedCarShowroomOutlineButtonClass}
                    onClick={clearReserveFilters}
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] font-semibold text-[#66638c]">
                แสดง {filteredReservations.length}/{reservations.length}
              </p>
            </div>

            {reservations.length === 0 ? (
              <AppEmptyState>ยังไม่มีการจอง</AppEmptyState>
            ) : filteredReservations.length === 0 ? (
              <AppEmptyState>ไม่พบการจองตามตัวกรอง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredReservations.map((r) => {
                  const tone = usedCarReservationStatusTone(r.status);
                  return (
                    <li key={r.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(usedCarShowroomTonedRowCardClass(tone), "cursor-pointer")}
                        onClick={() => openReserveDetail(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openReserveDetail(r);
                          }
                        }}
                        aria-label={`ดูรายละเอียดการจองของ ${r.customerName}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          {r.vehicleCoverImageUrl ? (
                            <AppImageThumb
                              src={r.vehicleCoverImageUrl}
                              alt={r.vehicleTitle ?? "รถ"}
                              className="pointer-events-none h-14 w-14 shrink-0"
                            />
                          ) : (
                            <span className={cn(usedCarShowroomCardIconTileClass(tone, "lg"), "shrink-0")}>
                              <ClipboardList className="h-6 w-6" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-black text-[#1e1b4b]">{r.customerName}</p>
                              <span className={reservationStatusPillClass(r.status)}>
                                {usedCarReservationStatusLabel(r.status)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[#66638c]">
                              {r.customerPhone}
                              {r.vehicleTitle ? ` · ${r.vehicleTitle}` : ""}
                              {r.depositBaht > 0 ? ` · มัดจำ ${baht(r.depositBaht)}` : ""}
                            </p>
                            <p className="text-[10px] font-semibold text-[#8b87a8]">
                              แตะเพื่อดูรายละเอียด / เปลี่ยนสถานะ
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "appointments" ? (
          <div className="space-y-3">
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
              <button
                type="button"
                aria-expanded={apptFilterOpen}
                aria-controls="ucs-appointments-filter-panel"
                aria-label={apptFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={apptFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  usedCarShowroomInlineSubNavBtnClass(apptFilterOpen),
                  "relative",
                  apptFiltersActive && !apptFilterOpen && "ring-1 ring-amber-300/80",
                )}
                onClick={() => setApptFilterOpen((o) => !o)}
              >
                <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{apptFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {apptFiltersActive && !apptFilterOpen ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button type="button" className={usedCarShowroomPrimaryButtonClass} onClick={() => setApptOpen(true)}>
                นัดหมายใหม่
              </button>
            </div>

            <div
              id="ucs-appointments-filter-panel"
              className={cn("space-y-3", apptFilterOpen ? "block" : "hidden")}
            >
              <div
                className={usedCarShowroomFilterChipShellClass}
                role="tablist"
                aria-label="กรองสถานะนัดหมาย"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={apptStatusFilter === "ALL"}
                  className={usedCarShowroomFilterChipClass(apptStatusFilter === "ALL")}
                  onClick={() => setApptStatusFilter("ALL")}
                >
                  ทั้งหมด ({apptStatusCounts.ALL ?? 0})
                </button>
                {USED_CAR_APPOINTMENT_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={apptStatusFilter === s}
                    className={usedCarShowroomFilterChipClass(apptStatusFilter === s)}
                    onClick={() => setApptStatusFilter(s)}
                  >
                    {usedCarAppointmentStatusLabel(s)} ({apptStatusCounts[s] ?? 0})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor="ucs-appt-kw">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    id="ucs-appt-kw"
                    className={cn(usedCarShowroomFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="ชื่อ · เบอร์ · รถ · วัน"
                    value={apptKeyword}
                    onChange={(e) => setApptKeyword(e.target.value)}
                  />
                </label>
                {apptFiltersActive ? (
                  <button
                    type="button"
                    className={usedCarShowroomOutlineButtonClass}
                    onClick={clearApptFilters}
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] font-semibold text-[#66638c]">
                แสดง {filteredAppointments.length}/{appointments.length}
              </p>
            </div>

            {appointments.length === 0 ? (
              <AppEmptyState>ยังไม่มีนัดหมาย</AppEmptyState>
            ) : appointmentsToday.length === 0 &&
              appointmentsUpcoming.length === 0 &&
              appointmentsPast.length === 0 ? (
              <AppEmptyState>ไม่พบนัดหมายตามตัวกรอง</AppEmptyState>
            ) : (
              <div className="space-y-4">
                <section className="space-y-2" aria-labelledby="ucs-appt-today-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="ucs-appt-today-heading" className={usedCarShowroomSectionHeadingClass}>
                      <span
                        className={usedCarShowroomCardIconTileClass("amber")}
                        aria-hidden
                      >
                        <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      วันนี้
                      <span className="text-xs font-semibold text-[#8b87a8]">({appointmentsToday.length})</span>
                    </h3>
                  </div>
                  {appointmentsToday.length === 0 ? (
                    <AppEmptyState>วันนี้ยังไม่มีนัดหมาย</AppEmptyState>
                  ) : (
                    <ul className="space-y-2">
                      {appointmentsToday.map((a) => (
                        <li key={a.id} className={usedCarShowroomTonedRowCardClass("amber")}>
                          <button
                            type="button"
                            className="w-full min-w-0 text-left"
                            onClick={() => openApptDetail(a)}
                            aria-label={`ดูรายละเอียดนัด ${a.customerName}`}
                          >
                            <p className="text-sm font-black text-[#1e1b4b]">
                              {a.appointmentHm} · {a.customerName}
                            </p>
                            <p className="text-xs font-semibold text-[#66638c]">
                              {usedCarAppointmentKindLabel(a.kind)}
                              {a.vehicleTitle ? ` · ${a.vehicleTitle}` : ""}
                              {a.status !== "SCHEDULED"
                                ? ` · ${usedCarAppointmentStatusLabel(a.status)}`
                                : ""}
                            </p>
                            <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2" aria-labelledby="ucs-appt-upcoming-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="ucs-appt-upcoming-heading" className={usedCarShowroomSectionHeadingClass}>
                      <span
                        className={usedCarShowroomCardIconTileClass("cyan")}
                        aria-hidden
                      >
                        <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      กำหนดที่ยังไม่ถึง
                      <span className="text-xs font-semibold text-[#8b87a8]">({appointmentsUpcoming.length})</span>
                    </h3>
                  </div>
                  {appointmentsUpcoming.length === 0 ? (
                    <AppEmptyState>ยังไม่มีนัดล่วงหน้า</AppEmptyState>
                  ) : (
                    <ul className="space-y-2">
                      {appointmentsUpcoming.map((a) => (
                        <li key={a.id} className={usedCarShowroomTonedRowCardClass("cyan")}>
                          <button
                            type="button"
                            className="w-full min-w-0 text-left"
                            onClick={() => openApptDetail(a)}
                            aria-label={`ดูรายละเอียดนัด ${a.customerName}`}
                          >
                            <p className="text-sm font-black text-[#1e1b4b]">
                              {a.appointmentOn} {a.appointmentHm} · {a.customerName}
                            </p>
                            <p className="text-xs font-semibold text-[#66638c]">
                              {usedCarAppointmentKindLabel(a.kind)}
                              {a.vehicleTitle ? ` · ${a.vehicleTitle}` : ""}
                              {a.status !== "SCHEDULED"
                                ? ` · ${usedCarAppointmentStatusLabel(a.status)}`
                                : ""}
                            </p>
                            <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {appointmentsPast.length > 0 ? (
                  <section className="space-y-2" aria-labelledby="ucs-appt-past-heading">
                    <h3 id="ucs-appt-past-heading" className={usedCarShowroomSectionHeadingClass}>
                      <span
                        className={usedCarShowroomCardIconTileClass("slate")}
                        aria-hidden
                      >
                        <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      ที่ผ่านมา
                      <span className="text-xs font-semibold text-[#8b87a8]">({appointmentsPast.length})</span>
                    </h3>
                    <ul className="space-y-2">
                      {appointmentsPast.map((a) => (
                        <li key={a.id} className={usedCarShowroomTonedRowCardClass("slate")}>
                          <button
                            type="button"
                            className="w-full min-w-0 text-left"
                            onClick={() => openApptDetail(a)}
                            aria-label={`ดูรายละเอียดนัด ${a.customerName}`}
                          >
                            <p className="text-sm font-black text-[#1e1b4b]">
                              {a.appointmentOn} {a.appointmentHm} · {a.customerName}
                            </p>
                            <p className="text-xs font-semibold text-[#66638c]">
                              {usedCarAppointmentKindLabel(a.kind)}
                              {a.vehicleTitle ? ` · ${a.vehicleTitle}` : ""}
                              {a.status !== "SCHEDULED"
                                ? ` · ${usedCarAppointmentStatusLabel(a.status)}`
                                : ""}
                            </p>
                            <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {tab === "finance-pending" ? (
          <div className="space-y-3">
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
              <button
                type="button"
                aria-expanded={financeFilterOpen}
                aria-controls="ucs-finance-pending-filter-panel"
                aria-label={financeFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={financeFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  usedCarShowroomInlineSubNavBtnClass(financeFilterOpen),
                  "relative",
                  financeFiltersActive && !financeFilterOpen && "ring-1 ring-amber-300/80",
                )}
                onClick={() => setFinanceFilterOpen((o) => !o)}
              >
                <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{financeFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {financeFiltersActive && !financeFilterOpen ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
            </div>

            <div
              id="ucs-finance-pending-filter-panel"
              className={cn("space-y-3", financeFilterOpen ? "block" : "hidden")}
            >
              <div
                className={usedCarShowroomFilterChipShellClass}
                role="tablist"
                aria-label="กรองสถานะไฟแนนซ์รอ"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={financeStatusFilter === "ALL"}
                  className={usedCarShowroomFilterChipClass(financeStatusFilter === "ALL")}
                  onClick={() => setFinanceStatusFilter("ALL")}
                >
                  ทั้งหมด ({financeStatusCounts.ALL ?? 0})
                </button>
                {USED_CAR_FINANCE_PENDING_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={financeStatusFilter === s}
                    className={usedCarShowroomFilterChipClass(financeStatusFilter === s)}
                    onClick={() => setFinanceStatusFilter(s)}
                  >
                    {usedCarFinanceCaseStatusLabel(s)} ({financeStatusCounts[s] ?? 0})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor="ucs-finance-kw">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    id="ucs-finance-kw"
                    className={cn(usedCarShowroomFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="รถ · บริษัท · หมายเหตุ"
                    value={financeKeyword}
                    onChange={(e) => setFinanceKeyword(e.target.value)}
                  />
                </label>
                {financeFiltersActive ? (
                  <button
                    type="button"
                    className={usedCarShowroomOutlineButtonClass}
                    onClick={clearFinanceFilters}
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] font-semibold text-[#66638c]">
                แสดง {pendingFinance.length}/{pendingFinanceBase.length}
              </p>
            </div>

            {pendingFinanceBase.length === 0 ? (
              <AppEmptyState>ไม่มีเคสไฟแนนซ์รอ</AppEmptyState>
            ) : pendingFinance.length === 0 ? (
              <AppEmptyState>ไม่พบเคสตามตัวกรอง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {pendingFinance.map((c) => (
                  <li key={c.id} className={usedCarShowroomTonedRowCardClass("indigo")}>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#1e1b4b]">{c.vehicleTitle ?? c.id.slice(0, 8)}</p>
                      <p className="text-xs text-[#66638c]">
                        {usedCarFinanceCaseStatusLabel(c.status)}
                        {c.companyName ? ` · ${c.companyName}` : ""} · ยอดจัด {baht(c.financedAmountBaht)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "installment" ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#66638c]">
              คำนวณแบบดอกเบี้ยคงที่ (flat) — ใช้เทียบราคาหน้าเต็นท์ · ไม่ใช่ตารางลดต้นลดดอกของไฟแนนซ์
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                ราคาขาย
                <input className={usedCarShowroomFieldClass} value={instPrice} onChange={(e) => setInstPrice(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                ดาวน์
                <input className={usedCarShowroomFieldClass} value={instDown} onChange={(e) => setInstDown(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                ดอกเบี้ย %/ปี
                <input className={usedCarShowroomFieldClass} value={instRate} onChange={(e) => setInstRate(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
                เดือน
                <input className={usedCarShowroomFieldClass} value={instMonths} onChange={(e) => setInstMonths(e.target.value)} />
              </label>
            </div>
            {installment ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-sm font-black text-[#1e1b4b]">
                  ค่างวดประมาณ {baht(installment.monthlyPaymentBaht)} / เดือน
                </p>
                <p className="text-xs text-[#66638c]">
                  ยอดจัด {baht(installment.financedBaht)} · ดอกเบี้ยรวม {baht(installment.totalInterestBaht)} · รวมชำระ{" "}
                  {baht(installment.totalPaymentBaht)}
                </p>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-[#66638c]">
                        <th className="py-1">งวด</th>
                        <th>เงินต้น</th>
                        <th>ดอก</th>
                        <th>ชำระ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installment.schedule.slice(0, 12).map((row) => (
                        <tr key={row.period} className="border-t border-slate-200/80">
                          <td className="py-1">{row.period}</td>
                          <td>{baht(row.principalBaht)}</td>
                          <td>{baht(row.interestBaht)}</td>
                          <td>{baht(row.paymentBaht)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {installment.schedule.length > 12 ? (
                    <p className="mt-1 text-[10px] text-[#66638c]">แสดง 12 งวดแรกจากทั้งหมด {installment.schedule.length}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <AppEmptyState>กรอกตัวเลขเพื่อคำนวณ</AppEmptyState>
            )}
          </div>
        ) : null}
      </UsedCarShowroomPageSubNav>

      <FormModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        title="จองให้ลูกค้า"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setReserveOpen(false)}
            onSubmit={() => void createReservation()}
            submitLabel="บันทึกจอง"
            loading={reserveSaving}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อลูกค้า
            <input
              className={usedCarShowroomFieldClass}
              value={reserveForm.customerName}
              onChange={(e) => setReserveForm((f) => ({ ...f, customerName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            เบอร์โทร
            <input
              className={usedCarShowroomFieldClass}
              inputMode="tel"
              value={reserveForm.customerPhone}
              onChange={(e) => setReserveForm((f) => ({ ...f, customerPhone: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            รถ
            <select
              className={usedCarShowroomFieldClass}
              value={reserveForm.vehicleId}
              onChange={(e) => setReserveForm((f) => ({ ...f, vehicleId: e.target.value }))}
            >
              <option value="">— เลือกรถ —</option>
              {reservableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} · {baht(v.askingPriceBaht)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            โหมดมัดจำ
            <select
              className={usedCarShowroomFieldClass}
              value={reserveForm.depositMode}
              onChange={(e) =>
                setReserveForm((f) => ({
                  ...f,
                  depositMode: e.target.value as "NONE" | "DEPOSIT" | "FULL",
                  depositBaht:
                    e.target.value === "NONE"
                      ? ""
                      : f.depositBaht || String(initialShop.depositAmountBaht || ""),
                }))
              }
            >
              <option value="NONE">ไม่มัดจำ</option>
              <option value="DEPOSIT">มัดจำ</option>
              <option value="FULL">ชำระเต็ม</option>
            </select>
          </label>
          {reserveForm.depositMode !== "NONE" ? (
            <>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ช่องทางชำระ
                <select
                  className={usedCarShowroomFieldClass}
                  value={reserveForm.paymentMethod}
                  onChange={(e) =>
                    setReserveForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value as UsedCarPaymentMethod,
                    }))
                  }
                >
                  {USED_CAR_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {usedCarPaymentMethodLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ยอดมัดจำ / ชำระ
                <input
                  className={usedCarShowroomFieldClass}
                  inputMode="numeric"
                  value={reserveForm.depositBaht}
                  onChange={(e) => setReserveForm((f) => ({ ...f, depositBaht: e.target.value }))}
                />
              </label>
            </>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={Boolean(stockDetail)}
        onClose={closeStockDetail}
        title={stockEditing ? "แก้ไขรถในสต็อก" : "รายละเอียดรถ"}
        size="lg"
        mobileCentered
        footer={
          stockEditing ? (
            <FormModalFooterActions
              onCancel={cancelStockEdit}
              cancelLabel="ยกเลิก"
              onSubmit={() => void saveStockDetail()}
              submitLabel="บันทึก"
              loading={stockSaving}
              submitDisabled={stockUploading}
            />
          ) : (
            <FormModalFooterActions
              onCancel={closeStockDetail}
              cancelLabel="ปิด"
              onSubmit={startStockEdit}
              submitLabel="แก้ไข"
            />
          )
        }
      >
        {stockDetail ? (
          stockEditing ? (
            <div className="space-y-3">
              <div className="flex min-w-0 items-start gap-3">
                {stockDetail.coverImageUrl ? (
                  <AppImageThumb
                    src={stockDetail.coverImageUrl}
                    alt={stockDetail.title}
                    className="h-20 w-20 shrink-0"
                    onOpen={() => stockDetail.coverImageUrl && lb.open(stockDetail.coverImageUrl)}
                  />
                ) : (
                  <span
                    className={cn(
                      usedCarShowroomCardIconTileClass(usedCarVehicleStatusTone(stockEditForm.status), "lg"),
                      "shrink-0",
                    )}
                    aria-hidden
                  >
                    <Car className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-black text-[#1e1b4b]">
                    {[stockEditForm.brand, stockEditForm.model, stockEditForm.year].filter(Boolean).join(" ") ||
                      stockDetail.title}
                  </p>
                  <span className={vehicleStatusPillClass(stockEditForm.status)}>
                    {usedCarVehicleStatusLabel(stockEditForm.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#4d47b6]">สถานะ</p>
                <div className="flex flex-wrap gap-1">
                  {USED_CAR_VEHICLE_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={cn(
                        usedCarShowroomOutlineButtonClass,
                        "min-h-7 px-2 text-[10px]",
                        stockEditForm.status === st && usedCarShowroomPrimaryButtonClass,
                      )}
                      onClick={() => setStockEditForm((f) => ({ ...f, status: st }))}
                    >
                      {usedCarVehicleStatusLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ยี่ห้อ
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.brand}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, brand: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  รุ่น
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.model}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, model: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ปี
                  <input
                    className={usedCarShowroomFieldClass}
                    inputMode="numeric"
                    value={stockEditForm.year}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, year: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  สี
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.color}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, color: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ทะเบียน
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.plateNumber}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, plateNumber: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  เลขไมล์ (กม.)
                  <input
                    className={usedCarShowroomFieldClass}
                    inputMode="numeric"
                    value={stockEditForm.mileageKm}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, mileageKm: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  เกียร์
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.transmission}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, transmission: e.target.value }))}
                    placeholder="เช่น ออโต้ / ธรรมดา"
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  เชื้อเพลิง
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.fuelType}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, fuelType: e.target.value }))}
                    placeholder="เช่น เบนซิน / ดีเซล"
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ทุนซื้อ (บาท)
                  <input
                    className={usedCarShowroomFieldClass}
                    inputMode="numeric"
                    value={stockEditForm.purchaseCostBaht}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, purchaseCostBaht: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ราคาขาย (บาท)
                  <input
                    className={usedCarShowroomFieldClass}
                    inputMode="numeric"
                    value={stockEditForm.askingPriceBaht}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, askingPriceBaht: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6] sm:col-span-2">
                  VIN
                  <input
                    className={usedCarShowroomFieldClass}
                    value={stockEditForm.vin}
                    onChange={(e) => setStockEditForm((f) => ({ ...f, vin: e.target.value }))}
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[#4d47b6]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={stockEditForm.hasRegistrationBook}
                  onChange={(e) =>
                    setStockEditForm((f) => ({ ...f, hasRegistrationBook: e.target.checked }))
                  }
                />
                มีเล่มทะเบียน
              </label>

              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                คำอธิบาย
                <textarea
                  className={cn(usedCarShowroomFieldClass, "min-h-[72px] max-h-none py-2")}
                  value={stockEditForm.description}
                  onChange={(e) => setStockEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </label>

              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                หมายเหตุภายใน
                <textarea
                  className={cn(usedCarShowroomFieldClass, "min-h-[56px] max-h-none py-2")}
                  value={stockEditForm.note}
                  onChange={(e) => setStockEditForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                />
              </label>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#4d47b6]">รูปรถ</p>
                <input
                  type="file"
                  accept="image/*"
                  disabled={stockUploading || stockSaving}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadStockImage(f);
                    e.target.value = "";
                  }}
                />
                {stockUploading ? (
                  <p className="text-[11px] font-semibold text-[#66638c]">กำลังอัปโหลด…</p>
                ) : null}
                {stockDetail.images && stockDetail.images.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {stockDetail.images.map((img) => (
                      <li key={img.id}>
                        <AppImageThumb
                          src={img.imageUrl}
                          alt={stockDetail.title}
                          className="h-16 w-16"
                          onOpen={() => lb.open(img.imageUrl)}
                        />
                        {img.isCover ? (
                          <span className="block text-center text-[10px] font-bold text-emerald-700">ปก</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex min-w-0 items-start gap-3">
                {stockDetail.coverImageUrl ? (
                  <AppImageThumb
                    src={stockDetail.coverImageUrl}
                    alt={stockDetail.title}
                    className="h-20 w-20 shrink-0"
                    onOpen={() => stockDetail.coverImageUrl && lb.open(stockDetail.coverImageUrl)}
                  />
                ) : (
                  <span
                    className={cn(
                      usedCarShowroomCardIconTileClass(usedCarVehicleStatusTone(stockDetail.status), "lg"),
                      "shrink-0",
                    )}
                    aria-hidden
                  >
                    <Car className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{stockDetail.title}</p>
                  <span className={vehicleStatusPillClass(stockDetail.status)}>{stockDetail.statusLabel}</span>
                  <p className="text-sm font-black text-emerald-700">{baht(stockDetail.askingPriceBaht)}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
                <div>
                  <dt className="font-bold text-[#8b87a8]">ยี่ห้อ / รุ่น</dt>
                  <dd className="font-semibold text-[#1e1b4b]">
                    {stockDetail.brand} {stockDetail.model}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ปี</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{stockDetail.year ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">สี</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{stockDetail.color || "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">เลขไมล์</dt>
                  <dd className="font-semibold text-[#1e1b4b]">
                    {stockDetail.mileageKm != null
                      ? `${stockDetail.mileageKm.toLocaleString("th-TH")} กม.`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">เกียร์</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{stockDetail.transmission || "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">เชื้อเพลิง</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{stockDetail.fuelType || "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ทะเบียน</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{stockDetail.plateNumber || "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">เล่มทะเบียน</dt>
                  <dd className="font-semibold text-[#1e1b4b]">
                    {stockDetail.hasRegistrationBook ? "มี" : "ไม่มี / ไม่ระบุ"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ทุนซื้อ</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{baht(stockDetail.purchaseCostBaht ?? 0)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ปรับสภาพ</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{baht(stockDetail.prepCostBaht ?? 0)}</dd>
                </div>
                {stockDetail.vin ? (
                  <div className="col-span-2">
                    <dt className="font-bold text-[#8b87a8]">VIN</dt>
                    <dd className="break-all font-semibold text-[#1e1b4b]">{stockDetail.vin}</dd>
                  </div>
                ) : null}
              </dl>

              {stockDetail.description ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4d47b6]">คำอธิบาย</p>
                  <p className="whitespace-pre-wrap text-xs font-semibold text-[#66638c]">
                    {stockDetail.description}
                  </p>
                </div>
              ) : null}

              {stockDetail.note ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4d47b6]">หมายเหตุภายใน</p>
                  <p className="whitespace-pre-wrap text-xs font-semibold text-[#66638c]">{stockDetail.note}</p>
                </div>
              ) : null}

              {stockDetail.images && stockDetail.images.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-[#4d47b6]">รูปรถ ({stockDetail.images.length})</p>
                  <ul className="flex flex-wrap gap-2">
                    {stockDetail.images.map((img) => (
                      <li key={img.id}>
                        <AppImageThumb
                          src={img.imageUrl}
                          alt={stockDetail.title}
                          className="h-16 w-16"
                          onOpen={() => lb.open(img.imageUrl)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stockDetail.costLines && stockDetail.costLines.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-[#4d47b6]">รายการปรับสภาพ</p>
                  <ul className="space-y-1">
                    {stockDetail.costLines.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-white/70 px-2.5 py-1.5 text-xs"
                      >
                        <span className="min-w-0 truncate font-semibold text-[#1e1b4b]">
                          {c.label || c.kind}
                        </span>
                        <span className="shrink-0 font-bold text-rose-600">{baht(c.amountBaht)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )
        ) : null}
      </FormModal>

      <FormModal
        open={Boolean(reserveDetail)}
        onClose={() => setReserveDetail(null)}
        title="รายละเอียดการจอง"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setReserveDetail(null)}
            onSubmit={() => void saveReserveDetail()}
            submitLabel="บันทึกสถานะ"
            loading={reserveDetailSaving}
          />
        }
      >
        {reserveDetail ? (
          <div className="space-y-3">
            <div className="flex min-w-0 items-start gap-3">
              {reserveDetail.vehicleCoverImageUrl ? (
                <AppImageThumb
                  src={reserveDetail.vehicleCoverImageUrl}
                  alt={reserveDetail.vehicleTitle ?? "รถ"}
                  className="h-16 w-16 shrink-0"
                  onOpen={() =>
                    reserveDetail.vehicleCoverImageUrl && lb.open(reserveDetail.vehicleCoverImageUrl)
                  }
                />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-black text-[#1e1b4b]">{reserveDetail.customerName}</p>
                <p className="text-xs font-semibold text-[#66638c]">{reserveDetail.customerPhone}</p>
                <p className="text-xs font-semibold text-[#66638c]">
                  {reserveDetail.vehicleTitle ?? "— ไม่ระบุรถ —"}
                </p>
                <span className={reservationStatusPillClass(reserveDetail.status)}>
                  {usedCarReservationStatusLabel(reserveDetail.status)}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
              <div>
                <dt className="font-bold text-[#8b87a8]">แหล่งจอง</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {usedCarReservationSourceLabel(reserveDetail.source ?? "STAFF")}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">มัดจำ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{baht(reserveDetail.depositBaht)}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ช่องทางชำระ</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {usedCarPaymentMethodLabel(reserveDetail.paymentMethod || "NONE")}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">หมดอายุ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{reserveDetail.expiresOn || "—"}</dd>
              </div>
            </dl>

            {reserveDetail.slipImageUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#4d47b6]">สลิปมัดจำ</p>
                <AppLabeledImageThumb
                  src={reserveDetail.slipImageUrl}
                  kind="slip"
                  alt="สลิปมัดจำ"
                  className="h-20 w-20"
                  onOpen={() => reserveDetail.slipImageUrl && lb.open(reserveDetail.slipImageUrl)}
                />
              </div>
            ) : null}

            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะการจอง
              <select
                className={usedCarShowroomFieldClass}
                value={reserveDetailStatus}
                onChange={(e) => setReserveDetailStatus(e.target.value)}
              >
                {USED_CAR_RESERVATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {usedCarReservationStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              หมายเหตุ
              <textarea
                className={cn(usedCarShowroomFieldClass, "min-h-[72px] max-h-none py-2")}
                value={reserveDetailNote}
                onChange={(e) => setReserveDetailNote(e.target.value)}
                rows={3}
              />
            </label>
          </div>
        ) : null}
      </FormModal>

      <FormModal
        open={Boolean(apptDetail)}
        onClose={() => setApptDetail(null)}
        title="รายละเอียดนัดหมาย"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setApptDetail(null)}
            onSubmit={() => void saveApptDetail()}
            submitLabel="บันทึกสถานะ"
            loading={apptDetailSaving}
          />
        }
      >
        {apptDetail ? (
          <div className="space-y-3">
            <div className="flex min-w-0 items-start gap-3">
              {apptDetail.vehicleCoverImageUrl ? (
                <AppImageThumb
                  src={apptDetail.vehicleCoverImageUrl}
                  alt={apptDetail.vehicleTitle ?? "รถ"}
                  className="h-16 w-16 shrink-0"
                  onOpen={() =>
                    apptDetail.vehicleCoverImageUrl && lb.open(apptDetail.vehicleCoverImageUrl)
                  }
                />
              ) : (
                <span className={cn(usedCarShowroomCardIconTileClass("cyan", "lg"), "shrink-0")} aria-hidden>
                  <Car className="h-6 w-6" strokeWidth={2.1} />
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-black text-[#1e1b4b]">{apptDetail.customerName}</p>
                <p className="text-xs font-semibold text-[#66638c]">
                  <a href={`tel:${apptDetail.customerPhone}`} className="underline-offset-2 hover:underline">
                    {apptDetail.customerPhone}
                  </a>
                </p>
                <p className="text-xs font-semibold text-[#66638c]">
                  {apptDetail.vehicleTitle ?? "— ไม่ระบุรถ —"}
                  {apptDetail.vehiclePlateNumber ? ` · ทะเบียน ${apptDetail.vehiclePlateNumber}` : ""}
                </p>
                <span
                  className={cn(
                    "inline-flex max-w-full items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                    apptDetail.status === "DONE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : apptDetail.status === "CANCELLED"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : apptDetail.status === "NO_SHOW"
                          ? "border-slate-200 bg-slate-50 text-slate-700"
                          : "border-amber-200 bg-amber-50 text-amber-900",
                  )}
                >
                  {usedCarAppointmentStatusLabel(apptDetail.status)}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold text-[#8b87a8]">วันเวลา</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {apptDetail.appointmentOn} · {apptDetail.appointmentHm} น.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ประเภท</dt>
                <dd className="font-semibold text-[#1e1b4b]">{usedCarAppointmentKindLabel(apptDetail.kind)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">สถานที่นัด</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {initialShop.displayName}
                  {initialShop.address ? (
                    <>
                      <br />
                      <span className="font-medium text-[#66638c]">{initialShop.address}</span>
                    </>
                  ) : (
                    <span className="font-medium text-[#8b87a8]"> — ยังไม่ได้ตั้งที่อยู่ในตั้งค่าร้าน</span>
                  )}
                  {initialShop.mapUrl ? (
                    <>
                      {" · "}
                      <a
                        href={initialShop.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#4d47b6] underline-offset-2 hover:underline"
                      >
                        เปิดแผนที่
                      </a>
                    </>
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">รถที่จะดู</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {apptDetail.vehicleTitle ? (
                    <>
                      {apptDetail.vehicleTitle}
                      {apptDetail.vehicleColor ? ` · สี${apptDetail.vehicleColor}` : ""}
                      {apptDetail.vehiclePlateNumber ? ` · ทะเบียน ${apptDetail.vehiclePlateNumber}` : ""}
                      {typeof apptDetail.vehicleAskingPriceBaht === "number" &&
                      apptDetail.vehicleAskingPriceBaht > 0 ? (
                        <>
                          <br />
                          <span className="text-[#66638c]">ราคาถาม {baht(apptDetail.vehicleAskingPriceBaht)}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "ยังไม่ระบุคัน — นัดทั่วไปที่โชว์รูม"
                  )}
                </dd>
              </div>
            </dl>

            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะนัดหมาย
              <select
                className={usedCarShowroomFieldClass}
                value={apptDetailStatus}
                onChange={(e) => setApptDetailStatus(e.target.value)}
              >
                {USED_CAR_APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {usedCarAppointmentStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              หมายเหตุ
              <textarea
                className={cn(usedCarShowroomFieldClass, "min-h-[72px] max-h-none py-2")}
                value={apptDetailNote}
                onChange={(e) => setApptDetailNote(e.target.value)}
                rows={3}
              />
            </label>
          </div>
        ) : null}
      </FormModal>

      <FormModal
        open={apptOpen}
        onClose={() => setApptOpen(false)}
        title="นัดหมายใหม่"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setApptOpen(false)}
            onSubmit={() => void createAppointment()}
            submitLabel="บันทึกนัด"
            loading={apptSaving}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อลูกค้า
            <input
              className={usedCarShowroomFieldClass}
              value={apptForm.customerName}
              onChange={(e) => setApptForm((f) => ({ ...f, customerName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            เบอร์โทร
            <input
              className={usedCarShowroomFieldClass}
              inputMode="tel"
              value={apptForm.customerPhone}
              onChange={(e) => setApptForm((f) => ({ ...f, customerPhone: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            รถ (ไม่บังคับ)
            <select
              className={usedCarShowroomFieldClass}
              value={apptForm.vehicleId}
              onChange={(e) => setApptForm((f) => ({ ...f, vehicleId: e.target.value }))}
            >
              <option value="">—</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ประเภท
            <select
              className={usedCarShowroomFieldClass}
              value={apptForm.kind}
              onChange={(e) => setApptForm((f) => ({ ...f, kind: e.target.value as "VIEW" | "TEST_DRIVE" }))}
            >
              <option value="VIEW">ดูรถ</option>
              <option value="TEST_DRIVE">ทดลองขับ</option>
            </select>
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            วันที่ (เวลาไทย)
            <input
              type="date"
              className={usedCarShowroomFieldClass}
              value={apptForm.appointmentOn}
              onChange={(e) => setApptForm((f) => ({ ...f, appointmentOn: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            เวลา
            <AppTime24Input
              value={apptForm.appointmentHm}
              onChange={(hm) => setApptForm((f) => ({ ...f, appointmentHm: hm }))}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}

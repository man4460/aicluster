"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Car, CalendarClock, Landmark, ClipboardList, TrendingUp, Wallet } from "lucide-react";
import {
  AppEmptyState,
  AppImageThumb,
  AppLabeledImageThumb,
  AppTime24Input,
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
  USED_CAR_RESERVATION_STATUSES,
  usedCarReservationSourceLabel,
  usedCarReservationStatusLabel,
  usedCarReservationStatusTone,
  usedCarVehicleStatusLabel,
  usedCarVehicleStatusTone,
} from "@/systems/used-car-showroom/lib/status";
import {
  usedCarShowroomFieldClass,
  usedCarShowroomFinanceStatsGridClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomPageStackClass,
  usedCarShowroomPrimaryButtonClass,
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

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  statusLabel: string;
  askingPriceBaht: number;
  coverImageUrl: string | null;
  title: string;
};

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
  const [appointments, setAppointments] = useState<
    { id: string; customerName: string; appointmentOn: string; appointmentHm: string; kind: string; status: string; vehicleTitle: string | null }[]
  >([]);
  const [financeCases, setFinanceCases] = useState<
    { id: string; status: string; financedAmountBaht: number; vehicleTitle?: string | null }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveSaving, setReserveSaving] = useState(false);
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
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const stockVehicles = useMemo(() => {
    let list = vehicles;
    if (statusFilter) list = list.filter((v) => v.status === statusFilter);
    else if (tab === "stock") list = list.filter((v) => ["PREP", "FOR_SALE", "RESERVED", "SOLD", "DELIVERED"].includes(v.status));
    return list;
  }, [vehicles, statusFilter, tab]);

  const appointmentsToday = useMemo(() => {
    const today = bangkokDateKey();
    return appointments
      .filter((a) => a.appointmentOn === today && a.status !== "CANCELLED")
      .slice()
      .sort((a, b) => a.appointmentHm.localeCompare(b.appointmentHm));
  }, [appointments]);

  const pendingFinance = useMemo(
    () => financeCases.filter((c) => c.status === "SUBMITTED" || c.status === "WAITING_DOCS"),
    [financeCases],
  );

  const reservableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === "PREP" || v.status === "FOR_SALE"),
    [vehicles],
  );

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
              {appointmentsToday.length === 0 ? (
                <AppEmptyState>วันนี้ยังไม่มีนัดหมาย</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {appointmentsToday.map((a) => (
                    <li key={a.id} className={usedCarShowroomTonedRowCardClass("cyan")}>
                      <button
                        type="button"
                        className="w-full min-w-0 text-left"
                        onClick={() => setTab("appointments")}
                      >
                        <p className="text-sm font-black text-[#1e1b4b]">
                          {a.appointmentHm} · {a.customerName}
                        </p>
                        <p className="text-xs font-semibold text-[#66638c]">
                          {a.kind === "TEST_DRIVE" ? "ทดลองขับ" : "ดูรถ"}
                          {a.vehicleTitle ? ` · ${a.vehicleTitle}` : ""}
                          {a.status !== "SCHEDULED" ? ` · ${a.status}` : ""}
                        </p>
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
            <div className="flex flex-wrap gap-1.5">
              {[null, "PREP", "FOR_SALE", "RESERVED", "SOLD", "DELIVERED"].map((s) => (
                <button
                  key={s ?? "all"}
                  type="button"
                  className={cn(
                    usedCarShowroomOutlineButtonClass,
                    (statusFilter ?? null) === s && usedCarShowroomPrimaryButtonClass,
                  )}
                  onClick={() => setTab("stock", { status: s })}
                >
                  {s ? usedCarVehicleStatusLabel(s) : "ทั้งหมด"}
                </button>
              ))}
            </div>
            {stockVehicles.length === 0 ? (
              <AppEmptyState>ยังไม่มีรถ — เพิ่มรถที่เมนูการจัดการ</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {stockVehicles.map((v) => {
                  const tone = usedCarVehicleStatusTone(v.status);
                  return (
                    <li key={v.id} className={usedCarShowroomTonedRowCardClass(tone)}>
                      <div className="flex min-w-0 items-start gap-3">
                        {v.coverImageUrl ? (
                          <AppImageThumb
                            src={v.coverImageUrl}
                            alt={v.title}
                            className="h-14 w-14"
                            onOpen={() => lb.open(v.coverImageUrl!)}
                          />
                        ) : (
                          <span className={usedCarShowroomCardIconTileClass(tone, "lg")}>
                            <Car className="h-6 w-6" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-[#1e1b4b]">{v.title}</p>
                          <p className="text-xs font-semibold text-[#66638c]">
                            {v.statusLabel} · {baht(v.askingPriceBaht)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "reservations" ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                className={usedCarShowroomPrimaryButtonClass}
                onClick={() => setReserveOpen(true)}
              >
                จองให้ลูกค้า
              </button>
            </div>
            {reservations.length === 0 ? (
              <AppEmptyState>ยังไม่มีการจอง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {reservations.map((r) => {
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
                            <p className="text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด / เปลี่ยนสถานะ</p>
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
            <div className="flex justify-end">
              <button type="button" className={usedCarShowroomPrimaryButtonClass} onClick={() => setApptOpen(true)}>
                นัดหมายใหม่
              </button>
            </div>
            {appointments.length === 0 ? (
              <AppEmptyState>ยังไม่มีนัดหมาย</AppEmptyState>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className={usedCarShowroomTonedRowCardClass("cyan")}>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1e1b4b]">{a.customerName}</p>
                    <p className="text-xs text-[#66638c]">
                      {a.appointmentOn} {a.appointmentHm} · {a.kind === "TEST_DRIVE" ? "ทดลองขับ" : "ดูรถ"} ·{" "}
                      {a.vehicleTitle ?? "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === "finance-pending" ? (
          <div className="space-y-2">
            {pendingFinance.length === 0 ? (
              <AppEmptyState>ไม่มีเคสไฟแนนซ์รอ</AppEmptyState>
            ) : (
              pendingFinance.map((c) => (
                <div key={c.id} className={usedCarShowroomTonedRowCardClass("indigo")}>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1e1b4b]">{c.vehicleTitle ?? c.id.slice(0, 8)}</p>
                    <p className="text-xs text-[#66638c]">
                      {c.status} · ยอดจัด {baht(c.financedAmountBaht)}
                    </p>
                  </div>
                </div>
              ))
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

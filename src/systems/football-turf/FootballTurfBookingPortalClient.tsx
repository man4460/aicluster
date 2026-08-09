"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, Landmark, Phone, ReceiptText, Users } from "lucide-react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  prepareImageFileAsDataUrl,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { isBangkokWeekend } from "@/lib/time/bangkok";
import { footballTurfPublicBookingUrl } from "@/lib/football-turf/public-url";
import {
  type FootballTurfBooking,
  type FootballTurfCourt,
  type FootballTurfVenueSettings,
  createFootballTurfRepository,
} from "@/systems/football-turf/football-turf-service";
import { footballTurfComputePortalPayDue, footballTurfPortalSlipProofMessage } from "@/systems/football-turf/lib/portal-booking";
import {
  isBookingTimePassed,
  isSlotOpenForBooking,
  isSlotTimeCurrent,
  isSlotTimePassed,
  isSlotUpcoming,
  localDateKey,
  localNowMinutes,
  minutesToTime,
  timeToMinutes,
} from "@/systems/football-turf/lib/time-queue";

type PortalPayQr = {
  qrDataUrl: string | null;
  configured: boolean;
  promptpayNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  shopName?: string | null;
};

const FOOTBALL_TURF_MODULE_NAME = "สนามฟุตบอล";

function slipProofMessage(mode: FootballTurfVenueSettings["portalBookingPaymentMode"]) {
  return footballTurfPortalSlipProofMessage(mode ?? "NONE");
}

function buildCourtTimeline(
  court: FootballTurfCourt,
  courtBookings: FootballTurfBooking[],
): Array<{ startTime: string; endTime: string; booking: FootballTurfBooking | null }> {
  const start = timeToMinutes(court.openTime);
  const end = timeToMinutes(court.closeTime);
  const slots: Array<{ startTime: string; endTime: string; booking: FootballTurfBooking | null }> = [];
  for (let minute = start; minute < end; minute += court.slotMinutes) {
    const slotStart = minute;
    const slotEnd = Math.min(minute + court.slotMinutes, end);
    const booking =
      courtBookings.find((item) => {
        const bookingStart = timeToMinutes(item.startTime);
        const bookingEnd = timeToMinutes(item.endTime);
        return bookingStart < slotEnd && bookingEnd > slotStart && item.status !== "CANCELLED";
      }) ?? null;
    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      booking,
    });
  }
  return slots;
}

function bookingStatusLabel(status: FootballTurfBooking["status"]) {
  if (status === "CHECKED_IN") return "เช็กอินแล้ว";
  if (status === "PLAYING") return "กำลังใช้งาน";
  if (status === "COMPLETED") return "เสร็จสิ้น";
  if (status === "CANCELLED") return "ยกเลิก";
  return "จองแล้ว";
}

function formatMoney(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

const EMPTY_SETTINGS: FootballTurfVenueSettings = {
  venueName: "",
  venueSubtitle: "",
  promptpayNumber: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  venueAddress: "",
  taxId: "",
  contactPhone: "",
  contactLine: "",
  note: "",
  slipPaperSize: "SLIP_58",
  portalBookingPaymentMode: "NONE",
  depositAmountBaht: null,
};

export function FootballTurfBookingPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const repo = useMemo(
    () => createFootballTurfRepository({ mode: "public", ownerId, trialSessionId }),
    [ownerId, trialSessionId],
  );
  const router = useRouter();
  const [courts, setCourts] = useState<FootballTurfCourt[]>([]);
  const [bookings, setBookings] = useState<FootballTurfBooking[]>([]);
  const [settings, setSettings] = useState<FootballTurfVenueSettings>(EMPTY_SETTINGS);
  const [message, setMessage] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liveClockMs, setLiveClockMs] = useState(() => Date.now());
  const [payQr, setPayQr] = useState<PortalPayQr | null>(null);
  const [payQrBusy, setPayQrBusy] = useState(false);
  const [payQrErr, setPayQrErr] = useState<string | null>(null);
  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();
  const [form, setForm] = useState({
    courtId: "1",
    bookingDate: localDateKey(),
    startTime: "",
    endTime: "",
    customerName: "",
    customerPhone: "",
    teamName: "",
    playerCount: "",
    paymentMethod: "TRANSFER" as "TRANSFER" | "ONSITE",
    paymentReference: "",
    paymentSlipDataUrl: "",
  });

  const refresh = useCallback(async () => {
    const [courtRows, bookingRows, settingsRow] = await Promise.all([
      repo.listCourts(),
      repo.listBookings(),
      repo.getSettings(),
    ]);
    setCourts(courtRows.filter((item) => item.isActive));
    setBookings(bookingRows);
    setSettings(settingsRow);
  }, [repo]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => setLiveClockMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!courts.length) return;
    if (courts.some((item) => String(item.id) === form.courtId)) return;
    setForm((state) => ({ ...state, courtId: String(courts[0].id) }));
  }, [courts, form.courtId]);

  const liveNow = useMemo(() => new Date(liveClockMs), [liveClockMs]);
  const todayDateKey = localDateKey(liveNow);
  const nowMinutes = localNowMinutes(liveNow);
  const slotTimeOpts = useMemo(
    () => ({ scheduleDate: form.bookingDate, todayDateKey, nowMinutes }),
    [form.bookingDate, todayDateKey, nowMinutes],
  );
  const selectedCourt = useMemo(
    () => courts.find((item) => String(item.id) === form.courtId) ?? courts[0] ?? null,
    [courts, form.courtId],
  );
  const selectedCourtBookings = useMemo(
    () =>
      bookings
        .filter(
          (item) =>
            item.courtId === Number(form.courtId) &&
            item.bookingDate === form.bookingDate &&
            item.status !== "CANCELLED",
        )
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [bookings, form.bookingDate, form.courtId],
  );
  const timeline = useMemo(
    () => (selectedCourt ? buildCourtTimeline(selectedCourt, selectedCourtBookings) : []),
    [selectedCourt, selectedCourtBookings],
  );
  const availableSlots = useMemo(
    () => timeline.filter((slot) => isSlotOpenForBooking(slot, slotTimeOpts)),
    [timeline, slotTimeOpts],
  );
  const selectedSlot = useMemo(
    () =>
      timeline.find(
        (slot) =>
          isSlotOpenForBooking(slot, slotTimeOpts) &&
          slot.startTime === form.startTime &&
          slot.endTime === form.endTime,
      ) ?? null,
    [form.endTime, form.startTime, timeline, slotTimeOpts],
  );
  const activeTimelineSlot = useMemo(
    () =>
      timeline.find(
        (slot) =>
          slot.startTime === form.startTime &&
          slot.endTime === form.endTime &&
          !isSlotTimePassed(slot, slotTimeOpts),
      ) ?? null,
    [form.endTime, form.startTime, timeline, slotTimeOpts],
  );
  const bookingPrice = useMemo(() => {
    if (!selectedCourt) return 0;
    const isWeekend = isBangkokWeekend(form.bookingDate);
    return isWeekend ? selectedCourt.weekendPrice : selectedCourt.weekdayPrice;
  }, [form.bookingDate, selectedCourt]);
  const payDueBaht = useMemo(
    () =>
      footballTurfComputePortalPayDue({
        mode: settings.portalBookingPaymentMode ?? "NONE",
        depositAmountBaht: settings.depositAmountBaht,
        totalBaht: bookingPrice,
      }),
    [bookingPrice, settings.depositAmountBaht, settings.portalBookingPaymentMode],
  );
  const depositMisconfigured =
    settings.portalBookingPaymentMode === "DEPOSIT" &&
    Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0))) <= 0;
  const requiresPortalPay = payDueBaht != null && payDueBaht > 0;
  const moduleVenueLine = settings.venueName.trim() || settings.venueSubtitle.trim() || "สนามหญ้าเทียม";
  const canSubmit = Boolean(
    selectedCourt &&
      selectedSlot &&
      form.customerName.trim() &&
      form.customerPhone.trim() &&
      !depositMisconfigured &&
      (!requiresPortalPay || (form.paymentMethod === "TRANSFER" && form.paymentSlipDataUrl)) &&
      !submitting &&
      !uploadingSlip,
  );

  useEffect(() => {
    if (!requiresPortalPay || form.paymentMethod !== "TRANSFER" || !payDueBaht) {
      setPayQr(null);
      setPayQrErr(null);
      return;
    }
    let cancelled = false;
    setPayQrBusy(true);
    setPayQrErr(null);
    void (async () => {
      try {
        const res = await fetch("/api/football-turf/public/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            amountBaht: payDueBaht,
            t: trialSessionId || undefined,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as Partial<PortalPayQr> & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setPayQr(null);
          setPayQrErr(typeof j.error === "string" ? j.error : "โหลด QR ไม่สำเร็จ");
          return;
        }
        setPayQr({
          qrDataUrl: j.qrDataUrl ?? null,
          configured: Boolean(j.configured),
          promptpayNumber: j.promptpayNumber ?? null,
          bankName: j.bankName ?? null,
          accountNumber: j.accountNumber ?? null,
          accountName: j.accountName ?? null,
          shopName: j.shopName ?? null,
        });
      } catch {
        if (!cancelled) {
          setPayQr(null);
          setPayQrErr("เชื่อมต่อไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setPayQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.paymentMethod, ownerId, payDueBaht, requiresPortalPay, trialSessionId]);

  useEffect(() => {
    if (!requiresPortalPay) return;
    setForm((state) =>
      state.paymentMethod === "TRANSFER" ? state : { ...state, paymentMethod: "TRANSFER" },
    );
  }, [requiresPortalPay]);

  useEffect(() => {
    const nextSlot = availableSlots[0] ?? null;
    if (selectedSlot) return;
    if (!nextSlot && !form.startTime && !form.endTime) return;
    setForm((state) => ({
      ...state,
      startTime: nextSlot?.startTime ?? "",
      endTime: nextSlot?.endTime ?? "",
    }));
  }, [availableSlots, form.endTime, form.startTime, selectedSlot]);

  /** เปลี่ยนวัน → เคลียร์ช่วงที่อาจหมดเวลา แล้วให้ effect เลือกคิวว่างใหม่อัตโนมัติ */
  useEffect(() => {
    setForm((state) => ({ ...state, startTime: "", endTime: "" }));
  }, [form.bookingDate, form.courtId]);

  const phoneDigits = form.customerPhone.trim();
  const myBookings = useMemo(
    () =>
      bookings.filter((item) =>
        phoneDigits ? item.customerPhone.includes(phoneDigits) : false,
      ),
    [bookings, phoneDigits],
  );

  async function onSlipSelected(file: File | null) {
    if (!file) return;
    setUploadingSlip(true);
    setMessage("");
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setForm((state) => ({ ...state, paymentSlipDataUrl: dataUrl, paymentMethod: "TRANSFER" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "แนบสลิปไม่สำเร็จ");
    } finally {
      setUploadingSlip(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourt || !selectedSlot) {
      setMessage("กรุณาเลือกช่วงเวลาที่ว่างก่อนยืนยันการจอง");
      return;
    }
    if (isSlotTimePassed(selectedSlot, slotTimeOpts)) {
      setMessage("ช่วงเวลานี้หมดแล้ว กรุณาเลือกคิวว่างที่ยังไม่ผ่านเวลา");
      return;
    }
    if (requiresPortalPay && (form.paymentMethod !== "TRANSFER" || !form.paymentSlipDataUrl)) {
      setMessage(slipProofMessage(settings.portalBookingPaymentMode));
      return;
    }
    const playerCount = Number(form.playerCount);
    if (!form.playerCount.trim() || !Number.isFinite(playerCount) || playerCount < 1) {
      setMessage("กรุณากรอกจำนวนผู้เล่น");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const created = await repo.createBooking({
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        bookingDate: form.bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        teamName: form.teamName.trim(),
        playerCount,
        source: "ONLINE",
        status: "BOOKED",
        listedPrice: bookingPrice,
        finalPrice: bookingPrice,
        depositAmountBaht: payDueBaht,
        promotionSaleId: null,
        note:
          requiresPortalPay && settings.portalBookingPaymentMode === "DEPOSIT"
            ? `ลูกค้าจองผ่านลิงก์ · มัดจำ ${payDueBaht} บาท`
            : requiresPortalPay && settings.portalBookingPaymentMode === "FULL"
              ? "ลูกค้าจองผ่านลิงก์ · ชำระเต็มยอด"
              : "ลูกค้าจองผ่านลิงก์สนาม",
        paymentMethod: requiresPortalPay ? "TRANSFER" : form.paymentMethod,
        paymentStatus: requiresPortalPay ? "PENDING_REVIEW" : "UNPAID",
        paymentSlipDataUrl: requiresPortalPay ? form.paymentSlipDataUrl : "",
        paymentReference: form.paymentReference.trim(),
      });
      const phoneDigits = (created.customerPhone || form.customerPhone).replace(/\D/g, "");
      router.push(
        footballTurfPublicBookingUrl(
          "",
          ownerId,
          created.id,
          phoneDigits,
          trialSessionId?.trim() || "prod",
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "จองไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppPublicCheckInGlassPage className="pb-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-6 sm:px-7")}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">จองสนามออนไลน์</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{FOOTBALL_TURF_MODULE_NAME}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{moduleVenueLine}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สนามที่เลือก</p>
                <p className="mt-1 text-sm font-black text-slate-900">{selectedCourt?.name ?? "-"}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#0000BF]/30 bg-[#0000BF]/10 px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">ช่วงเวลาว่าง</p>
                <p className="mt-1 text-sm font-black text-slate-900">{availableSlots.length} บล็อก</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.28fr_0.72fr]">
          <form className={cn(appPublicCheckInGlassCardClass, "px-5 py-5 sm:px-7")} onSubmit={onSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-[1fr_0.95fr]">
                <label className="space-y-1.5 text-sm font-bold text-slate-700">
                  สนาม
                  <select
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    value={form.courtId}
                    onChange={(e) => setForm((state) => ({ ...state, courtId: e.target.value }))}
                  >
                    {courts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-bold text-slate-700">
                  วันที่
                  <input
                    type="date"
                    min={todayDateKey}
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    value={form.bookingDate}
                    onChange={(e) => setForm((state) => ({ ...state, bookingDate: e.target.value || todayDateKey }))}
                  />
                </label>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-emerald-50/50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เลือกช่วงเวลาว่าง</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">ช่วงเวลาแบบบล็อก</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-slate-200">ว่าง / จองล่วงหน้า</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500 ring-1 ring-slate-200">ถูกจอง</span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-500 ring-1 ring-slate-300">หมดเวลา</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">ช่วงที่เลือก</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {timeline.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm font-medium text-slate-500 sm:col-span-2 xl:col-span-3">
                      ยังไม่มีช่วงเวลาให้จองในสนามนี้
                    </div>
                  ) : (
                    timeline.map((slot) => {
                      const timePassed = isSlotTimePassed(slot, slotTimeOpts);
                      const timeCurrent = isSlotTimeCurrent(slot, slotTimeOpts);
                      const upcoming = isSlotUpcoming(slot, slotTimeOpts);
                      const booked = Boolean(slot.booking) && !timePassed;
                      const open = isSlotOpenForBooking(slot, slotTimeOpts);
                      const selected =
                        open &&
                        form.startTime === slot.startTime &&
                        form.endTime === slot.endTime;
                      return (
                        <button
                          key={`${slot.startTime}-${slot.endTime}`}
                          type="button"
                          disabled={!open}
                          onClick={() =>
                            setForm((state) => ({
                              ...state,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            }))
                          }
                          className={cn(
                            "rounded-[1.2rem] border px-4 py-4 text-left transition-all",
                            timePassed
                              ? "cursor-not-allowed border-slate-200/80 bg-slate-100/90 text-slate-400 opacity-85"
                              : booked
                                ? "cursor-not-allowed border-slate-200 bg-slate-100/85 text-slate-400"
                                : selected
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_18px_34px_-28px_rgba(16,185,129,0.8)] ring-1 ring-emerald-100"
                                  : timeCurrent
                                    ? "border-cyan-200 bg-cyan-50/80 text-slate-700 shadow-sm"
                                    : "border-white/80 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-white",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={cn("text-sm font-black", timePassed && "text-slate-400")}>
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p className={cn("mt-1 text-xs font-medium", timePassed ? "text-slate-400" : undefined)}>
                                {timePassed
                                  ? "ไม่มีผู้จอง / ผู้เล่น"
                                  : booked
                                    ? "ช่วงนี้ถูกจองแล้ว"
                                    : upcoming
                                      ? "ว่าง · จองล่วงหน้าได้"
                                      : "ว่าง พร้อมรับจอง"}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-black ring-1",
                                timePassed
                                  ? "bg-slate-200/90 text-slate-500 ring-slate-300/80"
                                  : booked
                                    ? "bg-slate-200 text-slate-500 ring-slate-200"
                                    : selected
                                      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                      : "bg-cyan-50 text-cyan-700 ring-cyan-200",
                              )}
                            >
                              {timePassed ? "หมดเวลา" : booked ? "ถูกจอง" : upcoming ? "ล่วงหน้า" : "ว่าง"}
                            </span>
                          </div>
                          <div className={cn("mt-3 flex items-center gap-2 text-[11px] font-black", timePassed && "text-slate-400")}>
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{selectedCourt?.slotMinutes ?? 0} นาที</span>
                            {open ? (
                              <span className="ml-auto">{formatMoney(bookingPrice)}</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สรุปรายการที่เลือก</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {activeTimelineSlot
                        ? `${selectedCourt?.name ?? "-"} · ${activeTimelineSlot.startTime}-${activeTimelineSlot.endTime}`
                        : "ยังไม่ได้เลือกช่วงเวลา"}
                    </p>
                  </div>
                  <div className={cn("rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg", appDashboardBrandGradientFillClass)}>
                    {formatMoney(bookingPrice)}
                  </div>
                </div>
                {activeTimelineSlot?.booking ? (
                  <p className="mt-3 text-xs font-bold text-emerald-700">ช่วงเวลานี้ถูกจองเรียบร้อยแล้ว สามารถเลือกบล็อกอื่นต่อได้ทันที</p>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/45 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ข้อมูลทีม / ผู้ติดต่อ</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <input
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    placeholder="ชื่อผู้จอง"
                    value={form.customerName}
                    onChange={(e) => setForm((state) => ({ ...state, customerName: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    placeholder="เบอร์โทร"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm((state) => ({
                        ...state,
                        customerPhone: e.target.value.replace(/\D/g, "").slice(0, 15),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    placeholder="ชื่อทีม"
                    value={form.teamName}
                    onChange={(e) => setForm((state) => ({ ...state, teamName: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                    placeholder="จำนวนผู้เล่น"
                    inputMode="numeric"
                    value={form.playerCount}
                    onChange={(e) =>
                      setForm((state) => ({
                        ...state,
                        playerCount: e.target.value.replace(/\D/g, "").slice(0, 2),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/50 p-4">
                <p className="text-xs font-black text-[#1e1b4b]">
                  {depositMisconfigured
                    ? "สนามยังไม่ได้ตั้งจำนวนมัดจำ — ติดต่อเจ้าของสนาม"
                    : settings.portalBookingPaymentMode === "DEPOSIT"
                      ? `มัดจำตอนจอง · ${formatMoney(payDueBaht ?? 0)}`
                      : settings.portalBookingPaymentMode === "FULL"
                        ? `ชำระเต็มยอด · ${formatMoney(payDueBaht ?? bookingPrice)}`
                        : "ไม่ต้องชำระตอนจอง — ชำระหน้าสนามได้"}
                </p>
                {requiresPortalPay ? (
                  <>
                    <p className="mt-1 text-[11px] font-semibold text-[#66638c]">
                      ยอดรวมรอบ {formatMoney(bookingPrice)}
                      {settings.portalBookingPaymentMode === "DEPOSIT"
                        ? " · ชำระส่วนที่เหลือหน้าสนาม"
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-black text-white shadow-sm",
                          appDashboardBrandGradientFillClass,
                        )}
                      >
                        โอนเงินค่าจอง
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((state) => ({ ...state, paymentMethod: "ONSITE", paymentSlipDataUrl: "" }))}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-black transition",
                        form.paymentMethod === "ONSITE"
                          ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                          : "bg-white text-slate-500 ring-1 ring-slate-200",
                      )}
                    >
                      ชำระหน้าสนาม
                    </button>
                  </div>
                )}

                {requiresPortalPay ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-slate-500" />
                      <p className="text-sm font-black text-slate-900">ชำระค่าจอง</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2 rounded-[1.25rem] border border-white/70 bg-white/80 p-3">
                        <p className="text-xs font-black text-[#1e1b4b]">QR พร้อมเพย์ · {formatMoney(payDueBaht ?? 0)}</p>
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f8f7ff] p-3 ring-1 ring-[#e8e6fc]">
                          {payQrBusy ? (
                            <p className="py-12 text-xs font-bold text-[#66638c]">กำลังสร้าง QR…</p>
                          ) : payQr?.qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={payQr.qrDataUrl}
                              alt="QR พร้อมเพย์"
                              className="h-[200px] w-[200px] rounded-2xl bg-white p-2 object-contain"
                            />
                          ) : (
                            <p className="py-8 text-center text-xs font-bold text-rose-600">
                              {payQrErr ||
                                (payQr?.configured === false
                                  ? "สนามยังไม่ได้ตั้งเบอร์พร้อมเพย์"
                                  : "สร้าง QR ไม่สำเร็จ")}
                            </p>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#66638c]">
                          พร้อมเพย์:{" "}
                          <span className="font-black text-[#1e1b4b]">
                            {payQr?.promptpayNumber || settings.promptpayNumber || "—"}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-1 rounded-[1.25rem] border border-white/70 bg-white/80 p-3 text-xs font-semibold text-[#66638c]">
                        <p className="font-black text-[#1e1b4b]">โอนเข้าบัญชี</p>
                        <p>
                          ธนาคาร:{" "}
                          <span className="font-black text-[#1e1b4b]">
                            {payQr?.bankName || settings.bankName || "—"}
                          </span>
                        </p>
                        <p>
                          เลขบัญชี:{" "}
                          <span className="font-black text-[#1e1b4b]">
                            {payQr?.accountNumber || settings.accountNumber || "—"}
                          </span>
                        </p>
                        <p>
                          ชื่อบัญชี:{" "}
                          <span className="font-black text-[#1e1b4b]">
                            {payQr?.accountName || settings.accountName || "—"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="h-5 w-5 text-slate-500" />
                      <p className="text-sm font-black text-slate-900">แนบสลิป</p>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold leading-snug text-[#66638c]">
                      {slipProofMessage(settings.portalBookingPaymentMode)}
                    </p>
                    <div className="mt-4 grid gap-3">
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                        placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                        value={form.paymentReference}
                        onChange={(e) => setForm((state) => ({ ...state, paymentReference: e.target.value }))}
                      />
                      <AppGalleryCameraFileInputs
                        galleryInputRef={slipGalleryRef}
                        cameraInputRef={cameraInputRef}
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          ev.target.value = "";
                          if (!f) return;
                          void onSlipSelected(f);
                        }}
                      />
                      <AppImagePickCameraButtons
                        onPickGallery={() => slipGalleryRef.current?.click()}
                        onPickCamera={() =>
                          openCamera((file) => {
                            void onSlipSelected(file);
                          })
                        }
                        busy={uploadingSlip || submitting}
                        labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                      />
                      {form.paymentSlipDataUrl ? (
                        <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/70 p-3">
                          <AppImageThumb
                            src={form.paymentSlipDataUrl}
                            alt="สลิปการโอน"
                            onOpen={() => lb.open(form.paymentSlipDataUrl)}
                            className="h-24 w-24"
                          />
                          <p className="mt-3 text-xs font-bold text-emerald-700">แนบสลิปแล้ว — กดยืนยันเพื่อบันทึกการจอง</p>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-amber-700">ยังไม่ได้แนบสลิป</p>
                      )}
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="mt-4 rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                    <p className="text-sm font-black text-slate-900">เลือกชำระเงินที่สนามแล้ว</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">ไม่ต้องแนบสลิป ระบบจะบันทึกคิวเป็นรอชำระหน้าสนาม</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="app-btn-primary rounded-2xl px-5 py-3 text-sm font-black shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? "กำลังจอง…" : "ยืนยันการจองสนาม"}
              </button>
              {message ? <p className="text-sm font-bold text-rose-600">{message}</p> : null}
            </div>
          </form>

          <div className="space-y-4">
            <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5")}>
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black text-slate-900">ข้อมูลสนามที่เลือก</p>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เวลาเปิดใช้งาน</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {selectedCourt ? `${selectedCourt.openTime} - ${selectedCourt.closeTime}` : "-"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ราคาต่อรอบ</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatMoney(bookingPrice)}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ติดต่อสนาม</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{settings.contactPhone || "-"}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{settings.venueAddress || "-"}</p>
                </div>
              </div>
            </div>

            <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5")}>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black text-slate-900">รายการจองของคุณ</p>
              </div>
              <div className="mt-4 space-y-3">
                {myBookings.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500">กรอกเบอร์โทรเพื่อดูประวัติการจอง</p>
                ) : (
                  myBookings.map((item) => {
                    const past = isBookingTimePassed(item, liveNow);
                    const detailHref = footballTurfPublicBookingUrl(
                      "",
                      ownerId,
                      item.id,
                      (item.customerPhone || phoneDigits).replace(/\D/g, ""),
                      trialSessionId?.trim() || "prod",
                    );
                    return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-[1.25rem] border p-4",
                        past
                          ? "border-slate-200/80 bg-slate-100/85"
                          : "border-white/70 bg-white/80",
                      )}
                    >
                      <p className={cn("font-black", past ? "text-slate-400" : "text-slate-900")}>
                        {past ? "ไม่มีผู้จอง / ผู้เล่น" : item.teamName || item.customerName}
                      </p>
                      <p className={cn("mt-1 text-xs font-medium", past ? "text-slate-400" : "text-slate-500")}>
                        {item.courtName} · {item.bookingDate} · {item.startTime}-{item.endTime}
                      </p>
                      <div
                        className={cn(
                          "mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                          past
                            ? "bg-slate-200/90 text-slate-500 ring-slate-300/80"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-200",
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {past ? "หมดเวลา" : bookingStatusLabel(item.status)}
                      </div>
                      {!past ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                          {item.paymentMethod === "TRANSFER" ? "โอนเงิน" : item.paymentMethod === "ONSITE" ? "ชำระหน้าสนาม" : "ยังไม่ระบุการชำระ"}
                        </span>
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-700 ring-1 ring-cyan-200">
                          {item.paymentStatus === "PENDING_REVIEW" ? "รอตรวจสลิป" : item.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                        </span>
                        <Link
                          href={detailHref}
                          className="rounded-full bg-[#5b61ff]/10 px-2.5 py-1 text-[11px] font-black text-[#4d47b6] ring-1 ring-[#5b61ff]/25"
                        >
                          ดูรายละเอียด
                        </Link>
                      </div>
                      ) : null}
                    </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5")}>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.contactPhone || "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.contactLine || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      {cameraModal}
    </AppPublicCheckInGlassPage>
  );
}

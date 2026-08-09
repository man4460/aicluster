"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock3, CreditCard, ReceiptText } from "lucide-react";
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
  FOOTBALL_TURF_PORTAL_SAMPLE_BANNER,
  FOOTBALL_TURF_PORTAL_SAMPLE_GALLERY,
} from "@/systems/football-turf/lib/portal-media";
import {
  isBookingTimePassed,
  isSlotEligibleForAdvanceBooking,
  isSlotTimeCurrent,
  isSlotTimePassed,
  isSlotUpcoming,
  listAdvanceBookingEligibleSlots,
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

type PortalPayMethod = "PROMPTPAY" | "TRANSFER" | "ONSITE";

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";
const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const mutedTextClass = "text-sm font-semibold text-[#66638c]";

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

function toStoredPaymentMethod(method: PortalPayMethod): "TRANSFER" | "ONSITE" {
  if (method === "ONSITE") return "ONSITE";
  return "TRANSFER";
}

const EMPTY_SETTINGS: FootballTurfVenueSettings = {
  venueName: "",
  venueSubtitle: "",
  logoUrl: "",
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
  portalBannerUrl: "",
  portalGallery: [],
  facebookUrl: "",
  mapUrl: "",
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
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liveClockMs, setLiveClockMs] = useState(() => Date.now());
  const [payQr, setPayQr] = useState<PortalPayQr | null>(null);
  const [payQrBusy, setPayQrBusy] = useState(false);
  const [payQrErr, setPayQrErr] = useState<string | null>(null);
  const [lookupPhone, setLookupPhone] = useState("");
  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLDivElement | null>(null);
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
    paymentMethod: "PROMPTPAY" as PortalPayMethod,
    paymentReference: "",
    paymentSlipDataUrl: "",
  });

  const refresh = useCallback(async () => {
    try {
      const [courtRows, bookingRows, settingsRow] = await Promise.all([
        repo.listCourts(),
        repo.listBookings(),
        repo.getSettings(),
      ]);
      setCourts(courtRows.filter((item) => item.isActive));
      setBookings(bookingRows);
      setSettings(settingsRow);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoaded(true);
    }
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
    () => listAdvanceBookingEligibleSlots(timeline, slotTimeOpts),
    [timeline, slotTimeOpts],
  );
  const selectedSlot = useMemo(
    () =>
      timeline.find(
        (slot) =>
          isSlotEligibleForAdvanceBooking(slot, slotTimeOpts) &&
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
  const venueTitle = settings.venueName.trim() || "สนามหญ้าเทียม";
  const canSubmit = Boolean(
    selectedCourt &&
      selectedSlot &&
      form.customerName.trim() &&
      form.customerPhone.trim() &&
      !depositMisconfigured &&
      (!requiresPortalPay ||
        ((form.paymentMethod === "PROMPTPAY" || form.paymentMethod === "TRANSFER") &&
          form.paymentSlipDataUrl)) &&
      !submitting &&
      !uploadingSlip,
  );

  useEffect(() => {
    if (!requiresPortalPay) {
      setForm((state) =>
        state.paymentMethod === "ONSITE" ? state : { ...state, paymentMethod: "ONSITE" },
      );
      return;
    }
    setForm((state) =>
      state.paymentMethod === "PROMPTPAY" || state.paymentMethod === "TRANSFER"
        ? state
        : { ...state, paymentMethod: "PROMPTPAY" },
    );
  }, [requiresPortalPay]);

  useEffect(() => {
    if (!requiresPortalPay || !payDueBaht) {
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
  }, [ownerId, payDueBaht, requiresPortalPay, trialSessionId]);

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

  useEffect(() => {
    setForm((state) => ({ ...state, startTime: "", endTime: "" }));
  }, [form.bookingDate, form.courtId]);

  const lookupDigits = lookupPhone.replace(/\D/g, "");
  const lookupBookings = useMemo(
    () =>
      lookupDigits
        ? bookings.filter((item) => item.customerPhone.replace(/\D/g, "").includes(lookupDigits))
        : [],
    [bookings, lookupDigits],
  );

  const contactCourt = selectedCourt ?? courts[0] ?? null;
  const gallery = settings.portalGallery?.length
    ? settings.portalGallery
    : [...FOOTBALL_TURF_PORTAL_SAMPLE_GALLERY];
  const banner = settings.portalBannerUrl.trim() || FOOTBALL_TURF_PORTAL_SAMPLE_BANNER;

  function selectCourtAndBook(courtId: number) {
    setForm((state) => ({ ...state, courtId: String(courtId) }));
    requestAnimationFrame(() => bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function onSlipSelected(file: File | null) {
    if (!file) return;
    setUploadingSlip(true);
    setMessage("");
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setForm((state) => ({
        ...state,
        paymentSlipDataUrl: dataUrl,
        paymentMethod:
          state.paymentMethod === "PROMPTPAY" || state.paymentMethod === "TRANSFER"
            ? state.paymentMethod
            : "PROMPTPAY",
      }));
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
    if (!isSlotEligibleForAdvanceBooking(selectedSlot, slotTimeOpts)) {
      setMessage("จองได้เฉพาะรอบถัดไปที่ยังไม่เริ่ม");
      return;
    }
    if (
      requiresPortalPay &&
      ((form.paymentMethod !== "PROMPTPAY" && form.paymentMethod !== "TRANSFER") ||
        !form.paymentSlipDataUrl)
    ) {
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
      const storedMethod = requiresPortalPay
        ? toStoredPaymentMethod(form.paymentMethod)
        : "ONSITE";
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
        amountPaidBaht: requiresPortalPay ? payDueBaht ?? 0 : 0,
        promotionSaleId: null,
        note:
          requiresPortalPay && settings.portalBookingPaymentMode === "DEPOSIT"
            ? `ลูกค้าจองผ่านลิงก์ · มัดจำ ${payDueBaht} บาท`
            : requiresPortalPay && settings.portalBookingPaymentMode === "FULL"
              ? "ลูกค้าจองผ่านลิงก์ · ชำระเต็มยอด"
              : "ลูกค้าจองผ่านลิงก์สนาม",
        paymentMethod: storedMethod,
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

  if (loadErr) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm font-semibold text-rose-600">
          {loadErr}
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (!loaded) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {settings.logoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl.trim()}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70 shadow-md"
              />
            ) : null}
            <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">
              {venueTitle}
            </p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนู"
          >
            <a href="#book" className={navLinkClass}>
              จอง
            </a>
            <a href="#courts" className={navLinkClass}>
              สนาม
            </a>
            <a href="#gallery" className={navLinkClass}>
              ภาพรวม
            </a>
            <a href="#contact" className={navLinkClass}>
              ติดต่อ
            </a>
            <a href="#lookup" className={navLinkClass}>
              การจอง
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[72vh] overflow-hidden sm:min-h-[80vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/25 via-[#1e1b4b]/5 to-[#faf9ff]/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/70 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:min-h-[80vh] sm:px-6 sm:pb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">
              Football turf booking
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              {venueTitle}
            </h1>
            {settings.venueSubtitle.trim() ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {settings.venueSubtitle.trim()}
              </p>
            ) : null}
          </div>

          <div
            id="book"
            ref={bookRef}
            className={cn(appPublicCheckInGlassCardClass, "mt-8 w-full scroll-mt-8 p-4 text-[#1e1b4b] sm:p-5")}
          >
            <form className="grid gap-5" onSubmit={onSubmit}>
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
                    onChange={(e) =>
                      setForm((state) => ({ ...state, bookingDate: e.target.value || todayDateKey }))
                    }
                  />
                </label>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-white/80 via-white/70 to-emerald-50/50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      เลือกช่วงเวลาว่าง
                    </p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">ช่วงเวลาแบบบล็อก</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-slate-200">
                      ว่าง / จองล่วงหน้า
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500 ring-1 ring-slate-200">
                      ถูกจอง
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-500 ring-1 ring-slate-300">
                      หมดเวลา
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                      ช่วงที่เลือก
                    </span>
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
                      const open = isSlotEligibleForAdvanceBooking(slot, slotTimeOpts);
                      const selected =
                        open && form.startTime === slot.startTime && form.endTime === slot.endTime;
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
                                : !open && timeCurrent
                                  ? "cursor-not-allowed border-cyan-200 bg-cyan-50/70 text-slate-500"
                                  : selected
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_18px_34px_-28px_rgba(16,185,129,0.8)] ring-1 ring-emerald-100"
                                    : open
                                      ? "border-white/80 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-white"
                                      : "cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={cn("text-sm font-black", timePassed && "text-slate-400")}>
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-xs font-medium",
                                  timePassed ? "text-slate-400" : undefined,
                                )}
                              >
                                {timePassed
                                  ? "หมดเวลา"
                                  : booked
                                    ? "ช่วงนี้ถูกจองแล้ว"
                                    : timeCurrent
                                      ? "รอบปัจจุบัน · จองล่วงหน้าไม่ได้"
                                      : upcoming
                                        ? "ว่าง · จองล่วงหน้าได้"
                                        : "เลือกไม่ได้"}
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
                                      : open
                                        ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
                                        : "bg-slate-100 text-slate-500 ring-slate-200",
                              )}
                            >
                              {timePassed
                                ? "หมดเวลา"
                                : booked
                                  ? "ถูกจอง"
                                  : timeCurrent
                                    ? "ปัจจุบัน"
                                    : upcoming
                                      ? "ล่วงหน้า"
                                      : "ปิด"}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "mt-3 flex items-center gap-2 text-[11px] font-black",
                              timePassed && "text-slate-400",
                            )}
                          >
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{selectedCourt?.slotMinutes ?? 0} นาที</span>
                            {open ? <span className="ml-auto">{formatMoney(bookingPrice)}</span> : null}
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
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      สรุปรายการที่เลือก
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {activeTimelineSlot
                        ? `${selectedCourt?.name ?? "-"} · ${activeTimelineSlot.startTime}-${activeTimelineSlot.endTime}`
                        : "ยังไม่ได้เลือกช่วงเวลา"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg",
                      appDashboardBrandGradientFillClass,
                    )}
                  >
                    {formatMoney(bookingPrice)}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/45 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  ข้อมูลทีม / ผู้ติดต่อ
                </p>
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
                        : "ไม่ต้องชำระตอนจอง"}
                </p>

                {requiresPortalPay ? (
                  <div className="mt-4 space-y-3 rounded-[1.25rem] border border-[#5b61ff]/25 bg-[#5b61ff]/08 p-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-slate-500" aria-hidden />
                      <p className="text-sm font-black text-slate-900">
                        ชำระ {formatMoney(payDueBaht ?? 0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(
                        [
                          { v: "PROMPTPAY" as const, l: "พร้อมเพย์" },
                          { v: "TRANSFER" as const, l: "โอน" },
                        ] as const
                      ).map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setForm((state) => ({ ...state, paymentMethod: o.v }))}
                          className={cn(
                            "min-h-[40px] flex-1 rounded-[1rem] border text-xs font-bold",
                            form.paymentMethod === o.v
                              ? "border-[#5b61ff]/50 bg-[#5b61ff]/15 text-[#4d47b6]"
                              : "border-white/70 bg-white/70 text-[#66638c]",
                          )}
                          aria-pressed={form.paymentMethod === o.v}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>

                    {form.paymentMethod === "PROMPTPAY" ? (
                      <div className="space-y-2 rounded-[1.25rem] border border-white/70 bg-white/80 p-3">
                        <p className="text-xs font-black text-[#1e1b4b]">QR พร้อมเพย์</p>
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
                    ) : null}

                    {form.paymentMethod === "TRANSFER" ? (
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
                    ) : null}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-slate-500" aria-hidden />
                        <p className="text-xs font-black text-[#1e1b4b]">แนบสลิป</p>
                      </div>
                      <p className="text-[11px] font-semibold leading-snug text-[#66638c]">
                        {slipProofMessage(settings.portalBookingPaymentMode)}
                      </p>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                        placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                        value={form.paymentReference}
                        onChange={(e) =>
                          setForm((state) => ({ ...state, paymentReference: e.target.value }))
                        }
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
                        <AppImageThumb
                          src={form.paymentSlipDataUrl}
                          alt="สลิปการโอน"
                          onOpen={() => lb.open(form.paymentSlipDataUrl)}
                          className="h-24 w-24"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="app-btn-primary rounded-2xl px-5 py-3 text-sm font-black shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? "กำลังจอง…" : "ยืนยันการจองสนาม"}
              </button>
              {message ? <p className="text-sm font-bold text-rose-600">{message}</p> : null}
            </form>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <section id="courts" className="scroll-mt-8">
          <h2 className={sectionTitleClass}>สนาม</h2>
          {courts.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>ยังไม่มีสนามเปิดจอง</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courts.map((court) => {
                const cover = court.imageUrl.trim() || banner;
                return (
                  <li
                    key={court.id}
                    className="overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/70 shadow-sm ring-1 ring-inset ring-white/50"
                  >
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => lb.open(cover)}
                      aria-label={`ดูรูป ${court.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="h-44 w-full object-cover object-center" />
                    </button>
                    <div className="space-y-2 p-4">
                      <p className="text-lg font-black text-[#1e1b4b]">{court.name}</p>
                      <p className="text-xs font-semibold text-[#66638c]">
                        {court.openTime} – {court.closeTime} · {court.slotMinutes} นาที/รอบ
                      </p>
                      <p className="text-sm font-black text-[#4d47b6]">
                        จ–ศ {formatMoney(court.weekdayPrice)} · ส–อา {formatMoney(court.weekendPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => selectCourtAndBook(court.id)}
                        className="app-btn-primary mt-1 min-h-[44px] w-full rounded-[1rem] px-4 text-sm font-black"
                      >
                        จองสนามนี้
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {gallery.length ? (
          <section id="gallery" className="scroll-mt-8">
            <h2 className={sectionTitleClass}>ภาพรวม</h2>
            {!settings.portalGallery?.length ? (
              <p className={cn("mt-2", mutedTextClass)}>รูปตัวอย่าง — อัปโหลดรูปจริงได้ที่ตั้งค่าสนาม</p>
            ) : null}
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => lb.openGallery(gallery, idx)}
                    className="block w-full overflow-hidden rounded-[1.25rem] border border-white/60 shadow-sm ring-1 ring-inset ring-white/60"
                    aria-label={`ภาพรวม ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-32 w-full object-cover sm:h-40" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="contact" className="scroll-mt-8">
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-white/60 bg-white/70 p-5 shadow-sm ring-1 ring-inset ring-white/50 sm:grid-cols-2">
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{venueTitle}</p>
              {settings.venueAddress.trim() ? <p>{settings.venueAddress.trim()}</p> : null}
              {settings.contactPhone.trim() ? (
                <p>
                  <a
                    className="font-bold text-[#4d47b6] hover:underline"
                    href={`tel:${settings.contactPhone.trim()}`}
                  >
                    {settings.contactPhone.trim()}
                  </a>
                </p>
              ) : null}
              {contactCourt ? (
                <p className="text-[#8b87b8]">
                  เปิด {contactCourt.openTime} – {contactCourt.closeTime}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {settings.contactLine.trim() ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(settings.contactLine.trim().replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  LINE
                </a>
              ) : null}
              {settings.facebookUrl.trim() ? (
                <a
                  href={settings.facebookUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  Facebook
                </a>
              ) : null}
              {settings.mapUrl.trim() ? (
                <a
                  href={settings.mapUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  แผนที่
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section id="lookup" className="scroll-mt-8 pb-4">
          <h2 className={sectionTitleClass}>การจอง</h2>
          <div
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-4 flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-end",
            )}
          >
            <label className="block min-w-0 flex-1">
              <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
              <input
                type="tel"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className="mt-1 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="กรอกเบอร์เพื่อดูการจอง"
              />
            </label>
          </div>
          <ul className="mt-4 grid w-full gap-2 sm:grid-cols-2">
            {lookupDigits && lookupBookings.length === 0 ? (
              <li className={cn(mutedTextClass, "sm:col-span-2")}>ไม่พบการจองของเบอร์นี้</li>
            ) : null}
            {lookupBookings.map((item) => {
              const past = isBookingTimePassed(item, liveNow);
              const href = footballTurfPublicBookingUrl(
                "",
                ownerId,
                item.id,
                (item.customerPhone || lookupDigits).replace(/\D/g, ""),
                trialSessionId?.trim() || "prod",
              );
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={cn(
                      "block w-full rounded-[1.25rem] border p-4 text-left transition hover:bg-white/90",
                      past
                        ? "border-slate-200/80 bg-slate-100/85"
                        : "border-white/70 bg-white/80",
                    )}
                  >
                    <p className={cn("font-black", past ? "text-slate-400" : "text-[#1e1b4b]")}>
                      {item.teamName || item.customerName}
                    </p>
                    <p className={cn("mt-1 text-xs font-medium", past ? "text-slate-400" : "text-[#66638c]")}>
                      {item.courtName} · {item.bookingDate} · {item.startTime}-{item.endTime}
                    </p>
                    <p className="mt-2 text-[11px] font-black text-[#4d47b6]">
                      {past ? "หมดเวลา" : bookingStatusLabel(item.status)} · ดูรายละเอียด
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปสนาม"
      />
      {cameraModal}
    </AppPublicCheckInGlassPage>
  );
}

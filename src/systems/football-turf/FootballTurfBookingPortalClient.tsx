"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Clock3 } from "lucide-react";
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
import { cn } from "@/lib/cn";
import { isBangkokWeekend } from "@/lib/time/bangkok";
import { footballTurfPublicBookingUrl } from "@/lib/football-turf/public-url";
import {
  type FootballTurfBooking,
  type FootballTurfCourt,
  type FootballTurfVenueSettings,
  createFootballTurfRepository,
  lookupFootballTurfPublicMemberForBooking,
} from "@/systems/football-turf/football-turf-service";
import { normalizeFootballTurfPhoneDigits } from "@/systems/football-turf/lib/member-phone-search";

type BookWizardStep = "phone" | "details" | "payment";
import {
  footballTurfComputePortalPayDue,
  footballTurfPortalSlipProofMessage,
} from "@/systems/football-turf/lib/portal-booking";
import {
  FOOTBALL_TURF_PORTAL_SAMPLE_BANNER,
  FOOTBALL_TURF_PORTAL_SAMPLE_GALLERY,
} from "@/systems/football-turf/lib/portal-media";
import {
  footballTurfContentCardClass,
  footballTurfFieldClass,
  footballTurfLabelClass,
} from "@/systems/football-turf/lib/ui-tokens";
import {
  isBookingTimePassed,
  isSlotEligibleForAdvanceBooking,
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

type SlotRow = {
  startTime: string;
  endTime: string;
  booking: FootballTurfBooking | null;
};

type CourtSearchResult = {
  court: FootballTurfCourt;
  price: number;
  freeSlots: SlotRow[];
  freeCount: number;
  cover: string;
};

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";
const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const mutedTextClass = "text-sm font-semibold text-[#66638c]";
const formLabelClass = "text-xs font-bold text-[#4d47b6]";

function slipProofMessage(mode: FootballTurfVenueSettings["portalBookingPaymentMode"]) {
  return footballTurfPortalSlipProofMessage(mode ?? "NONE");
}

function buildCourtTimeline(
  court: FootballTurfCourt,
  courtBookings: FootballTurfBooking[],
): SlotRow[] {
  const start = timeToMinutes(court.openTime);
  const end = timeToMinutes(court.closeTime);
  const slots: SlotRow[] = [];
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

function formatThYmd(ymd: string) {
  const d = new Date(`${ymd}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

function toStoredPaymentMethod(method: PortalPayMethod): "PROMPTPAY" | "TRANSFER" | "ONSITE" {
  if (method === "ONSITE") return "ONSITE";
  if (method === "PROMPTPAY") return "PROMPTPAY";
  return "TRANSFER";
}

const EMPTY_SETTINGS: FootballTurfVenueSettings = {
  venueName: "",
  venueSubtitle: "",
  logoUrl: "",
  promptpayNumber: "",
  promptPayQrImageUrl: "",
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
  const [liveClockMs, setLiveClockMs] = useState(() => Date.now());

  const [searchDate, setSearchDate] = useState(() => localDateKey());
  const [searchCourtId, setSearchCourtId] = useState("ALL");
  const [resultDate, setResultDate] = useState<string | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [courtResults, setCourtResults] = useState<CourtSearchResult[]>([]);

  const [selectedCourt, setSelectedCourt] = useState<FootballTurfCourt | null>(null);
  const [bookDate, setBookDate] = useState(() => localDateKey());
  const [selectedSlots, setSelectedSlots] = useState<Array<{ startTime: string; endTime: string }>>(
    [],
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [memberFound, setMemberFound] = useState<boolean | null>(null);
  const [memberHint, setMemberHint] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState(false);
  const [bookStep, setBookStep] = useState<BookWizardStep>("phone");
  const [paymentMethod, setPaymentMethod] = useState<PortalPayMethod>("PROMPTPAY");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSlipDataUrl, setPaymentSlipDataUrl] = useState("");
  const [bookBusy, setBookBusy] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const [payQr, setPayQr] = useState<PortalPayQr | null>(null);
  const [payQrBusy, setPayQrBusy] = useState(false);
  const [payQrErr, setPayQrErr] = useState<string | null>(null);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupBookings, setLookupBookings] = useState<FootballTurfBooking[]>([]);

  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const courtsRef = useRef<HTMLElement | null>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();

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

  const liveNow = useMemo(() => new Date(liveClockMs), [liveClockMs]);
  const todayDateKey = localDateKey(liveNow);
  const nowMinutes = localNowMinutes(liveNow);
  const banner = settings.portalBannerUrl.trim() || FOOTBALL_TURF_PORTAL_SAMPLE_BANNER;
  const gallery = settings.portalGallery?.length
    ? settings.portalGallery
    : [...FOOTBALL_TURF_PORTAL_SAMPLE_GALLERY];
  const venueTitle = settings.venueName.trim() || "สนามหญ้าเทียม";
  const contactCourt = courts[0] ?? null;

  const payModeLabel =
    settings.portalBookingPaymentMode === "DEPOSIT"
      ? "มัดจำ"
      : settings.portalBookingPaymentMode === "FULL"
        ? "ชำระเต็มยอด"
        : null;

  function computeResults(dateYmd: string, courtFilter: string): CourtSearchResult[] {
    const slotOpts = { scheduleDate: dateYmd, todayDateKey, nowMinutes };
    const weekend = isBangkokWeekend(dateYmd);
    const source =
      courtFilter === "ALL" ? courts : courts.filter((c) => String(c.id) === courtFilter);
    return source.map((court, idx) => {
      const dayBookings = bookings.filter(
        (b) => b.courtId === court.id && b.bookingDate === dateYmd && b.status !== "CANCELLED",
      );
      const timeline = buildCourtTimeline(court, dayBookings);
      const freeSlots = listAdvanceBookingEligibleSlots(timeline, slotOpts);
      const cover =
        court.imageUrl.trim() ||
        gallery[idx % gallery.length] ||
        banner;
      return {
        court,
        price: weekend ? court.weekendPrice : court.weekdayPrice,
        freeSlots,
        freeCount: freeSlots.length,
        cover,
      };
    });
  }

  function runSearch(opts?: { dateYmd?: string; courtId?: string; scroll?: boolean }) {
    const dateYmd = opts?.dateYmd ?? searchDate;
    const courtId = opts?.courtId ?? searchCourtId;
    setSearchBusy(true);
    setSearchErr(null);
    setSelectedCourt(null);
    try {
      if (!courts.length) {
        setCourtResults([]);
        setResultDate(dateYmd);
        setSearchErr("ยังไม่มีสนามเปิดจอง");
        return;
      }
      const rows = computeResults(dateYmd, courtId);
      setCourtResults(rows);
      setResultDate(dateYmd);
      if (opts?.scroll) {
        requestAnimationFrame(() =>
          courtsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } finally {
      setSearchBusy(false);
    }
  }

  /** โหลดสนามว่างวันนี้ทันทีเมื่อข้อมูลพร้อม — แบบโรงแรม */
  useEffect(() => {
    if (!loaded || !courts.length) return;
    const today = localDateKey();
    setSearchDate(today);
    runSearch({ dateYmd: today, courtId: "ALL", scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ครั้งแรกเมื่อโหลด courts
  }, [loaded, courts.length]);

  const bookingPrice = useMemo(() => {
    if (!selectedCourt) return 0;
    return isBangkokWeekend(bookDate)
      ? selectedCourt.weekendPrice
      : selectedCourt.weekdayPrice;
  }, [bookDate, selectedCourt]);

  const slotsTotalBaht = bookingPrice * selectedSlots.length;

  const payDueBaht = useMemo(
    () =>
      footballTurfComputePortalPayDue({
        mode: settings.portalBookingPaymentMode ?? "NONE",
        depositAmountBaht: settings.depositAmountBaht,
        totalBaht: slotsTotalBaht,
      }),
    [settings.depositAmountBaht, settings.portalBookingPaymentMode, slotsTotalBaht],
  );
  const depositMisconfigured =
    settings.portalBookingPaymentMode === "DEPOSIT" &&
    Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0))) <= 0;
  const requiresPortalPay = payDueBaht != null && payDueBaht > 0;

  const sheetSlotOpts = useMemo(
    () => ({ scheduleDate: bookDate, todayDateKey, nowMinutes }),
    [bookDate, todayDateKey, nowMinutes],
  );
  const sheetTimeline = useMemo(() => {
    if (!selectedCourt) return [] as SlotRow[];
    const dayBookings = bookings.filter(
      (b) =>
        b.courtId === selectedCourt.id &&
        b.bookingDate === bookDate &&
        b.status !== "CANCELLED",
    );
    return buildCourtTimeline(selectedCourt, dayBookings);
  }, [bookings, bookDate, selectedCourt]);
  const sheetFreeSlots = useMemo(
    () => listAdvanceBookingEligibleSlots(sheetTimeline, sheetSlotOpts),
    [sheetTimeline, sheetSlotOpts],
  );

  function isSlotSelected(slot: { startTime: string; endTime: string }) {
    return selectedSlots.some((s) => s.startTime === slot.startTime && s.endTime === slot.endTime);
  }

  function toggleSlot(slot: { startTime: string; endTime: string }) {
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.startTime === slot.startTime && s.endTime === slot.endTime);
      if (exists) {
        return prev.filter((s) => !(s.startTime === slot.startTime && s.endTime === slot.endTime));
      }
      return [...prev, { startTime: slot.startTime, endTime: slot.endTime }].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      );
    });
    setBookErr(null);
  }

  useEffect(() => {
    if (!requiresPortalPay) {
      setPaymentMethod("ONSITE");
      return;
    }
    setPaymentMethod((m) => (m === "PROMPTPAY" || m === "TRANSFER" ? m : "PROMPTPAY"));
  }, [requiresPortalPay]);

  useEffect(() => {
    if (!selectedCourt || !requiresPortalPay || !payDueBaht) {
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
  }, [ownerId, payDueBaht, requiresPortalPay, selectedCourt, trialSessionId]);

  // clear invalid selections when free slots change
  useEffect(() => {
    setSelectedSlots((prev) =>
      prev.filter((s) =>
        sheetFreeSlots.some((f) => f.startTime === s.startTime && f.endTime === s.endTime),
      ),
    );
  }, [sheetFreeSlots]);

  const phoneDigits = normalizeFootballTurfPhoneDigits(customerPhone);
  const paymentReady =
    !requiresPortalPay ||
    ((paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && Boolean(paymentSlipDataUrl));

  useEffect(() => {
    if (!selectedCourt || phoneDigits.length < 9) {
      if (phoneDigits.length < 9) {
        setMemberFound(null);
        setMemberHint(phoneDigits.length > 0 ? "กรอกเบอร์ให้ครบอย่างน้อย 9 หลัก" : null);
      }
      return;
    }
    const t = window.setTimeout(() => {
      void checkMemberPhone(customerPhone);
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce by phone digits only
  }, [selectedCourt, phoneDigits]);

  function resetMemberFields() {
    setCustomerName("");
    setCustomerPhone("");
    setTeamName("");
    setPlayerCount("");
    setMemberFound(null);
    setMemberHint(null);
    setBookStep("phone");
  }

  async function checkMemberPhone(raw?: string) {
    const digits = normalizeFootballTurfPhoneDigits(raw ?? customerPhone);
    if (digits.length < 9) {
      setMemberFound(null);
      setMemberHint("กรอกเบอร์ให้ครบอย่างน้อย 9 หลัก");
      setCustomerName("");
      setTeamName("");
      return;
    }
    setMemberBusy(true);
    try {
      const result = await lookupFootballTurfPublicMemberForBooking(
        ownerId,
        digits,
        trialSessionId,
      );
      setMemberFound(result.found);
      if (result.found) {
        setCustomerName(result.name?.trim() || "");
        setTeamName(result.teamName?.trim() || "");
        if (result.phone) {
          setCustomerPhone(normalizeFootballTurfPhoneDigits(result.phone));
        }
        setMemberHint("พบสมาชิกในระบบ — ใช้ชื่อทีมจากฐานข้อมูล");
      } else {
        setCustomerName("");
        setTeamName("");
        setMemberHint("ยังไม่มีในระบบ — กรอกชื่อและทีมเพื่อสร้างลูกค้าใหม่");
      }
    } catch {
      setMemberFound(null);
      setCustomerName("");
      setTeamName("");
      setMemberHint("ตรวจเบอร์ไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setMemberBusy(false);
    }
  }

  function openBookSheet(court: FootballTurfCourt, dateYmd: string) {
    setSelectedCourt(court);
    setBookDate(dateYmd);
    setSelectedSlots([]);
    setBookErr(null);
    setPaymentSlipDataUrl("");
    setPaymentReference("");
    resetMemberFields();
  }

  function goNextFromPhone() {
    if (phoneDigits.length < 9) {
      setBookErr("กรอกเบอร์โทรให้ครบอย่างน้อย 9 หลัก");
      return;
    }
    if (memberBusy || memberFound == null) {
      setBookErr("รอตรวจเบอร์ในระบบก่อน");
      return;
    }
    if (memberFound && !teamName.trim() && !customerName.trim()) {
      setBookErr("พบเบอร์แต่ไม่มีชื่อทีมในระบบ — ติดต่อเจ้าหน้าที่อัปเดตโปรไฟล์");
      return;
    }
    setBookErr(null);
    setBookStep("details");
  }

  function goNextFromDetails() {
    if (!selectedSlots.length) {
      setBookErr("กรุณาเลือกอย่างน้อย 1 ช่วงเวลา");
      return;
    }
    for (const slot of selectedSlots) {
      if (!isSlotEligibleForAdvanceBooking({ ...slot, booking: null }, sheetSlotOpts)) {
        setBookErr(`ช่วง ${slot.startTime}-${slot.endTime} จองไม่ได้แล้ว`);
        return;
      }
    }
    if (depositMisconfigured) {
      setBookErr("สนามยังไม่ได้ตั้งจำนวนมัดจำ");
      return;
    }
    const players = Number(playerCount);
    if (!playerCount.trim() || !Number.isFinite(players) || players < 1) {
      setBookErr("กรุณากรอกจำนวนผู้เล่น");
      return;
    }
    if (!memberFound) {
      if (!customerName.trim()) {
        setBookErr("กรอกชื่อผู้จอง");
        return;
      }
      if (!teamName.trim()) {
        setBookErr("กรอกชื่อทีม");
        return;
      }
    } else if (!teamName.trim()) {
      setBookErr("ข้อมูลทีมไม่ครบ — กลับไปกรอกเบอร์ใหม่");
      return;
    }
    setBookErr(null);
    if (requiresPortalPay) {
      setBookStep("payment");
      return;
    }
    void submitBook();
  }

  async function onSlipSelected(file: File | null) {
    if (!file) return;
    setUploadingSlip(true);
    setBookErr(null);
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setPaymentSlipDataUrl(dataUrl);
      setPaymentMethod((m) => (m === "PROMPTPAY" || m === "TRANSFER" ? m : "PROMPTPAY"));
    } catch (error) {
      setBookErr(error instanceof Error ? error.message : "แนบสลิปไม่สำเร็จ");
    } finally {
      setUploadingSlip(false);
    }
  }

  async function submitBook(e?: FormEvent) {
    e?.preventDefault();
    if (!selectedCourt || !selectedSlots.length) {
      setBookErr("กรุณาเลือกอย่างน้อย 1 ช่วงเวลา");
      setBookStep("details");
      return;
    }
    for (const slot of selectedSlots) {
      if (!isSlotEligibleForAdvanceBooking({ ...slot, booking: null }, sheetSlotOpts)) {
        setBookErr(`ช่วง ${slot.startTime}-${slot.endTime} จองไม่ได้แล้ว`);
        setBookStep("details");
        return;
      }
    }
    if (depositMisconfigured) {
      setBookErr("สนามยังไม่ได้ตั้งจำนวนมัดจำ");
      return;
    }
    if (requiresPortalPay && !paymentReady) {
      setBookErr(slipProofMessage(settings.portalBookingPaymentMode));
      setBookStep("payment");
      return;
    }
    const players = Number(playerCount);
    if (!playerCount.trim() || !Number.isFinite(players) || players < 1) {
      setBookErr("กรุณากรอกจำนวนผู้เล่น");
      setBookStep("details");
      return;
    }
    const phone = normalizeFootballTurfPhoneDigits(customerPhone);
    if (phone.length < 9) {
      setBookErr("กรอกเบอร์โทรให้ครบอย่างน้อย 9 หลัก");
      setBookStep("phone");
      return;
    }
    const nameForBooking = customerName.trim() || teamName.trim();
    if (!nameForBooking) {
      setBookErr(memberFound ? "ข้อมูลทีมไม่ครบ — กลับไปกรอกเบอร์ใหม่" : "กรอกชื่อผู้จอง");
      setBookStep(memberFound ? "phone" : "details");
      return;
    }
    if (!repo.createOnlineBookingsBatch) {
      setBookErr("ระบบจองหลายช่วงยังไม่พร้อม");
      return;
    }
    setBookBusy(true);
    setBookErr(null);
    try {
      const created = await repo.createOnlineBookingsBatch({
        courtId: selectedCourt.id,
        bookingDate: bookDate,
        slots: selectedSlots,
        customerName: nameForBooking,
        customerPhone: phone,
        teamName: teamName.trim(),
        playerCount: players,
        paymentMethod: requiresPortalPay ? toStoredPaymentMethod(paymentMethod) : "UNPAID",
        paymentReference: paymentReference.trim(),
        paymentSlipDataUrl: requiresPortalPay ? paymentSlipDataUrl : "",
      });
      const first = created[0];
      if (!first) throw new Error("จองไม่สำเร็จ");
      const href = footballTurfPublicBookingUrl(
        "",
        ownerId,
        first.id,
        phone,
        trialSessionId?.trim() || "prod",
        created.slice(1).map((b) => b.id),
      );
      router.push(href);
    } catch (error) {
      setBookErr(error instanceof Error ? error.message : "จองไม่สำเร็จ");
    } finally {
      setBookBusy(false);
    }
  }

  async function lookup(e: FormEvent) {
    e.preventDefault();
    const digits = lookupPhone.replace(/\D/g, "");
    if (digits.length < 4) {
      setLookupErr("กรอกเบอร์อย่างน้อย 4 หลัก");
      setLookupBookings([]);
      return;
    }
    setLookupBusy(true);
    setLookupErr(null);
    try {
      const rows = bookings.filter(
        (item) =>
          item.status !== "CANCELLED" &&
          item.customerPhone.replace(/\D/g, "").includes(digits),
      );
      setLookupBookings(rows);
      if (!rows.length) setLookupErr("ไม่พบการจองของเบอร์นี้");
    } finally {
      setLookupBusy(false);
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
              สนามว่าง
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

          <form
            id="book"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch({ scroll: true });
            }}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 grid w-full gap-3 p-4 text-[#1e1b4b] sm:grid-cols-[1.1fr_1fr_auto] sm:p-5",
            )}
          >
            <label className="block">
              <span className={formLabelClass}>วันที่</span>
              <input
                type="date"
                required
                value={searchDate}
                min={todayDateKey}
                onChange={(e) => setSearchDate(e.target.value || todayDateKey)}
                className={cn(footballTurfFieldClass, "mt-1")}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>สนาม</span>
              <select
                value={searchCourtId}
                onChange={(e) => setSearchCourtId(e.target.value)}
                className={cn(footballTurfFieldClass, "mt-1")}
              >
                <option value="ALL">ทุกสนาม</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={searchBusy}
              className="app-btn-primary min-h-[52px] self-end rounded-[1rem] px-6 text-sm font-black disabled:opacity-60"
            >
              {searchBusy ? "ค้นหา…" : "ค้นหาสนามว่าง"}
            </button>
            {payModeLabel ? (
              <p className={cn("sm:col-span-3", mutedTextClass, "!text-[11px]")}>
                {payModeLabel}
                {settings.portalBookingPaymentMode === "DEPOSIT" && settings.depositAmountBaht != null
                  ? ` ${settings.depositAmountBaht.toLocaleString("th-TH")} บาท`
                  : ""}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <section id="courts" ref={courtsRef} className="scroll-mt-8">
          <h2 className={sectionTitleClass}>สนามว่าง</h2>
          {resultDate ? (
            <p className={cn("mt-2", mutedTextClass)}>
              ผลการค้นหา {formatThYmd(resultDate)}
              {courtResults.length > 0
                ? ` · ${courtResults.filter((r) => r.freeCount > 0).length} สนามมีช่วงว่าง`
                : ""}
            </p>
          ) : null}
          {searchErr ? <p className="mt-3 text-sm font-semibold text-rose-600">{searchErr}</p> : null}
          {searchBusy && courtResults.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>กำลังค้นหาสนามว่าง…</p>
          ) : courtResults.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>
              {resultDate ? `ไม่มีสนามว่าง ${formatThYmd(resultDate)}` : "กดค้นหาสนามว่าง"}
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courtResults.map((row) => (
                <li key={row.court.id} className={cn(footballTurfContentCardClass, "!p-0")}>
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => lb.open(row.cover)}
                    aria-label={`ดูรูป ${row.court.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.cover}
                      alt=""
                      className="h-44 w-full object-cover object-center"
                    />
                  </button>
                  <div className="space-y-2 p-4">
                    <p className="text-lg font-black text-[#1e1b4b]">{row.court.name}</p>
                    <p className="text-xs font-semibold text-[#66638c]">
                      {row.court.openTime} – {row.court.closeTime} · {row.court.slotMinutes} นาที/รอบ
                    </p>
                    {row.freeCount > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.freeSlots.slice(0, 4).map((s) => (
                          <span
                            key={`${s.startTime}-${s.endTime}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                          >
                            {s.startTime}-{s.endTime}
                          </span>
                        ))}
                        {row.freeCount > 4 ? (
                          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#4d47b6]">
                            +{row.freeCount - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-rose-600">ไม่มีช่วงว่างในวันนี้</p>
                    )}
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <div>
                        <p className="text-xl font-black text-[#4d47b6]">
                          {formatMoney(row.price)}
                          <span className="text-xs font-bold text-[#8b87b8]"> /รอบ</span>
                        </p>
                        <p className="text-[11px] font-semibold text-[#8b87b8]">
                          {row.freeCount > 0 ? `${row.freeCount} ช่วงว่าง` : "เต็มแล้ว"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={row.freeCount < 1}
                        onClick={() => openBookSheet(row.court, resultDate || searchDate)}
                        className="app-btn-primary min-h-[44px] rounded-[1rem] px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        จอง
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="gallery" className="scroll-mt-8">
          <h2 className={sectionTitleClass}>ภาพรวม</h2>
          {!settings.portalGallery?.length ? (
            <p className={cn("mt-2", mutedTextClass)}>รูปตัวอย่าง</p>
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

        <section id="contact" className="scroll-mt-8">
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className={cn(footballTurfContentCardClass, "mt-6 grid gap-4 sm:grid-cols-2")}>
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
          <form
            onSubmit={(e) => void lookup(e)}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-4 flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-end",
            )}
          >
            <label className="block min-w-0 flex-1">
              <span className={formLabelClass}>เบอร์โทร</span>
              <input
                type="tel"
                required
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className={cn(footballTurfFieldClass, "mt-1")}
              />
            </label>
            <button
              type="submit"
              disabled={lookupBusy}
              className="app-btn-primary min-h-[48px] w-full shrink-0 rounded-[1rem] px-5 text-sm font-black sm:w-auto disabled:opacity-60"
            >
              {lookupBusy ? "ค้นหา…" : "ค้นหาการจอง"}
            </button>
          </form>
          {lookupErr ? <p className="mt-2 text-sm font-semibold text-rose-600">{lookupErr}</p> : null}
          <ul className="mt-4 grid w-full gap-2 sm:grid-cols-2">
            {lookupBookings.map((item) => {
              const past = isBookingTimePassed(item, liveNow);
              const href = footballTurfPublicBookingUrl(
                "",
                ownerId,
                item.id,
                (item.customerPhone || lookupPhone).replace(/\D/g, ""),
                trialSessionId?.trim() || "prod",
              );
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={cn(footballTurfContentCardClass, "block w-full text-left", past && "opacity-70")}
                  >
                    <p className="text-sm font-black text-[#1e1b4b]">
                      {item.teamName || "ทีม"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#66638c]">
                      {item.courtName} · {formatThYmd(item.bookingDate)} · {item.startTime}-
                      {item.endTime}
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

      {selectedCourt ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1e1b4b]/45 p-3 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (bookStep === "phone") goNextFromPhone();
              else if (bookStep === "details") goNextFromDetails();
              else void submitBook(e);
            }}
            className={cn(
              appPublicCheckInGlassCardClass,
              "max-h-[90dvh] w-full max-w-md overflow-y-auto p-5 text-[#1e1b4b]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{selectedCourt.name}</p>
                <p className="text-xs font-semibold text-[#66638c]">
                  {formatThYmd(bookDate)} · {formatMoney(bookingPrice)} /รอบ
                  {selectedSlots.length > 1 ? ` · เลือก ${selectedSlots.length} ช่วง` : ""}
                  {payModeLabel ? ` · ${payModeLabel}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourt(null)}
                className="min-h-[40px] min-w-[40px] rounded-full border border-white/70 bg-white/80 text-lg font-bold text-[#4d47b6]"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  { id: "phone" as const, label: "1. เบอร์" },
                  { id: "details" as const, label: "2. รายละเอียด" },
                  ...(requiresPortalPay
                    ? [{ id: "payment" as const, label: settings.portalBookingPaymentMode === "FULL" ? "3. ชำระเต็ม" : "3. มัดจำ" }]
                    : []),
                ] as const
              ).map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-black ring-1",
                    bookStep === s.id
                      ? "bg-[#5b61ff]/15 text-[#4d47b6] ring-[#5b61ff]/35"
                      : "bg-white/70 text-[#66638c] ring-white/80",
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {bookStep === "phone" ? (
                <>
                  <div className="space-y-2 rounded-[1.25rem] border border-[#5b61ff]/25 bg-[#5b61ff]/08 p-3">
                    <label className={footballTurfLabelClass}>
                      เบอร์โทร
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        autoFocus
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 15));
                          setMemberFound(null);
                          setMemberHint(null);
                          setBookErr(null);
                        }}
                        placeholder="08xxxxxxxx"
                        className={footballTurfFieldClass}
                      />
                    </label>
                    {memberBusy ? (
                      <p className="text-xs font-semibold text-[#66638c]">กำลังตรวจเบอร์ในระบบ…</p>
                    ) : memberHint ? (
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          memberFound ? "text-emerald-700" : "text-[#4d47b6]",
                        )}
                      >
                        {memberHint}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-[#66638c]">
                        กรอกเบอร์เต็มเพื่อตรวจสมาชิกในระบบ
                      </p>
                    )}
                  </div>
                  {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}
                  <button
                    type="submit"
                    disabled={memberBusy || phoneDigits.length < 9 || memberFound == null}
                    className="app-btn-primary min-h-[52px] w-full rounded-[1rem] text-sm font-black disabled:opacity-60"
                  >
                    ถัดไป — กรอกรายละเอียด
                  </button>
                </>
              ) : null}

              {bookStep === "details" ? (
                <>
                  <div
                    className={cn(
                      "rounded-[1rem] border px-3 py-2.5 text-xs font-semibold",
                      memberFound
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                        : "border-white/70 bg-white/80 text-[#66638c]",
                    )}
                  >
                    {memberFound ? (
                      <p className="text-sm font-black text-[#1e1b4b]">
                        {teamName.trim() || "สมาชิกในระบบ"}
                      </p>
                    ) : (
                      <p>ลูกค้าใหม่ — กรอกชื่อและทีมเพื่อสร้างโปรไฟล์</p>
                    )}
                  </div>
                  <label className={footballTurfLabelClass}>
                    วันที่
                    <input
                      type="date"
                      min={todayDateKey}
                      value={bookDate}
                      onChange={(e) => {
                        setBookDate(e.target.value || todayDateKey);
                        setSelectedSlots([]);
                      }}
                      className={footballTurfFieldClass}
                    />
                  </label>
                  <div>
                    <p className={formLabelClass}>เลือกช่วงว่าง (เลือกได้หลายช่วง)</p>
                    <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
                      {sheetFreeSlots.length === 0 ? (
                        <p className={cn(mutedTextClass, "sm:col-span-2")}>ไม่มีช่วงว่างในวันนี้</p>
                      ) : (
                        sheetFreeSlots.map((slot) => {
                          const selected = isSlotSelected(slot);
                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              type="button"
                              onClick={() => toggleSlot(slot)}
                              aria-pressed={selected}
                              className={cn(
                                "rounded-[1rem] border px-3 py-3 text-left text-xs font-black transition",
                                selected
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
                                  : "border-white/80 bg-white/90 text-slate-700",
                              )}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    {selectedSlots.length > 0 ? (
                      <p className="mt-2 text-xs font-semibold text-[#4d47b6]">
                        เลือก {selectedSlots.length} ช่วง · รวม {formatMoney(slotsTotalBaht)}
                      </p>
                    ) : null}
                  </div>
                  {!memberFound ? (
                    <>
                      <label className={footballTurfLabelClass}>
                        ชื่อผู้จอง
                        <input
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="กรอกชื่อ"
                          className={footballTurfFieldClass}
                        />
                      </label>
                      <label className={footballTurfLabelClass}>
                        ชื่อทีม
                        <input
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className={footballTurfFieldClass}
                        />
                      </label>
                    </>
                  ) : null}
                  <label className={footballTurfLabelClass}>
                    จำนวนผู้เล่น
                    <input
                      inputMode="numeric"
                      required
                      value={playerCount}
                      onChange={(e) =>
                        setPlayerCount(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                      className={footballTurfFieldClass}
                    />
                  </label>
                  {!requiresPortalPay ? (
                    <p className="text-xs font-semibold text-[#66638c]">
                      ไม่ต้องชำระตอนจอง — ชำระหน้าสนามได้
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-[#4d47b6]">
                      ขั้นถัดไปต้องชำระ{settings.portalBookingPaymentMode === "FULL" ? "เต็มยอด" : "มัดจำ"}{" "}
                      {formatMoney(payDueBaht ?? 0)} พร้อมแนบสลิป
                    </p>
                  )}
                  {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookErr(null);
                        setBookStep("phone");
                      }}
                      className="min-h-[52px] rounded-[1rem] border border-white/70 bg-white/80 text-sm font-black text-[#4d47b6]"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={bookBusy || !selectedSlots.length}
                      className="app-btn-primary min-h-[52px] rounded-[1rem] text-sm font-black disabled:opacity-60"
                    >
                      {requiresPortalPay ? "ถัดไป — ชำระเงิน" : bookBusy ? "กำลังจอง…" : "ยืนยันการจอง"}
                    </button>
                  </div>
                </>
              ) : null}

              {bookStep === "payment" && requiresPortalPay ? (
                <>
                  <div className="space-y-3 rounded-[1.25rem] border border-[#5b61ff]/25 bg-[#5b61ff]/08 p-3">
                    <p className="text-sm font-black text-[#4d47b6]">
                      {settings.portalBookingPaymentMode === "FULL" ? "ชำระเต็มยอด" : "มัดจำ"}{" "}
                      {formatMoney(payDueBaht ?? 0)}
                    </p>
                    <p className="text-[11px] font-semibold leading-snug text-[#66638c]">
                      ต้องชำระพร้อมเพย์หรือโอน และแนบ/ถ่ายสลิปก่อนยืนยันจอง
                    </p>
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
                          onClick={() => setPaymentMethod(o.v)}
                          className={cn(
                            "min-h-[40px] flex-1 rounded-[1rem] border text-xs font-bold",
                            paymentMethod === o.v
                              ? "border-[#5b61ff]/50 bg-[#5b61ff]/15 text-[#4d47b6]"
                              : "border-white/70 bg-white/70 text-[#66638c]",
                          )}
                          aria-pressed={paymentMethod === o.v}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "PROMPTPAY" ? (
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
                        {(payQr?.promptpayNumber || settings.promptpayNumber) ? (
                          <p className="text-xs font-semibold text-[#66638c]">
                            พร้อมเพย์:{" "}
                            <span className="font-black text-[#1e1b4b]">
                              {payQr?.promptpayNumber || settings.promptpayNumber}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {paymentMethod === "TRANSFER" ? (
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
                      <p className="text-xs font-black text-[#1e1b4b]">แนบสลิป (บังคับ)</p>
                      <p className="text-[11px] font-semibold leading-snug text-[#66638c]">
                        {slipProofMessage(settings.portalBookingPaymentMode)}
                      </p>
                      <input
                        className={footballTurfFieldClass}
                        placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
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
                        busy={bookBusy || uploadingSlip}
                        labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                      />
                      {paymentSlipDataUrl ? (
                        <AppImageThumb
                          src={paymentSlipDataUrl}
                          alt="สลิป"
                          onOpen={() => lb.open(paymentSlipDataUrl)}
                        />
                      ) : (
                        <p className="text-[11px] font-bold text-rose-600">
                          ยังไม่มีสลิป — แนบหรือถ่ายก่อนยืนยันจอง
                        </p>
                      )}
                    </div>
                  </div>
                  {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookErr(null);
                        setBookStep("details");
                      }}
                      className="min-h-[52px] rounded-[1rem] border border-white/70 bg-white/80 text-sm font-black text-[#4d47b6]"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={bookBusy || uploadingSlip || !paymentReady}
                      className="app-btn-primary min-h-[52px] rounded-[1rem] text-sm font-black disabled:opacity-60"
                    >
                      {bookBusy ? "กำลังจอง…" : "ยืนยันการจอง"}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

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

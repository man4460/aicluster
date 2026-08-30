"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  type AppPaymentInfo,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { parkingPublicBookingUrl } from "@/lib/parking/public-url";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  parkingPortalSlipProofMessage,
  type ParkingPortalPaymentMode,
  type ParkingPortalSpotCard,
} from "@/systems/parking/lib/portal-booking";
import {
  PARKING_PORTAL_SAMPLE_BANNER,
  PARKING_PORTAL_SAMPLE_GALLERY,
  PARKING_REVIEW_PHOTO_MAX,
} from "@/systems/parking/lib/portal-media";
import {
  parkingFilterChipClass,
  parkingPortalContentCardClass,
  parkingPortalFieldClass,
  parkingPortalSectionTitleClass,
  parkingPortalSpotGridClass,
} from "@/systems/parking/parking-ui-tokens";

type PortalLot = { id: number; name: string; dailyRateBaht: number };

type PortalReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrls: string[];
  createdAt: string;
};

type PortalInfo = {
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
  bookingPaymentMode: ParkingPortalPaymentMode;
  depositPercent: number | null;
  lots: PortalLot[];
  reviews: PortalReview[];
  reviewAvg: number | null;
  reviewCount: number;
};

type LookupRow = {
  id: number;
  licensePlate: string;
  siteName: string;
  spotCode?: string | null;
  scheduledStart: string;
  scheduledEnd: string | null;
  status: string;
};

type BookWizardStep = "details" | "payment";

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";
const mutedTextClass = "text-sm font-semibold text-[#66638c]";
const formLabelClass = "text-xs font-bold text-[#4d47b6]";

function addDays(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return bangkokDateKey(date);
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

function formatIsoDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function bookingStatusLabel(status: string) {
  if (status === "CHECKED_IN") return "เข้าจอดแล้ว";
  if (status === "COMPLETED") return "เสร็จสิ้น";
  if (status === "CANCELLED") return "ยกเลิก";
  return "จองแล้ว";
}

function Stars({ n }: { n: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="inline-flex tracking-tight text-amber-400" aria-hidden>
      {"★".repeat(filled)}
      <span className="text-white/40">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export function ParkingPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const router = useRouter();
  const today = useMemo(() => bangkokDateKey(), []);
  const spotsRef = useRef<HTMLElement | null>(null);
  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const revGalleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const revCamera = useAppCameraCapture({ title: "ถ่ายรูปรีวิว" });
  const lb = useAppImageLightbox();

  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revPhotos, setRevPhotos] = useState<string[]>([]);
  const [revBusy, setRevBusy] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  const [searchStart, setSearchStart] = useState(today);
  const [searchEnd, setSearchEnd] = useState(addDays(today, 1));
  const [searchLotId, setSearchLotId] = useState("ALL");
  const [resultStart, setResultStart] = useState<string | null>(null);
  const [resultEnd, setResultEnd] = useState<string | null>(null);
  const [spots, setSpots] = useState<ParkingPortalSpotCard[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<ParkingPortalSpotCard | null>(null);
  const [bookStart, setBookStart] = useState(today);
  const [bookEnd, setBookEnd] = useState(addDays(today, 1));
  const [bookStep, setBookStep] = useState<BookWizardStep>("details");
  const [licensePlate, setLicensePlate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [method, setMethod] = useState<"PROMPTPAY" | "TRANSFER">("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [payInfo, setPayInfo] = useState<AppPaymentInfo | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);

  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupRows, setLookupRows] = useState<LookupRow[]>([]);

  useEffect(() => {
    const q = new URLSearchParams({ ownerId });
    if (trialSessionId !== "prod") q.set("t", trialSessionId);
    void fetch(`/api/parking/public/portal/info?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as PortalInfo & { error?: string };
        if (!res.ok) throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
        setInfo({
          ...data,
          reviews: data.reviews ?? [],
          reviewAvg: data.reviewAvg ?? null,
          reviewCount: data.reviewCount ?? 0,
        });
        setLoadErr(null);
      })
      .catch((cause) => setLoadErr(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoaded(true));
  }, [ownerId, trialSessionId]);

  const gallery = useMemo(() => {
    return info?.portalGallery?.length ? info.portalGallery : [...PARKING_PORTAL_SAMPLE_GALLERY];
  }, [info?.portalGallery]);

  const banner = info?.portalBannerUrl?.trim() || PARKING_PORTAL_SAMPLE_BANNER;
  const venueTitle = info?.name?.trim() || "ลานจอดรถ";

  const payModeLabel = useMemo(() => {
    if (!info) return null;
    if (info.bookingPaymentMode === "DEPOSIT") return "มัดจำบนลิงก์";
    if (info.bookingPaymentMode === "FULL") return "ชำระเต็มบนลิงก์";
    return null;
  }, [info]);

  const payDue = selected?.payDueBaht ?? 0;
  const requiresPortalPay = payDue > 0;

  const runSearch = useCallback(
    async (opts?: { scroll?: boolean; start?: string; end?: string; lotId?: string }) => {
      const start = opts?.start ?? searchStart;
      const end = opts?.end ?? searchEnd;
      const lotId = opts?.lotId ?? searchLotId;
      setSearchBusy(true);
      setSearchErr(null);
      try {
        const q = new URLSearchParams({ ownerId, startYmd: start, endYmd: end });
        if (trialSessionId !== "prod") q.set("t", trialSessionId);
        if (lotId !== "ALL") q.set("siteId", lotId);
        const res = await fetch(`/api/parking/public/portal/spots?${q}`, { cache: "no-store" });
        const data = (await res.json()) as {
          spots?: ParkingPortalSpotCard[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "ค้นหาช่องว่างไม่สำเร็จ");
        setSpots(data.spots ?? []);
        setResultStart(start);
        setResultEnd(end);
        if (opts?.scroll) {
          window.setTimeout(() => {
            spotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
      } catch (cause) {
        setSpots([]);
        setResultStart(null);
        setResultEnd(null);
        setSearchErr(cause instanceof Error ? cause.message : "ค้นหาไม่สำเร็จ");
      } finally {
        setSearchBusy(false);
      }
    },
    [ownerId, searchEnd, searchLotId, searchStart, trialSessionId],
  );

  useEffect(() => {
    if (!info) return;
    const id = window.setTimeout(() => {
      void runSearch();
    }, 0);
    return () => window.clearTimeout(id);
  }, [info, runSearch]);

  function openBookSheet(spot: ParkingPortalSpotCard, start: string, end: string) {
    setSelected(spot);
    setBookStart(start);
    setBookEnd(end);
    setBookStep("details");
    setLicensePlate("");
    setCustomerName("");
    setCustomerPhone("");
    setMethod("PROMPTPAY");
    setSlipUrl(null);
    setPayInfo(null);
    setBookErr(null);
  }

  const loadPayInfo = useCallback(async () => {
    if (!requiresPortalPay || payDue <= 0) return;
    setPayBusy(true);
    setBookErr(null);
    try {
      const res = await fetch("/api/parking/public/portal/promptpay-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, amountBaht: payDue, t: trialSessionId }),
      });
      const data = (await res.json()) as AppPaymentInfo & { error?: string };
      if (!res.ok) throw new Error(data.error || "โหลดข้อมูลชำระเงินไม่สำเร็จ");
      setPayInfo(data);
    } catch (cause) {
      setBookErr(cause instanceof Error ? cause.message : "โหลดข้อมูลชำระเงินไม่สำเร็จ");
    } finally {
      setPayBusy(false);
    }
  }, [ownerId, payDue, requiresPortalPay, trialSessionId]);

  useEffect(() => {
    if (!selected || bookStep !== "payment" || !requiresPortalPay) return;
    void loadPayInfo();
  }, [bookStep, loadPayInfo, requiresPortalPay, selected]);

  async function onSlipSelected(file: File | null) {
    if (!file) return;
    setUploadingSlip(true);
    setBookErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.append("ownerId", ownerId);
      form.append("file", prepared);
      const res = await fetch("/api/parking/public/portal/upload-slip", { method: "POST", body: form });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      setSlipUrl(data.imageUrl);
    } catch (cause) {
      setBookErr(cause instanceof Error ? cause.message : "แนบสลิปไม่สำเร็จ");
    } finally {
      setUploadingSlip(false);
    }
  }

  function goNextFromDetails() {
    if (!licensePlate.trim()) {
      setBookErr("กรอกทะเบียนรถ");
      return;
    }
    if (!customerName.trim()) {
      setBookErr("กรอกชื่อผู้จอง");
      return;
    }
    if (customerPhone.replace(/\D/g, "").length < 9) {
      setBookErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    setBookErr(null);
    if (requiresPortalPay) {
      setBookStep("payment");
      return;
    }
    void submitBooking();
  }

  async function submitBooking() {
    if (!selected) return;
    if (requiresPortalPay && !slipUrl) {
      setBookErr(parkingPortalSlipProofMessage(selected.bookingPaymentMode));
      setBookStep("payment");
      return;
    }
    setBookBusy(true);
    setBookErr(null);
    try {
      const res = await fetch("/api/parking/public/portal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          trialSessionId,
          siteId: selected.siteId,
          spotId: selected.id,
          licensePlate,
          customerName,
          customerPhone,
          startYmd: bookStart,
          endYmd: bookEnd,
          paymentMethod: method,
          paymentSlipUrl: slipUrl,
          amountPaidBaht: payDue,
        }),
      });
      const data = (await res.json()) as {
        booking?: { id: number; customerPhone: string };
        error?: string;
      };
      if (!res.ok || !data.booking) throw new Error(data.error || "จองไม่สำเร็จ");
      router.push(
        parkingPublicBookingUrl(
          "",
          ownerId,
          data.booking.id,
          data.booking.customerPhone,
          trialSessionId,
        ),
      );
    } catch (cause) {
      setBookErr(cause instanceof Error ? cause.message : "จองไม่สำเร็จ");
    } finally {
      setBookBusy(false);
    }
  }

  async function lookup(e: FormEvent) {
    e.preventDefault();
    const phone = lookupPhone.replace(/\D/g, "");
    if (phone.length < 4) {
      setLookupErr("กรอกเบอร์อย่างน้อย 4 หลัก");
      setLookupRows([]);
      return;
    }
    setLookupBusy(true);
    setLookupErr(null);
    try {
      const res = await fetch("/api/parking/public/portal/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, phone, trialSessionId }),
      });
      const data = (await res.json()) as { bookings?: LookupRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "ค้นหาไม่สำเร็จ");
      setLookupRows(data.bookings ?? []);
      if (!(data.bookings ?? []).length) setLookupErr("ไม่พบการจองของเบอร์นี้");
    } catch (cause) {
      setLookupErr(cause instanceof Error ? cause.message : "ค้นหาไม่สำเร็จ");
      setLookupRows([]);
    } finally {
      setLookupBusy(false);
    }
  }

  async function uploadPublicImage(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const form = new FormData();
    form.append("ownerId", ownerId);
    form.append("file", prepared);
    const res = await fetch("/api/parking/public/portal/upload-slip", { method: "POST", body: form });
    const data = (await res.json()) as { imageUrl?: string; error?: string };
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
    return data.imageUrl;
  }

  async function onSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setRevBusy(true);
    setRevMsg(null);
    try {
      const res = await fetch("/api/parking/public/portal/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          t: trialSessionId,
          guestName: revName.trim(),
          rating: revRating,
          comment: revComment.trim(),
          photoUrls: revPhotos,
        }),
      });
      const j = (await res.json()) as { review?: PortalReview; error?: string };
      if (!res.ok || !j.review) throw new Error(j.error || "ส่งรีวิวไม่สำเร็จ");
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              reviews: [j.review!, ...prev.reviews].slice(0, 40),
              reviewCount: prev.reviewCount + 1,
            }
          : prev,
      );
      setRevName("");
      setRevComment("");
      setRevPhotos([]);
      setRevRating(5);
      setRevMsg("ส่งรีวิวแล้ว");
    } catch (cause) {
      setRevMsg(cause instanceof Error ? cause.message : "ส่งรีวิวไม่สำเร็จ");
    } finally {
      setRevBusy(false);
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

  if (!loaded || !info) {
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
            {info.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.logoUrl}
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
            <a href="#spots" className={navLinkClass}>
              ช่องว่าง
            </a>
            <a href="#gallery" className={navLinkClass}>
              ภาพรวม
            </a>
            <a href="#reviews" className={navLinkClass}>
              รีวิว
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
              Parking booking
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              {venueTitle}
            </h1>
            {info.tagline?.trim() ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {info.tagline.trim()}
              </p>
            ) : null}
            {info.reviewCount > 0 && info.reviewAvg != null ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-100 drop-shadow">
                <Stars n={Math.round(info.reviewAvg)} />
                <span>
                  {info.reviewAvg} · {info.reviewCount} รีวิว
                </span>
              </p>
            ) : null}
          </div>

          <form
            id="book"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch({ scroll: true });
            }}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 grid w-full gap-3 p-4 text-[#1e1b4b] sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end sm:p-5",
            )}
          >
            <label className="block">
              <span className={formLabelClass}>วันเริ่ม</span>
              <input
                type="date"
                required
                min={today}
                value={searchStart}
                onChange={(e) => {
                  const next = e.target.value || today;
                  setSearchStart(next);
                  if (searchEnd <= next) setSearchEnd(addDays(next, 1));
                }}
                className={cn(parkingPortalFieldClass, "mt-1")}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>วันสิ้นสุด</span>
              <input
                type="date"
                required
                min={addDays(searchStart, 1)}
                value={searchEnd}
                onChange={(e) => setSearchEnd(e.target.value || addDays(searchStart, 1))}
                className={cn(parkingPortalFieldClass, "mt-1")}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>ลานจอด</span>
              <select
                value={searchLotId}
                onChange={(e) => setSearchLotId(e.target.value)}
                className={cn(parkingPortalFieldClass, "mt-1")}
              >
                <option value="ALL">ทุกลาน</option>
                {info.lots.map((lot) => (
                  <option key={lot.id} value={String(lot.id)}>
                    {lot.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={searchBusy}
              className="app-btn-primary min-h-[44px] self-end rounded-[1rem] px-6 text-sm font-black disabled:opacity-60"
            >
              {searchBusy ? "ค้นหา…" : "ค้นหาช่องว่าง"}
            </button>
            {payModeLabel ? (
              <p className={cn("sm:col-span-4", mutedTextClass, "!text-[11px]")}>
                {payModeLabel}
                {info.bookingPaymentMode === "DEPOSIT" && info.depositPercent != null
                  ? ` ${info.depositPercent}%`
                  : ""}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <section id="spots" ref={spotsRef} className="scroll-mt-8">
          <h2 className={parkingPortalSectionTitleClass}>ช่องจอดว่าง</h2>
          {resultStart && resultEnd ? (
            <p className={cn("mt-2", mutedTextClass)}>
              {formatThYmd(resultStart)} – {formatThYmd(resultEnd)}
              {spots.length > 0 ? ` · ${spots.length} ช่อง` : ""}
            </p>
          ) : null}
          {searchErr ? <p className="mt-3 text-sm font-semibold text-rose-600">{searchErr}</p> : null}
          {searchBusy && spots.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>กำลังค้นหาช่องว่าง…</p>
          ) : spots.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>
              {resultStart ? "ไม่มีช่องว่างในช่วงนี้" : "กดค้นหาช่องว่าง"}
            </p>
          ) : (
            <ul className={parkingPortalSpotGridClass}>
              {spots.map((spot) => {
                const cover = gallery[0] || banner;
                return (
                  <li key={spot.id} className={cn(parkingPortalContentCardClass, "!p-0")}>
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => lb.open(cover)}
                      aria-label={`ดูรูปช่อง ${spot.spotCode}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt=""
                        className="aspect-square w-full object-cover object-center"
                      />
                    </button>
                    <div className="space-y-1.5 p-2.5 sm:p-3">
                      <p className="truncate text-sm font-black text-[#1e1b4b] lg:text-xs">
                        {spot.spotCode}
                      </p>
                      <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-[#66638c]">
                        {spot.siteName}
                        {spot.zoneLabel ? ` · ${spot.zoneLabel}` : ""}
                      </p>
                      <p className="text-sm font-black text-[#4d47b6] lg:text-xs">
                        {formatMoney(spot.dailyRateBaht)}
                        <span className="font-bold text-[#8b87b8]">/วัน</span>
                      </p>
                      <p className="text-[10px] font-semibold text-[#8b87b8]">
                        รวม {formatMoney(spot.totalBaht)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          openBookSheet(
                            spot,
                            resultStart || searchStart,
                            resultEnd || searchEnd,
                          )
                        }
                        className="app-btn-primary mt-0.5 flex min-h-9 w-full items-center justify-center rounded-xl px-2 text-xs font-black"
                      >
                        จอง
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="gallery" className="scroll-mt-8">
          <h2 className={parkingPortalSectionTitleClass}>ภาพรวม</h2>
          {!info.portalGallery?.length ? (
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

        <section id="reviews" className="scroll-mt-8">
          <h2 className={parkingPortalSectionTitleClass}>รีวิว</h2>
          {info.reviews.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>ยังไม่มีรีวิว</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {info.reviews.map((r) => (
                <li key={r.id} className={cn(appPublicCheckInGlassCardClass, "p-4")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#1e1b4b]">{r.guestName}</p>
                    <Stars n={r.rating} />
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c]">{r.comment}</p>
                  {r.photoUrls.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.photoUrls.map((u) => (
                        <AppImageThumb key={u} src={u} alt="รีวิว" onOpen={() => lb.open(u)} />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <form
            className={cn(appPublicCheckInGlassCardClass, "mt-6 space-y-3 p-4 sm:p-5")}
            onSubmit={(e) => void onSubmitReview(e)}
          >
            <h3 className="text-sm font-black text-[#1e1b4b]">เขียนรีวิว</h3>
            <input
              required
              placeholder="ชื่อ"
              value={revName}
              onChange={(e) => setRevName(e.target.value)}
              className={parkingPortalFieldClass}
            />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={parkingFilterChipClass(revRating === n)}
                  onClick={() => setRevRating(n)}
                >
                  ★{n}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              placeholder="ความคิดเห็น"
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              className={cn(parkingPortalFieldClass, "min-h-[88px] py-3")}
            />
            <AppGalleryCameraFileInputs
              galleryInputRef={revGalleryRef}
              cameraInputRef={revCamera.cameraInputRef}
              onChange={(e) => {
                const files = e.target.files;
                e.target.value = "";
                if (!files?.length) return;
                void (async () => {
                  const added: string[] = [];
                  for (const file of Array.from(files).slice(
                    0,
                    PARKING_REVIEW_PHOTO_MAX - revPhotos.length,
                  )) {
                    added.push(await uploadPublicImage(file));
                  }
                  setRevPhotos((p) => [...p, ...added].slice(0, PARKING_REVIEW_PHOTO_MAX));
                })().catch((err) =>
                  setRevMsg(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                );
              }}
            />
            <AppImagePickCameraButtons
              onPickGallery={() => revGalleryRef.current?.click()}
              onPickCamera={() =>
                revCamera.openCamera(async (file) => {
                  try {
                    const url = await uploadPublicImage(file);
                    setRevPhotos((p) => [...p, url].slice(0, PARKING_REVIEW_PHOTO_MAX));
                  } catch (err) {
                    setRevMsg(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                  }
                })
              }
            />
            {revPhotos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {revPhotos.map((u) => (
                  <AppImageThumb key={u} src={u} alt="แนบรีวิว" onOpen={() => lb.open(u)} />
                ))}
              </div>
            ) : null}
            {revMsg ? <p className="text-sm font-semibold text-[#4d47b6]">{revMsg}</p> : null}
            <button
              type="submit"
              disabled={revBusy}
              className="app-btn-primary min-h-11 rounded-xl px-5 text-sm font-black disabled:opacity-60"
            >
              ส่งรีวิว
            </button>
          </form>
        </section>

        <section id="contact" className="scroll-mt-8">
          <h2 className={parkingPortalSectionTitleClass}>ติดต่อ</h2>
          <div className={cn(parkingPortalContentCardClass, "mt-6 grid gap-4 sm:grid-cols-2")}>
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{venueTitle}</p>
              {info.address?.trim() ? <p>{info.address.trim()}</p> : null}
              {info.contactPhone?.trim() ? (
                <p>
                  <a
                    className="font-bold text-[#4d47b6] hover:underline"
                    href={`tel:${info.contactPhone.trim()}`}
                  >
                    {info.contactPhone.trim()}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {info.lineId?.trim() ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(info.lineId.trim().replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  LINE
                </a>
              ) : null}
              {info.facebookUrl?.trim() ? (
                <a
                  href={info.facebookUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  Facebook
                </a>
              ) : null}
              {info.mapUrl?.trim() ? (
                <a
                  href={info.mapUrl.trim()}
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
          <h2 className={parkingPortalSectionTitleClass}>การจอง</h2>
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
                className={cn(parkingPortalFieldClass, "mt-1")}
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
            {lookupRows.map((row) => {
              const href = parkingPublicBookingUrl(
                "",
                ownerId,
                row.id,
                lookupPhone.replace(/\D/g, ""),
                trialSessionId,
              );
              return (
                <li key={row.id}>
                  <Link href={href} className={cn(parkingPortalContentCardClass, "block w-full text-left")}>
                    <p className="text-sm font-black text-[#1e1b4b]">
                      {row.licensePlate}
                      {row.spotCode ? ` · ช่อง ${row.spotCode}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#66638c]">
                      {row.siteName} · {formatIsoDate(row.scheduledStart)}
                      {row.scheduledEnd ? ` – ${formatIsoDate(row.scheduledEnd)}` : ""}
                    </p>
                    <p className="mt-2 text-[11px] font-black text-[#4d47b6]">
                      {bookingStatusLabel(row.status)} · ดูรายละเอียด
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {selected ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1e1b4b]/45 p-3 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (bookStep === "details") goNextFromDetails();
              else void submitBooking();
            }}
            className={cn(
              appPublicCheckInGlassCardClass,
              "max-h-[90dvh] w-full max-w-md overflow-y-auto p-5 text-[#1e1b4b]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">
                  ช่อง {selected.spotCode}
                </p>
                <p className="text-xs font-semibold text-[#66638c]">
                  {selected.siteName}
                  {selected.zoneLabel ? ` · ${selected.zoneLabel}` : ""} ·{" "}
                  {formatThYmd(bookStart)} – {formatThYmd(bookEnd)} · {selected.days} วัน ·{" "}
                  {formatMoney(selected.totalBaht)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-[40px] min-w-[40px] rounded-full border border-white/70 bg-white/80 text-lg font-bold text-[#4d47b6]"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  { id: "details" as const, label: "1. ข้อมูล" },
                  ...(requiresPortalPay
                    ? [
                        {
                          id: "payment" as const,
                          label:
                            selected.bookingPaymentMode === "FULL" ? "2. ชำระเต็ม" : "2. มัดจำ",
                        },
                      ]
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
              {bookStep === "details" ? (
                <>
                  <label className="block">
                    <span className={formLabelClass}>ทะเบียนรถ</span>
                    <input
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className={cn(parkingPortalFieldClass, "mt-1")}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>ชื่อผู้จอง</span>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={cn(parkingPortalFieldClass, "mt-1")}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>เบอร์โทร</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={cn(parkingPortalFieldClass, "mt-1")}
                      required
                    />
                  </label>
                </>
              ) : null}

              {bookStep === "payment" ? (
                <>
                  <div className="rounded-2xl bg-violet-50/80 p-3 text-sm font-bold text-[#4d47b6]">
                    ยอดที่ต้องชำระ {formatMoney(payDue)}
                    {selected.bookingPaymentMode === "DEPOSIT" ? " (มัดจำ)" : ""}
                  </div>
                  <p className="text-xs font-bold text-[#66638c]">
                    {parkingPortalSlipProofMessage(selected.bookingPaymentMode)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "PROMPTPAY" as const, label: "พร้อมเพย์" },
                        { id: "TRANSFER" as const, label: "โอน" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMethod(opt.id)}
                        className={cn(
                          "min-h-[40px] rounded-full px-4 text-xs font-black ring-1",
                          method === opt.id
                            ? "bg-[#5b61ff]/15 text-[#4d47b6] ring-[#5b61ff]/35"
                            : "bg-white/70 text-[#66638c] ring-white/80",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {payBusy ? (
                    <p className={mutedTextClass}>กำลังโหลด QR…</p>
                  ) : payInfo ? (
                    <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-3">
                      {method === "PROMPTPAY" && payInfo.qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={payInfo.qrDataUrl}
                          alt="QR พร้อมเพย์"
                          className="mx-auto h-44 w-44 rounded-xl bg-white object-contain p-2"
                        />
                      ) : null}
                      {method === "PROMPTPAY" && payInfo.promptPayPhone ? (
                        <p className="text-center text-sm font-bold text-[#4d47b6]">
                          {payInfo.promptPayPhone}
                        </p>
                      ) : null}
                      {method === "TRANSFER" ? (
                        <div className="space-y-1 text-sm font-semibold text-[#66638c]">
                          {payInfo.bankName ? <p>{payInfo.bankName}</p> : null}
                          {payInfo.bankAccountNumber ? (
                            <p className="font-black text-[#1e1b4b]">{payInfo.bankAccountNumber}</p>
                          ) : null}
                          {payInfo.bankAccountName ? <p>{payInfo.bankAccountName}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <AppGalleryCameraFileInputs
                    galleryInputRef={slipGalleryRef}
                    cameraInputRef={cameraInputRef}
                    onChange={(ev) => {
                      const file = ev.target.files?.[0] ?? null;
                      ev.target.value = "";
                      void onSlipSelected(file);
                    }}
                  />
                  <AppImagePickCameraButtons
                    onPickGallery={() => slipGalleryRef.current?.click()}
                    onPickCamera={() => openCamera((file) => void onSlipSelected(file))}
                    disabled={uploadingSlip || bookBusy}
                  />
                  {slipUrl ? (
                    <AppImageThumb
                      src={slipUrl}
                      alt="สลิป"
                      className="h-24 w-24"
                      onOpen={() => lb.open(slipUrl)}
                    />
                  ) : null}
                  {uploadingSlip ? <p className={mutedTextClass}>กำลังอัปโหลดสลิป…</p> : null}
                </>
              ) : null}

              {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}

              <div className="flex gap-2 pt-1">
                {bookStep === "payment" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBookStep("details");
                      setBookErr(null);
                    }}
                    className="min-h-[48px] flex-1 rounded-[1rem] border border-white/70 bg-white/80 text-sm font-black text-[#4d47b6]"
                  >
                    ย้อนกลับ
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={bookBusy || uploadingSlip}
                  className="app-btn-primary min-h-[48px] flex-1 rounded-[1rem] text-sm font-black disabled:opacity-50"
                >
                  {bookBusy
                    ? "กำลังจอง…"
                    : bookStep === "details" && requiresPortalPay
                      ? "ถัดไป"
                      : "ยืนยันการจอง"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {cameraModal}
      {revCamera.cameraModal}
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="ภาพลานจอด"
      />
    </AppPublicCheckInGlassPage>
  );
}

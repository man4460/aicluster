"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { hotelResortPublicBookingUrl } from "@/lib/hotel-resort/public-url";
import type { HotelPortalBookingPaymentMode } from "@/systems/hotel-resort/lib/portal-booking";
import {
  HOTEL_RESORT_PORTAL_SAMPLE_BANNER,
  HOTEL_RESORT_REVIEW_PHOTO_MAX,
} from "@/systems/hotel-resort/lib/portal-media";
import {
  hotelResortContentCardClass,
  hotelResortFieldClass,
  hotelResortFilterChipClass,
  hotelResortFormLabelClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type PortalReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrls: string[];
  createdAt: string;
};

type PortalInfo = {
  propertyName: string;
  tagline: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  checkInTime: string;
  checkOutTime: string;
  portalBannerUrl: string | null;
  portalGallery: string[];
  portalBookingPaymentMode: HotelPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  payment: {
    promptPayPhone: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
  };
  reviews: PortalReview[];
  reviewAvg: number | null;
  reviewCount: number;
};

type PortalPayQr = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

type PortalRoom = {
  id: string;
  roomNumber: string;
  floor: number;
  buildingName: string | null;
  roomTypeName: string;
  basePriceBaht: number;
  maxGuests: number;
  bedType: string | null;
  roomSizeSqm: number | null;
  viewType: string | null;
  amenities: { key: string; label: string }[];
  imageUrls: string[];
  note: string | null;
  nights: number;
  totalBaht: number;
  payDueBaht: number | null;
};

type PortalBooking = {
  id: string;
  roomNumber: string | null;
  roomTypeName?: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: string;
  guestName: string;
  totalBaht?: number;
  amountPaidBaht?: number;
  paymentStatus?: string;
};

function ymdLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  return ymdLocal(dt);
}

function formatThYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatThDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nightsFromYmd(checkInYmd: string, checkOutYmd: string) {
  const [y1, m1, d1] = checkInYmd.split("-").map(Number);
  const [y2, m2, d2] = checkOutYmd.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} จาก 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";

const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const mutedTextClass = "text-sm font-semibold text-[#66638c]";

export function HotelResortPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(() => ymdLocal());
  const [checkOut, setCheckOut] = useState(() => addDaysYmd(ymdLocal(), 1));
  const [rooms, setRooms] = useState<PortalRoom[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [resultRange, setResultRange] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [selected, setSelected] = useState<PortalRoom | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PROMPTPAY" | "TRANSFER">("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupBookings, setLookupBookings] = useState<PortalBooking[]>([]);
  const [payQr, setPayQr] = useState<PortalPayQr | null>(null);
  const [payQrBusy, setPayQrBusy] = useState(false);
  const [payQrErr, setPayQrErr] = useState<string | null>(null);
  const [revName, setRevName] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revPhotos, setRevPhotos] = useState<string[]>([]);
  const [revBusy, setRevBusy] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);
  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const revGalleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const revCamera = useAppCameraCapture({ title: "ถ่ายรูปรีวิว" });
  const lb = useAppImageLightbox();
  const roomsRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const qBase = useMemo(() => {
    const q = new URLSearchParams({ ownerId });
    if (trialSessionId) q.set("t", trialSessionId);
    return q;
  }, [ownerId, trialSessionId]);

  useEffect(() => {
    void fetch(`/api/hotel-resort/public/portal/info?${qBase}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        }
        const data = (await res.json()) as PortalInfo;
        setInfo({
          ...data,
          reviews: (data.reviews ?? []).map((r) => ({
            ...r,
            photoUrls: Array.isArray(r.photoUrls) ? r.photoUrls : [],
          })),
        });
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [qBase]);

  async function fetchRooms(opts?: {
    checkInYmd?: string;
    checkOutYmd?: string;
    scroll?: boolean;
  }) {
    const inYmd = opts?.checkInYmd ?? checkIn;
    const outYmd = opts?.checkOutYmd ?? checkOut;
    setSearchBusy(true);
    setSearchErr(null);
    setSelected(null);
    try {
      const q = new URLSearchParams(qBase);
      q.set("checkIn", inYmd);
      q.set("checkOut", outYmd);
      const res = await fetch(`/api/hotel-resort/public/portal/rooms?${q}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { rooms?: PortalRoom[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "ค้นหาไม่สำเร็จ");
      setRooms(j.rooms ?? []);
      setResultRange({ checkIn: inYmd, checkOut: outYmd });
      if (opts?.scroll) {
        requestAnimationFrame(() => roomsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    } catch (err) {
      setRooms([]);
      setResultRange(null);
      setSearchErr(err instanceof Error ? err.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setSearchBusy(false);
    }
  }

  useEffect(() => {
    const today = ymdLocal();
    const tomorrow = addDaysYmd(today, 1);
    void fetchRooms({ checkInYmd: today, checkOutYmd: tomorrow, scroll: false });
    // โหลดห้องว่างวันนี้ทันทีเมื่อเปิดหน้า
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ครั้งแรกตาม owner/trial เท่านั้น
  }, [qBase]);

  const payDueBaht =
    selected?.payDueBaht != null && selected.payDueBaht > 0 ? selected.payDueBaht : null;

  useEffect(() => {
    if (!payDueBaht || !selected) {
      setPayQr(null);
      setPayQrErr(null);
      return;
    }
    let cancelled = false;
    setPayQrBusy(true);
    setPayQrErr(null);
    void (async () => {
      try {
        const res = await fetch("/api/hotel-resort/public/portal/promptpay-qr", {
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
          promptPayPhone: j.promptPayPhone ?? null,
          bankName: j.bankName ?? null,
          bankAccountNumber: j.bankAccountNumber ?? null,
          bankAccountName: j.bankAccountName ?? null,
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
  }, [ownerId, payDueBaht, selected, trialSessionId]);

  async function searchRooms(e?: FormEvent) {
    e?.preventDefault();
    await fetchRooms({ scroll: true });
  }

  async function uploadSlip(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/hotel-resort/public/portal/upload-slip", {
      method: "POST",
      body: fd,
    });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
    setSlipUrl(j.imageUrl);
  }

  async function uploadPublicImage(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/hotel-resort/public/portal/upload-slip", {
      method: "POST",
      body: fd,
    });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
    return j.imageUrl;
  }

  async function onSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setRevBusy(true);
    setRevMsg(null);
    try {
      const res = await fetch("/api/hotel-resort/public/portal/reviews", {
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
              reviewAvg:
                Math.round(
                  ((prev.reviewAvg ?? 0) * prev.reviewCount + j.review!.rating) /
                    (prev.reviewCount + 1) *
                    10,
                ) / 10,
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

  async function submitBook(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBookBusy(true);
    setBookErr(null);
    try {
      const needPay = selected.payDueBaht != null && selected.payDueBaht > 0;
      if (needPay && !slipUrl) {
        throw new Error(
          info?.portalBookingPaymentMode === "FULL"
            ? "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง"
            : "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง",
        );
      }
      const res = await fetch("/api/hotel-resort/public/portal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          trialSessionId,
          roomId: selected.id,
          checkIn,
          checkOut,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          paymentMethod: needPay ? paymentMethod : undefined,
          paymentSlipUrl: needPay ? slipUrl : null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        booking?: { id: string; guestPhone?: string };
        error?: string;
      };
      if (!res.ok || !j.booking) throw new Error(j.error ?? "จองไม่สำเร็จ");
      const phoneDigits = (j.booking.guestPhone || guestPhone).replace(/\D/g, "");
      router.push(
        hotelResortPublicBookingUrl("", ownerId, j.booking.id, phoneDigits, trialSessionId || "prod"),
      );
      return;
    } catch (err) {
      setBookErr(err instanceof Error ? err.message : "จองไม่สำเร็จ");
    } finally {
      setBookBusy(false);
    }
  }

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setLookupBusy(true);
    setLookupErr(null);
    try {
      const res = await fetch("/api/hotel-resort/public/portal/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, trialSessionId, phone: lookupPhone.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        bookings?: PortalBooking[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "ค้นหาไม่สำเร็จ");
      setLookupBookings(j.bookings ?? []);
    } catch (err) {
      setLookupBookings([]);
      setLookupErr(err instanceof Error ? err.message : "ค้นหาไม่สำเร็จ");
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

  if (!info) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const banner = info.portalBannerUrl || HOTEL_RESORT_PORTAL_SAMPLE_BANNER;
  const title = info.propertyName.trim() || "โรงแรม";
  const payModeLabel =
    info.portalBookingPaymentMode === "DEPOSIT"
      ? "มัดจำ"
      : info.portalBookingPaymentMode === "FULL"
        ? "ชำระเต็มยอด"
        : null;

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
              {title}
            </p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนู"
          >
            <a href="#book" className={navLinkClass}>
              จอง
            </a>
            <a href="#rooms" className={navLinkClass}>
              ห้องพัก
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
              Hotel booking
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              {title}
            </h1>
            {info.tagline ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {info.tagline}
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
            onSubmit={(e) => void searchRooms(e)}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 grid w-full gap-3 p-4 text-[#1e1b4b] sm:grid-cols-[1fr_1fr_auto] sm:p-5",
            )}
          >
            <label className="block">
              <span className={hotelResortFormLabelClass}>เช็คอิน</span>
              <input
                type="date"
                required
                value={checkIn}
                min={ymdLocal()}
                onChange={(e) => {
                  const v = e.target.value;
                  setCheckIn(v);
                  if (checkOut <= v) setCheckOut(addDaysYmd(v, 1));
                }}
                className={cn(hotelResortFieldClass, "mt-1")}
              />
            </label>
            <label className="block">
              <span className={hotelResortFormLabelClass}>เช็คเอาต์</span>
              <input
                type="date"
                required
                value={checkOut}
                min={addDaysYmd(checkIn, 1)}
                onChange={(e) => setCheckOut(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
              />
            </label>
            <button
              type="submit"
              disabled={searchBusy}
              className="app-btn-primary min-h-[52px] self-end rounded-[1rem] px-6 text-sm font-black disabled:opacity-60"
            >
              {searchBusy ? "ค้นหา…" : "ค้นหาห้อง"}
            </button>
            {payModeLabel ? (
              <p className={cn("sm:col-span-3", mutedTextClass, "!text-[11px]")}>
                {payModeLabel}
                {info.portalBookingPaymentMode === "DEPOSIT" && info.depositAmountBaht != null
                  ? ` ${info.depositAmountBaht.toLocaleString("th-TH")} บาท`
                  : ""}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <section id="rooms" ref={roomsRef} className="scroll-mt-8">
          <h2 className={sectionTitleClass}>ห้องพัก</h2>
          {resultRange ? (
            <p className={cn("mt-2", mutedTextClass)}>
              ผลการค้นหา {formatThYmd(resultRange.checkIn)} – {formatThYmd(resultRange.checkOut)}
              {nightsFromYmd(resultRange.checkIn, resultRange.checkOut) > 0
                ? ` · ${nightsFromYmd(resultRange.checkIn, resultRange.checkOut)} คืน`
                : ""}
              {rooms.length > 0 ? ` · ${rooms.length} ห้อง` : ""}
            </p>
          ) : null}
          {searchErr ? <p className="mt-3 text-sm font-semibold text-rose-600">{searchErr}</p> : null}
          {searchBusy && rooms.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>กำลังโหลดห้อง…</p>
          ) : rooms.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>
              {resultRange
                ? `ไม่มีห้องว่าง ${formatThYmd(resultRange.checkIn)} – ${formatThYmd(resultRange.checkOut)}`
                : "ไม่มีห้องว่างในช่วงนี้"}
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const cover = room.imageUrls[0] ?? banner;
                return (
                  <li key={room.id} className={cn(hotelResortContentCardClass, "!p-0")}>
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => lb.openGallery(room.imageUrls.length ? room.imageUrls : [cover], 0)}
                      aria-label={`ดูรูป ${room.roomTypeName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="h-44 w-full object-cover object-center" />
                    </button>
                    <div className="space-y-2 p-4">
                      <p className="text-lg font-black text-[#1e1b4b]">{room.roomTypeName}</p>
                      <p className="text-xs font-semibold text-[#66638c]">
                        ห้อง {room.roomNumber}
                        {room.buildingName ? ` · ${room.buildingName}` : ""}
                        {room.bedType ? ` · ${room.bedType}` : ""}
                        {room.roomSizeSqm ? ` · ${room.roomSizeSqm} ตร.ม.` : ""}
                        {room.viewType ? ` · ${room.viewType}` : ""}
                      </p>
                      {room.amenities.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.slice(0, 6).map((a) => (
                            <span
                              key={a.key}
                              className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#4d47b6]"
                            >
                              {a.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-end justify-between gap-2 pt-1">
                        <div>
                          <p className="text-xl font-black text-[#4d47b6]">
                            ฿{room.basePriceBaht.toLocaleString("th-TH")}
                            <span className="text-xs font-bold text-[#8b87b8]"> /คืน</span>
                          </p>
                          <p className="text-[11px] font-semibold text-[#8b87b8]">
                            {room.nights} คืน · รวม ฿{room.totalBaht.toLocaleString("th-TH")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(room);
                            setBookErr(null);
                            setSlipUrl(null);
                          }}
                          className="app-btn-primary min-h-[44px] rounded-[1rem] px-4 text-sm font-black"
                        >
                          จอง
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {info.portalGallery.length ? (
          <section id="gallery" className="scroll-mt-8">
            <h2 className={sectionTitleClass}>ภาพรวม</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {info.portalGallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => lb.openGallery(info.portalGallery, idx)}
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

        <section id="reviews" className="scroll-mt-8">
          <h2 className={sectionTitleClass}>รีวิว</h2>
          {info.reviews.length === 0 ? (
            <p className={cn("mt-3", mutedTextClass)}>ยังไม่มีรีวิว</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {info.reviews.map((r) => (
                <li key={r.id} className={hotelResortContentCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#1e1b4b]">{r.guestName}</p>
                    <Stars n={r.rating} />
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c]">{r.comment}</p>
                  {r.photoUrls?.length ? (
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
            className={cn(hotelResortContentCardClass, "mt-6 space-y-3")}
            onSubmit={(e) => void onSubmitReview(e)}
          >
            <h3 className="text-sm font-black text-[#1e1b4b]">เขียนรีวิว</h3>
            <input
              required
              placeholder="ชื่อ"
              value={revName}
              onChange={(e) => setRevName(e.target.value)}
              className={hotelResortFieldClass}
            />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={hotelResortFilterChipClass(revRating === n)}
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
              className={cn(hotelResortFieldClass, "min-h-[88px] py-3")}
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
                    HOTEL_RESORT_REVIEW_PHOTO_MAX - revPhotos.length,
                  )) {
                    added.push(await uploadPublicImage(file));
                  }
                  setRevPhotos((p) => [...p, ...added].slice(0, HOTEL_RESORT_REVIEW_PHOTO_MAX));
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
                    setRevPhotos((p) => [...p, url].slice(0, HOTEL_RESORT_REVIEW_PHOTO_MAX));
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
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className={cn(hotelResortContentCardClass, "mt-6 grid gap-4 sm:grid-cols-2")}>
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{title}</p>
              {info.address ? <p>{info.address}</p> : null}
              {info.contactPhone ? (
                <p>
                  <a className="font-bold text-[#4d47b6] hover:underline" href={`tel:${info.contactPhone}`}>
                    {info.contactPhone}
                  </a>
                </p>
              ) : null}
              <p className="text-[#8b87b8]">
                เช็คอิน {info.checkInTime} · เช็คเอาต์ {info.checkOutTime}
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {info.lineId ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(info.lineId.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  LINE
                </a>
              ) : null}
              {info.facebookUrl ? (
                <a
                  href={info.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  Facebook
                </a>
              ) : null}
              {info.mapUrl ? (
                <a
                  href={info.mapUrl}
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
              <span className={hotelResortFormLabelClass}>เบอร์โทร</span>
              <input
                type="tel"
                required
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className={cn(hotelResortFieldClass, "mt-1")}
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
            {lookupBookings.map((b) => {
              const href = hotelResortPublicBookingUrl(
                "",
                ownerId,
                b.id,
                lookupPhone,
                trialSessionId || "prod",
              );
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => router.push(href)}
                    className={cn(hotelResortContentCardClass, "w-full text-left")}
                  >
                    <p className="text-sm font-black text-[#1e1b4b]">
                      ห้อง {b.roomNumber ?? "-"}
                      {b.roomTypeName ? ` · ${b.roomTypeName}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#66638c]">
                      {formatThDate(b.checkInAt)} – {formatThDate(b.checkOutAt)} · จองแล้ว
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {selected ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1e1b4b]/45 p-3 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={(e) => void submitBook(e)}
            className={cn(
              appPublicCheckInGlassCardClass,
              "max-h-[90dvh] w-full max-w-md overflow-y-auto p-5 text-[#1e1b4b]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{selected.roomTypeName}</p>
                <p className="text-xs font-semibold text-[#66638c]">
                  ห้อง {selected.roomNumber} · {selected.nights} คืน · ฿
                  {selected.totalBaht.toLocaleString("th-TH")}
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
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className={hotelResortFormLabelClass}>ชื่อ</span>
                <input
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
              <label className="block">
                <span className={hotelResortFormLabelClass}>เบอร์โทร</span>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
              {payDueBaht != null ? (
                <div className="space-y-3 rounded-[1.25rem] border border-[#5b61ff]/25 bg-[#5b61ff]/08 p-3">
                  <p className="text-sm font-black text-[#4d47b6]">
                    ชำระ ฿{payDueBaht.toLocaleString("th-TH")}
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
                                ? "ที่พักยังไม่ได้ตั้งเบอร์พร้อมเพย์"
                                : "สร้าง QR ไม่สำเร็จ")}
                          </p>
                        )}
                      </div>
                      {(payQr?.promptPayPhone || info.payment.promptPayPhone) ? (
                        <p className="text-xs font-semibold text-[#66638c]">
                          พร้อมเพย์:{" "}
                          <span className="font-black text-[#1e1b4b]">
                            {payQr?.promptPayPhone || info.payment.promptPayPhone}
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
                          {payQr?.bankName || info.payment.bankName || "—"}
                        </span>
                      </p>
                      <p>
                        เลขบัญชี:{" "}
                        <span className="font-black text-[#1e1b4b]">
                          {payQr?.bankAccountNumber || info.payment.bankAccountNumber || "—"}
                        </span>
                      </p>
                      <p>
                        ชื่อบัญชี:{" "}
                        <span className="font-black text-[#1e1b4b]">
                          {payQr?.bankAccountName || info.payment.bankAccountName || "—"}
                        </span>
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs font-black text-[#1e1b4b]">แนบสลิป</p>
                    <p className="text-[11px] font-semibold leading-snug text-[#66638c]">
                      {info.portalBookingPaymentMode === "FULL"
                        ? "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง"
                        : "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง"}
                    </p>
                    <AppGalleryCameraFileInputs
                      galleryInputRef={slipGalleryRef}
                      cameraInputRef={cameraInputRef}
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        void uploadSlip(f).catch((err) =>
                          setBookErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                        );
                      }}
                    />
                    <AppImagePickCameraButtons
                      onPickGallery={() => slipGalleryRef.current?.click()}
                      onPickCamera={() =>
                        openCamera((file) => {
                          void uploadSlip(file).catch((err) =>
                            setBookErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                          );
                        })
                      }
                      busy={bookBusy}
                      labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                    />
                    {slipUrl ? (
                      <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
                    ) : null}
                  </div>
                </div>
              ) : null}
              {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}
              <button
                type="submit"
                disabled={bookBusy}
                className="app-btn-primary min-h-[52px] w-full rounded-[1rem] text-sm font-black disabled:opacity-60"
              >
                {bookBusy ? "กำลังจอง…" : "ยืนยันการจอง"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปโรงแรม"
      />
      {cameraModal}
      {revCamera.cameraModal}
    </AppPublicCheckInGlassPage>
  );
}

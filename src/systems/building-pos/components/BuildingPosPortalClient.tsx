"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  AppTime24Input,
  appPublicCheckInGlassCardClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  buildingPosCartItemsTotalBaht,
  buildingPosComputePortalPayDue,
  buildingPosPortalSlipProofMessage,
  type BuildingPosPortalBookingPaymentMode,
  type BuildingPosPortalCartItem,
} from "@/lib/building-pos/portal-booking";
import { buildingPosPublicReservationUrl } from "@/lib/building-pos/public-url";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosFieldClass,
  buildingPosPortalMenuCardClass,
  buildingPosPortalMenuGridClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

type PortalReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrls: string[];
  createdAt: string;
};

type MenuItem = {
  id: number;
  category_id: number | null;
  name: string;
  image_url: string;
  price: number;
  description: string;
  is_featured: boolean;
};

type Category = { id: number; name: string; sort_order: number };

type PortalInfo = {
  shopName: string;
  tagline: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  openTime: string;
  closeTime: string;
  portalBannerUrl: string | null;
  portalGallery: string[];
  portalBookingPaymentMode: BuildingPosPortalBookingPaymentMode;
  depositAmountBaht: number | null;
  depositPercent: number | null;
  payment: {
    promptPayPhone: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
  };
  categories: Category[];
  menu_items: MenuItem[];
  reviews: PortalReview[];
  reviewAvg: number | null;
  reviewCount: number;
};

type PayQr = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

const SAMPLE_BANNER =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80";

/** โครงเดียวกับโรงแรม — โลโก้กลมในแถบบน · ไม่วางโลโก้ใหญ่ข้างหัวข้อบนแบนเนอร์ */
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

const portalNavLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";

const portalSectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const portalMutedTextClass = "text-sm font-semibold text-[#66638c]";

export function BuildingPosPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const router = useRouter();
  const t = trialSessionId && trialSessionId !== "prod" ? trialSessionId : undefined;
  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [visitDateKey, setVisitDateKey] = useState(bangkokDateKey());
  const [visitTimeHm, setVisitTimeHm] = useState("18:00");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<BuildingPosPortalCartItem[]>([]);
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  /** 1 = แถบบนแบนเนอร์ · 2 = ผู้จอง · 3 = เมนู · 4 = ยืนยัน/ชำระ */
  const [bookStep, setBookStep] = useState<1 | 2 | 3 | 4>(1);

  const [paymentMethod, setPaymentMethod] = useState<"PROMPTPAY" | "TRANSFER">("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [payQr, setPayQr] = useState<PayQr | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [stepErr, setStepErr] = useState<string | null>(null);

  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revPhotos, setRevPhotos] = useState<string[]>([]);
  const [revBusy, setRevBusy] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const slipCamera = useAppCameraCapture({ title: "ถ่ายสลิป" });
  const revGalleryRef = useRef<HTMLInputElement>(null);
  const revCamera = useAppCameraCapture({ title: "ถ่ายรูปรีวิว" });
  const bookContinueRef = useRef<HTMLElement | null>(null);
  const lb = useAppImageLightbox();

  const itemsTotal = useMemo(() => buildingPosCartItemsTotalBaht(cart), [cart]);
  const payDue = useMemo(() => {
    if (!info) return 0;
    return buildingPosComputePortalPayDue({
      mode: info.portalBookingPaymentMode,
      depositAmountBaht: info.depositAmountBaht,
      depositPercent: info.depositPercent,
      itemsTotalBaht: itemsTotal,
    });
  }, [info, itemsTotal]);

  useEffect(() => {
    const q = new URLSearchParams({ ownerId });
    if (t) q.set("t", t);
    setBusy(true);
    void fetch(`/api/building-pos/public/portal/info?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as PortalInfo & { error?: string };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setInfo(j);
        if (j.openTime) setVisitTimeHm(j.openTime);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, t]);

  useEffect(() => {
    if (!info || payDue <= 0 || paymentMethod !== "PROMPTPAY") {
      setPayQr(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/building-pos/public/portal/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, amountBaht: payDue, t: t ?? null }),
    })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as PayQr;
        if (!cancelled) setPayQr(j);
      })
      .catch(() => {
        if (!cancelled) setPayQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [info, payDue, paymentMethod, ownerId, t]);

  async function uploadPublicImage(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/building-pos/public/portal/upload-slip", { method: "POST", body: fd });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(j?.error ?? "อัปโหลดไม่สำเร็จ");
    }
    return j.imageUrl;
  }

  function addMenu(m: MenuItem) {
    /** พรีออเดอร์ได้เฉพาะขั้นเมนูในโฟลว์จอง — แถบเมนูแสดงผลอื่นไม่ติ๊กเข้าตะกร้า */
    if (bookStep !== 3) return;
    setCart((prev) => {
      const i = prev.findIndex((x) => x.menuItemId === m.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i]!, qty: Math.min(99, next[i]!.qty + 1) };
        return next;
      }
      return [...prev, { menuItemId: m.id, name: m.name, unitPrice: m.price, qty: 1 }];
    });
  }

  function goBookStep(next: 1 | 2 | 3 | 4) {
    setStepErr(null);
    setSubmitErr(null);
    if (next === 2) {
      if (!visitDateKey || visitDateKey < bangkokDateKey()) {
        setStepErr("เลือกวันที่ที่ถูกต้อง");
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(visitTimeHm)) {
        setStepErr("เลือกเวลา");
        return;
      }
      if (partySize < 1) {
        setStepErr("จำนวนคนอย่างน้อย 1");
        return;
      }
    }
    if (next === 3) {
      if (!customerName.trim()) {
        setStepErr("กรอกชื่อ");
        return;
      }
      if (phone.replace(/\D/g, "").length < 9) {
        setStepErr("กรอกเบอร์อย่างน้อย 9 หลัก");
        return;
      }
    }
    setBookStep(next);
    if (next >= 2) {
      requestAnimationFrame(() => {
        bookContinueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function onBook(e: FormEvent) {
    e.preventDefault();
    if (!info) return;
    setSubmitErr(null);
    if (payDue > 0 && !slipUrl) {
      setSubmitErr(buildingPosPortalSlipProofMessage(info.portalBookingPaymentMode));
      return;
    }
    setSubmitBusy(true);
    try {
      const res = await fetch("/api/building-pos/public/portal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          trialSessionId: t,
          customerName,
          phone,
          partySize,
          visitDateKey,
          visitTimeHm,
          note: note || null,
          items: cart,
          paymentMethod: payDue > 0 ? paymentMethod : undefined,
          paymentSlipUrl: slipUrl,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        reservation?: { id: string; phone: string };
        error?: string;
      };
      if (!res.ok || !j.reservation) throw new Error(j.error ?? "จองไม่สำเร็จ");
      const path = buildingPosPublicReservationUrl(
        "",
        ownerId,
        j.reservation.id,
        j.reservation.phone,
        t ?? "prod",
      );
      router.push(path);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "จองไม่สำเร็จ");
    } finally {
      setSubmitBusy(false);
    }
  }

  async function onSubmitReview(e: FormEvent) {
    e.preventDefault();
    setRevMsg(null);
    setRevBusy(true);
    try {
      const res = await fetch("/api/building-pos/public/portal/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          t,
          guestName: revName,
          rating: revRating,
          comment: revComment,
          photoUrls: revPhotos,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { review?: PortalReview; error?: string };
      if (!res.ok || !j.review) throw new Error(j.error ?? "ส่งรีวิวไม่สำเร็จ");
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
    } catch (err) {
      setRevMsg(err instanceof Error ? err.message : "ส่งรีวิวไม่สำเร็จ");
    } finally {
      setRevBusy(false);
    }
  }

  if (busy) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !info) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm font-semibold text-rose-600">
          {loadErr ?? "ไม่พบร้าน"}
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const banner = info.portalBannerUrl || SAMPLE_BANNER;
  const title = info.shopName.trim() || "ร้านอาหาร";
  const menus =
    filterCat === "all" ? info.menu_items : info.menu_items.filter((m) => m.category_id === filterCat);
  const payModeLabel =
    info.portalBookingPaymentMode === "DEPOSIT"
      ? "มัดจำ"
      : info.portalBookingPaymentMode === "FULL"
        ? "ชำระเต็มยอด"
        : null;

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {slipCamera.cameraModal}
      {revCamera.cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />

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
            <a href="#book" className={portalNavLinkClass}>
              จอง
            </a>
            <a href="#menu" className={portalNavLinkClass}>
              เมนู
            </a>
            <a href="#gallery" className={portalNavLinkClass}>
              แกลเลอรี
            </a>
            <a href="#reviews" className={portalNavLinkClass}>
              รีวิว
            </a>
            <a href="#contact" className={portalNavLinkClass}>
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
              Table booking
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
            onSubmit={(e) => {
              e.preventDefault();
              goBookStep(2);
            }}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 grid w-full gap-3 p-4 text-[#1e1b4b]",
              "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_auto] sm:items-end sm:gap-3 sm:p-5",
            )}
          >
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold text-[#4d47b6]">วันที่</span>
              <input
                type="date"
                required
                min={bangkokDateKey()}
                value={visitDateKey}
                onChange={(e) => setVisitDateKey(e.target.value)}
                className={cn(buildingPosFieldClass, "h-11 min-h-11")}
              />
            </label>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs font-bold text-[#4d47b6]">เวลา</p>
              <AppTime24Input
                value={visitTimeHm}
                onChange={setVisitTimeHm}
                selectClassName="h-11 min-h-11 rounded-2xl border border-slate-200 bg-white px-2 py-0 text-sm font-semibold text-[#1e1b4b]"
              />
            </div>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold text-[#4d47b6]">จำนวนคน</span>
              <input
                type="number"
                min={1}
                max={99}
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                className={cn(buildingPosFieldClass, "h-11 min-h-11")}
              />
            </label>
            <button
              type="submit"
              className="app-btn-primary h-11 min-h-11 self-end rounded-[1rem] px-6 text-sm font-black sm:mt-0"
            >
              จองโต๊ะ
            </button>
            {stepErr && bookStep === 1 ? (
              <p className="text-sm font-semibold text-rose-600 sm:col-span-4">{stepErr}</p>
            ) : null}
            {payModeLabel ? (
              <p className={cn("sm:col-span-4", portalMutedTextClass, "!text-[11px]")}>
                {payModeLabel}
                {info.portalBookingPaymentMode === "DEPOSIT" && info.depositAmountBaht != null
                  ? ` ${info.depositAmountBaht.toLocaleString("th-TH")} บาท`
                  : info.portalBookingPaymentMode === "DEPOSIT" && info.depositPercent != null
                    ? ` ${info.depositPercent}%`
                    : ""}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        {bookStep >= 2 ? (
          <section id="book-continue" ref={bookContinueRef} className="scroll-mt-8">
            <h2 className={portalSectionTitleClass}>จองโต๊ะ</h2>
            <p className={cn("mt-2", portalMutedTextClass)}>
              {visitDateKey} · {visitTimeHm} · {partySize} คน
              {cart.length > 0 ? ` · พรีออเดอร์ ฿${itemsTotal.toLocaleString()}` : ""}
            </p>

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="ขั้นตอนจอง"
            >
              {(
                [
                  [1, "เมื่อไหร่"],
                  [2, "ผู้จอง"],
                  [3, "เมนู"],
                  [4, "ยืนยัน"],
                ] as const
              ).map(([step, label]) => {
                const active = bookStep === step;
                return (
                  <button
                    key={step}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={active ? buildingPosChipActiveClass : buildingPosChipIdleClass}
                    onClick={() => {
                      if (step === 1) {
                        setBookStep(1);
                        setStepErr(null);
                        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                      }
                      if (step === 2) {
                        setBookStep(2);
                        setStepErr(null);
                        return;
                      }
                      if (step === 3) {
                        goBookStep(3);
                        return;
                      }
                      goBookStep(4);
                    }}
                  >
                    {step}. {label}
                  </button>
                );
              })}
            </div>

            <div className={cn(appPublicCheckInGlassCardClass, "mt-4 space-y-4 p-4 sm:p-5")}>
              {bookStep === 2 ? (
                <div className="space-y-3" role="tabpanel">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-[#4d47b6]">
                      ชื่อ
                      <input
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={cn(buildingPosFieldClass, "mt-1")}
                      />
                    </label>
                    <label className="block text-xs font-bold text-[#4d47b6]">
                      เบอร์โทร
                      <input
                        required
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(buildingPosFieldClass, "mt-1")}
                      />
                    </label>
                    <label className="block text-xs font-bold text-[#4d47b6] sm:col-span-2">
                      หมายเหตุ
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className={cn(buildingPosFieldClass, "mt-1")}
                      />
                    </label>
                  </div>
                  {stepErr ? <p className="text-sm font-semibold text-rose-600">{stepErr}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(buildingPosChipIdleClass, "min-h-[48px] px-5")}
                      onClick={() => {
                        setBookStep(1);
                        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      className="app-btn-primary min-h-[48px] rounded-[1rem] px-6 text-sm font-black"
                      onClick={() => goBookStep(3)}
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              ) : null}

              {bookStep === 3 ? (
                <div id="menu" className="space-y-3 scroll-mt-8" role="tabpanel">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามหมวดหมู่">
                    <button
                      type="button"
                      className={filterCat === "all" ? buildingPosChipActiveClass : buildingPosChipIdleClass}
                      onClick={() => setFilterCat("all")}
                      aria-pressed={filterCat === "all"}
                    >
                      ทั้งหมด
                    </button>
                    {info.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={filterCat === c.id ? buildingPosChipActiveClass : buildingPosChipIdleClass}
                        onClick={() => setFilterCat(c.id)}
                        aria-pressed={filterCat === c.id}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className={buildingPosPortalMenuGridClass}>
                    {menus.map((m) => {
                      const inCart = cart.find((x) => x.menuItemId === m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMenu(m)}
                          className={cn(
                            buildingPosPortalMenuCardClass,
                            inCart && "ring-2 ring-[#5b61ff]/45",
                          )}
                        >
                          {m.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.image_url} alt="" className="aspect-square w-full object-cover" />
                          ) : (
                            <div className="aspect-square bg-[#f4f3ff]" />
                          )}
                          <div className="p-1.5 sm:p-2">
                            <p className="line-clamp-2 text-[10px] font-black leading-snug text-[#1e1b4b] sm:text-xs">
                              {m.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold text-[#4d47b6] sm:mt-1 sm:text-xs">
                              ฿{m.price.toLocaleString()}
                              {inCart ? ` · ×${inCart.qty}` : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {cart.length > 0 ? (
                    <div className="rounded-2xl border border-[#ecebff] bg-white/70 p-3">
                      <p className="text-xs font-bold text-[#4d47b6]">
                        พรีออเดอร์ ฿{itemsTotal.toLocaleString()}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {cart.map((it) => (
                          <li
                            key={it.menuItemId}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="font-semibold text-[#1e1b4b]">
                              {it.name} × {it.qty}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-bold text-rose-600"
                              onClick={() =>
                                setCart((c) => c.filter((x) => x.menuItemId !== it.menuItemId))
                              }
                            >
                              ลบ
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className={portalMutedTextClass}>เลือกเมนูได้ (ไม่บังคับ)</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(buildingPosChipIdleClass, "min-h-[48px] px-5")}
                      onClick={() => setBookStep(2)}
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      className="app-btn-primary min-h-[48px] rounded-[1rem] px-6 text-sm font-black"
                      onClick={() => goBookStep(4)}
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              ) : null}

              {bookStep === 4 ? (
                <form className="space-y-3" role="tabpanel" onSubmit={(e) => void onBook(e)}>
                  <div className="rounded-2xl border border-[#ecebff] bg-white/70 p-3 text-sm font-semibold text-[#5f5a8a]">
                    <p className="font-black text-[#1e1b4b]">{customerName}</p>
                    <p>
                      {phone} · {visitDateKey} · {visitTimeHm} · {partySize} คน
                    </p>
                    {note ? <p className="mt-1">{note}</p> : null}
                  </div>
                  {cart.length > 0 ? (
                    <div className="rounded-2xl border border-[#ecebff] bg-white/70 p-3">
                      <p className="text-xs font-bold text-[#4d47b6]">
                        พรีออเดอร์ ฿{itemsTotal.toLocaleString()}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {cart.map((it) => (
                          <li
                            key={it.menuItemId}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="font-semibold text-[#1e1b4b]">
                              {it.name} × {it.qty}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-bold text-rose-600"
                              onClick={() =>
                                setCart((c) => c.filter((x) => x.menuItemId !== it.menuItemId))
                              }
                            >
                              ลบ
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className={portalMutedTextClass}>ไม่พรีออเดอร์เมนู</p>
                  )}

                  {payDue > 0 ? (
                    <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3">
                      <p className="text-sm font-black text-[#1e1b4b]">
                        ชำระตอนจอง ฿{payDue.toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["PROMPTPAY", "พร้อมเพย์"],
                            ["TRANSFER", "โอนเงิน"],
                          ] as const
                        ).map(([v, label]) => (
                          <button
                            key={v}
                            type="button"
                            className={
                              paymentMethod === v ? buildingPosChipActiveClass : buildingPosChipIdleClass
                            }
                            onClick={() => setPaymentMethod(v)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {paymentMethod === "PROMPTPAY" && payQr?.qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={payQr.qrDataUrl}
                          alt="QR พร้อมเพย์"
                          className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
                        />
                      ) : null}
                      {paymentMethod === "TRANSFER" ||
                      (paymentMethod === "PROMPTPAY" && !payQr?.qrDataUrl) ? (
                        <div className="text-xs font-semibold text-[#5f5a8a]">
                          {info.payment.bankName ? <p>ธนาคาร {info.payment.bankName}</p> : null}
                          {info.payment.bankAccountNumber ? (
                            <p>เลขบัญชี {info.payment.bankAccountNumber}</p>
                          ) : null}
                          {info.payment.bankAccountName ? (
                            <p>ชื่อบัญชี {info.payment.bankAccountName}</p>
                          ) : null}
                          {info.payment.promptPayPhone ? (
                            <p>พร้อมเพย์ {info.payment.promptPayPhone}</p>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="text-xs font-semibold text-amber-900">
                        {buildingPosPortalSlipProofMessage(info.portalBookingPaymentMode)}
                      </p>
                      <AppGalleryCameraFileInputs
                        galleryInputRef={slipGalleryRef}
                        cameraInputRef={slipCamera.cameraInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void uploadPublicImage(file)
                            .then(setSlipUrl)
                            .catch((err) =>
                              setSubmitErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                            );
                        }}
                      />
                      <AppImagePickCameraButtons
                        onPickGallery={() => slipGalleryRef.current?.click()}
                        onPickCamera={() =>
                          slipCamera.openCamera(async (file) => {
                            try {
                              setSlipUrl(await uploadPublicImage(file));
                            } catch (err) {
                              setSubmitErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                            }
                          })
                        }
                      />
                      {slipUrl ? (
                        <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
                      ) : null}
                    </div>
                  ) : null}

                  {submitErr ? <p className="text-sm font-semibold text-rose-600">{submitErr}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(buildingPosChipIdleClass, "min-h-[48px] px-5")}
                      onClick={() => setBookStep(3)}
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={submitBusy}
                      className="app-btn-primary min-h-[48px] rounded-[1rem] px-6 text-sm font-black disabled:opacity-60"
                    >
                      {submitBusy ? "กำลังจอง…" : "ยืนยันจอง"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        ) : null}

        {bookStep !== 3 ? (
          <section id="menu" className="scroll-mt-8">
            <h2 className={portalSectionTitleClass}>เมนู</h2>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="กรองตามหมวดหมู่">
              <button
                type="button"
                className={filterCat === "all" ? buildingPosChipActiveClass : buildingPosChipIdleClass}
                onClick={() => setFilterCat("all")}
                aria-pressed={filterCat === "all"}
              >
                ทั้งหมด
              </button>
              {info.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={filterCat === c.id ? buildingPosChipActiveClass : buildingPosChipIdleClass}
                  onClick={() => setFilterCat(c.id)}
                  aria-pressed={filterCat === c.id}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className={cn("mt-6", buildingPosPortalMenuGridClass)}>
              {menus.map((m) => (
                <div key={m.id} className={buildingPosPortalMenuCardClass}>
                  {m.image_url ? (
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => lb.open(m.image_url)}
                      aria-label={`ดูรูป ${m.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image_url} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ) : (
                    <div className="aspect-square bg-[#f4f3ff]" />
                  )}
                  <div className="p-1.5 sm:p-2">
                    <p className="line-clamp-2 text-[10px] font-black leading-snug text-[#1e1b4b] sm:text-xs">
                      {m.name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-[#4d47b6] sm:mt-1 sm:text-xs">
                      ฿{m.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {info.portalGallery.length > 0 ? (
          <section id="gallery" className="scroll-mt-8">
            <h2 className={portalSectionTitleClass}>แกลเลอรี</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {info.portalGallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => lb.open(url)}
                    className="block w-full overflow-hidden rounded-[1.25rem] border border-white/60 shadow-sm ring-1 ring-inset ring-white/60"
                    aria-label={`แกลเลอรี ${idx + 1}`}
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
          <h2 className={portalSectionTitleClass}>รีวิว</h2>
          {info.reviews.length === 0 ? (
            <p className={cn("mt-3", portalMutedTextClass)}>ยังไม่มีรีวิว</p>
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
              className={buildingPosFieldClass}
            />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={revRating === n ? buildingPosChipActiveClass : buildingPosChipIdleClass}
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
              className={cn(buildingPosFieldClass, "min-h-[88px] py-3")}
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
                  for (const file of Array.from(files).slice(0, 5 - revPhotos.length)) {
                    added.push(await uploadPublicImage(file));
                  }
                  setRevPhotos((p) => [...p, ...added].slice(0, 5));
                })().catch((err) => setRevMsg(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"));
              }}
            />
            <AppImagePickCameraButtons
              onPickGallery={() => revGalleryRef.current?.click()}
              onPickCamera={() =>
                revCamera.openCamera(async (file) => {
                  try {
                    const url = await uploadPublicImage(file);
                    setRevPhotos((p) => [...p, url].slice(0, 5));
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
          <h2 className={portalSectionTitleClass}>ติดต่อ</h2>
          <div className={cn(appPublicCheckInGlassCardClass, "mt-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5")}>
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
                เปิด {info.openTime}–{info.closeTime}
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {info.contactLine ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(info.contactLine.replace(/^@/, ""))}`}
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
      </main>
    </AppPublicCheckInGlassPage>
  );
}

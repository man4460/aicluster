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
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BARBER_PORTAL_SAMPLE_BANNER } from "@/systems/barber/lib/portal-media";
import { barberFormatWorkWeekdaysLabel } from "@/systems/barber/lib/stylist-schedule";
import { barberPublicBookingUrl } from "@/lib/barber/public-url";
import {
  barberFindFirstFreeRun,
  barberNormalizeDurationMinutes,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
  barberSlotsNeeded,
} from "@/systems/barber/lib/booking-slots";
import {
  barberPortalSlipProofMessage,
  type BarberPortalBookingPaymentMode,
} from "@/systems/barber/lib/portal-booking";

type PortalPackage = {
  id: number;
  name: string;
  priceBaht: number;
  totalSessions: number;
  imageUrl: string | null;
  durationMinutes: number;
  payDueBaht?: number | null;
};

type PortalStylist = {
  id: number;
  name: string;
  photoUrl: string | null;
  workStartTime?: string;
  workEndTime?: string;
  workWeekdays?: number[];
};

type PortalShop = {
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
  address: string | null;
  contactPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string;
  portalGallery: string[];
  hasPromptPay: boolean;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  openTime: string;
  closeTime: string;
  slotMinutes: 30 | 60;
  portalBookingPaymentMode?: BarberPortalBookingPaymentMode;
  depositAmountBaht?: number | null;
};

type AvailSlot = { startTime: string; available: boolean };

type MemberPkg = {
  subscriptionId: number;
  packageId: number;
  packageName: string;
  remainingSessions: number;
  durationMinutes: number;
  imageUrl: string | null;
};

type PortalPayQr = {
  qrDataUrl: string | null;
  configured: boolean;
  promptpayNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  shopName?: string | null;
};

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";
const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const formLabelClass = "text-xs font-bold text-[#4d47b6]";
const fieldClass =
  "mt-1 h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-3 text-sm font-semibold text-[#1e1b4b] outline-none focus:border-[#5b61ff]/50 focus:ring-2 focus:ring-[#5b61ff]/15";
const fieldActionBtnClass =
  "app-btn-soft h-12 w-full rounded-2xl px-4 text-sm font-bold disabled:opacity-60";

function runIsFree(
  slots: AvailSlot[],
  startIndex: number,
  need: number,
): string[] | null {
  if (need < 1 || startIndex < 0 || startIndex + need > slots.length) return null;
  const run: string[] = [];
  for (let i = 0; i < need; i++) {
    const s = slots[startIndex + i];
    if (!s?.available) return null;
    run.push(s.startTime);
  }
  return run;
}

export function BarberBookingPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const router = useRouter();
  const [shop, setShop] = useState<PortalShop | null>(null);
  const [packages, setPackages] = useState<PortalPackage[]>([]);
  const [stylists, setStylists] = useState<PortalStylist[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [resolvedTrial, setResolvedTrial] = useState(trialSessionId ?? "");

  const [bookDate, setBookDate] = useState(() => bangkokDateKey());
  const [stylistId, setStylistId] = useState<number | null>(null);
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);
  const [availBusy, setAvailBusy] = useState(false);
  const [stylistDayOff, setStylistDayOff] = useState(false);
  const [availErr, setAvailErr] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bookName, setBookName] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [memberPkgs, setMemberPkgs] = useState<MemberPkg[]>([]);
  const [memberFound, setMemberFound] = useState<boolean | null>(null);
  const [memberBusy, setMemberBusy] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [bookOk, setBookOk] = useState<string | null>(null);

  const [buyPkg, setBuyPkg] = useState<PortalPackage | null>(null);
  const [buyName, setBuyName] = useState("");
  const [buyPhone, setBuyPhone] = useState("");
  const [buyMethod, setBuyMethod] = useState<"PROMPTPAY" | "TRANSFER">("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState("");
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyErr, setBuyErr] = useState<string | null>(null);
  const [buyOk, setBuyOk] = useState<string | null>(null);
  const [payQr, setPayQr] = useState<PortalPayQr | null>(null);
  const [payQrBusy, setPayQrBusy] = useState(false);

  const [bookPayMethod, setBookPayMethod] = useState<"PROMPTPAY" | "TRANSFER">("PROMPTPAY");
  const [bookSlipUrl, setBookSlipUrl] = useState("");
  const [bookPayQr, setBookPayQr] = useState<PortalPayQr | null>(null);
  const [bookPayQrBusy, setBookPayQrBusy] = useState(false);

  const slipGalleryRef = useRef<HTMLInputElement>(null);
  const bookSlipGalleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();

  const slotMinutes = shop ? barberNormalizeSlotMinutes(shop.slotMinutes) : 30;
  const slotsNeeded = barberSlotsNeeded(durationMinutes, slotMinutes);

  const memberPackageSelected =
    selectedPackageId != null && memberPkgs.some((m) => m.packageId === selectedPackageId);
  const selectedPkg = packages.find((p) => p.id === selectedPackageId) ?? null;
  const bookPayDue =
    memberPackageSelected || !selectedPkg ? null : (selectedPkg.payDueBaht ?? null);
  const bookPayMode = shop?.portalBookingPaymentMode ?? "NONE";

  const qBase = useMemo(() => {
    const q = new URLSearchParams({ ownerId });
    if (trialSessionId) q.set("t", trialSessionId);
    return q;
  }, [ownerId, trialSessionId]);

  useEffect(() => {
    void fetch(`/api/barber/public/portal/info?${qBase}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        }
        const j = (await res.json()) as {
          shop: PortalShop;
          packages: PortalPackage[];
          stylists?: PortalStylist[];
          trialSessionId?: string;
        };
        setShop({
          ...j.shop,
          openTime: j.shop.openTime ?? "09:00",
          closeTime: j.shop.closeTime ?? "20:00",
          slotMinutes: barberNormalizeSlotMinutes(j.shop.slotMinutes ?? 30),
        });
        setPackages(
          (j.packages ?? []).map((p) => ({
            ...p,
            durationMinutes: barberNormalizeDurationMinutes(p.durationMinutes ?? 30, 30),
          })),
        );
        const st = j.stylists ?? [];
        setStylists(st);
        if (st.length === 1) setStylistId(st[0]!.id);
        setDurationMinutes(barberNormalizeSlotMinutes(j.shop.slotMinutes ?? 30));
        if (j.trialSessionId) setResolvedTrial(j.trialSessionId);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [qBase]);

  useEffect(() => {
    if (!shop) return;
    const needStylist = stylists.length > 0;
    if (needStylist && stylistId == null) {
      setAvailSlots([]);
      setSelectedSlots([]);
      setStylistDayOff(false);
      return;
    }
    let cancelled = false;
    setAvailBusy(true);
    setAvailErr(null);
    const q = new URLSearchParams({
      ownerId,
      date: bookDate,
    });
    if (resolvedTrial || trialSessionId) q.set("t", resolvedTrial || trialSessionId!);
    if (stylistId != null) q.set("stylistId", String(stylistId));
    void fetch(`/api/barber/public/portal/availability?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          slots?: AvailSlot[];
          stylistDayOff?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) throw new Error(j.error ?? "โหลดสล็อตไม่สำเร็จ");
        setStylistDayOff(Boolean(j.stylistDayOff));
        setAvailSlots(j.slots ?? []);
        setSelectedSlots([]);
      })
      .catch((e) => {
        if (!cancelled) {
          setAvailErr(e instanceof Error ? e.message : "โหลดสล็อตไม่สำเร็จ");
          setAvailSlots([]);
          setSelectedSlots([]);
          setStylistDayOff(false);
        }
      })
      .finally(() => {
        if (!cancelled) setAvailBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shop, bookDate, stylistId, stylists.length, ownerId, resolvedTrial, trialSessionId]);

  useEffect(() => {
    if (!buyPkg || buyMethod !== "PROMPTPAY") {
      setPayQr(null);
      return;
    }
    let cancelled = false;
    setPayQrBusy(true);
    void (async () => {
      try {
        const res = await fetch("/api/barber/public/portal/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            amountBaht: buyPkg.priceBaht,
            t: resolvedTrial || trialSessionId || undefined,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as Partial<PortalPayQr> & {
          error?: string;
          promptPayPhone?: string | null;
          bankAccountNumber?: string | null;
          bankAccountName?: string | null;
        };
        if (cancelled) return;
        if (!res.ok) {
          setPayQr(null);
          return;
        }
        setPayQr({
          qrDataUrl: j.qrDataUrl ?? null,
          configured: Boolean(j.configured),
          promptpayNumber: j.promptpayNumber ?? j.promptPayPhone ?? null,
          bankName: j.bankName ?? null,
          accountNumber: j.accountNumber ?? j.bankAccountNumber ?? null,
          accountName: j.accountName ?? j.bankAccountName ?? null,
          shopName: j.shopName ?? null,
        });
      } catch {
        if (!cancelled) setPayQr(null);
      } finally {
        if (!cancelled) setPayQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buyPkg, buyMethod, ownerId, resolvedTrial, trialSessionId]);

  useEffect(() => {
    if (bookPayDue == null || bookPayDue <= 0 || bookPayMethod !== "PROMPTPAY") {
      setBookPayQr(null);
      return;
    }
    let cancelled = false;
    setBookPayQrBusy(true);
    void (async () => {
      try {
        const res = await fetch("/api/barber/public/portal/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            amountBaht: bookPayDue,
            t: resolvedTrial || trialSessionId || undefined,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as Partial<PortalPayQr> & {
          error?: string;
          promptPayPhone?: string | null;
          bankAccountNumber?: string | null;
          bankAccountName?: string | null;
        };
        if (cancelled) return;
        if (!res.ok) {
          setBookPayQr(null);
          return;
        }
        setBookPayQr({
          qrDataUrl: j.qrDataUrl ?? null,
          configured: Boolean(j.configured),
          promptpayNumber: j.promptpayNumber ?? j.promptPayPhone ?? null,
          bankName: j.bankName ?? null,
          accountNumber: j.accountNumber ?? j.bankAccountNumber ?? null,
          accountName: j.accountName ?? j.bankAccountName ?? null,
          shopName: j.shopName ?? null,
        });
      } catch {
        if (!cancelled) setBookPayQr(null);
      } finally {
        if (!cancelled) setBookPayQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookPayDue, bookPayMethod, ownerId, resolvedTrial, trialSessionId]);

  function applyDurationAndAutoSelect(nextDuration: number) {
    const dur = barberNormalizeDurationMinutes(nextDuration, slotMinutes);
    setDurationMinutes(dur);
    const need = barberSlotsNeeded(dur, slotMinutes);
    const times = availSlots.map((s) => s.startTime);
    const busy: Array<{ startMin: number; endMin: number }> = [];
    for (const s of availSlots) {
      if (s.available) continue;
      const sm = barberParseHmToMinutes(s.startTime);
      if (sm == null) continue;
      busy.push({ startMin: sm, endMin: sm + slotMinutes });
    }
    const run = barberFindFirstFreeRun(times, busy, need, slotMinutes);
    setSelectedSlots(run ?? []);
  }

  async function lookupMember() {
    setMemberBusy(true);
    setBookErr(null);
    setMemberFound(null);
    setMemberPkgs([]);
    try {
      const phone = bookPhone.replace(/\D/g, "");
      if (phone.length < 9) throw new Error("กรอกเบอร์อย่างน้อย 9 หลัก");
      const res = await fetch("/api/barber/public/portal/member-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          phone,
          t: resolvedTrial || trialSessionId || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        found?: boolean;
        customerName?: string | null;
        packages?: MemberPkg[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "ค้นหาไม่สำเร็จ");
      setMemberFound(Boolean(j.found));
      if (j.found) {
        if (j.customerName) setBookName(j.customerName);
        setMemberPkgs(j.packages ?? []);
      } else {
        setMemberPkgs([]);
      }
    } catch (e) {
      setBookErr(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setMemberBusy(false);
    }
  }

  function selectMemberPackage(pkg: MemberPkg) {
    setSelectedPackageId(pkg.packageId);
    applyDurationAndAutoSelect(pkg.durationMinutes);
  }

  function onClickSlot(startTime: string) {
    const idx = availSlots.findIndex((s) => s.startTime === startTime);
    if (idx < 0) return;
    const slot = availSlots[idx];
    if (!slot?.available) return;
    const need = slotsNeeded;
    const run = runIsFree(availSlots, idx, need);
    if (!run) {
      setBookErr(`ต้องว่างติดกัน ${need} สล็อต`);
      return;
    }
    setBookErr(null);
    setSelectedSlots(run);
  }

  async function submitBook(e: FormEvent) {
    e.preventDefault();
    setBookBusy(true);
    setBookErr(null);
    setBookOk(null);
    try {
      const phone = bookPhone.replace(/\D/g, "");
      if (phone.length < 9) throw new Error("กรอกเบอร์อย่างน้อย 9 หลัก");
      if (stylists.length > 0 && stylistId == null) throw new Error("กรุณาเลือกช่าง");
      if (selectedPackageId == null) throw new Error("เลือกบริการก่อน");
      if (selectedSlots.length < 1) throw new Error("เลือกสล็อตเวลา");
      if (bookPayDue != null && bookPayDue > 0 && !bookSlipUrl.trim()) {
        throw new Error(barberPortalSlipProofMessage(bookPayMode));
      }
      const startTime = selectedSlots[0]!;
      const scheduledLocal = `${bookDate}T${startTime}`;
      const res = await fetch("/api/barber/public/portal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          t: resolvedTrial || trialSessionId || undefined,
          phone,
          customerName: bookName.trim() || undefined,
          stylistId: stylistId ?? undefined,
          packageId: selectedPackageId ?? undefined,
          scheduledLocal,
          durationMinutes,
          useMemberPackage: memberPackageSelected || undefined,
          ...(bookPayDue != null && bookPayDue > 0
            ? {
                paymentMethod: bookPayMethod,
                paymentSlipUrl: bookSlipUrl.trim(),
                amountPaidBaht: bookPayDue,
              }
            : {}),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        booking?: { id?: number };
      };
      if (!res.ok) throw new Error(j.error ?? "จองไม่สำเร็จ");
      const bookingId = Number(j.booking?.id);
      if (!Number.isFinite(bookingId) || bookingId < 1) {
        throw new Error("จองสำเร็จแต่ไม่พบรหัสการจอง");
      }
      const trial = resolvedTrial || trialSessionId || "prod";
      router.push(barberPublicBookingUrl("", ownerId, bookingId, phone, trial));
    } catch (err) {
      setBookErr(err instanceof Error ? err.message : "จองไม่สำเร็จ");
    } finally {
      setBookBusy(false);
    }
  }

  async function uploadSlip(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/barber/public/portal/upload-slip", { method: "POST", body: fd });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
    setSlipUrl(j.imageUrl);
  }

  async function uploadBookSlip(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/barber/public/portal/upload-slip", { method: "POST", body: fd });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
    setBookSlipUrl(j.imageUrl);
  }

  async function submitBuy(e: FormEvent) {
    e.preventDefault();
    if (!buyPkg) return;
    setBuyBusy(true);
    setBuyErr(null);
    setBuyOk(null);
    try {
      const phone = buyPhone.replace(/\D/g, "");
      if (phone.length < 9) throw new Error("กรอกเบอร์อย่างน้อย 9 หลัก");
      if (!slipUrl) {
        throw new Error("กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง");
      }
      const res = await fetch("/api/barber/public/portal/purchase-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          t: resolvedTrial || trialSessionId || undefined,
          phone,
          customerName: buyName.trim() || undefined,
          packageId: buyPkg.id,
          paymentMethod: buyMethod,
          receiptImageUrl: slipUrl,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(j.error ?? "ซื้อแพ็กไม่สำเร็จ");
      setBuyOk("ส่งคำขอซื้อแพ็กแล้ว");
      setBuyPkg(null);
      setBuyName("");
      setBuyPhone("");
      setSlipUrl("");
    } catch (err) {
      setBuyErr(err instanceof Error ? err.message : "ซื้อแพ็กไม่สำเร็จ");
    } finally {
      setBuyBusy(false);
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

  if (!shop) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const banner = shop.portalBannerUrl || BARBER_PORTAL_SAMPLE_BANNER;
  const title = shop.displayName.trim() || "ร้านตัดผม";
  const gallery = shop.portalGallery?.length ? shop.portalGallery : [];
  const selectedSet = new Set(selectedSlots);
  const singleVisitPackages = packages.filter((p) => p.totalSessions === 1);
  const multiSessionPackages = packages.filter((p) => p.totalSessions > 1);
  const serviceSelected = selectedPackageId != null;

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
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
              จองคิว
            </a>
            <a href="#packages" className={navLinkClass}>
              แพ็กเกจ
            </a>
            <a href="#gallery" className={navLinkClass}>
              แกลเลอรี
            </a>
            <a href="#contact" className={navLinkClass}>
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[56vh] overflow-hidden sm:min-h-[64vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/20 via-transparent to-[#faf9ff]/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/45 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[64vh] sm:px-6 sm:pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">
              Barber shop
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl">
              {title}
            </h1>
            {shop.tagline ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {shop.tagline}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-6 sm:space-y-14 sm:px-6">
        <section id="book" className="scroll-mt-16">
          <h2 className={sectionTitleClass}>จองคิว</h2>
          <form
            onSubmit={(e) => void submitBook(e)}
            className={cn(appPublicCheckInGlassCardClass, "mt-4 grid gap-3 p-4 sm:p-5")}
          >
            <label className="block sm:max-w-xs">
              <span className={formLabelClass}>วันที่</span>
              <input
                type="date"
                required
                value={bookDate}
                min={bangkokDateKey()}
                onChange={(e) => setBookDate(e.target.value)}
                className={fieldClass}
              />
            </label>

            {stylists.length > 0 ? (
              <div className="space-y-2">
                <p className={formLabelClass}>ช่าง</p>
                <div className="flex flex-wrap gap-2" role="listbox" aria-label="เลือกช่าง">
                  {stylists.map((s) => {
                    const active = stylistId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => setStylistId(s.id)}
                        className={cn(
                          "inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition",
                          active
                            ? "border-[#5b61ff] bg-[#5b61ff] text-white"
                            : "border-white/70 bg-white/80 text-[#4d47b6]",
                        )}
                      >
                        {s.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.photoUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/80"
                          />
                        ) : (
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
                              active ? "bg-white/20" : "bg-[#ecebff]",
                            )}
                          >
                            {s.name.trim().charAt(0) || "S"}
                          </span>
                        )}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const selected = stylists.find((s) => s.id === stylistId);
                  if (!selected?.workStartTime || !selected.workEndTime) return null;
                  return (
                    <p className="text-[11px] font-semibold leading-relaxed text-[#66638c]">
                      รับคิว {selected.workStartTime}–{selected.workEndTime}
                      <span className="mx-1 text-[#c4c0e0]" aria-hidden>
                        ·
                      </span>
                      {barberFormatWorkWeekdaysLabel(selected.workWeekdays ?? [0, 1, 2, 3, 4, 5, 6])}
                    </p>
                  );
                })()}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className={formLabelClass}>เลือกบริการรายครั้ง</p>
              {singleVisitPackages.length === 0 ? (
                <p className="text-xs font-semibold text-[#66638c]">ยังไม่มีเมนูรายครั้ง</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {singleVisitPackages.map((pkg) => {
                    const active = selectedPackageId === pkg.id && !memberPackageSelected;
                    return (
                      <li key={pkg.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackageId(pkg.id);
                            applyDurationAndAutoSelect(pkg.durationMinutes);
                          }}
                          className={cn(
                            "flex h-full w-full flex-col overflow-hidden rounded-xl border text-left transition",
                            active
                              ? "border-[#5b61ff] bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/35"
                              : "border-white/70 bg-white/80 hover:border-[#5b61ff]/40",
                          )}
                        >
                          {pkg.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pkg.imageUrl}
                              alt=""
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#ecebff] to-white text-[10px] font-bold text-[#4d47b6]">
                              บริการ
                            </div>
                          )}
                          <div className="space-y-0.5 p-1.5">
                            <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b]">
                              {pkg.name}
                            </p>
                            <p className="text-[9px] font-semibold tabular-nums text-[#66638c]">
                              {pkg.durationMinutes} นาที
                            </p>
                            <p className="text-[10px] font-black tabular-nums text-[#4d47b6]">
                              ฿{pkg.priceBaht.toLocaleString("th-TH")}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
              <label className="block">
                <span className={formLabelClass}>เบอร์โทร</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={bookPhone}
                  onChange={(e) => setBookPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  className={fieldClass}
                  autoComplete="tel"
                />
              </label>
              <div className="flex flex-col justify-end">
                <span className={cn(formLabelClass, "invisible max-sm:hidden")} aria-hidden>
                  ค้นหา
                </span>
                <button
                  type="button"
                  disabled={memberBusy}
                  onClick={() => void lookupMember()}
                  className={cn(fieldActionBtnClass, "mt-1")}
                >
                  {memberBusy ? "กำลังค้นหา…" : "ค้นหาสมาชิก"}
                </button>
              </div>
            </div>

            {memberFound === true && memberPkgs.length > 0 ? (
              <div className="space-y-2">
                <p className={formLabelClass}>แพ็กเกจของคุณ (ใช้แทนเมนูรายครั้งได้)</p>
                <div className="flex flex-wrap gap-2">
                  {memberPkgs.map((mp) => {
                    const active = selectedPackageId === mp.packageId && memberPackageSelected;
                    return (
                      <button
                        key={mp.subscriptionId}
                        type="button"
                        onClick={() => selectMemberPackage(mp)}
                        className={cn(
                          "inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-bold",
                          active
                            ? "bg-[#5b61ff] text-white"
                            : "border border-white/70 bg-white/80 text-[#4d47b6]",
                        )}
                      >
                        {mp.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mp.imageUrl} alt="" className="h-6 w-6 rounded-md object-cover" />
                        ) : null}
                        {mp.packageName} · เหลือ {mp.remainingSessions} · {mp.durationMinutes} นาที
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {memberFound === true && memberPkgs.length === 0 ? (
              <p className="text-xs font-semibold text-[#66638c]">ไม่พบแพ็กที่เหลือใช้ — เลือกเมนูรายครั้งด้านบน</p>
            ) : null}
            {memberFound === false ? (
              <p className="text-xs font-semibold text-[#66638c]">ไม่พบสมาชิก — เลือกเมนูรายครั้งแล้วจองได้</p>
            ) : null}

            <div className="space-y-2">
              <p className={formLabelClass}>
                เวลา · ต้องการ {slotsNeeded} สล็อต
                {selectedSlots.length > 0
                  ? ` · เลือก ${selectedSlots[0]}${selectedSlots.length > 1 ? `–${selectedSlots[selectedSlots.length - 1]}` : ""}`
                  : ""}
              </p>
              {!serviceSelected ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs font-semibold text-amber-900">
                  เลือกบริการรายครั้ง (หรือแพ็กสมาชิก) ก่อน จึงเลือกช่วงเวลาได้
                </p>
              ) : availBusy ? (
                <p className="text-xs font-semibold text-[#66638c]">กำลังโหลดสล็อต…</p>
              ) : availErr ? (
                <p className="text-sm font-semibold text-rose-600">{availErr}</p>
              ) : stylists.length > 0 && stylistId == null ? (
                <p className="text-xs font-semibold text-[#66638c]">เลือกช่างก่อน</p>
              ) : stylistDayOff ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs font-semibold text-amber-900">
                  ช่างไม่รับบริการวันนี้ — เลือกวันอื่นหรือช่างอื่น
                </p>
              ) : availSlots.length === 0 ? (
                <p className="text-xs font-semibold text-[#66638c]">ไม่มีสล็อตในวันนี้</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {availSlots.map((s, idx) => {
                    const selected = selectedSet.has(s.startTime);
                    const canStart = runIsFree(availSlots, idx, slotsNeeded) != null;
                    const disabled = !s.available || !canStart;
                    return (
                      <button
                        key={s.startTime}
                        type="button"
                        disabled={disabled}
                        onClick={() => onClickSlot(s.startTime)}
                        className={cn(
                          "min-h-[44px] rounded-xl text-sm font-bold tabular-nums transition",
                          disabled && "cursor-not-allowed bg-slate-100 text-slate-400 line-through",
                          !disabled &&
                            !selected &&
                            "border border-white/70 bg-white/85 text-[#4d47b6] hover:border-[#5b61ff]/40",
                          selected && "bg-[#5b61ff] text-white shadow-md",
                        )}
                      >
                        {s.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="block sm:max-w-md">
              <span className={formLabelClass}>ชื่อ</span>
              <input
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className={fieldClass}
                autoComplete="name"
              />
            </label>

            {bookPayDue != null && bookPayDue > 0 ? (
              <div className="space-y-3 rounded-2xl border border-[#5b61ff]/25 bg-[#5b61ff]/5 p-4 sm:max-w-lg">
                <p className="text-sm font-black text-[#1e1b4b]">
                  {bookPayMode === "FULL" ? "ชำระเต็มยอด" : "มัดจำ"} ฿
                  {bookPayDue.toLocaleString("th-TH")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBookPayMethod("PROMPTPAY")}
                    className={cn(
                      "min-h-10 rounded-xl px-3 text-xs font-bold",
                      bookPayMethod === "PROMPTPAY"
                        ? "bg-[#5b61ff] text-white"
                        : "bg-white text-[#4d47b6]",
                    )}
                  >
                    พร้อมเพย์
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookPayMethod("TRANSFER")}
                    className={cn(
                      "min-h-10 rounded-xl px-3 text-xs font-bold",
                      bookPayMethod === "TRANSFER"
                        ? "bg-[#5b61ff] text-white"
                        : "bg-white text-[#4d47b6]",
                    )}
                  >
                    โอนเงิน
                  </button>
                </div>
                {bookPayMethod === "PROMPTPAY" ? (
                  <div className="space-y-2">
                    {bookPayQrBusy ? (
                      <p className="text-xs font-semibold text-[#66638c]">กำลังสร้าง QR…</p>
                    ) : bookPayQr?.qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bookPayQr.qrDataUrl}
                        alt="QR พร้อมเพย์"
                        className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-amber-800">
                        ยังไม่มี QR พร้อมเพย์ — ใช้โอนเงินแทนได้
                      </p>
                    )}
                    {bookPayQr?.promptpayNumber ? (
                      <p className="text-center text-xs font-semibold text-[#5f5a8a]">
                        {bookPayQr.promptpayNumber}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1 text-xs font-semibold text-[#5f5a8a]">
                    {shop?.bankName ? <p>ธนาคาร {shop.bankName}</p> : null}
                    {shop?.bankAccountNumber ? <p>เลขบัญชี {shop.bankAccountNumber}</p> : null}
                    {shop?.bankAccountName ? <p>ชื่อบัญชี {shop.bankAccountName}</p> : null}
                  </div>
                )}
                <AppGalleryCameraFileInputs
                  galleryInputRef={bookSlipGalleryRef}
                  cameraInputRef={cameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file)
                      void uploadBookSlip(file).catch((err) =>
                        setBookErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                      );
                  }}
                />
                <AppImagePickCameraButtons
                  onPickGallery={() => bookSlipGalleryRef.current?.click()}
                  onPickCamera={() =>
                    openCamera((file) => {
                      void uploadBookSlip(file).catch((err) =>
                        setBookErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                      );
                    })
                  }
                />
                {bookSlipUrl ? (
                  <AppImageThumb src={bookSlipUrl} alt="สลิปจอง" onOpen={() => lb.open(bookSlipUrl)} />
                ) : (
                  <p className="text-xs font-semibold text-amber-800">
                    {barberPortalSlipProofMessage(bookPayMode)}
                  </p>
                )}
              </div>
            ) : null}

            {bookErr ? <p className="text-sm font-semibold text-rose-600">{bookErr}</p> : null}
            {bookOk ? <p className="text-sm font-semibold text-emerald-700">{bookOk}</p> : null}
            <button
              type="submit"
              disabled={bookBusy || !serviceSelected || selectedSlots.length < 1}
              className="app-btn-primary min-h-[52px] rounded-2xl px-6 text-sm font-black disabled:opacity-60"
            >
              {bookBusy ? "กำลังจอง…" : "จองคิว"}
            </button>
          </form>
        </section>

        <section id="packages" className="scroll-mt-16 space-y-8">
          <div>
            <h2 className={sectionTitleClass}>เมนูรายครั้ง</h2>
            {singleVisitPackages.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-[#66638c]">ยังไม่มีเมนูรายครั้ง</p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-2.5">
                {singleVisitPackages.map((pkg) => (
                  <li
                    key={pkg.id}
                    className="overflow-hidden rounded-xl border border-white/60 bg-white/75 shadow-sm backdrop-blur-xl"
                  >
                    {pkg.imageUrl ? (
                      <AppImageThumb
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        onOpen={() => lb.open(pkg.imageUrl!)}
                        className="aspect-square h-auto w-full rounded-none ring-0"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#ecebff] to-white text-[10px] font-bold text-[#4d47b6]">
                        บริการ
                      </div>
                    )}
                    <div className="space-y-1 p-1.5 sm:p-2">
                      <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:text-[11px]">
                        {pkg.name}
                      </p>
                      <p className="text-[9px] font-semibold tabular-nums text-[#66638c] sm:text-[10px]">
                        1 ครั้ง · {pkg.durationMinutes} นาที
                      </p>
                      <p className="text-[10px] font-black tabular-nums text-[#4d47b6] sm:text-[11px]">
                        ฿{pkg.priceBaht.toLocaleString("th-TH")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBuyPkg(pkg);
                          setBuyErr(null);
                          setBuyOk(null);
                          setSlipUrl("");
                          setBuyMethod("PROMPTPAY");
                        }}
                        className="app-btn-primary min-h-8 w-full rounded-lg px-1 text-[10px] font-black sm:min-h-9 sm:text-[11px]"
                      >
                        ซื้อ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className={sectionTitleClass}>แพ็กเกจ</h2>
            {buyOk ? <p className="mt-2 text-sm font-semibold text-emerald-700">{buyOk}</p> : null}
            {multiSessionPackages.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-[#66638c]">ยังไม่มีแพ็กเกจหลายครั้ง</p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-2.5">
                {multiSessionPackages.map((pkg) => (
                  <li
                    key={pkg.id}
                    className="overflow-hidden rounded-xl border border-white/60 bg-white/75 shadow-sm backdrop-blur-xl"
                  >
                    {pkg.imageUrl ? (
                      <AppImageThumb
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        onOpen={() => lb.open(pkg.imageUrl!)}
                        className="aspect-square h-auto w-full rounded-none ring-0"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#ecebff] to-white text-[10px] font-bold text-[#4d47b6]">
                        แพ็ก
                      </div>
                    )}
                    <div className="space-y-1 p-1.5 sm:p-2">
                      <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:text-[11px]">
                        {pkg.name}
                      </p>
                      <p className="text-[9px] font-semibold tabular-nums text-[#66638c] sm:text-[10px]">
                        {pkg.totalSessions} ครั้ง · {pkg.durationMinutes} นาที
                      </p>
                      <p className="text-[10px] font-black tabular-nums text-[#4d47b6] sm:text-[11px]">
                        ฿{pkg.priceBaht.toLocaleString("th-TH")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBuyPkg(pkg);
                          setBuyErr(null);
                          setBuyOk(null);
                          setSlipUrl("");
                          setBuyMethod("PROMPTPAY");
                        }}
                        className="app-btn-primary min-h-8 w-full rounded-lg px-1 text-[10px] font-black sm:min-h-9 sm:text-[11px]"
                      >
                        ซื้อ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section id="gallery" className="scroll-mt-16">
          <h2 className={sectionTitleClass}>แกลเลอรี</h2>
          {gallery.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-[#66638c]">ยังไม่มีรูป</p>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <AppImageThumb
                    src={url}
                    alt={`ภาพร้าน ${idx + 1}`}
                    onOpen={() => lb.openGallery(gallery, idx)}
                    className="h-36 w-full sm:h-40"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="contact" className="scroll-mt-16">
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className={cn(appPublicCheckInGlassCardClass, "mt-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5")}>
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{title}</p>
              {shop.address ? <p>{shop.address}</p> : null}
              {shop.contactPhone ? (
                <p>
                  <a
                    className="font-bold text-[#4d47b6] hover:underline"
                    href={`tel:${shop.contactPhone.replace(/\D/g, "")}`}
                  >
                    {shop.contactPhone}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {shop.contactPhone ? (
                <a
                  href={`tel:${shop.contactPhone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  โทร
                </a>
              ) : null}
              {shop.contactLine ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(shop.contactLine.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M19.37 6.55A8.66 8.66 0 0 0 12.05 3C7.14 3 3.17 6.3 3.17 10.36c0 3.6 3.2 6.62 7.52 7.18.29.06.69.2.79.45.09.23.06.59.03.82l-.13.8c-.04.24-.18 1.04 1.02.56 1.2-.48 6.48-3.82 8.85-6.54 1.66-1.78 1.76-3.26 1.76-3.63 0-4.06-3.97-7.36-8.88-7.36v.01Zm-2.2 9.3h-1.45c-.18 0-.33-.14-.33-.32V11.1c0-.18.15-.32.33-.32h1.45c.18 0 .33.14.33.32v4.43c0 .18-.15.32-.33.32Zm-2.74 0h-1.45a.33.33 0 0 1-.33-.32v-2.94l-1.73 2.9a.33.33 0 0 1-.28.16h-.02a.33.33 0 0 1-.3-.17l-1.7-2.9v2.95c0 .18-.15.32-.33.32H6.7a.33.33 0 0 1-.33-.32V11.1c0-.14.09-.27.22-.31a.33.33 0 0 1 .35.1l2.1 3.5 2.08-3.5a.33.33 0 0 1 .35-.1c.13.04.22.17.22.31v4.43c0 .18-.15.32-.33.32Zm5.8 0h-1.45a.33.33 0 0 1-.33-.32V11.1c0-.18.15-.32.33-.32h1.45c.18 0 .33.14.33.32v4.43c0 .18-.15.32-.33.32Z" />
                  </svg>
                  LINE
                </a>
              ) : null}
              {shop.facebookUrl ? (
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M14 8h2.5V5.1A29 29 0 0 0 12.9 5C10.1 5 8.2 6.7 8.2 9.8V12H5.8v3.2h2.4V22h3.2v-6.8h2.6L14.5 12h-3.1V9.9c0-.9.25-1.5 1.6-1.5V8z" />
                  </svg>
                  Facebook
                </a>
              ) : null}
              {shop.mapUrl ? (
                <a
                  href={shop.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  แผนที่
                </a>
              ) : null}
              {!shop.contactPhone && !shop.contactLine && !shop.facebookUrl && !shop.mapUrl && !shop.address ? (
                <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีข้อมูลติดต่อ</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      {buyPkg ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1e1b4b]/40 p-3 sm:items-center">
          <div
            role="dialog"
            aria-modal
            aria-labelledby="barber-buy-title"
            className={cn(
              appPublicCheckInGlassCardClass,
              "max-h-[90dvh] w-full max-w-md overflow-y-auto p-4 sm:p-5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="barber-buy-title" className="text-lg font-black text-[#1e1b4b]">
                  {buyPkg.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#66638c]">
                  {buyPkg.totalSessions} ครั้ง · {buyPkg.durationMinutes} นาที · ฿
                  {buyPkg.priceBaht.toLocaleString("th-TH")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuyPkg(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-[#4d47b6]"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void submitBuy(e)} className="mt-4 space-y-3">
              <label className="block">
                <span className={formLabelClass}>ชื่อ</span>
                <input
                  value={buyName}
                  onChange={(e) => setBuyName(e.target.value)}
                  className={fieldClass}
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className={formLabelClass}>เบอร์โทร</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={buyPhone}
                  onChange={(e) => setBuyPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  className={fieldClass}
                  autoComplete="tel"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBuyMethod("PROMPTPAY")}
                  className={cn(
                    "min-h-[40px] rounded-xl px-3 text-xs font-bold",
                    buyMethod === "PROMPTPAY"
                      ? "bg-[#5b61ff] text-white"
                      : "border border-white/70 bg-white/80 text-[#4d47b6]",
                  )}
                >
                  พร้อมเพย์
                </button>
                <button
                  type="button"
                  onClick={() => setBuyMethod("TRANSFER")}
                  className={cn(
                    "min-h-[40px] rounded-xl px-3 text-xs font-bold",
                    buyMethod === "TRANSFER"
                      ? "bg-[#5b61ff] text-white"
                      : "border border-white/70 bg-white/80 text-[#4d47b6]",
                  )}
                >
                  โอนเงิน
                </button>
              </div>

              {buyMethod === "PROMPTPAY" ? (
                <div className="rounded-2xl border border-white/60 bg-white/50 p-3">
                  {payQrBusy ? (
                    <p className="text-xs font-semibold text-[#66638c]">กำลังโหลด QR…</p>
                  ) : payQr?.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={payQr.qrDataUrl}
                      alt="QR พร้อมเพย์"
                      className="mx-auto h-48 w-48 rounded-xl bg-white object-contain"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-amber-800">ยังไม่ได้ตั้งพร้อมเพย์</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/60 bg-white/50 p-3 text-xs font-semibold text-[#1e1b4b]">
                  {shop.bankName || payQr?.bankName ? (
                    <p>ธนาคาร {shop.bankName || payQr?.bankName}</p>
                  ) : null}
                  {shop.bankAccountNumber || payQr?.accountNumber ? (
                    <p className="mt-1 tabular-nums">
                      {shop.bankAccountNumber || payQr?.accountNumber}
                    </p>
                  ) : null}
                  {shop.bankAccountName || payQr?.accountName ? (
                    <p className="mt-1">{shop.bankAccountName || payQr?.accountName}</p>
                  ) : (
                    <p className="text-amber-800">ยังไม่มีบัญชีโอน</p>
                  )}
                </div>
              )}

              <p className="text-[11px] font-semibold text-[#66638c]">
                กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง
              </p>
              <AppGalleryCameraFileInputs
                galleryInputRef={slipGalleryRef}
                cameraInputRef={cameraInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void uploadSlip(file).catch((err) =>
                    setBuyErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"),
                  );
                }}
              />
              <AppImagePickCameraButtons
                onPickGallery={() => slipGalleryRef.current?.click()}
                onPickCamera={() =>
                  openCamera(async (file) => {
                    try {
                      await uploadSlip(file);
                    } catch (err) {
                      setBuyErr(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                    }
                  })
                }
                disabled={buyBusy}
                labels={{ gallery: "เลือกสลิป", camera: "ถ่ายสลิป" }}
              />
              {cameraModal}
              {slipUrl ? (
                <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
              ) : null}

              {buyErr ? <p className="text-sm font-semibold text-rose-600">{buyErr}</p> : null}

              <button
                type="submit"
                disabled={buyBusy}
                className="app-btn-primary min-h-[52px] w-full rounded-2xl text-sm font-black disabled:opacity-60"
              >
                {buyBusy ? "กำลังส่ง…" : "ยืนยันซื้อแพ็ก"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปพอร์ทัล"
      />
    </AppPublicCheckInGlassPage>
  );
}

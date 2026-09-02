"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryPickupPublicClient } from "@/systems/laundry/components/LaundryPickupPublicClient";
import {
  LaundryPortalPackageLinkCard,
  laundryPortalPackageGridClass,
  type LaundryPortalPackageItem,
} from "@/systems/laundry/components/LaundryPortalPackageCard";
import { LaundryPortalPackageDetailModal } from "@/systems/laundry/components/LaundryPortalPackageDetailModal";
import { LAUNDRY_PORTAL_SAMPLE_BANNER } from "@/systems/laundry/lib/portal-media";
import {
  laundryPaymentCtaClass,
  laundryPortalFieldClass,
} from "@/systems/laundry/lib/ui-tokens";

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
  openTime: string;
  closeTime: string;
  shopLat: number | null;
  shopLng: number | null;
  pickupFeePerKmBaht: number | null;
  portalBookingPaymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositAmountBaht: number | null;
};

type PortalPackage = LaundryPortalPackageItem;

const navLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";
const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const portalMutedTextClass = "text-sm font-semibold text-[#66638c]";

function pickupPayModeHint(shop: PortalShop): string | null {
  if (shop.portalBookingPaymentMode === "DEPOSIT" && shop.depositAmountBaht != null) {
    return `มัดจำ ${shop.depositAmountBaht.toLocaleString("th-TH")} บาท`;
  }
  if (shop.portalBookingPaymentMode === "FULL") {
    return "ชำระเต็มจำนวนเมื่อยืนยันคำขอ";
  }
  return null;
}

export function LaundryPortalPublicClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const lb = useAppImageLightbox();
  const notice = useAppNoticePopup();
  const [shop, setShop] = useState<PortalShop | null>(null);
  const [packages, setPackages] = useState<PortalPackage[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupExpanded, setPickupExpanded] = useState(false);
  const [compactName, setCompactName] = useState("");
  const [compactPhone, setCompactPhone] = useState("");
  const [detailPkg, setDetailPkg] = useState<PortalPackage | null>(null);
  const [seedPackageId, setSeedPackageId] = useState<number | null>(null);

  const openPickupForm = useCallback(() => {
    setPickupExpanded(true);
    requestAnimationFrame(() => {
      document.getElementById("pickup-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const scrollToPickupCompact = useCallback(() => {
    document.getElementById("pickup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const scrollIfHash = () => {
      if (window.location.hash === "#pickup") scrollToPickupCompact();
    };
    scrollIfHash();
    window.addEventListener("hashchange", scrollIfHash);
    return () => window.removeEventListener("hashchange", scrollIfHash);
  }, [scrollToPickupCompact]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const q = trialSessionId && trialSessionId !== "prod" ? `&t=${encodeURIComponent(trialSessionId)}` : "";
        const res = await fetch(`/api/laundry/public/portal?ownerId=${encodeURIComponent(ownerId)}${q}`);
        const data = (await res.json()) as {
          shop?: PortalShop;
          packages?: PortalPackage[];
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setLoadErr(data.error ?? "โหลดข้อมูลร้านไม่สำเร็จ");
          return;
        }
        if (!cancelled) {
          setShop(data.shop ?? null);
          setPackages(data.packages ?? []);
        }
      } catch {
        if (!cancelled) setLoadErr("เชื่อมต่อไม่ได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, trialSessionId]);

  if (loading) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !shop) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm font-semibold text-rose-600">
          {loadErr ?? "ไม่พบข้อมูลร้าน"}
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const banner = shop.portalBannerUrl?.trim() || LAUNDRY_PORTAL_SAMPLE_BANNER;
  const title = shop.displayName.trim() || "ร้านซักผ้า";
  const gallery = shop.portalGallery?.length ? shop.portalGallery : [];
  const payModeHint = pickupPayModeHint(shop);

  function handleCompactPickupSubmit(e: FormEvent) {
    e.preventDefault();
    if (!compactName.trim() || !compactPhone.trim()) {
      notice.warning("กรุณากรอกชื่อและเบอร์โทร");
      return;
    }
    openPickupForm();
  }

  function handleRequestPickupFromPackage(pkg: PortalPackage) {
    setDetailPkg(null);
    setSeedPackageId(pkg.id);
    openPickupForm();
  }

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {notice.popup}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {shop.logoUrl ?
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            : null}
            <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">{title}</p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนู"
          >
            <a href="#pickup" className={navLinkClass} onClick={() => scrollToPickupCompact()}>
              ขอบริการรับ-ส่ง
            </a>
            {packages.length > 0 ?
              <a href="#packages" className={navLinkClass}>
                แพ็กเกจ
              </a>
            : null}
            {gallery.length > 0 ?
              <a href="#gallery" className={navLinkClass}>
                แกลเลอรี
              </a>
            : null}
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">Laundry</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl">{title}</h1>
            {shop.tagline ?
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">{shop.tagline}</p>
            : null}
          </div>

          <form
            id="pickup"
            onSubmit={handleCompactPickupSubmit}
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 grid w-full gap-3 p-4 text-[#1e1b4b]",
              "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:gap-3 sm:p-5",
            )}
          >
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อ</span>
              <input
                required
                value={compactName}
                onChange={(e) => setCompactName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                autoComplete="name"
                className={cn(laundryPortalFieldClass, "h-11 min-h-11 rounded-2xl")}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
              <input
                required
                inputMode="tel"
                value={compactPhone}
                onChange={(e) => setCompactPhone(e.target.value)}
                placeholder="0812345678"
                autoComplete="tel"
                className={cn(laundryPortalFieldClass, "h-11 min-h-11 rounded-2xl")}
              />
            </label>
            <button
              type="submit"
              className={cn(laundryPaymentCtaClass, "h-11 min-h-11 self-end rounded-[1rem] px-6 text-sm font-black sm:mt-0")}
            >
              ขอบริการรับ-ส่ง
            </button>
            {payModeHint ?
              <p className={cn("sm:col-span-3", portalMutedTextClass, "!text-[11px]")}>{payModeHint}</p>
            : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        {pickupExpanded ?
          <section id="pickup-form" className="scroll-mt-16">
            <h2 className={sectionTitleClass}>ขอบริการรับ-ส่ง</h2>
            <p className={cn("mt-2", portalMutedTextClass)}>
              {compactName.trim() || "—"} · {compactPhone.trim() || "—"}
            </p>
            <div className={cn(appPublicCheckInGlassCardClass, "mt-4 space-y-3 p-4 sm:p-5")}>
              <LaundryPickupPublicClient
                ownerId={ownerId}
                shopLabel={title}
                embeddedInPortal
                initialPackages={packages}
                seedCustomerName={compactName}
                seedCustomerPhone={compactPhone}
                seedPackageId={seedPackageId}
                shopLocation={{
                  shopLat: shop.shopLat,
                  shopLng: shop.shopLng,
                  pickupFeePerKmBaht: shop.pickupFeePerKmBaht,
                }}
                portalPayment={{
                  mode: shop.portalBookingPaymentMode,
                  depositAmountBaht: shop.depositAmountBaht,
                }}
              />
            </div>
          </section>
        : null}

        {packages.length > 0 ?
          <section id="packages" className="scroll-mt-16">
            <h2 className={sectionTitleClass}>แพ็กเกจ</h2>
            <ul className={cn(laundryPortalPackageGridClass, "mt-6")}>
              {packages.map((pkg) => (
                <LaundryPortalPackageLinkCard key={pkg.id} pkg={pkg} onOpenDetail={setDetailPkg} />
              ))}
            </ul>
          </section>
        : null}

        <section id="gallery" className="scroll-mt-16">
          <h2 className={sectionTitleClass}>แกลเลอรี</h2>
          {gallery.length === 0 ?
            <p className="mt-3 text-sm font-semibold text-[#66638c]">ยังไม่มีรูป</p>
          : <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <AppImageThumb
                    src={url}
                    alt={`ภาพร้าน ${idx + 1}`}
                    onOpen={() => lb.open(url)}
                    className="h-36 w-full sm:h-40"
                  />
                </li>
              ))}
            </ul>
          }
        </section>

        <section id="contact" className="scroll-mt-16">
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className={cn(appPublicCheckInGlassCardClass, "mt-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5")}>
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{title}</p>
              {shop.address ? <p>{shop.address}</p> : null}
              <p>
                {shop.openTime} – {shop.closeTime}
                <span className="text-xs text-slate-500"> (เวลาไทย)</span>
              </p>
              {shop.contactPhone ?
                <p>
                  <a
                    className="font-bold text-[#4d47b6] hover:underline"
                    href={`tel:${shop.contactPhone.replace(/\D/g, "")}`}
                  >
                    {shop.contactPhone}
                  </a>
                </p>
              : null}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {shop.contactPhone ?
                <a
                  href={`tel:${shop.contactPhone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  โทร
                </a>
              : null}
              {shop.contactLine ?
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(shop.contactLine.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  LINE
                </a>
              : null}
              {shop.facebookUrl ?
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  Facebook
                </a>
              : null}
              {shop.mapUrl ?
                <a
                  href={shop.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  แผนที่
                </a>
              : null}
              {!shop.contactPhone && !shop.contactLine && !shop.facebookUrl && !shop.mapUrl && !shop.address ?
                <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีข้อมูลติดต่อ</p>
              : null}
            </div>
          </div>
        </section>
      </main>

      <LaundryPortalPackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onRequestPickup={handleRequestPickupFromPackage}
      />

      <AppImageLightbox src={lb.src} alt="ภาพร้าน" onClose={lb.close} />
    </AppPublicCheckInGlassPage>
  );
}

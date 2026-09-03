"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
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
import { LaundryPortalSection } from "@/systems/laundry/components/LaundryPortalSection";
import { LaundryPortalStatusLookup } from "@/systems/laundry/components/LaundryPortalStatusLookup";
import { LaundryPortalGallery } from "@/systems/laundry/components/LaundryPortalGallery";
import { LaundryPortalPackageDetailModal } from "@/systems/laundry/components/LaundryPortalPackageDetailModal";
import { LAUNDRY_PORTAL_SAMPLE_BANNER } from "@/systems/laundry/lib/portal-media";
import {
  laundryCompactOutlineButtonClass,
  laundryPortalFieldClass,
  laundryPortalHeaderNavLinkClass,
  laundryPortalHeaderNavShellClass,
  laundryPortalHeroCompactShellClass,
  laundryPortalPrimaryBtnClass,
  laundryPortalShopNameClass,
  laundryPortalShopNameHeroClass,
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
            <p className={cn("truncate text-sm sm:text-base", laundryPortalShopNameHeroClass)}>{title}</p>
          </div>
          <nav className={laundryPortalHeaderNavShellClass} aria-label="เมนู">
            <a href="#pickup" className={laundryPortalHeaderNavLinkClass()} onClick={() => scrollToPickupCompact()}>
              ขอบริการรับ-ส่ง
            </a>
            <a href="#status" className={laundryPortalHeaderNavLinkClass()}>
              ติดตามสถานะ
            </a>
            {packages.length > 0 ?
              <a href="#packages" className={laundryPortalHeaderNavLinkClass()}>
                แพ็กเกจ
              </a>
            : null}
            {gallery.length > 0 ?
              <a href="#gallery" className={laundryPortalHeaderNavLinkClass()}>
                แกลเลอรี
              </a>
            : null}
            <a href="#contact" className={laundryPortalHeaderNavLinkClass()}>
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
            <h1 className={cn("mt-2 text-4xl sm:text-5xl", laundryPortalShopNameHeroClass)}>{title}</h1>
            {shop.tagline ?
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">{shop.tagline}</p>
            : null}
          </div>

          <form
            id="pickup"
            onSubmit={handleCompactPickupSubmit}
            className={laundryPortalHeroCompactShellClass}
          >
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold text-[#4d47b6] sm:text-[#4d47b6]">ชื่อ</span>
              <input
                required
                value={compactName}
                onChange={(e) => setCompactName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                autoComplete="name"
                className={cn(laundryPortalFieldClass, "bg-white/95 sm:bg-white")}
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
                className={cn(laundryPortalFieldClass, "bg-white/95 sm:bg-white")}
              />
            </label>
            <button
              type="submit"
              className={cn(laundryPortalPrimaryBtnClass, "self-end sm:mt-0")}
            >
              ขอบริการรับ-ส่ง
            </button>
            {payModeHint ?
              <p className="text-[11px] font-semibold text-[#66638c] sm:col-span-3">{payModeHint}</p>
            : null}
          </form>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        {pickupExpanded ?
          <LaundryPortalSection
            id="pickup-form"
            title="ขอบริการรับ-ส่ง"
            subtitle={`${compactName.trim() || "—"} · ${compactPhone.trim() || "—"}`}
          >
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
          </LaundryPortalSection>
        : null}

        <LaundryPortalStatusLookup ownerId={ownerId} trialSessionId={trialSessionId} />

        {packages.length > 0 ?
          <LaundryPortalSection id="packages" title="แพ็กเกจ">
            <ul className={cn(laundryPortalPackageGridClass, "list-none p-0")}>
              {packages.map((pkg) => (
                <LaundryPortalPackageLinkCard key={pkg.id} pkg={pkg} onOpenDetail={setDetailPkg} />
              ))}
            </ul>
          </LaundryPortalSection>
        : null}

        <LaundryPortalGallery
          urls={gallery}
          onOpenAt={(index) => lb.openGallery(gallery, index)}
        />

        <LaundryPortalSection id="contact" title="ติดต่อ">
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className={cn("text-lg", laundryPortalShopNameClass)}>{title}</p>
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
                <a href={`tel:${shop.contactPhone.replace(/\D/g, "")}`} className={laundryCompactOutlineButtonClass}>
                  โทร
                </a>
              : null}
              {shop.contactLine ?
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(shop.contactLine.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className={laundryCompactOutlineButtonClass}
                >
                  LINE
                </a>
              : null}
              {shop.facebookUrl ?
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={laundryCompactOutlineButtonClass}
                >
                  Facebook
                </a>
              : null}
              {shop.mapUrl ?
                <a href={shop.mapUrl} target="_blank" rel="noreferrer" className={laundryCompactOutlineButtonClass}>
                  แผนที่
                </a>
              : null}
              {!shop.contactPhone && !shop.contactLine && !shop.facebookUrl && !shop.mapUrl && !shop.address ?
                <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีข้อมูลติดต่อ</p>
              : null}
            </div>
          </div>
        </LaundryPortalSection>
      </main>

      <LaundryPortalPackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onRequestPickup={handleRequestPickupFromPackage}
      />

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        alt="ภาพร้าน"
        onClose={lb.close}
      />
    </AppPublicCheckInGlassPage>
  );
}

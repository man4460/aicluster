"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appSafeAreaPortalHeaderClass,
  appSafeAreaPortalHeroTopPadClass,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { UsedCarPortalSection } from "@/systems/used-car-showroom/components/UsedCarPortalSection";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import {
  usedCarShowroomPortalHeroCompactShellClass,
  usedCarShowroomPortalPrimaryBtnClass,
  usedCarShowroomPortalPublicFieldClass,
  usedCarShowroomPortalShopNameHeroClass,
  usedCarShowroomPortalVehicleGridClass,
  usedCarShowroomOutlineButtonClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";

type PortalVehicle = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  statusLabel: string;
  askingPriceBaht: number;
  coverImageUrl: string | null;
  mileageKm: number | null;
  transmission: string | null;
  color: string | null;
};

type PortalPromo = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  valueBaht: number;
  valuePercent: number;
  giftLabel: string | null;
};

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

function trialQuery(trialParam?: string | null) {
  const t = trialParam?.trim();
  return t && t !== "prod" ? `?t=${encodeURIComponent(t)}` : "";
}

export function UsedCarPortalPublicClient({
  slug,
  trialParam,
}: {
  slug: string;
  trialParam?: string | null;
}) {
  const lb = useAppImageLightbox();
  const notice = useAppNoticePopup();
  const [shop, setShop] = useState<UsedCarShopDto | null>(null);
  const [vehicles, setVehicles] = useState<PortalVehicle[]>([]);
  const [promotions, setPromotions] = useState<PortalPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const qs = trialQuery(trialParam);
      const res = await fetch(
        `/api/used-car-showroom/public/portal/${encodeURIComponent(slug)}${qs}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setShop(data.shop ?? null);
      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      setPromotions(Array.isArray(data.promotions) ? data.promotions : []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [slug, trialParam]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return vehicles;
    return vehicles.filter((v) =>
      [v.title, v.brand, v.model, v.color, v.statusLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [vehicles, q]);

  if (loading) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !shop) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm font-semibold text-rose-600">{loadErr || "ไม่พบโชว์รูม"}</p>
          <button type="button" className={usedCarShowroomOutlineButtonClass} onClick={() => void load()}>
            ลองใหม่
          </button>
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const title = shop.displayName || "โชว์รูมรถมือสอง";
  const banner = shop.portalBannerUrl || shop.logoUrl || null;
  const gallery = shop.portalGallery ?? [];
  const tq = trialQuery(trialParam);

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปโชว์รูม" />

      <header className={appSafeAreaPortalHeaderClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : null}
            <p className={cn("truncate text-sm sm:text-base", usedCarShowroomPortalShopNameHeroClass)}>
              {title}
            </p>
          </div>
          <nav className="hidden items-center gap-0.5 md:inline-flex" aria-label="เมนู">
            <a
              href="#vehicles"
              className="inline-flex min-h-9 items-center rounded-md px-3 text-xs font-semibold text-white/95 hover:bg-white/25 sm:text-sm"
            >
              รถขาย
            </a>
            {promotions.length > 0 ? (
              <a
                href="#promos"
                className="inline-flex min-h-9 items-center rounded-md px-3 text-xs font-semibold text-white/95 hover:bg-white/25 sm:text-sm"
              >
                โปรโมชัน
              </a>
            ) : null}
            <a
              href="#contact"
              className="inline-flex min-h-9 items-center rounded-md px-3 text-xs font-semibold text-white/95 hover:bg-white/25 sm:text-sm"
            >
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[48vh] overflow-hidden sm:min-h-[56vh]">
        {banner ? (
          <button
            type="button"
            className="absolute inset-0 block"
            onClick={() => lb.open(banner)}
            aria-label="ดูแบนเนอร์"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner} alt="" className="h-full w-full object-cover object-center" />
          </button>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#4f2f9a] to-[#ec4899]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/25 via-transparent to-[#faf9ff]/80" />
        <div
          className={cn(
            "relative z-10 mx-auto flex min-h-[48vh] max-w-6xl flex-col justify-end px-4 pb-8 sm:min-h-[56vh] sm:px-6 sm:pb-10",
            appSafeAreaPortalHeroTopPadClass,
          )}
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">
              Used Car Showroom
            </p>
            <h1 className={cn("mt-2 text-4xl sm:text-5xl", usedCarShowroomPortalShopNameHeroClass)}>
              {title}
            </h1>
            {shop.tagline ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {shop.tagline}
              </p>
            ) : null}
          </div>

          <div className={usedCarShowroomPortalHeroCompactShellClass}>
            <label className="flex min-w-0 flex-col gap-1 sm:col-span-1">
              <span className="text-xs font-bold text-[#4d47b6]">ค้นหารถ</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ยี่ห้อ · รุ่น · สี"
                className={cn(usedCarShowroomPortalPublicFieldClass, "bg-white/95 sm:bg-white")}
              />
            </label>
            <a
              href="#vehicles"
              className={cn(usedCarShowroomPortalPrimaryBtnClass, "self-end justify-center sm:min-w-[8rem]")}
            >
              ดูรถขาย
            </a>
            {shop.portalBookingPaymentMode === "DEPOSIT" && shop.depositAmountBaht > 0 ? (
              <p className="text-[11px] font-semibold text-[#66638c] sm:col-span-2">
                จองกันคัน · มัดจำ {baht(shop.depositAmountBaht)} + สลิป · หรือนัดดูรถไม่มัดจำ
              </p>
            ) : shop.portalBookingPaymentMode === "FULL" ? (
              <p className="text-[11px] font-semibold text-[#66638c] sm:col-span-2">
                จองออนไลน์ชำระเต็ม + สลิป · หรือนัดดูรถไม่มัดจำ
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-[#66638c] sm:col-span-2">
                รับนัดดูรถ / ทดลองขับออนไลน์ · ไม่เปิดจองมัดจำผ่านเว็บ
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <UsedCarPortalSection id="vehicles" title="รถพร้อมขาย">
          {filtered.length === 0 ? (
            <AppEmptyState>
              <p className="font-semibold text-[#1e1b4b]">ยังไม่มีรถในรายการ</p>
              <p className="mt-1 text-sm text-[#66638c]">
                {q.trim() ? "ไม่พบรถที่ตรงคำค้น" : "โปรดกลับมาใหม่ภายหลัง"}
              </p>
            </AppEmptyState>
          ) : (
            <div className={usedCarShowroomPortalVehicleGridClass}>
              {filtered.map((v) => (
                <Link
                  key={v.id}
                  href={`/car/${encodeURIComponent(slug)}/v/${encodeURIComponent(v.id)}${tq}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-[#5b61ff]/35 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {v.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                        ไม่มีรูป
                      </div>
                    )}
                    {v.status === "RESERVED" ? (
                      <span className="absolute left-2 top-2 rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        ติดจอง
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3 sm:p-4">
                    <p className="line-clamp-2 text-sm font-black text-[#1e1b4b]">{v.title}</p>
                    <p className="text-base font-black text-[#4d47b6]">{baht(v.askingPriceBaht)}</p>
                    <p className="text-[11px] font-semibold text-[#66638c]">
                      {[
                        v.mileageKm != null ? `${v.mileageKm.toLocaleString("th-TH")} กม.` : null,
                        v.transmission,
                        v.color,
                      ]
                        .filter(Boolean)
                        .join(" · ") || v.statusLabel}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </UsedCarPortalSection>

        {promotions.length > 0 ? (
          <UsedCarPortalSection id="promos" title="โปรโมชัน">
            <ul className="space-y-2">
              {promotions.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3"
                >
                  <p className="text-sm font-black text-[#1e1b4b]">{p.title}</p>
                  {p.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[#66638c]">
                      {p.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </UsedCarPortalSection>
        ) : null}

        {gallery.length > 0 ? (
          <UsedCarPortalSection id="gallery" title="แกลเลอรี">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-8">
              {gallery.map((url) => (
                <AppImageThumb
                  key={url}
                  src={url}
                  alt="แกลเลอรี"
                  onOpen={() => lb.open(url)}
                  className="h-20 w-full sm:h-24"
                />
              ))}
            </div>
          </UsedCarPortalSection>
        ) : null}

        <UsedCarPortalSection id="contact" title="ติดต่อ">
          <div className="space-y-2 text-sm font-semibold text-[#1e1b4b]">
            {shop.address ? <p>{shop.address}</p> : null}
            {shop.contactPhone ? (
              <p>
                โทร{" "}
                <a className="text-[#4d47b6] underline" href={`tel:${shop.contactPhone}`}>
                  {shop.contactPhone}
                </a>
              </p>
            ) : null}
            {shop.contactLine ? <p>LINE: {shop.contactLine}</p> : null}
            {shop.openTimeHm || shop.closeTimeHm ? (
              <p>
                เปิด {shop.openTimeHm || "—"} – {shop.closeTimeHm || "—"} (เวลาไทย)
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              {shop.mapUrl ? (
                <a
                  href={shop.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={usedCarShowroomOutlineButtonClass}
                >
                  แผนที่
                </a>
              ) : null}
              {shop.facebookUrl ? (
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={usedCarShowroomOutlineButtonClass}
                >
                  Facebook
                </a>
              ) : null}
            </div>
          </div>
        </UsedCarPortalSection>
      </main>
    </AppPublicCheckInGlassPage>
  );
}

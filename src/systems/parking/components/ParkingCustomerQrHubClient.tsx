"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppEmptyState, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { ParkingSpotCustomerQrPanel } from "@/systems/parking/components/ParkingSpotCustomerQrPanel";
import { ParkingRegenerateTokenButton } from "@/systems/parking/components/ParkingSpotAdminButtons";
import { publicParkingCheckInUrl } from "@/systems/parking/lib/public-checkin-url";
import { PARKING_LOTS_HREF } from "@/systems/parking/parking-module-nav";
import { parkingFilterChipClass, parkingQrHubOuterClass } from "@/systems/parking/parking-ui-tokens";

export type ParkingQrLotRow = {
  id: number;
  name: string;
  isActive: boolean;
};

export type ParkingQrSpotRow = {
  id: number;
  siteId: number;
  spotCode: string;
  zoneLabel: string | null;
  siteName: string;
  checkInToken: string;
};

export type ParkingCustomerQrHubClientProps = {
  lots: ParkingQrLotRow[];
  spots: ParkingQrSpotRow[];
  businessName: string | null;
  logoUrl: string | null;
  baseUrl: string;
};

export function ParkingCustomerQrHubClient({
  lots,
  spots,
  businessName,
  logoUrl,
  baseUrl,
}: ParkingCustomerQrHubClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [lotFilter, setLotFilter] = useState("");
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(spots[0]?.id ?? null);

  const activeLots = useMemo(() => lots.filter((l) => l.isActive), [lots]);

  const filteredSpots = useMemo(() => {
    if (!lotFilter) return spots;
    const id = Number(lotFilter);
    if (!Number.isInteger(id)) return spots;
    return spots.filter((s) => s.siteId === id);
  }, [spots, lotFilter]);

  useEffect(() => {
    if (filteredSpots.length === 0) {
      setSelectedSpotId(null);
      return;
    }
    if (selectedSpotId == null || !filteredSpots.some((s) => s.id === selectedSpotId)) {
      setSelectedSpotId(filteredSpots[0]!.id);
    }
  }, [filteredSpots, selectedSpotId]);

  const selectedSpot = useMemo(
    () => filteredSpots.find((s) => s.id === selectedSpotId) ?? null,
    [filteredSpots, selectedSpotId],
  );

  const checkInUrl = selectedSpot ? publicParkingCheckInUrl(selectedSpot.checkInToken) : "";

  const lotFilterBar =
    activeLots.length > 0 ? (
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="เลือกลานจอด">
        <button
          type="button"
          role="tab"
          aria-selected={!lotFilter}
          className={parkingFilterChipClass(!lotFilter)}
          onClick={() => setLotFilter("")}
        >
          ทั้งหมด
        </button>
        {activeLots.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lotFilter === String(l.id)}
            className={parkingFilterChipClass(lotFilter === String(l.id))}
            onClick={() => setLotFilter(String(l.id))}
          >
            {l.name}
          </button>
        ))}
      </div>
    ) : null;

  if (spots.length === 0) {
    return (
      <div className="space-y-3">
        <AppEmptyState tone="glass">ยังไม่มีช่องจอด — เพิ่มลานและช่องก่อนสร้าง QR</AppEmptyState>
        <Link
          href={PARKING_LOTS_HREF}
          className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold")}
        >
          ไปหน้าลานจอด
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className={parkingQrHubOuterClass}>
        <div className="border-b border-white/50 bg-gradient-to-r from-[#4d47b6]/[0.08] via-transparent to-[#5b61ff]/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">ลิงก์ / QR ลูกค้า</h2>
          <p className="mt-1 text-sm font-medium text-[#66638c]">
            แต่ละช่องจอดมีลิงก์เช็คอินเอง — เลือกช่องแล้วส่งออกโปสเตอร์ (เหมือน QR โต๊ะร้านอาหาร)
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {lotFilterBar ? <div className="mb-4">{lotFilterBar}</div> : null}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={cn(
              "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
              "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
              "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
              "ring-1 ring-inset ring-white/60 transition-all duration-300",
              "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
            )}
            aria-label="เปิดจัดการ QR ลูกค้าเช็คอิน"
          >
            <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
            <div className="relative flex items-start gap-4 sm:gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR เช็คอินลูกค้า</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  เลือกช่องจอด · คัดลอกลิงก์ · ดาวน์โหลด PDF/PNG โปสเตอร์
                </p>
                <p className="mt-2 text-xs font-semibold text-[#5b61ff]">
                  {filteredSpots.length.toLocaleString("th-TH")} ช่องพร้อมสร้าง QR
                  {lotFilter && activeLots.find((l) => String(l.id) === lotFilter)
                    ? ` · ${activeLots.find((l) => String(l.id) === lotFilter)!.name}`
                    : ""}
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="QR ลูกค้าเช็คอิน"
        description="เลือกช่องจอด — ลูกค้าสแกนแล้วกรอกทะเบียนได้เอง"
        appearance="glass"
        glassTint="violet"
        size="lg"
        mobileCentered
        footer={
          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-4 text-sm font-black text-[#5b61ff] shadow-sm backdrop-blur-sm"
            >
              <span aria-hidden>✕</span>
              ปิด
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {lotFilterBar}
          {filteredSpots.length === 0 ? (
            <AppEmptyState tone="glass">ไม่มีช่องจอดในลานที่เลือก</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredSpots.map((s) => {
              const active = selectedSpotId === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSpotId(s.id)}
                    className={cn(
                      "flex h-full min-h-[120px] w-full flex-col rounded-[1.25rem] border p-3 text-left shadow-sm transition",
                      active
                        ? "border-[#4d47b6] bg-gradient-to-b from-[#ecebff] to-white ring-2 ring-[#4d47b6]/25"
                        : "border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 hover:border-[#4d47b6]/35",
                    )}
                    aria-pressed={active}
                    aria-label={`เลือกช่อง ${s.spotCode}`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">ช่องจอด</span>
                    <span className="mt-2 line-clamp-2 text-center text-xl font-black tabular-nums text-[#2e2a58]">
                      {s.spotCode}
                    </span>
                    <span className="mt-1 line-clamp-2 text-center text-[10px] font-medium text-[#66638c]">
                      {s.siteName}
                      {s.zoneLabel ? ` · ${s.zoneLabel}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
            </ul>
          )}

          {selectedSpot ? (
            <div className="rounded-[1.25rem] border border-[#e1e3ff] bg-white/80 p-4 shadow-inner backdrop-blur-sm sm:p-5">
              <h3 className="text-sm font-semibold text-[#2e2a58] sm:text-base">
                ส่งออก QR — ช่อง {selectedSpot.spotCode}
                {selectedSpot.zoneLabel ? ` · ${selectedSpot.zoneLabel}` : ""}
              </h3>
              <p className="mt-1 text-xs text-[#66638c]">ลาน {selectedSpot.siteName}</p>
              <div className="mt-4">
                <ParkingSpotCustomerQrPanel
                  checkInUrl={checkInUrl}
                  spotId={selectedSpot.id}
                  spotCode={selectedSpot.spotCode}
                  zoneLabel={selectedSpot.zoneLabel}
                  siteName={selectedSpot.siteName}
                  businessName={businessName}
                  logoUrl={logoUrl}
                  baseUrl={baseUrl}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/40 pt-4">
                <ParkingRegenerateTokenButton spotId={selectedSpot.id} />
              </div>
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}

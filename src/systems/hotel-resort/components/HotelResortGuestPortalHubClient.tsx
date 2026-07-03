"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import {
  hotelResortHubCardAmberClass,
  hotelResortHubCardVioletClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import { HotelResortQrPosterClient } from "@/systems/hotel-resort/components/HotelResortQrPosterClient";
import { IconQr, IconSearchGuest } from "@/systems/hotel-resort/components/HotelResortIcons";

export function HotelResortGuestPortalHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  hotelLabel,
  logoUrl = null,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  hotelLabel: string;
  logoUrl?: string | null;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <HotelResortButton
          type="button"
          onClick={() => { setLookupOpen(false); setQrOpen(true); }}
          className={hotelResortHubCardVioletClass}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c66ff] text-white shadow-lg">
              <IconQr className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR พอร์ทัลลูกค้า</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ และแสดง QR ที่หน้าเคาน์เตอร์</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5b61ff]">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </HotelResortButton>

        <HotelResortButton
          type="button"
          onClick={() => { setQrOpen(false); setLookupOpen(true); }}
          className={hotelResortHubCardAmberClass}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <IconSearchGuest className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">ค้นหาลูกค้า</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">เปิดพอร์ทัลสาธารณะเพื่อค้นหาสถานะการจองด้วยเบอร์โทร</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-amber-800">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </HotelResortButton>
      </div>

      <FormModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        size="lg"
        appearance="glass"
        glassTint="violet"
        title="QR พอร์ทัลลูกค้า"
        footer={<div className="flex justify-end"><HotelResortButton type="button" onClick={() => setQrOpen(false)} className="app-btn-primary rounded-xl px-4 py-2 text-sm font-bold">ปิด</HotelResortButton></div>}
      >
        <HotelResortQrPosterClient
          ownerId={ownerId}
          trialSessionId={trialSessionId}
          baseUrl={baseUrl}
          hotelLabel={hotelLabel}
          logoUrl={logoUrl}
          compactForModal
        />
      </FormModal>

      <FormModal
        open={lookupOpen}
        onClose={() => setLookupOpen(false)}
        size="md"
        appearance="glass"
        glassTint="amber"
        title="เปิดพอร์ทัลลูกค้า"
        footer={<div className="flex justify-end"><HotelResortButton type="button" onClick={() => setLookupOpen(false)} className="app-btn-primary rounded-xl px-4 py-2 text-sm font-bold">ปิด</HotelResortButton></div>}
      >
        <a
          href={`/hotel-resort/${ownerId}${trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : ""}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/55 bg-white/75 px-4 py-2 text-sm font-black text-[#4d47b6] hover:bg-white"
        >
          เปิดหน้าตรวจสอบการจองลูกค้า
        </a>
      </FormModal>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { FormModal } from "@/components/ui/FormModal";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import {
  hotelResortHubCardAmberClass,
  hotelResortHubCardVioletClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import { HotelResortQrPosterClient } from "@/systems/hotel-resort/components/HotelResortQrPosterClient";
import { HotelResortStaffQrPosterClient } from "@/systems/hotel-resort/components/HotelResortStaffQrPosterClient";
import { IconQr } from "@/systems/hotel-resort/components/HotelResortIcons";

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <HotelResortButton
        type="button"
        onClick={onClose}
        className="cw-btn app-btn-primary rounded-[1rem] px-4 py-2 text-sm font-bold"
        aria-label="ปิด"
      >
        <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        <span className="cw-btn-label">ปิด</span>
      </HotelResortButton>
    </div>
  );
}

export function HotelResortGuestPortalHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  hotelLabel,
  logoUrl = null,
  trialExportBlocked = false,
  embedded = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  hotelLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  embedded?: boolean;
}) {
  const [modal, setModal] = useState<"qr" | "staff" | null>(null);

  return (
    <ModuleQrMonthlyGate moduleSlug={HOTEL_RESORT_MODULE_SLUG}>
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <HotelResortButton
          type="button"
          onClick={() => setModal("qr")}
          className={hotelResortHubCardVioletClass}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c66ff] text-white shadow-lg">
              <IconQr className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR พอร์ทัลลูกค้า</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">คัดลอกลิงก์ · ดาวน์โหลดโปสเตอร์</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5b61ff]">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </HotelResortButton>

        <HotelResortButton
          type="button"
          onClick={() => setModal("staff")}
          className={hotelResortHubCardAmberClass}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR พนักงาน</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">ลิงก์ลับสำหรับเช็คอิน / บันทึกการเข้าพัก</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-amber-800">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </HotelResortButton>
      </div>

      {!embedded ? (
        <p className="text-sm font-medium text-[#66638c]">
          ตั้งค่าแบนเนอร์ · รูปภาพ · ข้อมูลติดต่อ · รีวิว —{" "}
          <Link
            href="/dashboard/hotel-resort/settings?tab=portal"
            className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-bold")}
          >
            ไปตั้งค่าเว็ปลิงค์ลูกค้า
          </Link>
        </p>
      ) : null}

      <FormModal
        open={modal === "qr"}
        onClose={() => setModal(null)}
        size="lg"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title="QR พอร์ทัลลูกค้า"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <HotelResortQrPosterClient
          ownerId={ownerId}
          trialSessionId={trialSessionId}
          baseUrl={baseUrl}
          hotelLabel={hotelLabel}
          logoUrl={logoUrl}
          trialExportBlocked={trialExportBlocked}
          compactForModal
        />
      </FormModal>

      <FormModal
        open={modal === "staff"}
        onClose={() => setModal(null)}
        size="lg"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title="QR พนักงาน"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <HotelResortStaffQrPosterClient
          hotelLabel={hotelLabel}
          logoUrl={logoUrl}
          trialExportBlocked={trialExportBlocked}
          compactForModal
        />
      </FormModal>
    </div>
    </ModuleQrMonthlyGate>
  );
}

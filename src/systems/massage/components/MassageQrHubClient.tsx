"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { FormModal } from "@/components/ui/FormModal";
import { MassageQrPosterClient } from "@/systems/massage/components/MassageQrPosterClient";
import { MassageStaffQrDashboardSection } from "@/systems/massage/components/MassageStaffQrDashboardSection";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialExportBlocked: boolean;
  isTrialSandbox: boolean;
  trialSessionId: string;
};

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
        aria-label="ปิด"
      >
        <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        <span className="cw-btn-label">ปิด</span>
      </button>
    </div>
  );
}

/** การ์ดคู่เปิด FormModal แบบคาร์แคร์ — ดู `.cursor/rules/shop-qr-hub-popup-pattern.mdc` */
export function MassageQrHubClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked,
  isTrialSandbox,
  trialSessionId,
}: Props) {
  const [showCustomerQrModal, setShowCustomerQrModal] = useState(false);
  const [showStaffQrModal, setShowStaffQrModal] = useState(false);

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <button
          type="button"
          onClick={() => {
            setShowStaffQrModal(false);
            setShowCustomerQrModal(true);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
            "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                พอร์ทัลลูกค้า — คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ และดูตัวอย่างในป๊อปอัป
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b61ff]">
                <span>คลิกเพื่อเปิด</span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowCustomerQrModal(false);
            setShowStaffQrModal(true);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
            "p-6 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดจัดการ QR พนักงาน"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR พนักงาน</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                แดชบอร์ด + การจัดการ — สแกนหรือเปิดลิงก์ (ล็อกอินร้าน · รหัสรายวันถ้าตั้งไว้)
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
                <span>คลิกเพื่อเปิด</span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>
        </button>
      </div>

      <FormModal
        open={showCustomerQrModal}
        size="lg"
        appearance="glass"
        glassTint="violet"
        onClose={() => setShowCustomerQrModal(false)}
        title="QR ลูกค้า"
        footer={<ModalCloseFooter onClose={() => setShowCustomerQrModal(false)} />}
      >
        <MassageQrPosterClient
          ownerId={ownerId}
          shopLabel={shopLabel}
          logoUrl={logoUrl}
          baseUrl={baseUrl}
          trialSessionId={trialSessionId}
          trialExportBlocked={trialExportBlocked}
          embedded
          compactForModal
        />
      </FormModal>

      <FormModal
        open={showStaffQrModal}
        size="full"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setShowStaffQrModal(false)}
        title="QR พนักงาน"
        description="แดชบอร์ดคิว/เช็กอิน และการจัดการ — ถ้าร้านตั้งรหัสรายวันต้องใส่รหัสก่อน"
        footer={<ModalCloseFooter onClose={() => setShowStaffQrModal(false)} />}
      >
        <MassageStaffQrDashboardSection
          ownerId={ownerId}
          shopLabel={shopLabel}
          logoUrl={logoUrl}
          baseUrl={baseUrl}
          trialExportBlocked={trialExportBlocked}
          isTrialSandbox={isTrialSandbox}
          trialSessionId={trialSessionId}
          hideDashboardBackLink
          compactForModal
        />
      </FormModal>
    </div>
  );
}

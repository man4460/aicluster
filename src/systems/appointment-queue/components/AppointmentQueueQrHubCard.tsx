"use client";

import { useState } from "react";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { cn } from "@/lib/cn";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { FormModal } from "@/components/ui/FormModal";
import { AppointmentQueueQrPosterClient } from "@/systems/appointment-queue/components/AppointmentQueueQrPosterClient";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked: boolean;
};

export function AppointmentQueueQrHubCard({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  trialExportBlocked,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <ModuleQrMonthlyGate moduleSlug={APPOINTMENT_QUEUE_MODULE_SLUG}>
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
            "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
            "sm:p-8",
          )}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-md ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
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
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                สแกนจองเวลา — คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ แปะ Facebook / TikTok
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b61ff]">
                <span>คลิกเพื่อเปิด</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>
        </button>

        <FormModal
          open={open}
          size="lg"
          appearance="glass"
          glassTint="violet"
          onClose={() => setOpen(false)}
          title="QR ลูกค้า"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <span className="cw-btn-label">ปิด</span>
              </button>
            </div>
          }
        >
          <AppointmentQueueQrPosterClient
            ownerId={ownerId}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            trialSessionId={trialSessionId}
            trialExportBlocked={trialExportBlocked}
            compactForModal
          />
        </FormModal>
      </>
    </ModuleQrMonthlyGate>
  );
}

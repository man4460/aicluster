"use client";

import { useMemo, useState } from "react";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { FormModal } from "@/components/ui/FormModal";
import { VILLAGE_MODULE_SLUG } from "@/lib/modules/config";
import { VillageQrPosterClient } from "@/systems/village/components/VillageQrPosterClient";
import { villageBtnPrimary } from "@/systems/village/village-ui";
import { cn } from "@/lib/cn";

const hubCardClass =
  "w-full rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/30 to-violet-50/20 p-5 text-left shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition hover:-translate-y-0.5 hover:border-[#5b61ff]/25 hover:shadow-[0_22px_48px_-22px_rgba(30,27,75,0.38)] hover:ring-[#5b61ff]/15";

export function VillageGuestPortalHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  villageLabel,
  logoUrl = null,
  trialExportBlocked = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  villageLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => villageLabel.trim() || "หมู่บ้าน", [villageLabel]);

  return (
    <ModuleQrMonthlyGate moduleSlug={VILLAGE_MODULE_SLUG}>
      <div className="min-w-0 space-y-4">
        <button type="button" onClick={() => setOpen(true)} className={hubCardClass}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c66ff] text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h7v7h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR เว็บโครงการ</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">ลูกค้าดูบ้านประกาศขาย · ติดต่อนิติ</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5b61ff]">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </button>

        <FormModal
          open={open}
          onClose={() => setOpen(false)}
          title="QR / ลิงก์เว็บโครงการ"
          size="lg"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(villageBtnPrimary, "min-h-10 px-4")}
              >
                ปิด
              </button>
            </div>
          }
        >
          <VillageQrPosterClient
            ownerId={ownerId}
            trialSessionId={trialSessionId}
            baseUrl={baseUrl}
            villageLabel={label}
            logoUrl={logoUrl}
            trialExportBlocked={trialExportBlocked}
            compactForModal
          />
        </FormModal>
      </div>
    </ModuleQrMonthlyGate>
  );
}

"use client";

import { useState } from "react";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { cn } from "@/lib/cn";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { FormModal } from "@/components/ui/FormModal";
import { LoyaltyStampQrPosterClient } from "@/systems/loyalty-stamp/components/LoyaltyStampQrPosterClient";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked: boolean;
};

export function LoyaltyStampQrHubCard(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <ModuleQrMonthlyGate moduleSlug={LOYALTY_STAMP_MODULE_SLUG}>
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25 p-6 backdrop-blur-2xl sm:p-8",
            "ring-1 ring-inset ring-white/60 transition-all hover:-translate-y-1",
          )}
          aria-label="เปิด QR การ์ดลูกค้า"
        >
          <h3 className="text-lg font-black text-[#1e1b4b]">QR / ลิงก์การ์ดลูกค้า</h3>
          <p className="mt-2 text-sm text-[#66638c]">ลูกค้าสแกนเปิดการ์ดสะสมแต้ม — แปะหน้าร้านได้เลย</p>
        </button>
        <FormModal
          open={open}
          size="lg"
          appearance="glass"
          glassTint="violet"
          onClose={() => setOpen(false)}
          title="QR การ์ดลูกค้า"
        >
          <LoyaltyStampQrPosterClient {...props} />
        </FormModal>
      </>
    </ModuleQrMonthlyGate>
  );
}

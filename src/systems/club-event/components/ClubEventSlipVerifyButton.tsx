"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { patchClubEventSubmissionSlipVerified } from "@/systems/club-event/lib/verify-slip";
import {
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventSlipVerifyButton({
  submissionId,
  hasSlip,
  verified,
  onPatched,
  onError,
  className,
}: {
  submissionId: string;
  hasSlip: boolean;
  verified: boolean;
  onPatched: (next: { slipVerified: boolean; slipVerifiedAt: string | null }) => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  if (!hasSlip) return null;

  async function toggle() {
    setBusy(true);
    try {
      const next = await patchClubEventSubmissionSlipVerified(submissionId, !verified);
      onPatched(next);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <div className={cn("flex shrink-0 flex-nowrap items-center justify-end gap-1.5", className)}>
        <span className="inline-flex max-w-[9.5rem] items-center gap-1 rounded-md bg-emerald-100/90 px-2 py-1 text-[10px] font-black leading-tight text-emerald-800 ring-1 ring-emerald-200/80 sm:max-w-none">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
          <span>ตรวจแล้ว</span>
        </span>
        <button
          type="button"
          className={cn(
            clubEventOutlineButtonClass,
            "min-h-10 min-w-10 px-0 text-rose-600 sm:min-w-0 sm:px-3 sm:text-[#4d47b6]",
          )}
          disabled={busy}
          aria-busy={busy}
          aria-label="ยกเลิกการตรวจสลิป"
          title="ยกเลิกการตรวจ"
          onClick={() => void toggle()}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
          <span className="hidden sm:inline">ยกเลิกการตรวจ</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        clubEventPrimaryButtonClass,
        "min-h-10 min-w-10 shrink-0 px-0 sm:min-w-0 sm:px-3",
        className,
      )}
      disabled={busy}
      aria-busy={busy}
      aria-label={busy ? "กำลังบันทึกการตรวจสลิป" : "ตรวจสอบสลิปแล้ว"}
      title="ตรวจสอบสลิปแล้ว"
      onClick={() => void toggle()}
    >
      <CheckCircle2 className={cn("h-4 w-4 shrink-0", busy && "animate-pulse")} aria-hidden strokeWidth={2.25} />
      <span className="hidden sm:inline">{busy ? "กำลังบันทึก…" : "ตรวจสอบสลิปแล้ว"}</span>
    </button>
  );
}

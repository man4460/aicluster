"use client";

import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/cn";
import {
  CLUB_EVENT_DUES_PERIOD_LABELS,
  type ClubEventDuesPeriodKey,
} from "@/systems/club-event/lib/dues";
import type { ClubEventProfileDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventOutlineButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

const labelClass = "block space-y-1";
const labelTextClass = "text-xs font-bold text-[#4d47b6]";

export function ClubEventDuesSettingsPanel({
  form,
  setForm,
  saving,
  onCopied,
  onCopyFailed,
}: {
  form: ClubEventProfileDto;
  setForm: Dispatch<SetStateAction<ClubEventProfileDto>>;
  saving?: boolean;
  onCopied?: () => void;
  onCopyFailed?: () => void;
}) {
  const period = form.duesPeriod as ClubEventDuesPeriodKey;
  const publicPath = form.duesPublicPath;

  async function copyLink() {
    if (!publicPath) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPath.startsWith("/") ? publicPath : `/${publicPath}`}`
        : publicPath;
    try {
      await navigator.clipboard.writeText(url);
      onCopied?.();
    } catch {
      onCopyFailed?.();
    }
  }

  return (
    <div id="club-event-settings-panel-dues" role="tabpanel" className="space-y-4">
      <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
          checked={Boolean(form.duesEnabled)}
          disabled={saving}
          onChange={(e) => setForm((f) => ({ ...f, duesEnabled: e.target.checked }))}
        />
        <span className="min-w-0">
          <span className="block text-sm font-black text-[#1e1b4b]">เปิดเก็บค่าบำรุงสมาชิก</span>
          <span className="block text-[11px] font-semibold text-[#66638c]">
            สร้างลิงก์ชำระสาธารณะอัตโนมัติเมื่อบันทึก
          </span>
        </span>
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>จำนวนเงิน (บาท)</span>
        <input
          type="number"
          min={0}
          step={1}
          className={cn(clubEventFieldClass, "mt-1")}
          disabled={saving || !form.duesEnabled}
          value={form.duesAmountBaht}
          onChange={(e) =>
            setForm((f) => ({ ...f, duesAmountBaht: Math.max(0, Math.round(Number(e.target.value) || 0)) }))
          }
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>รอบเก็บ</span>
        <select
          className={cn(clubEventFieldClass, "mt-1")}
          disabled={saving || !form.duesEnabled}
          value={period}
          onChange={(e) =>
            setForm((f) => ({ ...f, duesPeriod: e.target.value as ClubEventDuesPeriodKey }))
          }
        >
          {(Object.keys(CLUB_EVENT_DUES_PERIOD_LABELS) as ClubEventDuesPeriodKey[]).map((k) => (
            <option key={k} value={k}>
              {CLUB_EVENT_DUES_PERIOD_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      {publicPath ? (
        <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
          <p className="text-xs font-black text-[#4d47b6]">ลิงก์ชำระค่าบำรุง</p>
          <p className="break-all text-sm font-semibold text-[#1e1b4b]">{publicPath}</p>
          <button
            type="button"
            className={clubEventOutlineButtonClass}
            disabled={saving}
            onClick={() => void copyLink()}
          >
            คัดลอกลิงก์
          </button>
        </div>
      ) : (
        <p className="text-xs font-semibold text-[#66638c]">
          เปิดเก็บค่าบำรุงแล้วกดบันทึก เพื่อสร้างลิงก์สาธารณะ
        </p>
      )}
    </div>
  );
}

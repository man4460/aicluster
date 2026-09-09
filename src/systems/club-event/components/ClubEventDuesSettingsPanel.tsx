"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { clubEventDashboardTabHref, clubEventSettingsHref } from "@/systems/club-event/club-event-module-nav";
import {
  CLUB_EVENT_DUES_PERIOD_LABELS,
  type ClubEventDuesPeriodKey,
} from "@/systems/club-event/lib/dues";
import type { ClubEventProfileDto } from "@/systems/club-event/lib/mappers";
import { clubEventFieldClass } from "@/systems/club-event/lib/ui-tokens";

const labelClass = "block space-y-1";
const labelTextClass = "text-xs font-bold text-[#4d47b6]";

export function ClubEventDuesSettingsPanel({
  form,
  setForm,
  saving,
}: {
  form: ClubEventProfileDto;
  setForm: Dispatch<SetStateAction<ClubEventProfileDto>>;
  saving?: boolean;
  /** @deprecated คัดลอกลิงก์ย้ายไปแท็บลิงก์แล้ว */
  onCopied?: () => void;
  onCopyFailed?: () => void;
}) {
  const period = form.duesPeriod as ClubEventDuesPeriodKey;
  const publicPath = form.duesPublicPath;

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
            สร้างลิงก์ชำระสาธารณะอัตโนมัติเมื่อบันทึก — QR/คัดลอกอยู่แท็บ «ลิงก์»
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
        <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-[#66638c]">
          ลิงก์ชำระค่าบำรุงพร้อมแล้ว — ดู QR และคัดลอกได้ที่{" "}
          <Link
            href={clubEventSettingsHref("link")}
            className="font-bold text-[#0000BF] underline underline-offset-2"
          >
            ตั้งค่า → ลิงก์
          </Link>
        </p>
      ) : (
        <p className="text-xs font-semibold text-[#66638c]">
          เปิดเก็บค่าบำรุงแล้วกดบันทึก เพื่อสร้างลิงก์สาธารณะ
        </p>
      )}

      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-[#66638c]">
        ติดตามผู้จ่าย / สลิป / ยังไม่ชำระอยู่ที่{" "}
        <Link
          href={clubEventDashboardTabHref("dues")}
          className="font-bold text-[#0000BF] underline underline-offset-2"
        >
          แดชบอร์ด → ค่าบำรุง
        </Link>
      </p>
    </div>
  );
}

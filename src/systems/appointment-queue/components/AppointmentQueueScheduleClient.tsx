"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { normalizeTimeHHmm } from "@/lib/appointment-queue/slot-times";
import { useMounted } from "@/lib/use-mounted";
import {
  aqCardBodyPaddingXClass,
  aqFilterChipClass,
  aqListRowCardClass,
} from "@/systems/appointment-queue/appointment-queue-ui-tokens";

type SlotAvailabilityItem = { time: string; available: boolean; bookingId?: number };

type SchedulePayload = {
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  isClosed: boolean;
  slots: string[];
  slotAvailability?: SlotAvailabilityItem[];
  availableCount?: number;
  hasCustomRow?: boolean;
};

const cardBodyPad = cn(aqCardBodyPaddingXClass, "py-5 sm:px-6");

const scheduleFieldClass =
  "mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5 text-sm text-[#2e2a58] outline-none transition focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

function shiftDateKey(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return bangkokDateKey(dt);
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ScheduleToolbar({
  busy,
  onRefresh,
  onSave,
}: {
  busy: boolean;
  onRefresh: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onRefresh}
        className={cn(
          "cw-btn app-btn-soft app-tap-feedback inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-[#dcd8f0] px-3 py-2 text-[#4d47b6] hover:bg-[#f4f3ff] disabled:opacity-60 sm:min-w-0 sm:px-3.5 sm:text-sm",
        )}
        aria-label={busy ? "กำลังรีเฟรชตารางเวลา" : "รีเฟรชตารางเวลา"}
        title="รีเฟรช"
      >
        <IconRefresh className="cw-btn-icon" />
        <span className="cw-btn-label">{busy ? "กำลังรีเฟรช…" : "รีเฟรช"}</span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className={cn(
          "cw-btn app-btn-primary app-tap-feedback inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl px-3 py-2 sm:min-w-0 sm:px-4 sm:text-sm",
        )}
        aria-label="บันทึกตารางเวลา"
        title="บันทึกตาราง"
      >
        <IconSave className="cw-btn-icon" />
        <span className="cw-btn-label">บันทึกตาราง</span>
      </button>
    </div>
  );
}

function ScheduleFormSkeleton() {
  return (
    <div className={cn(cardBodyPad, "space-y-4 pb-2")} aria-hidden>
      <div className="h-12 animate-pulse rounded-xl bg-white/40" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-xl bg-white/40" />
        <div className="h-16 animate-pulse rounded-xl bg-white/40" />
        <div className="col-span-2 h-16 animate-pulse rounded-xl bg-white/40 sm:col-span-1" />
      </div>
      <div className="flex gap-2">
        <div className="h-11 w-28 animate-pulse rounded-xl bg-white/40" />
        <div className="h-11 w-20 animate-pulse rounded-xl bg-white/40" />
      </div>
    </div>
  );
}

export function AppointmentQueueScheduleClient({
  initialDateKey,
  embedded = false,
  collapsible = false,
  defaultOpen = false,
}: {
  initialDateKey: string;
  embedded?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const mounted = useMounted();
  const panelId = useId();
  const headingId = useId();
  const [panelOpen, setPanelOpen] = useState(defaultOpen);
  const todayKey = initialDateKey;
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [isClosed, setIsClosed] = useState(false);
  const [hasCustomRow, setHasCustomRow] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const weekStrip = [-3, -2, -1, 0, 1, 2, 3].map((d) => shiftDateKey(todayKey, d));

  const load = useCallback(async (d: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/appointment-queue/day-schedules?date=${encodeURIComponent(d)}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "โหลดไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime);
      setCloseTime(data.closeTime);
      setSlotMinutes(data.slotMinutes);
      setIsClosed(data.isClosed);
      setSlots(data.slots ?? []);
      setSlotAvailability(data.slotAvailability ?? []);
      setHasCustomRow(Boolean(data.hasCustomRow));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(dateKey);
  }, [dateKey, load]);

  async function save() {
    setBusy(true);
    setMsg(null);
    const openNorm = normalizeTimeHHmm(openTime);
    const closeNorm = normalizeTimeHHmm(closeTime);
    if (!isClosed && (!openNorm || !closeNorm)) {
      setMsg("รูปแบบเวลาเปิด–ปิดไม่ถูกต้อง");
      setBusy(false);
      return;
    }
    if (!isClosed && openNorm! >= closeNorm!) {
      setMsg("เวลาปิดต้องหลังเวลาเปิด");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/appointment-queue/day-schedules", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          openTime: openNorm ?? openTime,
          closeTime: closeNorm ?? closeTime,
          slotMinutes,
          isClosed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime ?? openNorm ?? openTime);
      setCloseTime(data.closeTime ?? closeNorm ?? closeTime);
      setSlotMinutes(data.slotMinutes ?? slotMinutes);
      setIsClosed(data.isClosed ?? isClosed);
      setSlots(data.slots ?? []);
      setSlotAvailability(data.slotAvailability ?? []);
      setHasCustomRow(true);
      setMsg("บันทึกตารางวันนี้แล้ว");
    } finally {
      setBusy(false);
    }
  }

  const availableCount =
    slotAvailability.length > 0
      ? slotAvailability.filter((s) => s.available).length
      : slots.length;

  const summaryLine = useMemo(() => {
    const dateLabel = dateKey.slice(5).replace("-", "/");
    if (!mounted) return `วันที่ ${dateLabel} · กำลังโหลด…`;
    if (isClosed) return `วันที่ ${dateLabel} · ปิดรับจองวันนี้`;
    if (slots.length === 0) return `วันที่ ${dateLabel} · ${openTime}–${closeTime} · ยังไม่มีช่วงเวลา`;
    return `วันที่ ${dateLabel} · ${openTime}–${closeTime} · ว่าง ${availableCount}/${slots.length} ช่วง`;
  }, [mounted, dateKey, isClosed, openTime, closeTime, slots.length, availableCount]);

  const inner = !mounted ? (
    <ScheduleFormSkeleton />
  ) : (
    <div className={cn(cardBodyPad, "space-y-4 pb-2")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm text-left">
          <span className="font-semibold text-[#2e2a58]">วันที่</span>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className={scheduleFieldClass}
            aria-label="เลือกวันที่ตั้งตาราง"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDateKey(todayKey)}
          className={cn(
            appTemplateOutlineButtonClass,
            "min-h-[42px] shrink-0 rounded-xl px-3 text-sm font-semibold text-[#4d47b6] sm:self-end",
          )}
        >
          วันนี้
        </button>
        <label className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3 py-2.5 text-sm sm:self-end">
          <input
            type="checkbox"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium text-rose-800">ปิดรับจองวันนี้</span>
        </label>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
        {weekStrip.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDateKey(d)}
            className={aqFilterChipClass(dateKey === d)}
          >
            {d === todayKey ? "วันนี้" : d.slice(5).replace("-", "/")}
          </button>
        ))}
      </div>

      {hasCustomRow ? (
        <p className="text-left text-xs font-medium text-[#5b61ff]">มีการตั้งค่าเฉพาะวันนี้แล้ว</p>
      ) : (
        <p className="text-left text-xs text-[#66638c]">ยังใช้เวลาเริ่มต้นของร้าน — บันทึกเพื่อกำหนดวันนี้</p>
      )}

      {!isClosed ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="text-left text-sm">
            <span className="font-semibold text-[#2e2a58]">เปิด</span>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className={scheduleFieldClass}
            />
          </label>
          <label className="text-left text-sm">
            <span className="font-semibold text-[#2e2a58]">ปิด</span>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className={scheduleFieldClass}
            />
          </label>
          <label className="col-span-2 text-left text-sm sm:col-span-1">
            <span className="font-semibold text-[#2e2a58]">ระยะคิว (นาที)</span>
            <input
              type="number"
              min={15}
              max={240}
              step={15}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value) || 60)}
              className={scheduleFieldClass}
            />
          </label>
        </div>
      ) : null}

      {msg ? <p className="text-left text-sm font-medium text-[#5b61ff]">{msg}</p> : null}

      {!isClosed && slots.length > 0 ? (
        <div className="text-left">
          <p className="text-xs font-semibold text-[#8b87ad]">
            ช่วงเวลา ({slots.length} ช่วง) · ว่าง{" "}
            {slotAvailability.length > 0
              ? slotAvailability.filter((s) => s.available).length
              : slots.length}{" "}
            · จองแล้ว {slotAvailability.filter((s) => !s.available).length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(slotAvailability.length > 0 ? slotAvailability : slots.map((t) => ({ time: t, available: true }))).map(
              (s) => (
                <span
                  key={s.time}
                  className={cn(
                    "inline-flex min-h-[40px] min-w-[4.5rem] items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums",
                    s.available
                      ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-900"
                      : "border-slate-200/80 bg-slate-100/80 text-slate-500 line-through",
                  )}
                  title={s.available ? "ว่าง — ลูกค้าจองได้" : "มีคิวแล้ว"}
                >
                  {s.time}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {isClosed ? (
        <p className={cn(appTemplateOutlineButtonClass, "inline-block rounded-xl px-4 py-3 text-sm text-rose-800")}>
          ปิดรับจองวันนี้ — ลูกค้าจะไม่เห็นช่วงเวลา
        </p>
      ) : null}
    </div>
  );

  const toolbarRow = (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        collapsible ? cn(cardBodyPad, "border-t border-white/40 pt-0") : "px-5 pb-2 sm:px-6",
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <ScheduleToolbar
        busy={busy}
        onRefresh={() => void load(dateKey)}
        onSave={() => void save()}
      />
    </div>
  );

  const sectionBody = (
    <>
      {inner}
      {toolbarRow}
    </>
  );

  if (collapsible) {
    return (
      <AppDashboardSection tone="violet" className="min-w-0 gap-0 overflow-hidden p-0">
        <button
          type="button"
          className={cn(
            aqListRowCardClass,
            "w-full rounded-none border-0 bg-transparent shadow-none ring-0 hover:bg-white/40",
            "flex min-h-[56px] items-stretch px-4 py-4 sm:px-6",
          )}
          aria-expanded={panelOpen}
          aria-controls={panelOpen ? panelId : undefined}
          aria-labelledby={headingId}
          onClick={() => setPanelOpen((v) => !v)}
        >
          <AppSectionHeader
            tone="violet"
            title="ตั้งช่วงเวลารายวัน"
            titleId={headingId}
            description={summaryLine}
            className="pointer-events-none flex w-full min-w-0 flex-row items-start justify-between gap-3 sm:items-center"
            action={
              <svg
                className={cn(
                  "h-5 w-5 shrink-0 text-[#5b61ff] transition-transform duration-200",
                  panelOpen ? "rotate-180" : "rotate-0",
                )}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            actionWrapClassName="pointer-events-none shrink-0 self-start pt-0.5 sm:pt-0"
          />
        </button>
        {panelOpen ? (
          <div id={panelId} role="region" aria-labelledby={headingId}>
            {sectionBody}
          </div>
        ) : (
          <p className="border-t border-white/35 px-4 pb-4 text-left text-xs text-[#66638c] sm:px-6">
            แตะหัวการ์ดเพื่อตั้งเวลาเปิด–ปิดและช่วงคิว
          </p>
        )}
      </AppDashboardSection>
    );
  }

  const sectionHeader = (
    <AppSectionHeader
      tone="violet"
      title="ตั้งช่วงเวลารายวัน"
      description="กำหนดเวลาเปิด–ปิดและระยะคิว — ลูกค้าเห็นช่วงว่างตอนสแกน QR"
      className="flex flex-row items-start justify-between gap-3 sm:items-center"
      actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
      action={
        <ScheduleToolbar
          busy={busy}
          onRefresh={() => void load(dateKey)}
          onSave={() => void save()}
        />
      }
    />
  );

  if (embedded) {
    return (
      <AppDashboardSection tone="violet" className="min-w-0">
        {sectionHeader}
        {inner}
      </AppDashboardSection>
    );
  }

  return (
    <AppDashboardSection tone="violet">
      {sectionHeader}
      {inner}
    </AppDashboardSection>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { WaitQueueDashboardDto } from "@/systems/wait-queue/lib/load-dashboard";
import {
  buildWaitQueueAnnouncementPhrase,
  cancelWaitQueueSpeech,
  isSpeechSynthesisSupported,
  primeWaitQueueAudioContext,
  speakWaitQueueAnnouncement,
} from "@/systems/wait-queue/lib/wait-queue-speech";


const refreshIntervalMs = 8000;
const VOICE_ENABLED_STORAGE_KEY = "wait-queue-voice-enabled";

/** ค่าตัวอย่างเมื่อเปิดโมดัลลงคิว — พนักงานแก้หรือลบก่อนบันทึกได้ */
const WAIT_QUEUE_ADD_FORM_EXAMPLE: { partySize: number; customerName: string; note: string } = {
  partySize: 4,
  customerName: "ครอบครัวสมชาย",
  note: "โต๊ะสูง ชั้น 2 · เด็ก 2 คน",
};

function statusLabel(s: string): string {
  switch (s) {
    case "WAITING":
      return "กำลังรอ";
    case "CALLED":
      return "เรียกแล้ว";
    case "SEATED":
      return "เข้าร้านแล้ว";
    case "CANCELLED":
      return "ยกเลิก";
    case "SKIPPED":
      return "ข้าม";
    default:
      return s;
  }
}

function statusBadgeClass(s: string): string {
  switch (s) {
    case "WAITING":
      return "bg-amber-100 text-amber-950 ring-amber-200";
    case "CALLED":
      return "bg-indigo-100 text-indigo-950 ring-indigo-200";
    case "SEATED":
      return "bg-emerald-100 text-emerald-950 ring-emerald-200";
    case "CANCELLED":
      return "bg-slate-200 text-slate-800 ring-slate-300";
    case "SKIPPED":
      return "bg-rose-50 text-rose-900 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-800 ring-slate-200";
  }
}

export function WaitQueueDashboardClient({ initial }: { initial: WaitQueueDashboardDto }) {
  const [data, setData] = useState<WaitQueueDashboardDto>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  const [partySize, setPartySize] = useState(WAIT_QUEUE_ADD_FORM_EXAMPLE.partySize);
  const [customerName, setCustomerName] = useState(WAIT_QUEUE_ADD_FORM_EXAMPLE.customerName);
  const [note, setNote] = useState(WAIT_QUEUE_ADD_FORM_EXAMPLE.note);

  const prevAnnouncedCallIdRef = useRef<string | undefined>(undefined);
  const skipInitialSpeechRef = useRef(true);

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported());
    try {
      const v = localStorage.getItem(VOICE_ENABLED_STORAGE_KEY);
      if (v === "0") setVoiceOn(false);
    } catch {
      /* ignore */
    }
  }, []);

  const setVoiceOnPersist = useCallback((on: boolean) => {
    setVoiceOn(on);
    try {
      localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const speakCurrentCallAnnouncement = useCallback(
    async (reportFailure?: boolean) => {
      const c = data.currentCalled;
      if (!c) return;
      const ok = await speakWaitQueueAnnouncement(
        buildWaitQueueAnnouncementPhrase({
          ticketLabel: c.ticketLabel,
          callMessage: data.site.callMessage,
          note: c.note,
          customerName: c.customerName,
          partySize: c.partySize,
        }),
      );
      if (!ok && reportFailure) {
        setError(
          "เล่นเสียงประกาศไม่ได้ — เปิดลำโพงหรือระดับเสียงแท็บนี้ · หรือติดตั้งเสียงอังกฤษในระบบ · หรือตั้ง GOOGLE_CLOUD_TTS_API_KEY บนเซิร์ฟเวอร์",
        );
      }
    },
    [data.currentCalled, data.site.callMessage],
  );

  useEffect(() => {
    return () => cancelWaitQueueSpeech();
  }, []);

  useEffect(() => {
    if (!speechSupported) return;

    const id = data.currentCalled?.id;
    if (skipInitialSpeechRef.current) {
      skipInitialSpeechRef.current = false;
      prevAnnouncedCallIdRef.current = id;
      return;
    }

    if (id === prevAnnouncedCallIdRef.current) return;
    prevAnnouncedCallIdRef.current = id;

    if (!voiceOn || !data.currentCalled || !id) return;
    speakCurrentCallAnnouncement();
  }, [data.currentCalled, speechSupported, voiceOn, speakCurrentCallAnnouncement]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wait-queue/dashboard", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as WaitQueueDashboardDto;
    setData(json);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function runJson(url: string, init?: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "เกิดข้อผิดพลาด");
        return null;
      }
      await refresh();
      return json;
    } finally {
      setBusy(false);
    }
  }

  function openAddTicketModal() {
    setPartySize(WAIT_QUEUE_ADD_FORM_EXAMPLE.partySize);
    setCustomerName(WAIT_QUEUE_ADD_FORM_EXAMPLE.customerName);
    setNote(WAIT_QUEUE_ADD_FORM_EXAMPLE.note);
    setAddModalOpen(true);
  }

  async function submitNewTicket() {
    const json = await runJson("/api/wait-queue/tickets", {
      method: "POST",
      body: JSON.stringify({
        partySize,
        customerName: customerName.trim() || undefined,
        note: note.trim() || undefined,
      }),
    });
    if (json !== null) {
      setAddModalOpen(false);
      setPartySize(WAIT_QUEUE_ADD_FORM_EXAMPLE.partySize);
      setCustomerName(WAIT_QUEUE_ADD_FORM_EXAMPLE.customerName);
      setNote(WAIT_QUEUE_ADD_FORM_EXAMPLE.note);
    }
  }

  async function patchTicket(id: string, action: string) {
    await runJson(`/api/wait-queue/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
  }

  async function callNext() {
    await runJson("/api/wait-queue/call-next", { method: "POST", body: "{}" });
  }

  const called = data.currentCalled;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          {error}
        </div>
      ) : null}

      {called ? (
        <section
          className={cn(
            "relative overflow-hidden rounded-[2.5rem] border border-indigo-200/80 bg-gradient-to-br from-indigo-500/95 via-violet-500/90 to-fuchsia-500/85 p-6 text-white shadow-[0_28px_70px_-28px_rgba(49,46,129,0.65)]",
            "ring-1 ring-white/25",
          )}
          aria-live="polite"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">ถึงคิวแล้ว</p>
              <p className="mt-2 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{called.ticketLabel}</p>
              <p className="mt-4 max-w-xl text-lg font-bold leading-snug text-white/95">{data.site.callMessage}</p>
            </div>

            <div className="flex min-w-0 shrink-0 flex-col gap-3 border-t border-white/20 pt-4 md:w-[min(100%,20rem)] md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-right">
              {called.customerName ? (
                <p className="text-sm font-semibold text-white/90 md:ml-auto">
                  เรียกชื่อ: <span className="font-bold text-white">{called.customerName}</span>
                </p>
              ) : null}
              <p className="text-xs font-semibold text-white/75 md:ml-auto">
                {called.partySize} ท่าน · อัปเดตอัตโนมัติทุก {refreshIntervalMs / 1000} วินาที
              </p>
              {speechSupported ? (
                <div className="flex flex-col gap-2 md:ml-auto md:items-end">
                  <button
                    type="button"
                    onPointerDown={() => primeWaitQueueAudioContext()}
                    onClick={() => void speakCurrentCallAnnouncement(true)}
                    className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-white/45 bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25 active:scale-[0.98] md:w-auto md:justify-end"
                    aria-label="พูดประกาศคิวอีกครั้ง"
                    title="พูดประกาศคิวอีกครั้ง"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    พูดอีกครั้ง
                  </button>
                  {!voiceOn ? (
                    <span className="max-w-full text-[11px] font-semibold leading-snug text-white/75 md:max-w-[14rem] md:text-right">
                      ปิดเสียงอัตโนมัติอยู่ — กดปุ่มนี้เพื่อให้อ่านผ่านลำโพงของเครื่อง
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs font-semibold text-white/70 md:ml-auto">เบราว์เซอร์นี้ไม่รองรับการพูดประกาศ (ลอง Chrome / Edge / Safari)</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-white/60 bg-white/35 px-5 py-8 text-center backdrop-blur-md">
          <p className="text-sm font-bold text-[#66638c]">ยังไม่มีคิวที่ถูกเรียก — กด «เรียกคิวถัดไป» หรือเรียกจากรายการด้านล่าง</p>
        </section>
      )}

      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 pt-0.5 sm:pt-0"
          title="สรุปวันนี้"
          description={`ปฏิทิน Bangkok · ${data.dateKey}`}
          action={
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold backdrop-blur-sm",
                speechSupported
                  ? "border-white/55 bg-white/45 text-[#5f5a8a] ring-1 ring-white/45"
                  : "cursor-not-allowed border-slate-200/80 bg-slate-100/60 text-slate-500",
              )}
              title={
                speechSupported
                  ? "ใช้ลำโพงหรืออุปกรณ์ขาออกที่ระบบเลือกไว้ — ประกาศเมื่อมีคิวใหม่"
                  : "เบราว์เซอร์ไม่รองรับ Web Speech API"
              }
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]/40"
                checked={voiceOn}
                onChange={(e) => setVoiceOnPersist(e.target.checked)}
                disabled={!speechSupported}
                aria-label="เปิดหรือปิดเสียงประกาศคิวอัตโนมัติ"
              />
              <span className="select-none">เสียงประกาศ</span>
            </label>
          }
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="relative overflow-hidden rounded-[1rem] border border-violet-200/70 bg-gradient-to-br from-white via-violet-50/50 to-indigo-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700/80">คิวทั้งหมด</p>
            <p className="mt-1 bg-gradient-to-br from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
              {(data.stats.waiting + data.stats.called + data.stats.seated + data.stats.cancelled + data.stats.skipped).toLocaleString("th-TH")}
              <span className="ml-1 text-sm font-bold text-[#8b87ad]">ราย</span>
            </p>
            <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-violet-300/40 via-indigo-200/30 to-transparent blur-2xl" />
          </div>
          <div className="relative overflow-hidden rounded-[1rem] border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/55 to-orange-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">กำลังรอ</p>
            <p className="mt-1 bg-gradient-to-br from-amber-500 via-orange-500 to-[#ea580c] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
              {data.stats.waiting.toLocaleString("th-TH")}
              <span className="ml-1 text-sm font-bold text-[#b45309]">ราย</span>
            </p>
            <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-amber-300/45 via-orange-200/30 to-transparent blur-2xl" />
          </div>
          <div className="relative overflow-hidden rounded-[1rem] border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/55 to-violet-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">กำลังให้บริการ</p>
            <p className="mt-1 bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#7c3aed] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
              {data.stats.called.toLocaleString("th-TH")}
              <span className="ml-1 text-sm font-bold text-[#6366f1]">ราย</span>
            </p>
            <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-300/45 via-violet-200/30 to-transparent blur-2xl" />
          </div>
          <div className="relative overflow-hidden rounded-[1rem] border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/55 to-teal-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">เสร็จแล้ว</p>
            <p className="mt-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-[#0d9488] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
              {data.stats.seated.toLocaleString("th-TH")}
              <span className="ml-1 text-sm font-bold text-[#0d9488]">ราย</span>
            </p>
            <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-300/45 via-teal-200/30 to-transparent blur-2xl" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={busy || data.stats.waiting === 0}
            onClick={() => void callNext()}
            className="app-btn-primary inline-flex min-h-[56px] w-full flex-1 items-center justify-center gap-2 rounded-[1.35rem] px-6 py-4 text-base font-black shadow-[0_14px_36px_-12px_rgba(91,97,255,0.55)] disabled:opacity-40 sm:min-h-[52px] sm:min-w-[min(100%,18rem)] sm:text-lg"
            suppressHydrationWarning
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
            </svg>
            เรียกคิวถัดไป
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-black sm:min-h-[52px] sm:min-w-0",
            )}
            aria-label="รีเฟรชข้อมูลคิว"
            suppressHydrationWarning
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v7h-7" />
            </svg>
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="คิวทั้งหมดวันนี้"
          description="เรียงตามลำดับที่ลงทะเบียน"
          action={
            <button
              type="button"
              onClick={openAddTicketModal}
              aria-label="ลงคิวใหม่"
              title="ลงคิวใหม่"
              className="app-btn-primary inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-black"
              suppressHydrationWarning
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>ลงคิวใหม่</span>
            </button>
          }
        />

        <FormModal
          open={addModalOpen}
          onClose={() => !busy && setAddModalOpen(false)}
          title="ลงคิวใหม่"
          description="ออกเลขตามลำดับวันนี้ · แก้ในช่องได้ก่อนบันทึก"
          ariaDescribedBy="form-modal-description"
          appearance="glass"
          size="md"
          footer={
            <FormModalFooterActions
              cancelLabel="ยกเลิก"
              onCancel={() => !busy && setAddModalOpen(false)}
              submitLabel="บันทึกคิว"
              onSubmit={() => void submitNewTicket()}
              loading={busy}
              submitDisabled={busy}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-bold text-[#1e1b4b]">
                จำนวนคน
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  placeholder="1–99"
                  inputMode="numeric"
                  className="min-h-[44px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-semibold tabular-nums text-[#1e1b4b] shadow-inner backdrop-blur-sm"
                  suppressHydrationWarning
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-[#1e1b4b]">
                  <span>ชื่อเรียก</span>
                  <span className="text-xs font-semibold text-[#66638c]">ไม่บังคับ</span>
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น ครอบครัวสมชาย"
                  autoComplete="off"
                  className="min-h-[44px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-semibold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
                  suppressHydrationWarning
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-[#1e1b4b]">
                  <span>หมายเหตุ</span>
                  <span className="text-xs font-semibold text-[#66638c]">ไม่บังคับ</span>
                </span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น โต๊ะสูง ชั้น 2 · เด็กเล็ก"
                  autoComplete="off"
                  className="min-h-[44px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-semibold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
                  suppressHydrationWarning
                />
              </label>
            </div>
          </div>
        </FormModal>

        {data.tickets.length === 0 ? (
          <AppEmptyState>ยังไม่มีคิวในวันนี้ — กดปุ่ม «ลงคิวใหม่» มุมขวาบนการ์ดนี้เพื่อบันทึกคิว</AppEmptyState>
        ) : (
          <ul className="space-y-3">
            {data.tickets.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-[1.75rem] border border-white/55 bg-white/45 p-4 shadow-sm backdrop-blur-sm ring-1 ring-white/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl font-black tabular-nums text-[#1e1b4b]">{t.ticketLabel}</span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-black ring-1", statusBadgeClass(t.status))}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#66638c]">
                    {t.partySize} ท่าน
                    {t.customerName ? ` · ${t.customerName}` : ""}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:flex-wrap sm:justify-end">
                  {t.status === "WAITING" ? (
                    <div className="flex w-full flex-row flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchTicket(t.id, "call")}
                        aria-label={`เรียกคิว ${t.ticketLabel}`}
                        title="เรียกคิว"
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#5b61ff]/45 bg-gradient-to-br from-[#5b61ff] to-[#6d28d9] px-3 py-2 text-sm font-black text-white shadow-[0_8px_22px_-8px_rgba(91,97,255,0.5)] transition active:scale-[0.98] disabled:opacity-40"
                        suppressHydrationWarning
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
                        </svg>
                        เรียกคิว
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchTicket(t.id, "cancel")}
                        aria-label={`ยกเลิกคิว ${t.ticketLabel}`}
                        title="ยกเลิกคิว"
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm disabled:opacity-40"
                        suppressHydrationWarning
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        </svg>
                        ยกเลิก
                      </button>
                    </div>
                  ) : null}
                  {t.status === "CALLED" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchTicket(t.id, "seat")}
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-40"
                        suppressHydrationWarning
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        เข้าร้านแล้ว
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchTicket(t.id, "skip")}
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-900 disabled:opacity-40"
                        suppressHydrationWarning
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                        ข้าม
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchTicket(t.id, "cancel")}
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40"
                        suppressHydrationWarning
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        </svg>
                        ยกเลิก
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}

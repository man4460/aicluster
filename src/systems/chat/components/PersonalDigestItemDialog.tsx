"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { DailyDigestNote, DailyReminderItem } from "@/lib/reminders/daily-reminder-types";
import { formatActivityTimeThLabel } from "@/lib/reminders/activity-time-from-text";
import { formatBangkokDigestDateLabel } from "@/lib/reminders/bangkok-calendar";
import {
  digestReminderDisplay,
  DIGEST_HEADLINE_MAX,
  headlineWithoutDuplicateTime,
  isGenericQuickNoteAttribution,
  splitDigestText,
  stripDigestNoise,
} from "@/lib/reminders/personal-digest-text";
import { cn } from "@/lib/cn";

const BTN_SOFT =
  "app-btn-soft rounded-xl border border-[#dcd8f0] text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] disabled:opacity-50";
const BTN_PRIMARY =
  "app-btn-primary rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50";

export type PersonalDigestItemDialogPayload =
  | { type: "reminder"; item: DailyReminderItem }
  | { type: "note"; note: DailyDigestNote };

type Props = {
  open: boolean;
  onClose: () => void;
  payload: PersonalDigestItemDialogPayload | null;
  onApplied: () => void;
};

async function patchJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "คำขอล้มเหลว");
  }
}

export async function completeDigestReminderItem(item: DailyReminderItem): Promise<void> {
  if (item.status === "done") {
    throw new Error("รายการนี้เสร็จแล้ว");
  }
  if (item.source === "home_finance_reminder") {
    const raw = item.id.replace(/^hfr-/, "");
    if (!/^\d+$/.test(raw)) throw new Error("รหัสรายการไม่ถูกต้อง");
    await patchJson(`/api/home-finance/reminders/${raw}`, { isDone: true });
    return;
  }
  if (item.source === "personal_plan") {
    const id = item.id.replace(/^plan-/, "");
    if (!id) throw new Error("รหัสแผนไม่ถูกต้อง");
    await patchJson(`/api/chat-ai/personal-plans/${encodeURIComponent(id)}`, { status: "DONE" });
    return;
  }
  if (item.source === "barber_booking") {
    const raw = item.id.replace(/^bb-/, "");
    if (!/^\d+$/.test(raw)) throw new Error("รหัสนัดไม่ถูกต้อง");
    await patchJson(`/api/barber/bookings/${raw}`, { status: "ARRIVED" });
    return;
  }
  if (item.source === "personal_note") {
    const m = /^note-(.+)-(today|tomorrow)$/.exec(item.id);
    const noteId = m?.[1];
    if (!noteId) throw new Error("รหัสโน้ตไม่ถูกต้อง");
    await patchJson(`/api/chat-ai/notes/${encodeURIComponent(noteId)}`, { hiddenFromDigest: true });
    return;
  }
  throw new Error("ไม่รองรับประเภทรายการนี้");
}

export function PersonalDigestItemDialog({ open, onClose, payload, onApplied }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hfrTitle, setHfrTitle] = useState("");
  const [hfrDueDate, setHfrDueDate] = useState("");
  const [hfrNote, setHfrNote] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const initForms = useCallback((p: PersonalDigestItemDialogPayload) => {
    if (p.type === "reminder") {
      const { item } = p;
      if (item.source === "home_finance_reminder") {
        setHfrTitle(item.title);
        setHfrDueDate(item.dueDate);
        setHfrNote((item.description ?? "").trim());
      } else if (item.source === "personal_plan") {
        setPlanTitle(item.title);
      } else if (item.source === "personal_note") {
        setNoteBody((item.fullText ?? item.title).trim());
      }
    } else {
      setNoteBody(p.note.content);
    }
  }, []);

  useEffect(() => {
    if (open && payload) {
      initForms(payload);
      setErr(null);
      setEditing(false);
    }
  }, [open, payload, initForms]);

  const handleSaveEdit = async () => {
    if (!payload) return;
    setBusy(true);
    setErr(null);
    try {
      if (payload.type === "note") {
        const t = noteBody.trim();
        if (!t) {
          setErr("เนื้อหาไม่ว่างได้");
          return;
        }
        await patchJson(`/api/chat-ai/notes/${encodeURIComponent(payload.note.id)}`, { content: t });
        onApplied();
        onClose();
        return;
      }
      const { item } = payload;
      if (item.source === "home_finance_reminder") {
        const raw = item.id.replace(/^hfr-/, "");
        const t = hfrTitle.trim();
        if (!t) {
          setErr("ใส่หัวข้อ");
          return;
        }
        await patchJson(`/api/home-finance/reminders/${raw}`, {
          title: t,
          dueDate: hfrDueDate,
          note: hfrNote.trim() || null,
        });
        onApplied();
        onClose();
        return;
      }
      if (item.source === "personal_plan") {
        const t = planTitle.trim();
        if (!t) {
          setErr("ใส่หัวข้อ");
          return;
        }
        const id = item.id.replace(/^plan-/, "");
        await patchJson(`/api/chat-ai/personal-plans/${encodeURIComponent(id)}`, { title: t });
        onApplied();
        onClose();
        return;
      }
      if (item.source === "personal_note") {
        const m = /^note-(.+)-(today|tomorrow)$/.exec(item.id);
        const noteId = m?.[1];
        if (!noteId) {
          setErr("รหัสโน้ตไม่ถูกต้อง");
          return;
        }
        const t = noteBody.trim();
        if (!t) {
          setErr("เนื้อหาไม่ว่างได้");
          return;
        }
        await patchJson(`/api/chat-ai/notes/${encodeURIComponent(noteId)}`, { content: t });
        onApplied();
        onClose();
        return;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!payload) return;
    setBusy(true);
    setErr(null);
    try {
      if (payload.type === "note") {
        await patchJson(`/api/chat-ai/notes/${encodeURIComponent(payload.note.id)}`, { hiddenFromDigest: true });
      } else {
        await completeDigestReminderItem(payload.item);
      }
      onApplied();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (!open || !payload) return null;

  const p = payload;
  const item = p.type === "reminder" ? p.item : null;
  const note = p.type === "note" ? p.note : null;

  const canEdit = (() => {
    if (p.type === "note") return true;
    if (p.item.status === "done") return false;
    return p.item.source !== "barber_booking";
  })();

  const canComplete = (() => {
    if (p.type === "note") return true;
    return p.item.status === "pending";
  })();

  const titleLine =
    p.type === "note"
      ? "บันทึกล่าสุด"
      : {
          home_finance_reminder: "รายจ่าย / กำหนด (บัญชี)",
          personal_plan: "แผนงาน",
          barber_booking: "จองคิว (ร้านตัดผม)",
          personal_note: "โน้ต (วันนี้/พรุ่งนี้)",
        }[p.item.source];

  const sourceHint =
    p.type === "note"
      ? "แก้เนื้อ หรือกด「ดำเนินการแล้ว」เพื่อซ่อนออกจากสรุป (โน้ตยังเก็บใน「โน้ตทั้งหมด」)"
      : {
          home_finance_reminder: "แก้หัวข้อ วันครบ หรือทำเครื่องหมายชำระแล้ว",
          personal_plan: "แก้ชื่อแผน หรือทำแผนให้เสร็จ (DONE)",
          barber_booking: "นัดร้านตัดผม — แก้นัดได้ในโมดูลตัดผม; กด「ดำเนินการแล้ว」= บันทึกว่าเข้าใช้บริการแล้ว (เข้าร้าน)",
          personal_note: "แก้ข้อความโน้ต หรือซ่อนออกจากสรุป",
        }[p.item.source];

  let timeLabel: string | null = null;
  let planDueRow: ReactNode = null;
  let viewHead = "";
  let viewDetail: string | null = null;

  if (p.type === "note" && note) {
    const act = formatActivityTimeThLabel(note.content);
    const h = splitDigestText(note.content);
    const hl = headlineWithoutDuplicateTime(h.headline, act);
    viewHead = !hl.trim() ? stripDigestNoise(String(note.content).slice(0, DIGEST_HEADLINE_MAX)) : hl;
    viewDetail = h.detail;
    timeLabel = act || null;
  } else if (item) {
    if (item.source === "personal_note" && item.fullText) {
      const act = formatActivityTimeThLabel(item.fullText);
      const h = splitDigestText(item.fullText);
      const hl = headlineWithoutDuplicateTime(h.headline, act);
      timeLabel = act || null;
      const head = !hl.trim() ? stripDigestNoise(String(item.fullText).slice(0, DIGEST_HEADLINE_MAX)) : hl;
      viewHead = head;
      viewDetail = h.detail;
    } else {
      const dueTimeSafe = String(item.dueTime ?? "").trim();
      const showTime = Boolean(dueTimeSafe && /^\d{2}:\d{2}$/.test(dueTimeSafe));
      const activityFromText = !showTime && String(item.title).trim() ? formatActivityTimeThLabel(String(item.title)) : null;
      timeLabel = (showTime ? `${dueTimeSafe} น.` : activityFromText) || null;
      const d = digestReminderDisplay(item);
      let h2 = d.headline;
      h2 = headlineWithoutDuplicateTime(h2, timeLabel);
      if (d.detail && isGenericQuickNoteAttribution(d.detail)) {
        viewDetail = null;
      } else {
        viewDetail = d.detail;
      }
      if (!h2.trim() && String(item.title).trim()) {
        h2 = stripDigestNoise(String(item.title).slice(0, DIGEST_HEADLINE_MAX));
      }
      viewHead = h2;
    }
    const tPlan = String(item.dueTime ?? "").trim();
    const showTimePlan = Boolean(tPlan && /^\d{2}:\d{2}$/.test(tPlan));
    if (item.source === "personal_plan" && !showTimePlan && item.dueDate) {
      planDueRow = (
        <p className="text-xs text-slate-500">
          ครบ{" "}
          {/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
            ? formatBangkokDigestDateLabel(`${item.dueDate}T12:00:00.000Z`)
            : item.dueDate}
        </p>
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-[215] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-item-dialog-title"
    >
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="ปิด" onClick={onClose} />
      <div
        className="relative m-0 flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#e4e2f5] bg-white shadow-2xl sm:m-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-[#ebe9f7] bg-gradient-to-r from-white to-[#faf9ff] px-4 py-3">
          <div className="min-w-0">
            <h2 id="digest-item-dialog-title" className="text-sm font-semibold text-[#2e2a58]">
              {titleLine}
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{sourceHint}</p>
          </div>
          <button type="button" onClick={onClose} className={cn(BTN_SOFT, "shrink-0 px-2.5 py-1")}>
            ปิด
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {err ? (
            <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</p>
          ) : null}
          {note ? <p className="text-[10px] text-slate-500">{formatBangkokDigestDateLabel(note.createdAt)}</p> : null}
          {timeLabel ? (
            <span className="mt-2 inline-flex w-fit items-center rounded-md border border-slate-200/80 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-slate-700">
              {timeLabel}
            </span>
          ) : null}

          {editing && p.type === "reminder" && item?.source === "home_finance_reminder" ? (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-[10px] font-medium text-slate-600">หัวข้อ</label>
                <input
                  value={hfrTitle}
                  onChange={(e) => setHfrTitle(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  maxLength={160}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600">วันครบ (YYYY-MM-DD)</label>
                <input
                  value={hfrDueDate}
                  onChange={(e) => setHfrDueDate(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  maxLength={10}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600">โน้ต</label>
                <input
                  value={hfrNote}
                  onChange={(e) => setHfrNote(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  maxLength={400}
                  disabled={busy}
                />
              </div>
            </div>
          ) : editing && p.type === "reminder" && item?.source === "personal_plan" ? (
            <div className="mt-3">
              <label className="text-[10px] font-medium text-slate-600">หัวข้อแผน</label>
              <input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                maxLength={200}
                disabled={busy}
              />
            </div>
          ) : editing ? (
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              maxLength={20000}
              rows={8}
              className="mt-3 w-full rounded-xl border border-[#dcd8f0] bg-white p-2 text-sm text-slate-900 shadow-inner outline-none focus:border-[#0000BF]/30"
              disabled={busy}
            />
          ) : (
            <div className="mt-3 min-h-[3rem]">
              <p className="whitespace-pre-wrap break-words text-sm font-medium text-slate-900">{viewHead || "—"}</p>
              {viewDetail ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{viewDetail}</p> : null}
            </div>
          )}
          {planDueRow}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#ebe9f7] bg-slate-50/80 px-4 py-3">
          {editing ? (
            <>
              <button type="button" disabled={busy} onClick={() => void handleSaveEdit()} className={BTN_PRIMARY}>
                {busy ? "…" : "บันทึกการแก้ไข"}
              </button>
              <button type="button" disabled={busy} onClick={() => setEditing(false)} className={cn(BTN_SOFT, "px-3 py-2")}>
                กลับ
              </button>
            </>
          ) : (
            <>
              {canEdit ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (p.type === "reminder") {
                      const it = p.item;
                      if (it.source === "home_finance_reminder") {
                        setHfrTitle(it.title);
                        setHfrDueDate(it.dueDate);
                        setHfrNote((it.description ?? "").trim());
                      } else if (it.source === "personal_plan") {
                        setPlanTitle(it.title);
                      } else if (it.source === "personal_note") {
                        setNoteBody((it.fullText ?? it.title).trim());
                      } else {
                        return;
                      }
                    } else {
                      setNoteBody(p.note.content);
                    }
                    setErr(null);
                    setEditing(true);
                  }}
                  className={cn(BTN_SOFT, "px-3 py-2")}
                >
                  แก้ไข
                </button>
              ) : null}
              {canComplete ? (
                <button type="button" disabled={busy} onClick={() => void handleComplete()} className={BTN_PRIMARY}>
                  {busy ? "…" : "ดำเนินการแล้ว"}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

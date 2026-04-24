"use client";

import { useCallback, useEffect, useState } from "react";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDigestDateTimeLabel } from "@/lib/reminders/bangkok-calendar";

export type ChatAiNoteRow = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** หลังลบโน้ตสำเร็จ — รีเฟรชแผงสรุป */
  onNotesChanged?: () => void;
};

async function parseJson<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text();
  if (!text.trim()) return { ok: false, message: `เซิร์ฟเวอร์ไม่ส่งข้อมูล (${res.status})` };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" };
  }
}

export function PersonalAiNotesModal({ open, onClose, onNotesChanged }: Props) {
  const [notes, setNotes] = useState<ChatAiNoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat-ai/notes?_=${Date.now()}`, { credentials: "include", cache: "no-store" });
      const parsed = await parseJson<{ notes: ChatAiNoteRow[]; error?: string }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        setNotes([]);
        return;
      }
      if (!res.ok) {
        setError(parsed.data.error ?? "โหลดโน้ตไม่สำเร็จ");
        setNotes([]);
        return;
      }
      setNotes(parsed.data.notes ?? []);
    } catch {
      setError("เครือข่ายมีปัญหา");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function removeNote(id: string) {
    if (!confirm("ลบโน้ตนี้?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/chat-ai/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const parsed = await parseJson<{ error?: string }>(res);
        setError(parsed.ok ? parsed.data.error ?? "ลบไม่สำเร็จ" : parsed.message);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
      onNotesChanged?.();
    } catch {
      setError("ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="personal-ai-notes-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="ปิด" onClick={onClose} />
      <div className="relative flex max-h-[min(85dvh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="personal-ai-notes-title" className="text-base font-semibold text-[#2e2a58]">
            โน้ตทั้งหมด
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className={cn(
                appTemplateOutlineButtonClass,
                "px-2.5 py-1.5 text-xs font-medium disabled:opacity-50",
              )}
            >
              รีเฟรช
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(appTemplateOutlineButtonClass, "px-2.5 py-1.5 text-xs font-medium")}
            >
              ปิด
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {loading && !notes.length ? <p className="text-center text-sm text-slate-500">กำลังโหลด…</p> : null}
          {!loading && !notes.length && !error ? (
            <p className="text-center text-sm text-slate-500">ยังไม่มีโน้ต</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{n.content}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    {formatBangkokDigestDateTimeLabel(n.createdAt)}
                    {n.tags.length ? ` · ${n.tags.join(", ")}` : ""}
                  </p>
                  <button
                    type="button"
                    disabled={deletingId === n.id}
                    onClick={() => void removeNote(n.id)}
                    className={cn(
                      "mt-2 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50",
                      deletingId === n.id && "opacity-50",
                    )}
                  >
                    {deletingId === n.id ? "กำลังลบ…" : "ลบ"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const NOTES_MODAL_SOFT_BTN =
  "app-btn-soft rounded-xl border border-[#dcd8f0] text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] disabled:opacity-50";
import { formatBangkokDigestDateTimeLabel } from "@/lib/reminders/bangkok-calendar";

export type ChatAiNoteRow = {
  id: string;
  content: string;
  tags: string[];
  /** ซ่อนจากแถบสรุป Chat AI — ยังอยู่ในรายการโน้ตทั้งหมด */
  hiddenFromDigest: boolean;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat-ai/notes?_=${Date.now()}`, { credentials: "include", cache: "no-store" });
      const parsed = await parseJson<{ notes: Partial<ChatAiNoteRow>[]; error?: string }>(res);
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
      const raw = parsed.data.notes ?? [];
      setNotes(
        raw.map((r) => ({
          id: String(r.id ?? ""),
          content: String(r.content ?? ""),
          tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : [],
          hiddenFromDigest: Boolean(r.hiddenFromDigest),
          createdAt: String(r.createdAt ?? ""),
        })),
      );
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

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditDraft("");
      setPatchingId(null);
    }
  }, [open]);

  async function patchNote(id: string, body: Record<string, unknown>) {
    setPatchingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/chat-ai/notes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const parsed = await parseJson<{ error?: string }>(res);
      if (!res.ok) {
        setError(parsed.ok ? parsed.data.error ?? "อัปเดตไม่สำเร็จ" : parsed.message);
        return;
      }
      if (typeof body.content === "string") {
        setNotes((prev) => prev.map((x) => (x.id === id ? { ...x, content: body.content as string } : x)));
        setEditingId(null);
      }
      if (typeof body.hiddenFromDigest === "boolean") {
        setNotes((prev) =>
          prev.map((x) => (x.id === id ? { ...x, hiddenFromDigest: body.hiddenFromDigest as boolean } : x)),
        );
      }
      onNotesChanged?.();
    } catch {
      setError("อัปเดตไม่สำเร็จ");
    } finally {
      setPatchingId(null);
    }
  }

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
              className={cn(NOTES_MODAL_SOFT_BTN, "px-2.5 py-1.5")}
            >
              รีเฟรช
            </button>
            <button type="button" onClick={onClose} className={cn(NOTES_MODAL_SOFT_BTN, "px-2.5 py-1.5")}>
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
              {notes.map((n) => {
                const isEditing = editingId === n.id;
                const busy = patchingId === n.id;
                return (
                  <li key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    {n.hiddenFromDigest ? (
                      <p className="mb-2 inline-block rounded-full bg-slate-200/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        ซ่อนจากแถบสรุปแล้ว
                      </p>
                    ) : null}
                    {isEditing ? (
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={5}
                        maxLength={4000}
                        disabled={busy}
                        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-[#0000BF]/35"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-slate-800">{n.content}</p>
                    )}
                    <p className="mt-2 text-[10px] text-slate-400">
                      {formatBangkokDigestDateTimeLabel(n.createdAt)}
                      {n.tags.length ? ` · ${n.tags.join(", ")}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void patchNote(n.id, { content: editDraft.trim() })}
                            className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            {busy ? "…" : "บันทึก"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft("");
                            }}
                            className={cn(NOTES_MODAL_SOFT_BTN, "px-2 py-1")}
                          >
                            ยกเลิก
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busy || deletingId !== null}
                            onClick={() => {
                              setEditingId(n.id);
                              setEditDraft(n.content);
                            }}
                            className={cn(NOTES_MODAL_SOFT_BTN, "px-2 py-1")}
                          >
                            แก้ไข
                          </button>
                          {n.hiddenFromDigest ? (
                            <button
                              type="button"
                              disabled={busy || deletingId !== null}
                              onClick={() => void patchNote(n.id, { hiddenFromDigest: false })}
                              className={cn(NOTES_MODAL_SOFT_BTN, "px-2 py-1")}
                            >
                              แสดงในแถบสรุปอีกครั้ง
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy || deletingId !== null}
                              onClick={() => void patchNote(n.id, { hiddenFromDigest: true })}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              ทำแล้ว (ซ่อนจากแถบสรุป)
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deletingId === n.id || busy}
                            onClick={() => void removeNote(n.id)}
                            className={cn(
                              "rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50",
                              deletingId === n.id && "opacity-50",
                            )}
                          >
                            {deletingId === n.id ? "กำลังลบ…" : "ลบ"}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatBangkokDigestDateTimeLabel } from "@/lib/reminders/bangkok-calendar";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HomeFinanceOverviewSubNav } from "@/systems/home-finance/components/HomeFinancePageSubNav";
import {
  HomeFinanceCardHeaderActions,
  HomeFinanceCardIconFilterButton,
  HomeFinanceCardIconRefreshButton,
  HomeFinanceCardIconSaveButton,
  HomeFinanceRowIconCancelButton,
  HomeFinanceRowIconConfirmButton,
} from "@/systems/home-finance/components/HomeFinanceCardHeaderActions";
import { homeFinanceTonedRowCardClass } from "@/systems/home-finance/lib/card-tones";
import {
  homeFinanceFieldClass,
  homeFinanceOffersEmptyStateClass,
  homeFinanceTextareaClass,
} from "@/systems/home-finance/lib/ui-tokens";

type NoteRow = {
  id: string;
  content: string;
  createdAt: string;
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

function noteApiError(message: string | undefined, fallback: string): string {
  const m = (message ?? "").trim();
  if (!m) return fallback;
  if (m.includes("เลขาส่วนตัว") || m.includes("อยู่ระหว่างพัฒนา")) return fallback;
  return m;
}

export function HomeFinanceNotesClient() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/notes?_=${Date.now()}`, { credentials: "include", cache: "no-store" });
      const parsed = await parseJson<{ notes: Partial<NoteRow>[]; error?: string }>(res);
      if (!parsed.ok) {
        setError(noteApiError(parsed.message, "โหลดโน้ตไม่สำเร็จ"));
        setNotes([]);
        return;
      }
      if (!res.ok) {
        setError(noteApiError(parsed.data.error, "โหลดโน้ตไม่สำเร็จ"));
        setNotes([]);
        return;
      }
      setNotes(
        (parsed.data.notes ?? []).map((r) => ({
          id: String(r.id ?? ""),
          content: String(r.content ?? ""),
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
    void load();
  }, [load]);

  const filtersActive = search.trim().length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.content.toLowerCase().includes(q));
  }, [notes, search]);

  async function createNote() {
    const content = draft.trim();
    if (!content) {
      setError("กรอกข้อความโน้ตก่อนบันทึก");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/home-finance/notes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const parsed = await parseJson<{ error?: string }>(res);
      if (!res.ok) {
        setError(noteApiError(parsed.ok ? parsed.data.error : parsed.message, "บันทึกไม่สำเร็จ"));
        return;
      }
      setDraft("");
      await load();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim();
    if (!content) {
      setError("เนื้อหาโน้ตว่างไม่ได้");
      return;
    }
    setPatchingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/notes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const parsed = await parseJson<{ error?: string }>(res);
      if (!res.ok) {
        setError(noteApiError(parsed.ok ? parsed.data.error : parsed.message, "อัปเดตไม่สำเร็จ"));
        return;
      }
      setNotes((prev) => prev.map((x) => (x.id === id ? { ...x, content } : x)));
      setEditingId(null);
      setEditDraft("");
    } catch {
      setError("อัปเดตไม่สำเร็จ");
    } finally {
      setPatchingId(null);
    }
  }

  async function removeNote(id: string) {
    if (!window.confirm("ลบโน้ตนี้?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const parsed = await parseJson<{ error?: string }>(res);
        setError(noteApiError(parsed.ok ? parsed.data.error : parsed.message, "ลบไม่สำเร็จ"));
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <HomeFinanceOverviewSubNav
      action={
        <HomeFinanceCardHeaderActions>
          <HomeFinanceCardIconFilterButton
            expanded={filterOpen}
            filtersActive={filtersActive}
            controls="home-finance-notes-filter-panel"
            onClick={() => setFilterOpen((o) => !o)}
          />
          <HomeFinanceCardIconRefreshButton
            label="รีเฟรชรายการโน้ต"
            onClick={() => void load()}
            disabled={loading || saving}
            busy={loading}
          />
          <HomeFinanceCardIconSaveButton
            label="บันทึกโน้ต"
            onClick={() => void createNote()}
            disabled={saving || !draft.trim()}
            busy={saving}
          />
        </HomeFinanceCardHeaderActions>
      }
    >
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-600">
          เขียนโน้ต
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="เช่น ยอดโอนเดือนหน้า · เรื่องที่ต้องเช็ค…"
            className={cn(homeFinanceTextareaClass, "mt-1")}
            disabled={saving}
          />
        </label>

        <div id="home-finance-notes-filter-panel" className={cn(filterOpen ? "block" : "hidden")}>
          <label className="block text-xs font-medium text-slate-600">
            ค้นหาโน้ต
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(homeFinanceFieldClass, "mt-1")}
              placeholder="พิมพ์คำที่ต้องการกรอง…"
              aria-label="ค้นหาโน้ต"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <p className="text-xs font-medium text-[#66638c]">
          {loading
            ? "กำลังโหลด…"
            : filtersActive
              ? `แสดง ${filtered.length}/${notes.length} รายการ`
              : `${notes.length} รายการ`}
        </p>

        {loading && !notes.length ? (
          <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : !notes.length ? (
          <p className={homeFinanceOffersEmptyStateClass}>ยังไม่มีโน้ต — เขียนด้านบนแล้วกดบันทึก</p>
        ) : filtered.length === 0 ? (
          <p className={homeFinanceOffersEmptyStateClass}>ไม่พบโน้ตที่ตรงกับคำค้น</p>
        ) : (
          <ul className="space-y-2" aria-label="รายการโน้ต">
            {filtered.map((n) => {
              const isEditing = editingId === n.id;
              const busy = patchingId === n.id || deletingId === n.id;
              return (
                <li key={n.id} className={homeFinanceTonedRowCardClass("amber")}>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {isEditing ? (
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        maxLength={4000}
                        disabled={busy}
                        className={cn(homeFinanceFieldClass, "h-auto min-h-[4.5rem] py-2")}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm font-medium text-[#1e1b4b]">{n.content}</p>
                    )}
                    <p className="text-[10px] font-medium text-[#66638c]">
                      {formatBangkokDigestDateTimeLabel(n.createdAt)}
                    </p>
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <HomeFinanceRowIconConfirmButton
                          label="บันทึกโน้ต"
                          disabled={busy}
                          onClick={() => void saveEdit(n.id)}
                        />
                        <HomeFinanceRowIconCancelButton
                          label="ยกเลิกการแก้ไข"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft("");
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {!isEditing ? (
                    <div className="flex shrink-0 items-center gap-1 self-start">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label="แก้ไขโน้ต"
                        title="แก้ไข"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(n.id);
                          setEditDraft(n.content);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label="ลบโน้ต"
                        title="ลบ"
                        disabled={busy}
                        onClick={() => void removeNote(n.id)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </HomeFinanceOverviewSubNav>
  );
}

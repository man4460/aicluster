"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type ChatUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  user: ChatUser;
};

type ThreadRow = {
  id: string;
  title: string;
  roomKind: string;
  author: { id: string; displayName: string };
  lastMessagePreview: string | null;
  updatedAt: string;
};

type TabId = "community" | "admin";

/** กัน response ว่าง / ไม่ใช่ JSON แล้ว res.json() พัง */
async function parseApiJson<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, message: `เซิร์ฟเวอร์ไม่ส่งข้อมูล (รหัส ${res.status})` };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, message: "การตอบกลับไม่ใช่ JSON — ลองรีเฟรชหรือตรวจสอบเซิร์ฟเวอร์" };
  }
}

export function ChatHub({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<TabId>("community");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [editThread, setEditThread] = useState<{ id: string; title: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminListUrl =
    tab === "admin" && isAdmin
      ? "/api/chat/threads?roomKind=ADMIN_SUPPORT&scope=all"
      : `/api/chat/threads?roomKind=${tab === "community" ? "COMMUNITY" : "ADMIN_SUPPORT"}`;

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    setErr(null);
    try {
      const res = await fetch(adminListUrl, { credentials: "include" });
      const parsed = await parseApiJson<{ error?: string; threads?: ThreadRow[] }>(res);
      if (!parsed.ok) {
        setErr(parsed.message);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setErr(data.error ?? "โหลดกระทู้ไม่สำเร็จ");
        return;
      }
      const list = data.threads ?? [];
      setThreads(list);
      if (tab === "admin" && !isAdmin && list.length === 0) {
        const cr = await fetch("/api/chat/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ roomKind: "ADMIN_SUPPORT" }),
        });
        const cp = await parseApiJson<{ error?: string; thread?: { id: string } }>(cr);
        if (!cp.ok) {
          setErr(cp.message);
          return;
        }
        const cd = cp.data;
        if (cr.ok && cd.thread) {
          setThreads([
            {
              id: cd.thread.id,
              title: "ติดต่อผู้ดูแลระบบ",
              roomKind: "ADMIN_SUPPORT",
              author: { id: "", displayName: "" },
              lastMessagePreview: null,
              updatedAt: new Date().toISOString(),
            },
          ]);
          setThreadId(cd.thread.id);
        } else if (!cr.ok) {
          setErr(cd.error ?? "สร้างห้องติดต่อแอดมินไม่สำเร็จ");
        }
        return;
      }
      setThreadId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } finally {
      setLoadingThreads(false);
    }
  }, [adminListUrl, isAdmin, tab]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  async function loadMessages() {
    if (!threadId) {
      setMessages([]);
      return;
    }
    const res = await fetch(`/api/chat/messages?threadId=${encodeURIComponent(threadId)}`, {
      credentials: "include",
    });
    const parsed = await parseApiJson<{ error?: string; messages?: Msg[] }>(res);
    if (!parsed.ok) {
      setErr(parsed.message);
      return;
    }
    const data = parsed.data;
    if (!res.ok) {
      if (res.status === 403) setErr(data.error ?? "ไม่มีสิทธิ์");
      else setErr(data.error ?? "โหลดข้อความไม่สำเร็จ");
      return;
    }
    setErr(null);
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    void loadMessages();
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    const t = setInterval(() => void loadMessages(), 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll เมื่อ threadId เปลี่ยน
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function submitEditThread(e: React.FormEvent) {
    e.preventDefault();
    if (!editThread) return;
    const title = editThread.title.trim();
    if (!title) return;
    setModerating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/chat/threads/${encodeURIComponent(editThread.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      const parsed = await parseApiJson<{ error?: string }>(res);
      if (!parsed.ok) {
        setErr(parsed.message);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setErr(data.error ?? "แก้ไขไม่สำเร็จ");
        return;
      }
      setEditThread(null);
      await loadThreads();
    } finally {
      setModerating(false);
    }
  }

  async function deleteThread(id: string) {
    if (!confirm("ลบกระทู้นี้และข้อความทั้งหมดในห้องนี้? การลบถาวร")) return;
    setModerating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/chat/threads/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const parsed = await parseApiJson<{ error?: string }>(res);
      if (!parsed.ok) {
        setErr(parsed.message);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setErr(data.error ?? "ลบไม่สำเร็จ");
        return;
      }
      if (editThread?.id === id) setEditThread(null);
      await loadThreads();
    } finally {
      setModerating(false);
    }
  }

  async function createCommunityTopic(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomKind: "COMMUNITY", title }),
      });
      const parsed = await parseApiJson<{ error?: string; thread?: { id: string } }>(res);
      if (!parsed.ok) {
        setErr(parsed.message);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setErr(data.error ?? "สร้างกระทู้ไม่สำเร็จ");
        return;
      }
      setNewTitle("");
      setShowNewTopic(false);
      await loadThreads();
      if (data.thread) setThreadId(data.thread.id);
    } finally {
      setSending(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!threadId) return;
    const t = text.trim();
    if (!t) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ threadId, content: t }),
      });
      const parsed = await parseApiJson<{ error?: string; message?: Msg }>(res);
      if (!parsed.ok) {
        setErr(parsed.message);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setErr(data.error ?? "ส่งไม่สำเร็จ");
        return;
      }
      if (data.message) setMessages((prev) => [...prev, data.message!]);
      setText("");
      void loadThreads();
    } finally {
      setSending(false);
    }
  }

  async function openAdminSupportRoom() {
    setSending(true);
    setErr(null);
    try {
      const cr = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomKind: "ADMIN_SUPPORT" }),
      });
      const cp = await parseApiJson<{ error?: string; thread?: { id: string } }>(cr);
      if (!cp.ok) {
        setErr(cp.message);
        return;
      }
      const cd = cp.data;
      if (!cr.ok) {
        setErr(cd.error ?? "เปิดห้องไม่สำเร็จ");
        return;
      }
      if (cd.thread) {
        setThreads([
          {
            id: cd.thread.id,
            title: "ติดต่อผู้ดูแลระบบ",
            roomKind: "ADMIN_SUPPORT",
            author: { id: "", displayName: "" },
            lastMessagePreview: null,
            updatedAt: new Date().toISOString(),
          },
        ]);
        setThreadId(cd.thread.id);
      }
    } finally {
      setSending(false);
    }
  }

  const newTopicModal =
    mounted && showNewTopic
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal
            aria-labelledby="new-topic-title"
            onClick={() => setShowNewTopic(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowNewTopic(false);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="new-topic-title" className="text-lg font-semibold text-[#2e2a58]">
                กระทู้ใหม่
              </h2>
              <p className="mt-1 text-xs text-slate-500">ตั้งหัวข้อแล้วทุกคนสามารถเข้ามาตอบได้</p>
              <form onSubmit={createCommunityTopic} className="mt-4 space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={280}
                  placeholder="หัวข้อกระทู้"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTopic(false)}
                    className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !newTitle.trim()}
                    className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    สร้างกระทู้
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  const editTopicModal =
    mounted && editThread
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal
            aria-labelledby="edit-topic-title"
            onClick={() => setEditThread(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditThread(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="edit-topic-title" className="text-lg font-semibold text-[#2e2a58]">
                แก้ไขหัวข้อกระทู้
              </h2>
              <p className="mt-1 text-xs text-slate-500">เฉพาะแอดมิน — หัวข้อใหม่จะแสดงให้ทุกคนเห็น</p>
              <form onSubmit={submitEditThread} className="mt-4 space-y-3">
                <input
                  value={editThread.title}
                  onChange={(e) => setEditThread((m) => (m ? { ...m, title: e.target.value } : null))}
                  maxLength={280}
                  placeholder="หัวข้อกระทู้"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditThread(null)}
                    className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={moderating || !editThread.title.trim()}
                    className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  const adminNeedsRoom = tab === "admin" && !isAdmin && !loadingThreads && !threadId;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {err}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="flex shrink-0 flex-col gap-2 lg:w-[min(100%,280px)]">
        <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("community");
              setThreadId(null);
              setThreads([]);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
              tab === "community" ? "bg-white text-[#0000BF] shadow-sm" : "text-slate-600 hover:bg-white/60",
            )}
          >
            กระทู้ชุมชน
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setThreadId(null);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
              tab === "admin" ? "bg-white text-[#0000BF] shadow-sm" : "text-slate-600 hover:bg-white/60",
            )}
          >
            ติดต่อแอดมิน
          </button>
        </div>

        {tab === "admin" && !isAdmin ? (
          <p className="text-xs leading-relaxed text-slate-500">
            ห้องส่วนตัวกับทีมแอดมิน — คนอื่นมองไม่เห็น
          </p>
        ) : null}

        {tab === "community" ? (
          <button
            type="button"
            onClick={() => {
              setErr(null);
              setShowNewTopic(true);
            }}
            className="rounded-lg border border-dashed border-[#0000BF]/40 bg-indigo-50/50 px-3 py-2.5 text-sm font-medium text-[#0000BF] hover:bg-indigo-50"
          >
            + เริ่มกระทู้ใหม่
          </button>
        ) : null}

        <div className="max-h-[40vh] space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 lg:max-h-[min(560px,calc(100dvh-16rem))]">
          {loadingThreads ? (
            <p className="px-2 py-3 text-center text-xs text-slate-400">กำลังโหลด...</p>
          ) : threads.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-slate-500">
              {tab === "community" ? "ยังไม่มีกระทู้ — กดเริ่มกระทู้ใหม่" : "ยังไม่มีข้อความ"}
            </p>
          ) : (
            threads.map((th) => (
              <div
                key={th.id}
                className={cn(
                  "flex min-w-0 items-stretch rounded-lg transition",
                  threadId === th.id ? "bg-[#0000BF]/10 ring-1 ring-[#0000BF]/15" : "hover:bg-slate-50",
                )}
              >
                <button
                  type="button"
                  onClick={() => setThreadId(th.id)}
                  className={cn(
                    "min-w-0 flex-1 px-2 py-2 text-left text-sm transition",
                    threadId === th.id ? "font-medium text-[#1e1b4b]" : "text-slate-700",
                  )}
                >
                  <span className="line-clamp-2">{th.title}</span>
                  {tab === "admin" && isAdmin ? (
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      จาก {th.author.displayName}
                    </span>
                  ) : null}
                  {th.lastMessagePreview ? (
                    <span className="mt-0.5 line-clamp-1 block text-[10px] text-slate-400">
                      {th.lastMessagePreview}
                    </span>
                  ) : null}
                </button>
                {isAdmin ? (
                  <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l border-slate-100 py-1 pr-1 pl-0.5">
                    <button
                      type="button"
                      disabled={moderating}
                      aria-label="แก้ไขหัวข้อกระทู้"
                      onClick={() => {
                        setErr(null);
                        setEditThread({ id: th.id, title: th.title });
                      }}
                      className="rounded-md px-1.5 py-1 text-[11px] font-medium text-[#0000BF] hover:bg-indigo-50 disabled:opacity-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      disabled={moderating}
                      aria-label="ลบกระทู้"
                      onClick={() => void deleteThread(th.id)}
                      className="rounded-md px-1.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-0 min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tab === "admin" && loadingThreads && !threadId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#0000BF] border-t-transparent" />
            กำลังเตรียมห้องแชท…
          </div>
        ) : !threadId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-sm text-slate-500">
            <p>
              {tab === "admin" && !isAdmin
                ? "เปิดห้องเพื่อแจ้งปัญหาหรือสอบถามทีมแอดมิน"
                : tab === "admin" && isAdmin
                  ? "ยังไม่มีคำขอ — รอผู้ใช้ส่งข้อความเข้าห้องติดต่อแอดมิน"
                  : "เลือกกระทู้จากรายการด้านซ้าย"}
            </p>
            {adminNeedsRoom ? (
              <button
                type="button"
                disabled={sending}
                onClick={() => void openAdminSupportRoom()}
                className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60"
              >
                เปิดห้องสนทนากับแอดมิน
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {m.user.avatarUrl ? (
                      <Image src={m.user.avatarUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        {m.user.displayName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{m.user.displayName}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{m.content}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(m.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
                placeholder="พิมพ์ความเห็นหรือตอบกระทู้..."
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20",
                )}
              />
              <button
                type="submit"
                disabled={sending}
                className="shrink-0 rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60"
              >
                ส่ง
              </button>
            </form>
          </>
        )}
      </div>
      </div>

      {newTopicModal}
      {editTopicModal}
    </div>
  );
}

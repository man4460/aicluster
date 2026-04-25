"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  prepareImageFileForVisionOcr,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  PERSONAL_AI_CHAT_CARD_SHELL_CLASS,
  PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS,
  PERSONAL_AI_CHAT_ROOT_CLASS,
} from "@/systems/chat/personal-ai-chat-shell";
import { PersonalAiDailyDigest } from "@/systems/chat/components/PersonalAiDailyDigest";
import { PersonalAiNotesModal } from "@/systems/chat/components/PersonalAiNotesModal";

/** ปุ่มรองแบบแดชบอร์ด (เดียวกับ car-wash / โมดูลอื่น) */
const CHAT_BTN_SOFT =
  "app-btn-soft rounded-xl border border-[#dcd8f0] text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] disabled:opacity-50";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  imageDataUrl?: string | null;
};

type ReplyResponse = {
  sessionId?: string;
  reply: string;
};

type ChatSession = {
  id: string;
  serverSessionId?: string | null;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

function buildWelcomeMessage(displayName: string): ChatMessage {
  const name = displayName.trim() || "คุณ";
  return {
    id: "welcome",
    role: "assistant",
    content:
      `สวัสดีครับ คุณ${name}\n\n` +
      "• ถามงาน / บัญชี / ทั่วไปได้เลย\n" +
      "• แนบรูปส่งคู่ข้อความได้ถ้าต้องการ\n\n" +
      "ให้ช่วยอะไรครับ?",
  };
}

const PERSONAL_AI_CHAT_STORAGE_KEY = "mia-personal-ai-chat.v1";

type PersistedChatStateV1 = {
  v: 1;
  activeSessionId: string;
  sessions: ChatSession[];
};

function defaultChatSessions(greetingName?: string): ChatSession[] {
  const name = (greetingName ?? "คุณ").trim() || "คุณ";
  return [
    {
      id: "s-default",
      serverSessionId: null,
      title: "แชทใหม่",
      messages: [buildWelcomeMessage(name)],
      updatedAt: 0,
    },
  ];
}

function loadPersistedChatState(greetingName?: string): { sessions: ChatSession[]; activeSessionId: string } {
  if (typeof window === "undefined") {
    const s = defaultChatSessions(greetingName);
    return { sessions: s, activeSessionId: s[0]!.id };
  }
  try {
    const raw = localStorage.getItem(PERSONAL_AI_CHAT_STORAGE_KEY);
    if (!raw) {
      const s = defaultChatSessions(greetingName);
      return { sessions: s, activeSessionId: s[0]!.id };
    }
    const data = JSON.parse(raw) as Partial<PersistedChatStateV1>;
    if (data.v !== 1 || !Array.isArray(data.sessions) || data.sessions.length === 0) {
      const s = defaultChatSessions(greetingName);
      return { sessions: s, activeSessionId: s[0]!.id };
    }
    const sessions = data.sessions as ChatSession[];
    const active =
      data.activeSessionId && sessions.some((x) => x.id === data.activeSessionId)
        ? data.activeSessionId
        : sessions[0]!.id;
    return { sessions, activeSessionId: active };
  } catch {
    const s = defaultChatSessions(greetingName);
    return { sessions: s, activeSessionId: s[0]!.id };
  }
}

function persistChatState(sessions: ChatSession[], activeSessionId: string): void {
  if (typeof window === "undefined") return;
  const tryWrite = (sessionsToWrite: ChatSession[]) => {
    localStorage.setItem(
      PERSONAL_AI_CHAT_STORAGE_KEY,
      JSON.stringify({ v: 1, activeSessionId, sessions: sessionsToWrite } satisfies PersistedChatStateV1),
    );
  };
  try {
    tryWrite(sessions);
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      const stripped = sessions.map((s) => ({
        ...s,
        messages: s.messages.map((m) => ({ ...m, imageDataUrl: null })),
      }));
      try {
        tryWrite(stripped);
      } catch {
        /* ignore */
      }
    }
  }
}

/** ตอบกลับจากเซิร์ฟเวอร์บ่งว่ามีการบันทึกโน้ต (รีเฟรชแผงสำรอง) */
function replySuggestsNoteSaved(reply: string): boolean {
  const t = reply.trim();
  if (!t) return false;
  if (/บันทึกโน้ตแล้ว|จดโน้ตแล้ว/u.test(t)) return true;
  if (/บันทึกเรียบร้อย/u.test(t) && /#\w{6,}/u.test(t)) return true;
  if (/เก็บแผนนี้ใน\s*[*]*บันทึกล่าสุด/u.test(t)) return true;
  return false;
}

/** ตอบกลับหลังบันทึกรายรับ–รายจ่ายจากสลิป / คำสั่งบันทึก */
function replySuggestsFinanceSaved(reply: string): boolean {
  const t = reply.trim();
  if (!t) return false;
  if (/ลงบัญชีแล้วค่ะ/u.test(t) && /รายการ\s*#\d+/u.test(t)) return true;
  if (/บันทึก(?:รายรับ|รายจ่าย).*แล้วค่ะ/u.test(t) && /รายการ\s*#\d+/u.test(t)) return true;
  return false;
}

function replySuggestsSlipConfirmAction(reply: string): boolean {
  const t = reply.trim();
  if (!t) return false;
  if (/ลงบัญชีแล้วค่ะ/u.test(t) || /รายการ\s*#\d+/u.test(t)) return false;
  if (/ถ้าข้อมูลถูกต้อง.*ยืนยัน|พิมพ์\s*\*\*ยืนยัน\*\*|พิมพ์\s*ยืนยัน|บันทึกเลย/u.test(t)) return true;
  // fallback: ถ้าเป็นข้อความสรุปอ่านสลิป (มีหัวข้อหลัก) ให้ขึ้นปุ่มยืนยันด้วย
  const looksLikeSlipSummary =
    /อ่านสลิปแล้ว/u.test(t) &&
    /จำนวนเงิน|ยอดเงิน/u.test(t) &&
    /วันที่/u.test(t);
  return looksLikeSlipSummary;
}

function isConfirmMessage(text: string): boolean {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return false;
  return /^(ยืนยัน|ยืนยันครับ|ยืนยันค่ะ|บันทึกเลย|ตกลง|โอเค|ok|okay)$/iu.test(t);
}

export type PersonalAiChatProps = {
  /** แสดงในหัวข้อทักทาย (เช่น ชื่อจากโปรไฟล์) */
  greetingName?: string;
};

function AiSparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z"
      />
    </svg>
  );
}

async function parseJson<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, message: `เซิร์ฟเวอร์ไม่ส่งข้อมูล (รหัส ${res.status})` };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    const body = text.trim();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const isHtml = body.startsWith("<!DOCTYPE") || body.startsWith("<html") || contentType.includes("text/html");
    if (isHtml) {
      if (res.status === 524 || res.status === 504) {
        return { ok: false, message: "เซิร์ฟเวอร์ใช้เวลาประมวลผลนานเกินไป กรุณาลองใหม่" };
      }
      if (res.status === 502 || res.status === 503) {
        return { ok: false, message: "บริการ AI ชั่วคราวมีปัญหา กรุณาลองใหม่อีกครั้ง" };
      }
      return { ok: false, message: `เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ (รหัส ${res.status})` };
    }
    return { ok: false, message: `รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง (รหัส ${res.status})` };
  }
}

export function PersonalAiChat({ greetingName }: PersonalAiChatProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const persistedOnceRef = useRef<{ sessions: ChatSession[]; activeSessionId: string } | null>(null);
  if (!persistedOnceRef.current) {
    persistedOnceRef.current = loadPersistedChatState(greetingName);
  }
  const imageLightbox = useAppImageLightbox();
  const [sessions, setSessions] = useState<ChatSession[]>(() => persistedOnceRef.current!.sessions);
  const [activeSessionId, setActiveSessionId] = useState(() => persistedOnceRef.current!.activeSessionId);
  const [input, setInput] = useState("");
  const [attachedImageDataUrl, setAttachedImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [digestRefreshKey, setDigestRefreshKey] = useState(0);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [activeSessionId, sessions],
  );
  const messages = activeSession?.messages ?? [];
  const canSend = useMemo(() => !loading && (input.trim().length > 0 || Boolean(attachedImageDataUrl)), [attachedImageDataUrl, input, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, activeSessionId]);

  useEffect(() => {
    persistChatState(sessions, activeSessionId);
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
      };
      reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
      reader.readAsDataURL(file);
    });
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    try {
      const prepared = await prepareImageFileForVisionOcr(file);
      const dataUrl = await fileToDataUrl(prepared);
      setAttachedImageDataUrl(dataUrl);
      setError(null);
    } catch {
      setError("แนบรูปไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSend) return;
      const form = e.currentTarget.form;
      form?.requestSubmit();
    }
  }

  function updateActiveSession(update: (current: ChatSession) => ChatSession) {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? update(s) : s)).sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }

  function createSession() {
    const name = (greetingName ?? "คุณ").trim() || "คุณ";
    const id = `s-${Date.now()}`;
    const next: ChatSession = {
      id,
      serverSessionId: null,
      title: "แชทใหม่",
      messages: [buildWelcomeMessage(name)],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(id);
    setError(null);
  }

  async function resetAssistantMemory() {
    try {
      await fetch("/api/chat-ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reset: true, sessionId: activeSession?.serverSessionId ?? undefined }),
      });
    } catch {
      // ไม่บล็อก UX ถ้าล้างฝั่ง server ไม่สำเร็จ
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    const imageDataUrl = attachedImageDataUrl;
    if ((!content && !imageDataUrl) || loading || !activeSession) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content || "ส่งรูปภาพ",
      imageDataUrl,
    };
    const nextMessages = [...messages, userMessage];
    const optimisticConfirm = !imageDataUrl && isConfirmMessage(content);
    const optimisticAssistantMessage: ChatMessage | null = optimisticConfirm
      ? {
          id: `a-pending-${Date.now()}`,
          role: "assistant",
          content: "รับคำยืนยันแล้ว กำลังบันทึกให้ค่ะ…",
          imageDataUrl: null,
        }
      : null;
    updateActiveSession((current) => ({
      ...current,
      title:
        current.title === "แชทใหม่" && (content || imageDataUrl)
          ? (content || "รูปภาพ").slice(0, 28) + ((content || "รูปภาพ").length > 28 ? "..." : "")
          : current.title,
      messages: optimisticAssistantMessage ? [...nextMessages, optimisticAssistantMessage] : nextMessages,
      updatedAt: Date.now(),
    }));
    setInput("");
    setAttachedImageDataUrl(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat-ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: activeSession.serverSessionId ?? undefined,
          message: content || undefined,
          imageDataUrl,
        }),
      });
      const parsed = await parseJson<{ error?: string } & ReplyResponse>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      if (!res.ok) {
        setError(parsed.data.error ?? "ส่งข้อความไม่สำเร็จ");
        return;
      }
      const replyText = parsed.data.reply || "ไม่ได้รับข้อความตอบกลับ";
      updateActiveSession((current) => ({
        ...current,
        serverSessionId: parsed.data.sessionId ?? current.serverSessionId ?? null,
        messages: [
          ...current.messages,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: replyText,
            imageDataUrl: null,
          },
        ],
        updatedAt: Date.now(),
      }));
      setDigestRefreshKey((k) => k + 1);
      if (replySuggestsFinanceSaved(replyText)) {
        setToast("บันทึกลงบัญชีแล้ว");
        window.setTimeout(() => setDigestRefreshKey((k) => k + 1), 400);
      } else if (replySuggestsNoteSaved(replyText)) {
        setToast("บันทึกแล้ว");
        window.setTimeout(() => setDigestRefreshKey((k) => k + 1), 500);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendQuickConfirm() {
    if (loading || !activeSession) return;
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: "ยืนยัน",
      imageDataUrl: null,
    };
    updateActiveSession((current) => ({
      ...current,
      messages: [
        ...current.messages,
        userMessage,
        {
          id: `a-pending-${Date.now()}`,
          role: "assistant",
          content: "รับคำยืนยันแล้ว กำลังบันทึกให้ค่ะ…",
          imageDataUrl: null,
        },
      ],
      updatedAt: Date.now(),
    }));
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat-ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: activeSession.serverSessionId ?? undefined,
          message: "ยืนยัน",
        }),
      });
      const parsed = await parseJson<{ error?: string } & ReplyResponse>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      if (!res.ok) {
        setError(parsed.data.error ?? "ส่งข้อความไม่สำเร็จ");
        return;
      }
      const replyText = parsed.data.reply || "ไม่ได้รับข้อความตอบกลับ";
      updateActiveSession((current) => ({
        ...current,
        serverSessionId: parsed.data.sessionId ?? current.serverSessionId ?? null,
        messages: [
          ...current.messages,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: replyText,
            imageDataUrl: null,
          },
        ],
        updatedAt: Date.now(),
      }));
      setDigestRefreshKey((k) => k + 1);
      if (replySuggestsFinanceSaved(replyText)) {
        setToast("บันทึกลงบัญชีแล้ว");
        window.setTimeout(() => setDigestRefreshKey((k) => k + 1), 400);
      } else if (replySuggestsNoteSaved(replyText)) {
        setToast("บันทึกแล้ว");
        window.setTimeout(() => setDigestRefreshKey((k) => k + 1), 500);
      }
    } finally {
      setLoading(false);
    }
  }

  const greet = (greetingName ?? "คุณ").trim() || "คุณ";
  const greetInitial = greet.slice(0, 1);

  return (
    <div className={PERSONAL_AI_CHAT_ROOT_CLASS}>
      <PersonalAiDailyDigest
        refreshKey={digestRefreshKey}
        onOpenAllNotes={() => setNotesModalOpen(true)}
        onNotesChanged={() => setDigestRefreshKey((k) => k + 1)}
      />

      <PersonalAiNotesModal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        onNotesChanged={() => setDigestRefreshKey((k) => k + 1)}
      />

      {toast ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[220] -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-md"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <div className={PERSONAL_AI_CHAT_CARD_SHELL_CLASS}>
        <div className="shrink-0 border-b border-[#e8e6fc] bg-gradient-to-r from-white via-[#faf9ff] to-[#f3f1fc]/90">
          <div className="px-3 py-3 sm:px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e0e7ff] via-[#eef2ff] to-[#ddd6fe] text-sm font-bold text-[#0000BF] shadow-md shadow-indigo-900/10 ring-2 ring-white sm:h-11 sm:w-11"
                  aria-hidden
                >
                  {greetInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-slate-900">สวัสดี, {greet}</p>
                    <div className="inline-flex items-center gap-1 rounded-full border border-[#0000BF]/25 bg-[#0000BF]/8 px-2 py-0.5">
                      <AiSparklesIcon className="h-3 w-3 text-[#0000BF]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#1e1b4b] sm:text-[10px]">ผู้ช่วย AI</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setNotesModalOpen(true)}
                  className={cn(CHAT_BTN_SOFT, "px-2.5 py-1.5")}
                  title="ดูโน้ตทั้งหมด"
                >
                  📝 บันทึก
                </button>
                <button
                  type="button"
                  onClick={createSession}
                  className="app-btn-primary rounded-xl px-3 py-1.5 text-xs font-semibold shadow-md transition hover:opacity-95 disabled:opacity-50"
                >
                  + แชทใหม่
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void resetAssistantMemory();
                    updateActiveSession((current) => ({
                      ...current,
                      title: "แชทใหม่",
                      messages: [buildWelcomeMessage((greetingName ?? "คุณ").trim() || "คุณ")],
                      updatedAt: Date.now(),
                    }));
                    setError(null);
                  }}
                  className={cn(CHAT_BTN_SOFT, "px-2.5 py-1.5")}
                  title="ล้างข้อความในแชทนี้ (บันทึกบนเครื่องจะอัปเดตตาม)"
                >
                  ล้างแชท
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-[#ebe9f7] bg-white/70 px-2 py-2 [scrollbar-width:thin]">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSessionId(s.id);
                  setError(null);
                }}
                className={cn(
                  "shrink-0 max-w-[10rem] truncate rounded-full border px-2.5 py-1 text-left text-xs font-medium shadow-sm transition sm:max-w-[12rem] sm:px-3",
                  s.id === activeSessionId
                    ? "app-btn-primary border-transparent text-white shadow-md shadow-fuchsia-500/20"
                    : "app-btn-soft border-[#dcd8f0] text-[#4d47b6] hover:bg-[#f4f3ff]",
                )}
                title={s.title}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="shrink-0 border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
            <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        <div className={PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS} role="log" aria-label="ข้อความแชท">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {messages.map((m, idx) => (
              <div
                key={m.id}
                className={cn("flex w-full flex-col gap-1.5", m.role === "user" ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[min(92%,36rem)] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%]",
                    m.role === "user"
                      ? "app-btn-primary border-transparent text-white shadow-md shadow-fuchsia-500/20"
                      : "border border-[#e4e2f5] bg-white text-slate-800 shadow-md shadow-indigo-950/5",
                  )}
                >
                  {m.role === "assistant" && m.id !== "welcome" ? (
                    <div className="mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#0000BF]">
                      <AiSparklesIcon className="h-3.5 w-3.5 shrink-0 text-[#0000BF]" />
                      <span>คำตอบจาก AI</span>
                    </div>
                  ) : null}
                  {m.imageDataUrl ? (
                    <div className="mb-2">
                      <AppImageThumb
                        src={m.imageDataUrl}
                        alt="รูปแนบในการสนทนา"
                        className="h-24 w-24 rounded-lg"
                        onOpen={() => imageLightbox.open(m.imageDataUrl!)}
                      />
                    </div>
                  ) : null}
                  {m.content}
                </div>
                {m.role === "assistant" && replySuggestsNoteSaved(m.content) ? (
                  <button
                    type="button"
                    onClick={() => setNotesModalOpen(true)}
                    className={cn(CHAT_BTN_SOFT, "ml-1 px-2.5 py-1 text-left")}
                  >
                    📝 ดูโน้ตทั้งหมด
                  </button>
                ) : null}
                {m.role === "assistant" &&
                idx === messages.length - 1 &&
                replySuggestsSlipConfirmAction(m.content) ? (
                  <button
                    type="button"
                    onClick={() => void sendQuickConfirm()}
                    disabled={loading}
                    className="app-btn-primary ml-1 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-md transition hover:opacity-95 disabled:opacity-50"
                  >
                    ยืนยันบันทึก
                  </button>
                ) : null}
              </div>
            ))}
            {loading ? (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#0000BF]" />
                กำลังพิมพ์…
              </p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={sendMessage}
          className="shrink-0 border-t border-[#e8e6fc] bg-gradient-to-r from-white via-[#faf9ff] to-[#f5f4fc] px-3 py-2.5 shadow-[0_-4px_24px_-8px_rgba(79,70,229,0.12)] sm:px-4 sm:py-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void onPickImage(file);
              e.currentTarget.value = "";
            }}
          />
          <div className="mx-auto w-full max-w-3xl space-y-2">
            {attachedImageDataUrl ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e4e2f5] bg-white px-2 py-2 shadow-md shadow-indigo-950/5">
                <AppImageThumb
                  src={attachedImageDataUrl}
                  alt="รูปที่แนบ"
                  className="h-12 w-12 rounded-md"
                  onOpen={() => imageLightbox.open(attachedImageDataUrl)}
                />
                <button
                  type="button"
                  className="text-xs text-slate-600 underline hover:text-slate-900"
                  onClick={() => setAttachedImageDataUrl(null)}
                >
                  ลบรูป
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInput("จดว่า ");
                  textareaRef.current?.focus();
                }}
                disabled={loading}
                className={cn(CHAT_BTN_SOFT, "inline-flex items-center px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs")}
              >
                📝 บันทึก
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("personal-ai-digest")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                className={cn(CHAT_BTN_SOFT, "inline-flex items-center px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs")}
              >
                📅 ตาราง
              </button>
              <Link
                href="/dashboard/home-finance"
                className={cn(CHAT_BTN_SOFT, "inline-flex items-center px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs")}
              >
                💰 บัญชี
              </Link>
            </div>
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute left-3 top-2.5 text-[#0000BF]/55 sm:top-3">
                  <AiSparklesIcon className="h-4 w-4" />
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  rows={2}
                  maxLength={4000}
                  placeholder="พิมพ์ข้อความ… (Enter ส่ง · Shift+Enter ขึ้นบรรทัด)"
                  className="min-h-[48px] w-full resize-none rounded-xl border border-[#e4e2f5] bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 outline-none placeholder:text-slate-400 focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/25 sm:min-h-[52px] sm:py-3"
                />
              </div>
              <div className="flex shrink-0 gap-1.5 self-end pb-0.5 sm:gap-2 sm:pb-1">
                <AppPickGalleryImageButton
                  type="button"
                  aria-label="แนบรูป"
                  title="แนบรูป"
                  className={cn(
                    CHAT_BTN_SOFT,
                    "flex h-10 w-10 items-center justify-center px-0 py-0 text-[#4d47b6] sm:h-11 sm:w-11",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path
                      fill="currentColor"
                      d="M19 7h-3.17l-1.84-2H10L8.17 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm0 10H5V9h14v8Zm-7-1.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7Z"
                    />
                  </svg>
                </AppPickGalleryImageButton>
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="ส่งข้อความ"
                  title="ส่ง"
                  className="app-btn-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition hover:opacity-95 disabled:opacity-50 sm:h-11 sm:w-11"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path fill="currentColor" d="M3.4 20.4 22 12 3.4 3.6 3 10l13 2-13 2 .4 6.4Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
        <AppImageLightbox src={imageLightbox.src} onClose={imageLightbox.close} alt="รูปแนบในการสนทนา" />
      </div>
    </div>
  );
}

export default PersonalAiChat;

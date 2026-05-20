"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  PERSONAL_AI_CHAT_CARD_SHELL_CLASS,
  PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS,
  PERSONAL_AI_CHAT_ROOT_CLASS,
} from "@/systems/chat/personal-ai-chat-shell";

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
      "พิมพ์ข้อความด้านล่างแล้วกดส่งได้เลย\n\n" + "ให้ช่วยอะไรครับ?",
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
    const name = (greetingName ?? "คุณ").trim() || "คุณ";
    const sessionsSanitized = sessions.map((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === "welcome" && m.role === "assistant" && /แนบรูป|อัปโหลดรูป|แนบรูปส่ง/u.test(m.content)
          ? { ...buildWelcomeMessage(name), id: "welcome" as const }
          : m,
      ),
    }));
    const active =
      data.activeSessionId && sessionsSanitized.some((x) => x.id === data.activeSessionId)
        ? data.activeSessionId
        : sessionsSanitized[0]!.id;
    return { sessions: sessionsSanitized, activeSessionId: active };
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

function IconChatNew({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconChatClear({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14M10 11v6M14 11v6"
      />
    </svg>
  );
}

/** เวลาในมุมฟอง (รูปแบบ id: u-173… / a-173… / a-pending-173…) */
function telegramMetaFromMessageId(id: string): { label: string; iso: string } | null {
  if (id === "welcome") return null;
  const last = id.split("-").pop();
  if (!last || !/^\d+$/.test(last)) return null;
  const ms = Number(last);
  if (ms < 1_000_000_000_000 || ms > 10_000_000_000_000) return null;
  try {
    const d = new Date(ms);
    return {
      label: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }),
      iso: d.toISOString(),
    };
  } catch {
    return null;
  }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [activeSessionId, sessions],
  );
  const messages = activeSession?.messages ?? [];
  const canSend = useMemo(() => !loading && input.trim().length > 0, [input, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, activeSessionId]);

  useEffect(() => {
    persistChatState(sessions, activeSessionId);
  }, [sessions, activeSessionId]);

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
    if (!content || loading || !activeSession) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      imageDataUrl: null,
    };
    const nextMessages = [...messages, userMessage];
    const optimisticConfirm = isConfirmMessage(content);
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
        current.title === "แชทใหม่" && content
          ? content.slice(0, 28) + (content.length > 28 ? "..." : "")
          : current.title,
      messages: optimisticAssistantMessage ? [...nextMessages, optimisticAssistantMessage] : nextMessages,
      updatedAt: Date.now(),
    }));
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat-ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: activeSession.serverSessionId ?? undefined,
          message: content,
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
    } finally {
      setLoading(false);
    }
  }

  const greet = (greetingName ?? "คุณ").trim() || "คุณ";
  const greetInitial = greet.slice(0, 1);

  return (
    <div className={PERSONAL_AI_CHAT_ROOT_CLASS}>
      <div className={PERSONAL_AI_CHAT_CARD_SHELL_CLASS}>
        <div className="shrink-0 border-b border-[#e8e6fc] bg-gradient-to-r from-white via-[#faf9ff] to-[#f3f1fc]/90">
          <div className="px-3 py-3 sm:px-4">
            <div className="flex flex-row items-start justify-between gap-3 sm:items-center">
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
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#66638c]/90">พิมพ์ข้อความด้านล่างแล้วกดส่ง</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5 self-start pt-0.5 sm:gap-2 sm:self-center sm:pt-0">
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
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl border-[#dcd8f0] bg-white/90 px-0 text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] sm:min-w-0 sm:px-3.5",
                  )}
                  aria-label="ล้างข้อความในแชทนี้"
                  title="ล้างแชท"
                >
                  <IconChatClear className="h-4 w-4 shrink-0 sm:hidden" />
                  <span className="hidden sm:inline">ล้างแชท</span>
                </button>
                <button
                  type="button"
                  onClick={createSession}
                  className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-0 text-xs font-semibold shadow-md transition hover:opacity-95 disabled:opacity-50 sm:min-w-0 sm:px-3.5"
                  aria-label="เริ่มแชทใหม่"
                  title="แชทใหม่"
                >
                  <IconChatNew className="h-4 w-4 shrink-0 text-white sm:hidden" />
                  <span className="hidden sm:inline">แชทใหม่</span>
                </button>
              </div>
            </div>
          </div>

          {sessions.length > 1 ? (
            <div className="border-t border-[#ebe9f7] bg-gradient-to-b from-white/80 to-[#faf9ff]/60 px-2 py-2 sm:px-3">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">ห้องแชท</p>
              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain rounded-2xl border border-white/55 bg-white/50 p-1.5 shadow-inner shadow-slate-900/[0.04] backdrop-blur-sm [scrollbar-width:thin]">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setError(null);
                    }}
                    className={cn(
                      "shrink-0 max-w-[10rem] truncate rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition sm:max-w-[12rem] sm:px-3",
                      s.id === activeSessionId
                        ? "app-btn-primary border-transparent text-white shadow-md shadow-fuchsia-500/20"
                        : "border-[#e8e4f7] bg-white/90 text-[#4d47b6] hover:bg-[#f4f3ff]",
                    )}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="shrink-0 border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
            <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        <div className={PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS} role="log" aria-label="ข้อความแชท">
          <div className="mx-auto w-full max-w-3xl space-y-2.5 sm:space-y-3">
            {messages.map((m) => {
              const timeMeta = telegramMetaFromMessageId(m.id);
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
                  aria-label={isUser ? "ข้อความของคุณ" : "ข้อความจากผู้ช่วย AI"}
                >
                  <div
                    className={cn(
                      "flex max-w-[min(94%,22rem)] items-end gap-2 sm:max-w-[min(90%,26rem)]",
                      isUser ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-sm font-bold shadow-md ring-2 ring-white/90",
                        isUser
                          ? "bg-gradient-to-br from-[#e0e7ff] via-[#eef2ff] to-[#ddd6fe] text-[#0000BF]"
                          : "bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a855f7] text-white",
                      )}
                      aria-label={isUser ? `ผู้ใช้ ${greet}` : "ผู้ช่วย AI"}
                    >
                      {isUser ? greetInitial : <AiSparklesIcon className="h-5 w-5 text-white" />}
                    </div>

                    <div className="relative min-w-0 flex-1 pb-0.5">
                      {!isUser ? (
                        <div
                          className="absolute bottom-[14px] -left-1 z-0 size-2.5 rotate-45 border-b border-l border-black/[0.07] bg-white"
                          aria-hidden
                        />
                      ) : (
                        <div
                          className="absolute bottom-[14px] -right-1 z-0 size-2.5 rotate-45 border-r border-t border-[#b5d99a] bg-[#effdde]"
                          aria-hidden
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 overflow-hidden rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-[0_1px_0.5px_rgba(0,0,0,0.06)]",
                          isUser
                            ? "rounded-br-md border border-[#c5e89f]/90 bg-[#effdde] text-slate-900"
                            : "rounded-bl-md border border-black/[0.07] bg-white text-slate-800",
                        )}
                      >
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
                        <div className="whitespace-pre-wrap break-words">{m.content}</div>
                        {timeMeta ? (
                          <div className="mt-1 flex justify-end">
                            <time className="text-[11px] font-medium tabular-nums text-slate-500/85" dateTime={timeMeta.iso}>
                              {timeMeta.label}
                            </time>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {loading ? (
              <div className="flex justify-start pl-1">
                <div className="ml-12 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white/95 px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#6366f1]" aria-hidden />
                  กำลังพิมพ์…
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={sendMessage}
          className="shrink-0 border-t border-[#e8e6fc] bg-gradient-to-r from-white via-[#faf9ff] to-[#f5f4fc] px-3 py-2.5 shadow-[0_-4px_24px_-8px_rgba(79,70,229,0.12)] sm:px-4 sm:py-3"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-stretch gap-2 sm:gap-2.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onComposerKeyDown}
                rows={2}
                maxLength={4000}
                placeholder="พิมพ์ข้อความ… (Enter ส่ง · Shift+Enter ขึ้นบรรทัด)"
                className="min-h-[52px] w-full min-w-0 flex-1 resize-none rounded-xl border border-[#e4e2f5] bg-white px-3 py-3 text-sm leading-snug text-slate-900 shadow-inner shadow-slate-900/5 outline-none placeholder:text-slate-400 focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/25 sm:min-h-[56px] sm:py-3.5"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="ส่งข้อความ"
                title="ส่ง"
                className="app-btn-primary flex w-[52px] shrink-0 items-center justify-center self-stretch rounded-xl shadow-md transition hover:opacity-95 disabled:opacity-50 sm:w-14"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
                  <path fill="currentColor" d="M3.4 20.4 22 12 3.4 3.6 3 10l13 2-13 2 .4 6.4Z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
        <AppImageLightbox src={imageLightbox.src} onClose={imageLightbox.close} alt="รูปแนบในการสนทนา" />
      </div>
    </div>
  );
}

export default PersonalAiChat;

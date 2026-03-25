"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

export function ChatRoom() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadAll() {
    const res = await fetch("/api/chat/messages", { credentials: "include" });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      if (res.status === 403) setErr(d.error ?? "โทเคนไม่พอ");
      return;
    }
    setErr(null);
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const t = setInterval(loadAll, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll คงที่
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: t }),
      });
      const data = (await res.json()) as { error?: string; message?: Msg };
      if (!res.ok) {
        setErr(data.error ?? "ส่งไม่สำเร็จ");
        return;
      }
      if (data.message) setMessages((prev) => [...prev, data.message!]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
      {err ? <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{err}</p> : null}
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="พิมพ์ข้อความ..."
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
    </div>
  );
}

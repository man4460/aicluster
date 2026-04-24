"use client";

import { useEffect, useState } from "react";
import PersonalAiChat, { type PersonalAiChatProps } from "@/systems/chat/components/PersonalAiChat";
import { PERSONAL_AI_CHAT_ROOT_CLASS } from "@/systems/chat/personal-ai-chat-shell";

/** Skeleton ใช้เฉพาะ `div` — ไม่ซ้อน block ใน `p`/`span` */
function ChatAiSkeleton() {
  return (
    <div
      className={PERSONAL_AI_CHAT_ROOT_CLASS}
      aria-busy="true"
      aria-label="กำลังโหลดแชท"
      suppressHydrationWarning
    >
      <div className="order-1 h-[min(52vh,28rem)] max-h-[min(52vh,28rem)] shrink-0 rounded-2xl border border-[#dcd7f0] bg-gradient-to-b from-[#faf9ff] via-[#f3f1fc] to-[#e8e4f7] shadow-xl shadow-indigo-950/[0.09] lg:h-auto lg:max-h-none lg:min-h-0 lg:w-72 lg:min-w-[18rem] xl:w-80">
        <div className="p-3 pb-2">
          <div className="h-28 animate-pulse rounded-2xl bg-white/50" />
        </div>
        <div className="space-y-2 px-3 pb-3">
          <div className="h-16 animate-pulse rounded-2xl bg-white/35" />
          <div className="h-16 animate-pulse rounded-2xl bg-white/35" />
        </div>
      </div>
      <div className="order-2 min-h-[12rem] min-w-0 flex-1 animate-pulse rounded-2xl border border-[#e4e2f5] bg-white/75 lg:min-h-0 lg:max-h-none" />
    </div>
  );
}

/**
 * รอบแรก: skeleton กับ root class เดียวกับ `PersonalAiChat` (จาก `personal-ai-chat-shell`) → หลัง mount ค่อยแสดงแชทจริง
 */
export default function ChatAiClientRoot({ greetingName }: PersonalAiChatProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <ChatAiSkeleton />;
  return <PersonalAiChat greetingName={greetingName} />;
}

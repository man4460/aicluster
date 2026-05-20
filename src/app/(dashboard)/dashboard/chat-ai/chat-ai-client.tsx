"use client";

import { useLayoutEffect, useState } from "react";
import PersonalAiChat, { type PersonalAiChatProps } from "@/systems/chat/components/PersonalAiChat";
import { cn } from "@/lib/cn";
import { PERSONAL_AI_CHAT_CARD_SHELL_CLASS, PERSONAL_AI_CHAT_ROOT_CLASS } from "@/systems/chat/personal-ai-chat-shell";

/** Skeleton โครงเดียวกับ `PersonalAiChat`: root > การ์ดแชท (pulse) เพื่อ hydrate สม่ำเสมอ */
function ChatAiSkeleton() {
  return (
    <div
      className={PERSONAL_AI_CHAT_ROOT_CLASS}
      aria-busy="true"
      aria-label="กำลังโหลดแชท"
      suppressHydrationWarning
    >
      <div className={cn(PERSONAL_AI_CHAT_CARD_SHELL_CLASS, "animate-pulse")} suppressHydrationWarning aria-hidden />
    </div>
  );
}

/**
 * รอบแรก: skeleton ให้ตรง SSR/hydrate → แล้วสลับเป็นแชทจริงใน useLayoutEffect **ก่อน paint**
 * (ถ้าใช้ useEffect จะเห็น skeleton หนึ่งเฟรมแล้วเหมือนข้อมูล/เลย์เอาต์ “กลับค่าเดิม”)
 */
export default function ChatAiClientRoot({ greetingName }: PersonalAiChatProps) {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <ChatAiSkeleton />;
  return <PersonalAiChat greetingName={greetingName} />;
}

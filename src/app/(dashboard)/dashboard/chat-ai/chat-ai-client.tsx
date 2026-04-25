"use client";

import { useLayoutEffect, useState } from "react";
import PersonalAiChat, { type PersonalAiChatProps } from "@/systems/chat/components/PersonalAiChat";
import { cn } from "@/lib/cn";
import {
  PERSONAL_AI_CHAT_CARD_SHELL_CLASS,
  PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS,
  PERSONAL_AI_CHAT_DIGEST_INNER_CLASS,
  PERSONAL_AI_CHAT_ROOT_CLASS,
  PERSONAL_AI_DIGEST_ASIDE_ARIA_LABEL,
} from "@/systems/chat/personal-ai-chat-shell";

/**
 * Skeleton โครงเดียวกับ `PersonalAiDigestAsideFrame` + `PersonalAiDailyDigest`:
 * `<aside id="personal-ai-digest">` + inner `div` + `header` + `section` (ห้ามใช้ `<div>` แทน `<aside>` — hydrate จะพัง)
 */
function ChatAiSkeleton() {
  return (
    <div
      className={PERSONAL_AI_CHAT_ROOT_CLASS}
      aria-busy="true"
      aria-label="กำลังโหลดแชท"
      suppressHydrationWarning
    >
      <aside
        id="personal-ai-digest"
        className={PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS}
        aria-label={PERSONAL_AI_DIGEST_ASIDE_ARIA_LABEL}
        suppressHydrationWarning
      >
        <div className={PERSONAL_AI_CHAT_DIGEST_INNER_CLASS}>
          <header className="shrink-0 p-3 pb-2">
            <div className="h-24 animate-pulse rounded-2xl bg-white/50" aria-hidden />
          </header>
          <section
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-3 pt-0 [scrollbar-gutter:stable] transition-opacity duration-150 opacity-100"
            aria-label="รายการสรุป รายการวันนี้ และโน้ต"
            aria-busy={false}
          >
            <div className="h-32 animate-pulse rounded-2xl bg-white/40" aria-hidden />
          </section>
        </div>
      </aside>

      <div
        className={cn(PERSONAL_AI_CHAT_CARD_SHELL_CLASS, "animate-pulse")}
        suppressHydrationWarning
        aria-hidden
      />
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

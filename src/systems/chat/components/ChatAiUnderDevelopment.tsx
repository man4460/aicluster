import Link from "next/link";
import { CHAT_AI_DISABLED_MESSAGE_TH } from "@/lib/chat-ai/feature";

/** แผงแจ้งเมื่อเลขาส่วนตัวปิดชั่วคราว */
export function ChatAiUnderDevelopment() {
  return (
    <div className="flex min-h-[min(420px,50vh)] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#5b61ff]/25 bg-white/55 px-6 py-10 text-center shadow-[0_16px_48px_-28px_rgba(79,70,229,0.25)] backdrop-blur-sm sm:rounded-3xl">
      <span
        className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef0ff] to-violet-100 text-2xl"
        aria-hidden
      >
        🤖
      </span>
      <h2 className="font-black tracking-tight text-[#1e1b4b] text-lg sm:text-xl">น้องมาเวล — เลขาส่วนตัว</h2>
      <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-[#66638c]">{CHAT_AI_DISABLED_MESSAGE_TH}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#5b61ff] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#4d52e8]"
      >
        กลับแดชบอร์ด
      </Link>
    </div>
  );
}

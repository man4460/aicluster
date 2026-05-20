import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import ChatAiClientRoot from "./chat-ai-client";

export const metadata: Metadata = {
  title: "น้องมาเวล — เลขาส่วนตัว | MAWELL Buffet",
};

export default async function ChatAiPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userRow = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, username: true },
  });
  const greetingName = userRow?.fullName?.trim() || userRow?.username || session.username;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <header className="app-surface relative shrink-0 overflow-hidden rounded-2xl border border-white/70 px-3 py-3 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:rounded-3xl sm:px-6 sm:py-5">
        <div
          className="pointer-events-none absolute -right-12 top-0 hidden h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl sm:block"
          aria-hidden
        />
        <div className="relative">
          <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-[#0000BF]/75 sm:block">MAWELL Buffet</p>
          <h1 className="text-lg font-semibold tracking-tight text-[#2e2a58] sm:mt-1.5 sm:text-2xl">น้องมาเวล — เลขาส่วนตัว</h1>
          <p className="mt-1 hidden max-w-2xl text-xs text-[#66638c] sm:block sm:text-sm">
            คุยกับ AI ด้านล่าง — ส่งข้อความได้เลย ไม่มีการอัปโหลดรูป
          </p>
          <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
            <span className="rounded-full border border-[#0000BF]/15 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#0000BF]">
              แชทข้อความ
            </span>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatAiClientRoot greetingName={greetingName} />
      </div>
    </div>
  );
}

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden sm:gap-6">
      <header className="app-surface relative shrink-0 overflow-hidden rounded-3xl border border-white/70 px-5 py-6 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-8 sm:py-7">
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0000BF]/75">MAWELL Buffet</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2e2a58] sm:text-3xl">น้องมาเวล — เลขาส่วนตัว</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#66638c]">แชท · โน้ต · สรุปรายวัน</p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatAiClientRoot greetingName={greetingName} />
      </div>
    </div>
  );
}

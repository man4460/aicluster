import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatHub } from "@/systems/chat/components/ChatHub";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "แชท | MAWELL Buffet",
};

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <header className="app-surface relative overflow-hidden rounded-3xl border border-white/70 px-5 py-6 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-8 sm:py-7">
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-[#0000BF]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0000BF]/75">MAWELL Buffet</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2e2a58] sm:text-3xl">แชท</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#66638c]">
            กระทู้ชุมชน · ห้องติดต่อแอดมิน (แจ้งปัญหา / สอบถาม)
          </p>
        </div>
      </header>
      <div className="min-h-0 min-h-[min(520px,calc(100dvh-14rem))] flex-1">
        <ChatHub isAdmin={session.role === "ADMIN"} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatHub } from "@/systems/chat/components/ChatHub";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "แชท | MAWELL PLATFORM",
};

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <header className="app-surface relative overflow-hidden rounded-3xl border border-white/70 px-4 py-4 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-6 sm:py-5">
        <div className={cn("h-1.5 w-full rounded-full relative z-[2]", appDashboardBrandGradientBarClass)} aria-hidden />
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-[#0000BF]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative mt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Chat</p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">แชท</h1>
        </div>
      </header>
      <div className="min-h-0 min-h-[min(520px,calc(100dvh-12.5rem))] flex-1">
        <ChatHub isAdmin={session.role === "ADMIN"} />
      </div>
    </div>
  );
}

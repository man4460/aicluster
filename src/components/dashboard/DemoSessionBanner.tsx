"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const chipClass =
  "inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-black leading-none tracking-tight text-white shadow-sm sm:px-2 sm:text-[11px]";

/**
 * แสดงในแถบ Header เมื่อล็อกอินบัญชีทดลอง —
 * มือถือ: ลิงก์ «สมัคร» อย่างเดียว (ไม่ซ้อนป้ายโหมดทดลอง)
 * lg+: ชิปแดง + ชิป «สนใจสมัคร»
 */
export function DemoSessionBanner() {
  const pathname = usePathname() || "/dashboard";
  const nextQ = encodeURIComponent(pathname.startsWith("/") ? pathname : "/dashboard");
  const loginNext = `/login?next=${nextQ}`;

  return (
    <div
      role="status"
      className="flex h-6 shrink-0 items-center gap-1.5 self-center sm:gap-2"
      title="บัญชีทดลอง — ข้อมูลตัวอย่าง"
    >
      <form action="/api/auth/demo/exit" method="POST" className="m-0 inline-flex h-6 items-center p-0 lg:hidden">
        <input type="hidden" name="next" value={loginNext} />
        <button
          type="submit"
          className="inline-flex h-6 items-center gap-0.5 text-[11px] font-bold text-white underline-offset-2 transition hover:underline active:scale-95"
          title="โหมดทดลอง — กดเพื่อไปสมัคร / เข้าสู่ระบบ"
          aria-label="สมัครใช้งาน (ออกจากโหมดทดลอง)"
          suppressHydrationWarning
        >
          สมัคร
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      <span className={cn(chipClass, "hidden bg-red-600 ring-1 ring-red-950/25 lg:inline-flex")}>โหมดทดลอง</span>
      <form action="/api/auth/demo/exit" method="POST" className="m-0 hidden h-6 items-center p-0 lg:inline-flex">
        <input type="hidden" name="next" value={loginNext} />
        <button
          type="submit"
          className={cn(
            chipClass,
            "bg-[#0000BF] ring-1 ring-[#00008a]/40 transition-all duration-200 ease-out",
            "hover:-translate-y-0.5 hover:scale-105 hover:bg-[#1a1aff] hover:shadow-[0_6px_16px_-4px_rgba(0,0,191,0.75)] hover:ring-2 hover:ring-white/70",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/80 active:translate-y-0 active:scale-95",
          )}
          title="ออกจากบัญชีทดลองแล้วไปหน้าเข้าสู่ระบบ / สมัคร"
          suppressHydrationWarning
        >
          สนใจสมัคร
        </button>
      </form>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const chipClass =
  "inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-black leading-none tracking-tight text-white shadow-sm sm:px-2 sm:text-[11px]";

function useDemoLoginNext() {
  const pathname = usePathname() || "/dashboard";
  const nextQ = encodeURIComponent(pathname.startsWith("/") ? pathname : "/dashboard");
  return `/login?next=${nextQ}`;
}

/**
 * ชิปในแถบหัว — เฉพาะ lg+ (มือถือย้ายไปเมนูบัญชี เพื่อไม่แย่งที่ยอดโทเคน)
 */
export function DemoSessionBanner() {
  const loginNext = useDemoLoginNext();

  return (
    <div
      role="status"
      className="hidden h-6 shrink-0 items-center gap-1.5 self-center sm:gap-2 lg:flex"
      title="บัญชีทดลอง — ข้อมูลตัวอย่าง"
    >
      <span className={cn(chipClass, "bg-red-600 ring-1 ring-red-950/25")}>โหมดทดลอง</span>
      <form action="/api/auth/demo/exit" method="POST" className="m-0 inline-flex h-6 items-center p-0">
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

/** รายการในเมนูบัญชีมือถือ — สมัคร / ออกจากโหมดทดลอง */
export function DemoSessionAccountMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const loginNext = useDemoLoginNext();

  return (
    <form action="/api/auth/demo/exit" method="POST" className="m-0" onSubmit={() => onNavigate?.()}>
      <input type="hidden" name="next" value={loginNext} />
      <button
        type="submit"
        role="menuitem"
        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-[#0000BF] transition-colors hover:bg-[#5b61ff]/10"
        title="ออกจากบัญชีทดลองแล้วไปหน้าเข้าสู่ระบบ / สมัคร"
        suppressHydrationWarning
      >
        <span className="text-lg" aria-hidden>
          ✨
        </span>
        สนใจสมัคร
      </button>
    </form>
  );
}

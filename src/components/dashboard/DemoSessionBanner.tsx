"use client";

import { usePathname } from "next/navigation";

const chipClass =
  "inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-black leading-none tracking-tight text-white shadow-sm sm:px-2 sm:text-[11px]";

/**
 * แสดงในแถบ Header จริงเมื่อล็อกอินบัญชีทดลอง —
 * ข้อความแดงเด่น + 「สนใจสมัคร」ไปหน้า login (POST ออกจาก demo ก่อน)
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
      <span className={`${chipClass} bg-red-600 ring-1 ring-red-950/25`}>โหมดทดลอง</span>
      {/* POST เท่านั้น — ห้าม <Link> ไป /api/auth/demo/exit (Next prefetch แล้วล้าง session) */}
      <form action="/api/auth/demo/exit" method="POST" className="m-0 inline-flex h-6 items-center p-0">
        <input type="hidden" name="next" value={loginNext} />
        <button
          type="submit"
          className={`${chipClass} bg-[#0000BF] ring-1 ring-[#00008a]/40 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#1a1aff] hover:shadow-[0_6px_16px_-4px_rgba(0,0,191,0.75)] hover:ring-2 hover:ring-white/70 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/80 active:translate-y-0 active:scale-95`}
          title="ออกจากบัญชีทดลองแล้วไปหน้าเข้าสู่ระบบ / สมัคร"
          suppressHydrationWarning
        >
          สนใจสมัคร
        </button>
      </form>
    </div>
  );
}

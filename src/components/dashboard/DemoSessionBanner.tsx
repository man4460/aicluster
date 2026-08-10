"use client";

import { usePathname } from "next/navigation";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";

function ExitTrialIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H12"
      />
    </svg>
  );
}

const bannerLinkClass =
  "inline-flex h-8 items-center justify-center rounded-md px-2 text-[11px] font-bold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/80 sm:text-xs";

/** แถบแจ้งเมื่อล็อกอินเป็นบัญชีทดลองสาธารณะ — ล็อกอิน / สมัคร / ออก */
export function DemoSessionBanner() {
  const pathname = usePathname() || "/dashboard";
  const nextQ = encodeURIComponent(pathname.startsWith("/") ? pathname : "/dashboard");
  const loginNext = `/login?next=${nextQ}`;
  const registerNext = `/register?next=${nextQ}`;

  return (
    <TrialSandboxStrip
      trailing={
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* POST เท่านั้น — ห้าม <Link> ไป /api/auth/demo/exit (Next prefetch แล้วล้าง session) */}
          <form action="/api/auth/demo/exit" method="POST">
            <input type="hidden" name="next" value={loginNext} />
            <button
              type="submit"
              className={bannerLinkClass}
              title="เข้าสู่ระบบด้วยบัญชีของคุณ"
            >
              เข้าสู่ระบบ
            </button>
          </form>
          <form action="/api/auth/demo/exit" method="POST">
            <input type="hidden" name="next" value={registerNext} />
            <button type="submit" className={bannerLinkClass} title="สมัครสมาชิกใหม่">
              สมัคร
            </button>
          </form>
          <form action="/api/auth/demo/exit" method="POST">
            <button
              type="submit"
              suppressHydrationWarning
              title="ออกจากบัญชีทดลอง"
              aria-label="ออกจากบัญชีทดลอง"
              className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-md text-white transition hover:bg-white/15 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95"
            >
              <ExitTrialIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      }
    >
      ทดลองใช้งาน · ข้อมูลตัวอย่าง
    </TrialSandboxStrip>
  );
}

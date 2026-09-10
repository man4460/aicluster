import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { isDemoAccountConfiguredForEntry } from "@/lib/auth/demo-account";
import { MODULE_TRY_ALL_DASHBOARD_HREF } from "@/lib/modules/try-link";
import { LANDING_HOME_MODULES_HREF } from "@/lib/landing/landing-visit-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ทดลองใช้งาน | MAWELL",
};

/**
 * ขอสาธิตฟรี — ยังไม่ล็อกอินอัตโนมัติ
 * เลือกโมดูลที่หน้าแรก หรือกดปุ่มเข้าบัญชีทดลองเมื่อพร้อม
 */
export default function TryAllModulesPage() {
  const loginHref = `/login?next=${encodeURIComponent(MODULE_TRY_ALL_DASHBOARD_HREF)}`;
  const registerHref = `/register?next=${encodeURIComponent(MODULE_TRY_ALL_DASHBOARD_HREF)}`;
  const demoReady = isDemoAccountConfiguredForEntry();

  return (
    <main
      className={cn(
        "flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-100/50 px-4",
        "pt-[max(2.5rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] pb-[max(2.5rem,var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)))]",
      )}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#5b61ff]">ทดลองใช้งาน</p>
        <h1 className="mt-2 text-center text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ระบบทั้งหมด</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#5f5a8a]">
          ดูรายละเอียดโมดูลได้ก่อนโดยไม่ต้องล็อกอิน — เมื่อพร้อมค่อยเข้าบัญชีทดลองเพื่อใช้งานแดชบอร์ดจริง
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={LANDING_HOME_MODULES_HREF}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#5b61ff]/25 bg-white/90 px-4 text-sm font-bold text-[#4d47b6]"
          >
            ดูโมดูลที่หน้าแรก
          </Link>
          {demoReady ? (
            <form action="/api/auth/demo/enter" method="POST">
              <input type="hidden" name="next" value={MODULE_TRY_ALL_DASHBOARD_HREF} />
              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#5b61ff] to-indigo-600 px-4 text-sm font-bold text-white shadow-md"
              >
                เข้าบัญชีทดลอง
              </button>
            </form>
          ) : (
            <>
              <Link
                href={loginHref}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#5b61ff] to-indigo-600 px-4 text-sm font-bold text-white shadow-md"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href={registerHref}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#5b61ff]/25 bg-white/90 px-4 text-sm font-bold text-[#4d47b6]"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

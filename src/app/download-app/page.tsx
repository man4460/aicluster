import type { Metadata } from "next";
import Link from "next/link";
import { AppPublicCheckInGlassPage } from "@/components/app-templates";
import { MawellLogo } from "@/components/layout/MawellLogo";

export const metadata: Metadata = {
  title: "แอปมือถือ MAWELL",
  description: "ทางเข้าใช้งาน MAWELL บนมือถือ",
  robots: { index: false, follow: false },
};

/** ซ่อนคู่มือติดตั้ง APK/iOS ชั่วคราว — จะใช้ปุ่มลัดหน้าจอโฮมภายหลัง */
export default function DownloadAppPage() {
  return (
    <AppPublicCheckInGlassPage>
      <div className="mx-auto max-w-lg space-y-6 px-1 pb-16 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-0 sm:pt-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-white/80"
          >
            <MawellLogo size="md" />
          </Link>
          <Link href="/" className="text-sm font-bold text-[#5b61ff] underline-offset-2 hover:underline">
            ← กลับหน้าแรก
          </Link>
        </header>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b61ff]">มือถือ</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1e1b4b]">ยังไม่เปิดติดตั้งแอป</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#66638c]">
            ตอนนี้ยังไม่ใช้ปุ่มติดตั้งแอปสำหรับ iPhone / Android — ภายหลังจะใช้แบบสร้างปุ่มลัดบนหน้าจอโฮมแทน
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-5 text-sm font-black text-white shadow-sm"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </AppPublicCheckInGlassPage>
  );
}

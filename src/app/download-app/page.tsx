import type { Metadata } from "next";
import Link from "next/link";
import { LandingAndroidInstallGuide } from "@/app/landing/LandingAndroidInstallGuide";
import { AppPublicCheckInGlassPage } from "@/components/app-templates";
import { MawellLogo } from "@/components/layout/MawellLogo";

export const metadata: Metadata = {
  title: "ดาวน์โหลดแอป MAWELL | Android",
  description: "ดาวน์โหลดไฟล์ APK และติดตั้งแอป MAWELL บนมือถือ Android ด้วยตัวเอง",
};

export default function DownloadAppPage() {
  return (
    <AppPublicCheckInGlassPage>
      <div className="mx-auto max-w-3xl space-y-8 px-1 pb-16 pt-4 sm:px-0 sm:pt-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-white/80"
          >
            <MawellLogo size="md" />
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-[#5b61ff] underline-offset-2 hover:underline"
          >
            ← กลับหน้าแรก
          </Link>
        </header>

        <LandingAndroidInstallGuide variant="page" />
      </div>
    </AppPublicCheckInGlassPage>
  );
}

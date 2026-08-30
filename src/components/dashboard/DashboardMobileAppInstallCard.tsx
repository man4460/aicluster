import Link from "next/link";
import {
  appDashboardBrandGradientBarClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type Props = {
  displayName: string;
  className?: string;
};

/** ส่วนหัวหน้าแดชบอร์ด — ทักทาย + ลิงก์ดูระบบทั้งหมด */
export function DashboardMobileAppInstallCard({ displayName, className }: Props) {
  return (
    <header
      className={cn(
        "app-surface overflow-hidden rounded-[1.35rem] border border-[#e8e6fc]/80 p-4 sm:p-5",
        className,
      )}
    >
      <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 pl-0.5 sm:pl-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Workspace</p>
          <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">
            สวัสดี, <span className="app-gradient-text">{displayName}</span>
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/dashboard/systems"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/70 bg-white/85 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-white active:scale-[0.99] sm:px-4"
          >
            ดูระบบ
          </Link>
          <Link
            href="/dashboard/modules"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99] sm:px-4"
          >
            ดูระบบทั้งหมด
          </Link>
        </div>
      </div>
    </header>
  );
}

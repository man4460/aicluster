"use client";

import type { ReactNode } from "react";
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

export type StaffQrLandingVariant = "car-wash" | "laundry" | "barber" | "massage";

function StaffQrLandingHeroIcon({ variant }: { variant: StaffQrLandingVariant }) {
  const cls = "h-7 w-7 text-[#5b61ff]";
  switch (variant) {
    case "car-wash":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
          <circle cx="12" cy="11" r="2.5" />
          <path d="m8 19 4-2 4 2" />
        </svg>
      );
    case "laundry":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v18M8 8l8 8M16 8l-8 8" />
          <circle cx="12" cy="12" r="9" opacity="0.35" />
        </svg>
      );
    case "barber":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case "massage":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M8 12c2-2 6-2 8 0M7 16c3-3 7-3 10 0" />
          <circle cx="12" cy="5" r="2" />
        </svg>
      );
  }
}

/**
 * หน้าเป้าหมาย QR พนักงาน (หลังสแกน ล็อกอินแล้ว) — โครงเดียวกับคาร์แคร์ staff lane:
 * พื้นหลัง glass · ไอคอนกลาง · หัวเรื่องเข้ม · (ถ้ามี) คำบรรยาย · ชื่อร้าน · การ์ดเนื้อหา
 */
export function StaffQrLandingShell({
  variant,
  title,
  subtitle,
  shopLabel,
  loading = false,
  error,
  children,
  className,
  pageClassName,
}: {
  variant: StaffQrLandingVariant;
  title: string;
  /** ถ้าไม่ส่งหรือว่าง — ไม่แสดงบรรทัดคำบรรยายใต้หัวเรื่อง (โหมดพนักงานแบบย่อ) */
  subtitle?: string | null;
  shopLabel?: string | null;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
  /** คลาสเพิ่มบน inner column (เช่น flex-1) */
  className?: string;
  /** คลาสเพิ่มบน AppPublicCheckInGlassPage root */
  pageClassName?: string;
}) {
  return (
    <AppPublicCheckInGlassPage className={cn("flex min-h-[100dvh] flex-1 flex-col", pageClassName)}>
      <div className={cn("relative mx-auto w-full max-w-md flex-1 space-y-4", className)}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <StaffQrLandingHeroIcon variant={variant} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{title}</h1>
          {subtitle?.trim() ? <p className="mt-1 text-sm text-[#6b6894]">{subtitle.trim()}</p> : null}
          {shopLabel?.trim() ?
            <p className="mt-2 text-xs font-bold text-[#9490c0]">{shopLabel.trim()}</p>
          : null}
        </div>
        {loading ? <p className="text-center text-sm text-[#66638c]">กำลังโหลด...</p> : null}
        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
        {!loading && children != null ?
          <div className={appPublicCheckInGlassCardClass}>
            <div className="px-5 py-5 sm:px-6">{children}</div>
          </div>
        : null}
      </div>
    </AppPublicCheckInGlassPage>
  );
}

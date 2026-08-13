"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  appDashboardBrandGradientFillClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BUILDING_POS_PUBLIC_PRESENTATION_HREF } from "@/systems/building-pos/building-pos-nav";

/** การ์ดสไลด์นำเสนอในคู่มือ — คัดลอกลิงก์สาธารณะ + เปิดเต็มจอ */
export function BuildingPosPresentationGuideCard() {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const copyPresentationLink = useCallback(async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${BUILDING_POS_PUBLIC_PRESENTATION_HREF}`
          : BUILDING_POS_PUBLIC_PRESENTATION_HREF;
      await navigator.clipboard.writeText(url);
      setCopyMsg("คัดลอกลิงก์แล้ว — โพสต์ Facebook / ส่ง LINE ได้");
      window.setTimeout(() => setCopyMsg(null), 2800);
    } catch {
      setCopyMsg("คัดลอกไม่สำเร็จ");
      window.setTimeout(() => setCopyMsg(null), 2200);
    }
  }, []);

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[#dcd8f0]/90 bg-gradient-to-br from-white via-[#f5f3ff]/90 to-[#ede9fe]/70 p-4 shadow-[0_12px_28px_-20px_rgba(77,71,182,0.35)] ring-1 ring-inset ring-white/70 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-fuchsia-500/25",
            appDashboardBrandGradientFillClass,
          )}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <rect x="2" y="4" width="20" height="16" rx="2.5" />
            <path d="M6 8h.01M10 8h.01M14 8h4M8 12h8M8 16h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">สไลด์นำเสนอ</p>
          <h4 className="mt-1 text-base font-black tracking-tight text-[#1e1b4b]">แนะนำ POS ร้านอาหารแบบเต็มจอ</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5f5a8a]">
            ลิงก์สาธารณะ ไม่มีแถบหัวแดชบอร์ด — เปิดเต็มจอ และโพสต์ Facebook หรือส่งใน LINE ได้เลย
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void copyPresentationLink()}
          className={cn(
            appTemplateOutlineButtonClass,
            "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border-[#dcd8f0] bg-white/90 px-4 text-sm font-black text-[#4d47b6] sm:flex-none",
          )}
          aria-label="คัดลอกลิงก์สไลด์นำเสนอ"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
          </svg>
          คัดลอกลิงก์
        </button>
        <Link
          href={BUILDING_POS_PUBLIC_PRESENTATION_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] sm:flex-none",
            appDashboardBrandGradientFillClass,
          )}
          aria-label="รับชมสไลด์นำเสนอเต็มจอ"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
            <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" strokeLinecap="round" />
          </svg>
          รับชมสไลด์นำเสนอเต็มจอ
        </Link>
      </div>
      {copyMsg ? (
        <p className="mt-2 text-xs font-semibold text-emerald-700" role="status" aria-live="polite">
          {copyMsg}
        </p>
      ) : (
        <p className="mt-2 break-all text-[11px] font-medium text-[#8b87b0]">
          {BUILDING_POS_PUBLIC_PRESENTATION_HREF}
        </p>
      )}
    </div>
  );
}

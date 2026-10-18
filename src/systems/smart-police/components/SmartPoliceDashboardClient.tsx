"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { SMART_POLICE_CASE_PRIORITY_LABEL, SMART_POLICE_CASE_STATUS_LABEL } from "@/lib/smart-police/types";
import { IconSpCase, IconSpPlus, IconSpPrint, IconSpSettings } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceListRowAccentClass,
  smartPoliceListRowClass,
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelDividerClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceSectionHeadingClass,
  smartPoliceStatInlineClass,
  smartPoliceStatsGridClass,
  smartPoliceSubtitleClass,
} from "@/systems/smart-police/lib/ui-tokens";
import type { SmartPoliceCasePriority, SmartPoliceCaseStatus } from "@/generated/prisma/enums";

type Overview = {
  summary: {
    totalCases: number;
    openCases: number;
    inProgress: number;
    closed: number;
    totalPrints: number;
    overdueCount: number;
    urgentCount: number;
    notSentToProsecutor: number;
  };
  recentCases: {
    id: string;
    caseNumber: string;
    title: string;
    status: SmartPoliceCaseStatus;
    priority: SmartPoliceCasePriority;
    daysSinceReceived: number | null;
    overdue: boolean;
    sentToProsecutorAt: string | null;
    documentCount: number;
    updatedAt: string;
  }[];
};

export function SmartPoliceDashboardClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/smart-police/reports/overview", { cache: "no-store" });
    if (!res.ok) return;
    setData((await res.json()) as Overview);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const s = data?.summary;

  return (
    <div className={smartPolicePageStackClass}>
      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="ภาพรวม"
          description="สถิติคดี · เกินกำหนด · ส่งอัยการ"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
              <Link
                href="/dashboard/smart-police/settings"
                className={smartPoliceOutlineButtonClass}
                aria-label="ตั้งค่าสถานี"
              >
                <IconSpSettings className="h-4 w-4 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">ตั้งค่า</span>
              </Link>
              <Link
                href="/dashboard/smart-police/cases"
                className={smartPoliceOutlineButtonClass}
                aria-label="เปิดรายการคดี"
              >
                <IconSpCase className="h-4 w-4 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">คดีทั้งหมด</span>
              </Link>
              <Link
                href="/dashboard/smart-police/cases?new=1"
                className={cn(smartPolicePrimaryIconButtonClass, "sm:hidden")}
                aria-label="สร้างสำนวนแรก"
              >
                <IconSpPlus className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/dashboard/smart-police/cases?new=1"
                className={cn(smartPolicePrimaryButtonClass, "hidden sm:inline-flex")}
                aria-label="สร้างสำนวนแรก"
              >
                <IconSpPlus className="h-3.5 w-3.5" aria-hidden />
                สำนวนแรก
              </Link>
            </div>
          }
        />

        <div className={cn("mt-4", smartPoliceStatsGridClass)}>
          {[
            { label: "คดีทั้งหมด", value: s?.totalCases ?? "—" },
            { label: "เปิด/สอบสวน", value: (s?.openCases ?? 0) + (s?.inProgress ?? 0) },
            { label: "เกินกำหนด", value: s?.overdueCount ?? "—", warn: true },
            { label: "ด่วน/สูง", value: s?.urgentCount ?? "—", warn: true },
            { label: "ยังไม่ส่งอัยการ", value: s?.notSentToProsecutor ?? "—" },
            { label: "พิมพ์สะสม", value: s?.totalPrints ?? "—", icon: true },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                smartPoliceStatInlineClass,
                "warn" in card && card.warn && (s?.overdueCount || s?.urgentCount)
                  ? "ring-1 ring-amber-200/80"
                  : undefined,
              )}
            >
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#8b87b8]">
                {"icon" in card && card.icon ? <IconSpPrint className="h-3 w-3" aria-hidden /> : null}
                {card.label}
              </p>
              <p
                className={cn(
                  "text-xl font-black tabular-nums sm:text-2xl",
                  "warn" in card && card.warn ? "text-amber-800" : "text-[#1e1b4b]",
                )}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/dashboard/smart-police/cases?prosecutor=pending"
            className={cn(smartPoliceOutlineButtonClass, "text-[11px]")}
          >
            กรองยังไม่ส่งอัยการ
          </Link>
          <Link
            href="/dashboard/smart-police/cases?priority=URGENT"
            className={cn(smartPoliceOutlineButtonClass, "text-[11px]")}
          >
            กรองคดีด่วน
          </Link>
        </div>

        <div className={cn(smartPolicePanelDividerClass, "mt-4 space-y-3 pt-4")}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={smartPoliceSectionHeadingClass}>คดีล่าสุด</h3>
            <p className={cn(smartPoliceSubtitleClass, "mt-0")}>อัปเดตล่าสุดจากระบบ</p>
          </div>

          {loading ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : !data?.recentCases.length ? (
            <AppEmptyState>ยังไม่มีคดี — กด «สำนวนแรก» เพื่อเริ่มวิซาร์ด</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {data.recentCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/smart-police/cases/${c.id}`}
                    className={
                      c.overdue ? smartPoliceListRowAccentClass("rose") : smartPoliceListRowClass
                    }
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-[#1e1b4b]">
                        <span className="text-[#4d47b6]">{c.caseNumber}</span>
                        <span className="mx-1.5 text-slate-300" aria-hidden>
                          ·
                        </span>
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                        {SMART_POLICE_CASE_STATUS_LABEL[c.status]} ·{" "}
                        {SMART_POLICE_CASE_PRIORITY_LABEL[c.priority]}
                        {c.daysSinceReceived != null ? ` · รับคดี ${c.daysSinceReceived} วัน` : ""}
                        {c.sentToProsecutorAt ? " · ส่งอัยการแล้ว" : ""} · {c.documentCount} เอกสาร
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-[#5b61ff]">เปิด →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

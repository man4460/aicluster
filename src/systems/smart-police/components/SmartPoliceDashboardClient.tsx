"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { SMART_POLICE_CASE_PRIORITY_LABEL, SMART_POLICE_CASE_STATUS_LABEL } from "@/lib/smart-police/types";
import { IconSpPlus, IconSpPrint } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceListRowAccentClass,
  smartPoliceListRowClass,
  smartPoliceMutedTextClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelDividerClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceSectionHeadingClass,
  smartPoliceStatCellClass,
  smartPoliceStatInlineClass,
  smartPoliceStatsGridClass,
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
        <div className={smartPoliceCardHeaderRowClass}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>ภาพรวม</h2>
            {s?.totalCases != null ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">{s.totalCases} คดี</span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <Link
              href="/dashboard/smart-police/cases?new=1"
              className={cn(smartPolicePrimaryIconButtonClass, "sm:hidden")}
              aria-label="สร้างสำนวนแรก"
            >
              <IconSpPlus className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href="/dashboard/smart-police/cases?new=1"
              className={cn(smartPolicePrimaryButtonClass, "hidden sm:inline-flex")}
              aria-label="สร้างสำนวนแรก"
            >
              <IconSpPlus className="h-3 w-3" aria-hidden />
              สำนวนแรก
            </Link>
          </div>
        </div>

        <div className={cn("mt-1.5", smartPoliceStatsGridClass)}>
          {[
            { label: "ทั้งหมด", value: s?.totalCases ?? "—" },
            { label: "เปิด/สอบสวน", value: (s?.openCases ?? 0) + (s?.inProgress ?? 0) },
            { label: "เกินกำหนด", value: s?.overdueCount ?? "—", warn: true },
            { label: "ด่วน/สูง", value: s?.urgentCount ?? "—", warn: true },
            { label: "ยังไม่ส่ง", value: s?.notSentToProsecutor ?? "—" },
            { label: "พิมพ์", value: s?.totalPrints ?? "—", icon: true },
          ].map((card) => (
            <div key={card.label} className={smartPoliceStatCellClass}>
              <div
                className={cn(
                  smartPoliceStatInlineClass,
                  "warn" in card && card.warn && (s?.overdueCount || s?.urgentCount)
                    ? "ring-1 ring-amber-200/80"
                    : undefined,
                )}
              >
                <p className="flex items-center gap-0.5 truncate text-[9px] font-bold uppercase tracking-wide text-[#8b87b8]">
                  {"icon" in card && card.icon ? (
                    <IconSpPrint className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  ) : null}
                  {card.label}
                </p>
                <p
                  className={cn(
                    "text-sm font-black tabular-nums sm:text-base",
                    "warn" in card && card.warn ? "text-amber-800" : "text-[#1e1b4b]",
                  )}
                >
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={cn(smartPolicePanelDividerClass, "mt-2 space-y-1 pt-2")}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <h3 className={smartPoliceSectionHeadingClass}>คดีล่าสุด</h3>
            <nav
              className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[11px] font-semibold"
              aria-label="กรองด่วน"
            >
              <Link
                href="/dashboard/smart-police/cases?prosecutor=pending"
                className="text-[#5b61ff] underline-offset-2 hover:underline"
              >
                ยังไม่ส่ง
                {s?.notSentToProsecutor != null ? (
                  <span className="ml-0.5 tabular-nums">{s.notSentToProsecutor}</span>
                ) : null}
              </Link>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <Link
                href="/dashboard/smart-police/cases?priority=URGENT"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                ด่วน
                {s?.urgentCount != null ? (
                  <span className="ml-0.5 tabular-nums">{s.urgentCount}</span>
                ) : null}
              </Link>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <Link
                href="/dashboard/smart-police/cases"
                className="text-[#66638c] underline-offset-2 hover:underline hover:text-[#4d47b6]"
              >
                ทั้งหมด
              </Link>
            </nav>
          </div>

          {loading ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : !data?.recentCases.length ? (
            <AppEmptyState>ยังไม่มีคดี — กด «สำนวนแรก» เพื่อเริ่มวิซาร์ด</AppEmptyState>
          ) : (
            <ul className="space-y-1">
              {data.recentCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/smart-police/cases/${c.id}`}
                    className={
                      c.overdue ? smartPoliceListRowAccentClass("rose") : smartPoliceListRowClass
                    }
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[13px] font-bold text-[#1e1b4b]">
                        <span className="text-[#4d47b6]">{c.caseNumber}</span>
                        <span className="mx-1 text-slate-300" aria-hidden>
                          ·
                        </span>
                        {c.title}
                      </p>
                      <p className="truncate text-[10px] font-medium text-[#66638c]">
                        {SMART_POLICE_CASE_STATUS_LABEL[c.status]} ·{" "}
                        {SMART_POLICE_CASE_PRIORITY_LABEL[c.priority]}
                        {c.daysSinceReceived != null ? ` · ${c.daysSinceReceived} วัน` : ""}
                        {c.sentToProsecutorAt ? " · ส่งอัยการ" : ""} · {c.documentCount} เอกสาร
                      </p>
                    </div>
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

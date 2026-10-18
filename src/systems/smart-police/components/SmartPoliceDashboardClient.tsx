"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { IconSpPlus, IconSpPrint } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  SmartPoliceCaseListCard,
  type SmartPoliceCaseListCardData,
} from "@/systems/smart-police/components/SmartPoliceCaseListCard";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceFillBodyClass,
  smartPoliceFillPanelClass,
  smartPoliceMutedTextClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelDividerClass,
  smartPolicePanelSectionClass,
  smartPoliceScrollListClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceSectionHeadingClass,
  smartPoliceStatCellClass,
  smartPoliceStatInlineClass,
  smartPoliceStatsGridClass,
} from "@/systems/smart-police/lib/ui-tokens";

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
  recentCases: SmartPoliceCaseListCardData[];
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
      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
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

        <div className={cn("mt-1.5 shrink-0", smartPoliceStatsGridClass)}>
          {(
            [
              {
                label: "ทั้งหมด",
                value: s?.totalCases ?? "—",
                href: "/dashboard/smart-police/cases",
                aria: "ดูคดีทั้งหมด",
              },
              {
                label: "เปิด/สอบสวน",
                value: (s?.openCases ?? 0) + (s?.inProgress ?? 0),
                href: "/dashboard/smart-police/cases?status=active",
                aria: "กรองคดีเปิดและกำลังสอบสวน",
              },
              {
                label: "เกินกำหนด",
                value: s?.overdueCount ?? "—",
                href: "/dashboard/smart-police/cases?overdue=1",
                aria: "กรองคดีเกินกำหนด",
                warn: true,
              },
              {
                label: "ด่วน/สูง",
                value: s?.urgentCount ?? "—",
                href: "/dashboard/smart-police/cases?priority=elevated",
                aria: "กรองคดีความสำคัญด่วนหรือสูง",
                warn: true,
              },
              {
                label: "ยังไม่ส่ง",
                value: s?.notSentToProsecutor ?? "—",
                href: "/dashboard/smart-police/cases?prosecutor=pending",
                aria: "กรองคดียังไม่ส่งอัยการ",
              },
              {
                label: "พิมพ์",
                value: s?.totalPrints ?? "—",
                href: "/dashboard/smart-police/reports",
                aria: "ดูรายงานการพิมพ์",
                icon: true,
              },
            ] as const
          ).map((card) => (
            <div key={card.label} className={smartPoliceStatCellClass}>
              <Link
                href={card.href}
                aria-label={card.aria}
                title={card.aria}
                className={cn(
                  smartPoliceStatInlineClass,
                  "transition hover:bg-white hover:ring-1 hover:ring-[#5b61ff]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35",
                  "warn" in card &&
                    card.warn &&
                    (Number(s?.overdueCount) > 0 || Number(s?.urgentCount) > 0)
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
              </Link>
            </div>
          ))}
        </div>

        <div
          className={cn(
            smartPolicePanelDividerClass,
            smartPoliceFillBodyClass,
            "mt-2 space-y-1 pt-2",
          )}
        >
          <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
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
            <ul className={cn(smartPoliceScrollListClass, "space-y-1")}>
              {data.recentCases.map((c) => (
                <li key={c.id}>
                  <SmartPoliceCaseListCard caseItem={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

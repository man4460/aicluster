"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppCompareBarList } from "@/components/app-templates";
import { SMART_POLICE_CASE_STATUS_LABEL, SMART_POLICE_DOCUMENT_KIND_LABEL } from "@/lib/smart-police/types";
import { cn } from "@/lib/cn";
import type { SmartPoliceCaseStatus, SmartPoliceDocumentKind } from "@/generated/prisma/enums";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceIconButtonClass,
  smartPoliceListRowClass,
  smartPoliceMutedTextClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelDividerClass,
  smartPolicePanelSectionClass,
  smartPoliceSectionHeadingClass,
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
  };
  documentsByKind: { kind: SmartPoliceDocumentKind; count: number }[];
  recentCases: {
    id: string;
    caseNumber: string;
    title: string;
    status: SmartPoliceCaseStatus;
    documentCount: number;
  }[];
};

export function SmartPoliceReportsClient() {
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
  const docMax = Math.max(...(data?.documentsByKind.map((x) => x.count) ?? [1]), 1);
  const barRows =
    data?.documentsByKind.map((d) => ({
      key: d.kind,
      label: SMART_POLICE_DOCUMENT_KIND_LABEL[d.kind],
      amount: d.count,
      pct: Math.round((d.count / docMax) * 100),
    })) ?? [];

  const caseMax = Math.max(s?.totalCases ?? 1, 1);
  const statusRows = s
    ? [
        { key: "OPEN", label: SMART_POLICE_CASE_STATUS_LABEL.OPEN, amount: s.openCases },
        { key: "IN_PROGRESS", label: SMART_POLICE_CASE_STATUS_LABEL.IN_PROGRESS, amount: s.inProgress },
        { key: "CLOSED", label: SMART_POLICE_CASE_STATUS_LABEL.CLOSED, amount: s.closed },
      ].map((r) => ({ ...r, pct: Math.round((r.amount / caseMax) * 100) }))
    : [];

  return (
    <div className={smartPolicePageStackClass}>
      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <div className={smartPoliceCardHeaderRowClass}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>รายงาน</h2>
            {s?.totalCases != null ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                {s.totalCases} คดี
              </span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              className={cn(smartPoliceIconButtonClass, "sm:min-w-0 sm:px-3")}
              aria-label="รีเฟรชข้อมูลรายงาน"
              disabled={loading}
              aria-busy={loading}
              onClick={() => void load()}
            >
              <span className={cn(loading && "inline-block animate-spin")}>↻</span>
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        </div>

        <div className={cn("mt-1.5", smartPoliceStatsGridClass)}>
          {[
            { label: "ทั้งหมด", value: s?.totalCases ?? 0 },
            { label: "เปิด", value: s?.openCases ?? 0 },
            { label: "สอบสวน", value: s?.inProgress ?? 0 },
            { label: "ปิด", value: s?.closed ?? 0 },
            { label: "พิมพ์", value: s?.totalPrints ?? 0 },
          ].map((c) => (
            <div key={c.label} className={cn(smartPoliceStatInlineClass, smartPoliceStatCellGrow)}>
              <p className="text-[9px] font-bold uppercase text-[#8b87b8]">{c.label}</p>
              <p className="text-sm font-black tabular-nums text-[#1e1b4b] sm:text-base">{c.value}</p>
            </div>
          ))}
        </div>

        {(statusRows.length > 0 || barRows.length > 0) && (
          <div className={cn(smartPolicePanelDividerClass, "mt-2 grid gap-2 pt-2 lg:grid-cols-2")}>
            {statusRows.length > 0 ? (
              <div className="min-w-0">
                <h3 className={smartPoliceSectionHeadingClass}>สถานะ</h3>
                <div className="mt-1">
                  <AppCompareBarList title="" emptyText="ไม่มีข้อมูล" rows={statusRows} />
                </div>
              </div>
            ) : null}
            {barRows.length > 0 ? (
              <div className="min-w-0">
                <h3 className={smartPoliceSectionHeadingClass}>เอกสาร</h3>
                <div className="mt-1">
                  <AppCompareBarList title="" emptyText="ไม่มีเอกสาร" rows={barRows} />
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className={cn(smartPolicePanelDividerClass, "mt-2 pt-2")}>
          <h3 className={smartPoliceSectionHeadingClass}>คดีล่าสุด</h3>
          <div className="mt-1">
            {loading && !data ? (
              <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
            ) : (
              <ul className="grid grid-cols-1 gap-1 lg:grid-cols-2">
                {(data?.recentCases ?? []).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/smart-police/cases/${c.id}`}
                      className={cn(smartPoliceListRowClass, "block text-[13px] font-semibold")}
                    >
                      <span className="text-[#4d47b6]">{c.caseNumber}</span>
                      <span className="mx-1 text-slate-300" aria-hidden>
                        ·
                      </span>
                      {c.title}
                      <span className="ml-1 font-medium text-[#66638c]">({c.documentCount})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const smartPoliceStatCellGrow = "min-w-[4.25rem] shrink-0 sm:min-w-0 sm:flex-1";

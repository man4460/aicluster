"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppCompareBarList } from "@/components/app-templates";
import { SMART_POLICE_CASE_STATUS_LABEL, SMART_POLICE_DOCUMENT_KIND_LABEL } from "@/lib/smart-police/types";
import { cn } from "@/lib/cn";
import type { SmartPoliceCaseStatus, SmartPoliceDocumentKind } from "@/generated/prisma/enums";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardMetaClass,
  smartPoliceCardTitleClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceIconButtonClass,
  smartPoliceListRowClass,
  smartPoliceMutedTextClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
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
          <div className="min-w-0">
            <h2 className={smartPoliceCardTitleClass}>รายงานสรุป</h2>
            <p className={smartPoliceCardMetaClass}>ภาพรวมคดี เอกสาร และการพิมพ์</p>
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

        <div className={cn("mt-3", smartPoliceStatsGridClass)}>
          {[
            { label: "คดีทั้งหมด", value: s?.totalCases ?? 0 },
            { label: "เปิดอยู่", value: s?.openCases ?? 0 },
            { label: "กำลังสอบสวน", value: s?.inProgress ?? 0 },
            { label: "ปิดคดี", value: s?.closed ?? 0 },
            { label: "พิมพ์สะสม", value: s?.totalPrints ?? 0 },
          ].map((c) => (
            <div key={c.label} className={cn(smartPoliceStatInlineClass, smartPoliceStatCellGrow)}>
              <p className="text-[10px] font-bold uppercase text-[#8b87b8]">{c.label}</p>
              <p className="mt-1 text-2xl font-black text-[#1e1b4b]">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        {statusRows.length > 0 ? (
          <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
            <h3 className={smartPoliceSectionHeadingClass}>คดีตามสถานะ</h3>
            <div className="mt-2">
              <AppCompareBarList title="จำนวนคดี" emptyText="ไม่มีข้อมูล" rows={statusRows} />
            </div>
          </section>
        ) : null}

        {barRows.length > 0 ? (
          <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
            <h3 className={smartPoliceSectionHeadingClass}>เอกสารตามประเภท</h3>
            <div className="mt-2">
              <AppCompareBarList title="จำนวนเอกสาร" emptyText="ไม่มีเอกสาร" rows={barRows} />
            </div>
          </section>
        ) : null}
      </div>

      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <h3 className={smartPoliceSectionHeadingClass}>คดีล่าสุดในรายงาน</h3>
        <div className="mt-2">
          {loading && !data ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {(data?.recentCases ?? []).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/smart-police/cases/${c.id}`}
                    className={cn(smartPoliceListRowClass, "block text-sm")}
                  >
                    {c.caseNumber} — {c.title} ({c.documentCount} เอกสาร)
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

const smartPoliceStatCellGrow = "min-w-[5rem] shrink-0 sm:min-w-0 sm:flex-1";

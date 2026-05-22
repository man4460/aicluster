"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppCompareBarList, AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { SMART_POLICE_CASE_STATUS_LABEL, SMART_POLICE_DOCUMENT_KIND_LABEL } from "@/lib/smart-police/types";
import { smartPoliceStatCardClass } from "@/systems/smart-police/smart-police-tokens";
import { cn } from "@/lib/cn";
import type { SmartPoliceCaseStatus, SmartPoliceDocumentKind } from "@/generated/prisma/enums";

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
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5"
          title="รายงานสรุป"
          description="ภาพรวมคดี เอกสาร และการพิมพ์"
          action={
            <button
              type="button"
              className="app-btn-soft min-h-[40px] min-w-[40px] rounded-xl sm:min-w-0 sm:px-4"
              aria-label="รีเฟรชข้อมูลรายงาน"
              disabled={loading}
              aria-busy={loading}
              onClick={() => void load()}
            >
              <span className={cn(loading && "inline-block animate-spin")}>↻</span>
              <span className="hidden sm:inline sm:ml-1.5">รีเฟรช</span>
            </button>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "คดีทั้งหมด", value: s?.totalCases ?? 0 },
            { label: "ปิดคดี", value: s?.closed ?? 0 },
            { label: "พิมพ์สะสม", value: s?.totalPrints ?? 0, span: true },
          ].map((c, i, arr) => (
            <div
              key={c.label}
              className={cn(
                smartPoliceStatCardClass,
                arr.length % 2 === 1 && i === arr.length - 1 && "col-span-2 sm:col-span-1",
                "span" in c && c.span && "col-span-2 sm:col-span-1",
              )}
            >
              <p className="text-[10px] font-bold uppercase text-[#8b87b8]">{c.label}</p>
              <p className="mt-1 text-2xl font-black text-[#1e1b4b]">{c.value}</p>
            </div>
          ))}
        </div>
      </AppDashboardSection>

      {statusRows.length > 0 && (
        <AppDashboardSection>
          <AppSectionHeader title="คดีตามสถานะ" />
          <AppCompareBarList
            title="จำนวนคดี"
            emptyText="ไม่มีข้อมูล"
            rows={statusRows}
          />
        </AppDashboardSection>
      )}

      {barRows.length > 0 && (
        <AppDashboardSection>
          <AppSectionHeader title="เอกสารตามประเภท" />
          <AppCompareBarList
            title="จำนวนเอกสาร"
            emptyText="ไม่มีเอกสาร"
            rows={barRows}
          />
        </AppDashboardSection>
      )}

      <AppDashboardSection>
        <AppSectionHeader title="คดีล่าสุดในรายงาน" />
        <ul className="space-y-2">
          {(data?.recentCases ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/smart-police/cases/${c.id}`}
                className="block rounded-xl border border-white/50 bg-white/50 px-3 py-2 text-left text-sm hover:bg-white/80"
              >
                {c.caseNumber} — {c.title} ({c.documentCount} เอกสาร)
              </Link>
            </li>
          ))}
        </ul>
      </AppDashboardSection>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { IconSpCase, IconSpPlus, IconSpPrint } from "@/systems/smart-police/components/SmartPoliceIcons";
import { smartPoliceHeroCardClass, smartPoliceStatCardClass } from "@/systems/smart-police/smart-police-tokens";
import { SMART_POLICE_CASE_STATUS_LABEL } from "@/lib/smart-police/types";
import type { SmartPoliceCaseStatus } from "@/generated/prisma/enums";

type Overview = {
  summary: {
    totalCases: number;
    openCases: number;
    inProgress: number;
    closed: number;
    totalPrints: number;
  };
  recentCases: {
    id: string;
    caseNumber: string;
    title: string;
    status: SmartPoliceCaseStatus;
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
    <div className="space-y-4 sm:space-y-6">
      <section className={smartPoliceHeroCardClass}>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="ภาพรวมคดี"
          description="จัดการสำนวน พิมพ์หมาย และรายงาน — เริ่มจากเปิดคดีใหม่หรือตั้งค่าหัวกระดาษสถานี"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/smart-police/settings"
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px] min-w-[40px] px-3 sm:min-w-0 sm:px-4")}
                aria-label="ตั้งค่าสถานี"
              >
                <span className="hidden sm:inline">ตั้งค่า</span>
                <span className="sm:hidden">⚙</span>
              </Link>
              <Link
                href="/dashboard/smart-police/cases"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-2 rounded-xl px-3 sm:min-w-0 sm:px-4"
                aria-label="เปิดรายการคดี"
              >
                <IconSpCase className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">คดีทั้งหมด</span>
              </Link>
              <Link
                href="/dashboard/smart-police/cases?new=1"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl sm:min-w-0 sm:px-4"
                aria-label="เปิดคดีใหม่"
              >
                <IconSpPlus className="h-5 w-5" />
                <span className="hidden sm:inline">+ คดีใหม่</span>
              </Link>
            </div>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: "คดีทั้งหมด", value: s?.totalCases ?? "—" },
            { label: "เปิดคดี", value: s?.openCases ?? "—" },
            { label: "สอบสวน", value: s?.inProgress ?? "—" },
            { label: "พิมพ์สะสม", value: s?.totalPrints ?? "—", icon: IconSpPrint },
          ].map((card, i, arr) => (
            <div
              key={card.label}
              className={cn(
                smartPoliceStatCardClass,
                arr.length % 2 === 1 && i === arr.length - 1 && "col-span-2 sm:col-span-1",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b87b8]">{card.label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#1e1b4b]">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <AppDashboardSection>
        <AppSectionHeader title="คดีล่าสุด" description="อัปเดตล่าสุดจากระบบ" />
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : !data?.recentCases.length ? (
          <AppEmptyState>ยังไม่มีคดี — กด «คดีใหม่» เพื่อเริ่มบันทึกสำนวน</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {data.recentCases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/smart-police/cases/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 transition hover:bg-white/80"
                >
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold text-[#1e1b4b]">
                      {c.caseNumber} · {c.title}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {SMART_POLICE_CASE_STATUS_LABEL[c.status]} · {c.documentCount} เอกสาร
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[#8b87b8]">เปิด →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}

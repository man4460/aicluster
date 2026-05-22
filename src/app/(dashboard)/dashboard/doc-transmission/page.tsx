import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppColumnBarSparkChart,
  AppCompareBarList,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  type AppColumnBarBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { DocStatCard } from "@/systems/doc-transmission/components/DocStatCard";
import { docListRowCardClass, docListRowCardWarnClass } from "@/systems/doc-transmission/doc-ui-tokens";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";
import { loadDocDashboard } from "@/systems/doc-transmission/lib/doc-data";
import {
  DOC_CATEGORY_BY_KEY,
  DOC_CATEGORY_LIST,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
  formatThaiDateLong,
} from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

export default async function DocTransmissionHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getDocTransmissionDataScope(session.sub);
  const data = await loadDocDashboard({
    ownerUserId: session.sub,
    trialSessionId: scope.trialSessionId,
  });

  const hasAnyData = data.totalAll > 0;
  const dailyMax = data.daily.reduce((m, d) => Math.max(m, d.count), 1);
  const dailyBuckets: AppColumnBarBucket[] = data.daily.map((d, i) => ({
    key: `d-${i}`,
    label: d.date.slice(5),
    amount: d.count,
    pct: dailyMax > 0 ? (d.count / dailyMax) * 100 : 0,
  }));

  const categoryRows = DOC_CATEGORY_LIST.map((c) => {
    const count = data.byCategory[c.key];
    const max = Math.max(...Object.values(data.byCategory), 1);
    return {
      key: `cat-${c.key}`,
      label: `${c.title} · ${count} ฉบับ`,
      amount: count,
      pct: max > 0 ? (count / max) * 100 : 0,
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="สรุปสารบรรณดิจิทัล"
          description={`ภาพรวม ${formatThaiDateLong(new Date())} (เวลาไทย)`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/doc-transmission/records/orders"
                aria-label="จัดการเอกสาร"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
              >
                <IconDocStack className="h-5 w-5 sm:hidden" strokeWidth={2.5} />
                <span className="hidden sm:inline">จัดการเอกสาร</span>
              </Link>
              <Link
                href="/dashboard/doc-transmission/reports"
                aria-label="ดูรายงาน"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
                )}
              >
                <IconReportChart className="h-5 w-5 shrink-0 sm:hidden" />
                <span className="hidden sm:inline">ดูรายงาน</span>
              </Link>
            </div>
          }
        />

        {hasAnyData ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DocStatCard title="ทั้งหมด" value={data.totalAll.toLocaleString("th-TH")} subtitle="ฉบับ" tone="violet" />
            <DocStatCard
              title="กำลังดำเนินการ"
              value={data.byStatus.IN_PROGRESS.toLocaleString("th-TH")}
              subtitle="ฉบับ"
              tone="amber"
            />
            <DocStatCard
              title="เสร็จสิ้น"
              value={data.byStatus.DONE.toLocaleString("th-TH")}
              subtitle="ฉบับ"
              tone="emerald"
            />
            <DocStatCard
              title="เลยกำหนด"
              value={data.overdueCount.toLocaleString("th-TH")}
              subtitle="ฉบับ"
              tone="rose"
            />
          </div>
        ) : (
          <AppEmptyState>
            <div className="flex flex-col items-center gap-3">
              <div>
                <p className="font-semibold text-[#2e2a58]">ยังไม่มีเอกสารในระบบ</p>
                <p className="mt-1 text-xs text-[#66638c]">
                  เริ่มต้นจากการเพิ่มหน่วยงาน · ตั้งค่าเลขที่ · จากนั้นบันทึกเอกสารฉบับแรก
                </p>
              </div>
              <Link
                href="/dashboard/doc-transmission/records/orders"
                className="app-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                + เพิ่มเอกสาร
              </Link>
            </div>
          </AppEmptyState>
        )}
      </AppDashboardSection>

      {hasAnyData ? (
        <>
          <AppDashboardSection tone="slate">
            <AppSectionHeader
              tone="slate"
              title="แนวโน้มจำนวนเอกสาร 30 วันล่าสุด"
              description="นับตามวันที่ของเอกสาร — ทุกหมวดรวมกัน"
            />
            <AppColumnBarSparkChart
              buckets={dailyBuckets}
              compact
              emptyText="ยังไม่มีเอกสารในช่วงนี้"
            />
          </AppDashboardSection>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AppDashboardSection tone="slate">
              <AppSectionHeader tone="slate" title="สัดส่วนเอกสารตามหมวด" description="ทุกปี" />
              <AppCompareBarList
                title="สัดส่วนเอกสาร"
                rows={categoryRows}
                emptyText="ยังไม่มีเอกสาร"
              />
            </AppDashboardSection>

            <AppDashboardSection tone="slate">
              <AppSectionHeader
                tone="slate"
                title="อัปเดตล่าสุด"
                description="เอกสารที่สร้าง/แก้ไขล่าสุด"
              />
              {data.recent.length === 0 ? (
                <AppEmptyState>ยังไม่มีรายการ</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {data.recent.map((r) => {
                    const cat = DOC_CATEGORY_BY_KEY[r.category];
                    const status = DOC_STATUS_BY_KEY[r.status];
                    const priority = DOC_PRIORITY_BY_KEY[r.priority];
                    return (
                      <li key={r.id} className={cn(docListRowCardClass, "flex items-start gap-3")}>
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff]/15 to-[#6a63ff]/10 text-[#5b61ff]">
                          <IconCategoryDot tone={cat.tone} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <Link
                              href={`/dashboard/doc-transmission/records/${cat.slug}/${r.id}`}
                              className="truncate text-sm font-semibold text-[#2e2a58] hover:underline"
                            >
                              {r.subject}
                            </Link>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
                                status.badge,
                              )}
                            >
                              {status.label}
                            </span>
                            {r.priority !== "NORMAL" ? (
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
                                  priority.tone,
                                )}
                              >
                                {priority.label}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#66638c]">
                            {cat.shortTitle} · {r.docNumber}
                            {r.person ? ` · ${r.person}` : ""}
                            {r.departmentName ? ` · ${r.departmentName}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AppDashboardSection>
          </div>

          {data.overdue.length > 0 ? (
            <AppDashboardSection tone="slate">
              <AppSectionHeader
                tone="slate"
                title={`แจ้งเตือนเอกสารเลยกำหนด (${data.overdue.length})`}
                description="เอกสารที่ยังไม่เสร็จและเลย dueDate แล้ว"
              />
              <ul className="space-y-2">
                {data.overdue.map((r) => {
                  const cat = DOC_CATEGORY_BY_KEY[r.category];
                  return (
                    <li key={r.id} className={cn(docListRowCardWarnClass, "flex items-start gap-3")}>
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                        <IconWarn />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/doc-transmission/records/${cat.slug}/${r.id}`}
                          className="truncate text-sm font-semibold text-rose-800 hover:underline"
                        >
                          {r.subject}
                        </Link>
                        <p className="mt-0.5 text-xs text-rose-700">
                          {cat.shortTitle} · {r.docNumber}
                          {r.dueDate ? ` · กำหนด ${r.dueDate.toISOString().slice(0, 10)}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AppDashboardSection>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function IconDocStack({ className, strokeWidth = 2.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReportChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCategoryDot({ tone }: { tone: string }) {
  const map: Record<string, string> = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };
  return <span className={cn("h-3 w-3 rounded-full", map[tone] ?? "bg-slate-400")} aria-hidden />;
}

function IconWarn() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
      <path d="m12 3 10 18H2L12 3z" strokeLinejoin="round" />
    </svg>
  );
}

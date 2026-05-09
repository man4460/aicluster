import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { MediaRegistryCategoryChart } from "@/systems/media-registry/components/MediaRegistryCategoryChart";
import { loadMediaRegistryDashboard } from "@/systems/media-registry/lib/server-dashboard";

export const dynamic = "force-dynamic";

export default async function MediaRegistryHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { summary, categoryBars, recentIssues } = await loadMediaRegistryDashboard(session.sub);

  const valueFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ภาพรวมทะเบียนสื่อ"
          description="จำนวนชิ้น มูลค่าในสต็อก การยืม และงานที่เกินกำหนด"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/media-registry/items"
                aria-label="เปิดทะเบียนสื่อ"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
              >
                <span className="hidden sm:inline">ทะเบียนสื่อ</span>
                <span className="sm:hidden" aria-hidden>
                  📋
                </span>
              </Link>
              <Link
                href="/dashboard/media-registry/borrow"
                aria-label="ยืม-คืน"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
                )}
              >
                <span className="hidden sm:inline">ยืม-คืน</span>
                <span className="sm:hidden" aria-hidden>
                  🔄
                </span>
              </Link>
            </div>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">รายการในทะเบียน</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">{summary.totalRegisterRows}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">จำนวนรวม / คงเหลือ</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">
              {summary.totalUnits}{" "}
              <span className="text-base font-bold text-[#4d47b6]">/ {summary.availableUnits}</span>
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">กำลังถูกยืม · เกินกำหนด</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">
              {summary.borrowedUnits}
              <span className="ml-2 text-base font-bold text-rose-600">
                {summary.overdueBorrowRecords > 0 ? `· ${summary.overdueBorrowRecords} เกิน` : ""}
              </span>
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">มูลค่าตามทะเบียน (ประมาณ)</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">
              {valueFmt.format(summary.valueBahtApprox)} ฿
            </p>
            <p className="mt-1 text-[11px] text-[#66638c]">
              สื่อชำรุด/สูญหาย/จำหน่าย: {summary.damagedLostDisposedTitles} เรื่อง
            </p>
          </div>
        </div>
      </AppDashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppDashboardSection tone="slate" className="min-h-0">
          <MediaRegistryCategoryChart rows={categoryBars} />
        </AppDashboardSection>

        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="บันทึกล่าสุด"
            description="ชำรุด · ซ่อมบำรุง · สูญหาย · จำหน่าย"
          />
          {recentIssues.length === 0 ? (
            <AppEmptyState className="mt-3">ยังไม่มีบันทึก — เพิ่มที่เมนู «ชำรุด/ซ่อม»</AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentIssues.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-white/55 bg-white/75 px-3 py-2 text-sm text-[#2e2a58]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">
                      {r.recordType} · {r.mediaName}
                    </span>
                    <span className="shrink-0 text-xs text-[#66638c]">{r.registerNo}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#66638c]">
                    {formatBangkokDateTimeLong(r.recordDate)} · {r.quantityAffected} ชิ้น
                    {r.cost ? ` · ${r.cost} ฿` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      </div>

      <p className="text-center text-xs text-[#66638c]">
        ออกแบบให้ตรวจนับและยืมแบบมีเลขทะเบียนและที่เก็บชัดเจน — ลดสูญหายและเกินกำหนดคืน
      </p>
    </div>
  );
}

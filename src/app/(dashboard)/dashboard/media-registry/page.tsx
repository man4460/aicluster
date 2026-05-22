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
import { MediaRegistryStatCard } from "@/systems/media-registry/components/MediaRegistryStatCard";
import { mrListRowCardCompactClass } from "@/systems/media-registry/components/media-registry-ui-tokens";
import { loadMediaRegistryDashboard } from "@/systems/media-registry/lib/server-dashboard";

export const dynamic = "force-dynamic";

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 4h6l1 3H8L9 4z" strokeLinejoin="round" />
      <path d="M8 7h8v13a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSwap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M7 8h11M7 8l3-3M7 8l3 3M17 16H6M17 16l-3 3M17 16l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 4L4 8l8 4 8-4-8-4z" strokeLinejoin="round" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function IconCoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h4a2 2 0 100 4h-2a2 2 0 110 4h4" strokeLinecap="round" />
    </svg>
  );
}

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
                <IconClipboard className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">ทะเบียนสื่อ</span>
              </Link>
              <Link
                href="/dashboard/media-registry/borrow"
                aria-label="ยืม-คืน"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
                )}
              >
                <IconSwap className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">ยืม-คืน</span>
              </Link>
            </div>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MediaRegistryStatCard
            title="รายการในทะเบียน"
            value={summary.totalRegisterRows}
            tone="slate"
            icon={<IconGrid className="h-5 w-5" />}
          />
          <MediaRegistryStatCard
            title="จำนวนรวม / คงเหลือ"
            value={
              <>
                {summary.totalUnits}{" "}
                <span className="text-lg font-bold text-[#4d47b6] sm:text-xl">/ {summary.availableUnits}</span>
              </>
            }
            tone="blue"
            icon={<IconStack className="h-5 w-5" />}
          />
          <MediaRegistryStatCard
            title="กำลังถูกยืม"
            value={
              <>
                {summary.borrowedUnits}
                {summary.overdueBorrowRecords > 0 ? (
                  <span className="ml-1 text-lg font-bold text-rose-600 sm:text-xl">
                    · {summary.overdueBorrowRecords} เกิน
                  </span>
                ) : null}
              </>
            }
            tone={summary.overdueBorrowRecords > 0 ? "rose" : "amber"}
            icon={<IconClock className="h-5 w-5" />}
          />
          <MediaRegistryStatCard
            title="มูลค่าตามทะเบียน"
            value={`${valueFmt.format(summary.valueBahtApprox)} ฿`}
            subtitle={`ชำรุด/สูญหาย/จำหน่าย: ${summary.damagedLostDisposedTitles} เรื่อง`}
            tone="violet"
            icon={<IconCoin className="h-5 w-5" />}
          />
        </div>
      </AppDashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppDashboardSection tone="violet" className="min-h-0">
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
                <li key={r.id} className={cn(mrListRowCardCompactClass, "text-sm text-[#2e2a58]")}>
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

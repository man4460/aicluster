import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppColumnBarSparkChart,
  AppCompareBarList,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
  type AppColumnBarBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { getAssetDataScope } from "@/lib/trial/module-scopes";
import { loadAssetDashboard } from "@/systems/asset/lib/asset-data";
import {
  ASSET_CONDITION_LABEL,
  ASSET_STATUS_LABEL,
  ASSET_STATUS_TONE,
  formatTHB,
  formatThaiDateLong,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";

export const dynamic = "force-dynamic";

export default async function AssetHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getAssetDataScope(session.sub);
  const data = await loadAssetDashboard({
    ownerUserId: session.sub,
    trialSessionId: scope.trialSessionId,
  });

  const hasAnyData = data.totalAssets > 0;
  const inUse = data.byStatus.IN_USE + data.byStatus.BORROWED;
  const inUsePct = data.totalAssets > 0 ? Math.round((inUse / data.totalAssets) * 100) : 0;
  const depreciationPct =
    data.totalValue > 0 ? Math.round((1 - data.currentValue / data.totalValue) * 100) : 0;

  const monthlyMax = data.monthlyValue30d.reduce((m, d) => Math.max(m, d.purchaseValue), 1);
  const monthlyBuckets: AppColumnBarBucket[] = data.monthlyValue30d.map((d, i) => ({
    key: `m-${i}`,
    label: d.monthLabel,
    amount: Math.round(d.purchaseValue),
    pct: monthlyMax > 0 ? (d.purchaseValue / monthlyMax) * 100 : 0,
  }));

  const categoryRows = data.byCategory.slice(0, 6).map((c) => ({
    key: `cat-${c.id}`,
    label: `${c.name} · ${c.count} รายการ`,
    amount: c.value,
    pct:
      data.byCategory[0] && data.byCategory[0].value > 0
        ? (c.value / data.byCategory[0].value) * 100
        : 0,
  }));
  const departmentRows = data.byDepartment.slice(0, 6).map((d) => ({
    key: `dep-${d.id}`,
    label: `${d.name} · ${d.count} รายการ`,
    amount: d.value,
    pct:
      data.byDepartment[0] && data.byDepartment[0].value > 0
        ? (d.value / data.byDepartment[0].value) * 100
        : 0,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="สรุปทรัพย์สิน"
          description={`ภาพรวม ${formatThaiDateLong(new Date())} (เวลาไทย)`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          action={
            hasAnyData ? (
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                <Link
                  href="/dashboard/asset/assets"
                  aria-label="จัดการทรัพย์สิน"
                  className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
                >
                  <IconAssetBox className="h-5 w-5 shrink-0 sm:hidden" />
                  <span className="hidden sm:inline">จัดการทรัพย์สิน</span>
                </Link>
                <Link
                  href="/dashboard/asset/reports"
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
            ) : null
          }
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="ทรัพย์สินทั้งหมด"
            value={data.totalAssets}
            hint={`รวมมูลค่า ${formatTHB(data.totalValue)} บาท`}
            accent="violet"
          />
          <StatCard
            label="กำลังใช้งาน"
            value={inUse}
            hint={`คิดเป็น ${inUsePct}% ของทั้งหมด`}
            accent="green"
          />
          <StatCard
            label="กำลังซ่อม"
            value={data.byStatus.IN_REPAIR}
            hint={`รอจำหน่ายออก ${data.byStatus.DISPOSED} รายการ`}
            accent="amber"
          />
          <StatCard
            label="มูลค่าคงเหลือ"
            value={Math.round(data.currentValue / 1000)}
            unit="K"
            hint={`เสื่อมแล้ว ${depreciationPct}%`}
            accent="indigo"
          />
        </div>

        {hasAnyData ? null : (
          <AppEmptyState tone="violet" className="mt-5">
            ยังไม่มีข้อมูลในระบบ — เริ่มจาก{" "}
            <Link href="/dashboard/asset/master" className="font-semibold text-[#4d47b6] underline">
              ตั้งข้อมูลหลัก
            </Link>{" "}
            แล้วเพิ่ม{" "}
            <Link href="/dashboard/asset/assets" className="font-semibold text-[#4d47b6] underline">
              ทรัพย์สิน
            </Link>
          </AppEmptyState>
        )}
      </AppDashboardSection>

      {hasAnyData ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <AppDashboardSection tone="slate">
              <AppSectionHeader tone="slate" title="สถานะทรัพย์สิน" description="แยกตามสถานะใช้งานปัจจุบัน" />
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(data.byStatus) as Array<keyof typeof data.byStatus>).map((s) => (
                  <li
                    key={s}
                    className={cn(
                      "flex flex-col rounded-xl border px-3 py-2 text-xs",
                      ASSET_STATUS_TONE[s],
                    )}
                  >
                    <span className="font-semibold">{ASSET_STATUS_LABEL[s]}</span>
                    <span className="mt-0.5 text-base font-bold">{data.byStatus[s].toLocaleString("th-TH")}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(data.byCondition) as Array<keyof typeof data.byCondition>).map((c) => (
                  <div
                    key={c}
                    className="flex flex-col rounded-xl border border-white/60 bg-white/65 px-3 py-2 text-xs text-[#2e2a58]"
                  >
                    <span className="text-[#66638c]">สภาพ {ASSET_CONDITION_LABEL[c]}</span>
                    <span className="text-base font-bold">{data.byCondition[c].toLocaleString("th-TH")}</span>
                  </div>
                ))}
              </div>
            </AppDashboardSection>

            <AppDashboardSection tone="slate">
              <AppSectionHeader
                tone="slate"
                title="การจัดซื้อย้อนหลัง"
                description="มูลค่าซื้อทรัพย์สินรายเดือน (12 เดือนล่าสุด)"
              />
              {monthlyBuckets.length > 0 ? (
                <div className="mt-3 flex min-h-0 flex-1 flex-col">
                  <AppColumnBarSparkChart
                    buckets={monthlyBuckets}
                    emptyText="ยังไม่มีข้อมูล"
                    variant="brand"
                  />
                </div>
              ) : (
                <AppEmptyState>ยังไม่มีข้อมูลการซื้อ</AppEmptyState>
              )}
            </AppDashboardSection>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AppDashboardSection tone="slate">
              <AppCompareBarList
                title="มูลค่าตามหมวดหมู่"
                subtitle="หมวดที่มีมูลค่ารวมสูงสุด (Top 6)"
                rows={categoryRows}
                emptyText="ยังไม่มีหมวดหมู่"
                variant="brand"
              />
            </AppDashboardSection>

            <AppDashboardSection tone="slate">
              <AppCompareBarList
                title="มูลค่าตามแผนก"
                subtitle="แผนกที่ถือครองทรัพย์สินมากที่สุด (Top 6)"
                rows={departmentRows}
                emptyText="ยังไม่มีแผนก"
                variant="emerald"
              />
            </AppDashboardSection>
          </div>

          <AppDashboardSection tone="slate">
            <AppSectionHeader
              tone="slate"
              title="การแจ้งเตือน"
              description="ประกันใกล้หมด · ซ่อมยังไม่เสร็จ · ตรวจนับไม่ตรง"
            />
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <AlertCard
                title="ประกันใกล้หมด"
                emptyText="ไม่มีรายการใกล้หมดประกัน"
                items={data.alerts.warrantyExpiring.map((w) => ({
                  key: `w-${w.id}`,
                  primary: w.assetName,
                  secondary: `${w.assetCode} · ${w.daysLeft >= 0 ? `เหลือ ${w.daysLeft} วัน` : `หมดแล้ว ${Math.abs(w.daysLeft)} วัน`}`,
                  tone: w.daysLeft <= 7 ? "rose" : w.daysLeft <= 30 ? "amber" : "slate",
                }))}
              />
              <AlertCard
                title="ซ่อมยังไม่เสร็จ"
                emptyText="ไม่มีงานซ่อมค้าง"
                items={data.alerts.inRepair.map((m) => ({
                  key: `m-${m.id.toString()}`,
                  primary: m.assetName,
                  secondary: `${m.assetCode} · เริ่ม ${formatThaiDateShort(m.startDate)}`,
                  tone: "amber",
                }))}
              />
              <AlertCard
                title="ตรวจนับไม่ตรง"
                emptyText="ไม่มีรายการตรวจนับไม่ตรง"
                items={data.alerts.auditMismatch.map((a) => ({
                  key: `a-${a.id.toString()}`,
                  primary: a.assetName,
                  secondary: `${a.assetCode} · ${formatThaiDateShort(a.auditDate)}${a.note ? ` · ${a.note}` : ""}`,
                  tone: "rose",
                }))}
              />
            </div>
          </AppDashboardSection>

          <AppDashboardSection tone="slate">
            <AppSectionHeader tone="slate" title="กิจกรรมล่าสุด" description="เคลื่อนไหว ซ่อมบำรุง ตรวจนับ จำหน่ายออก" />
            {data.recentActivity.length === 0 ? (
              <AppEmptyState>ยังไม่มีรายการในระยะหลัง</AppEmptyState>
            ) : (
              <ul className="mt-3 divide-y divide-white/60">
                {data.recentActivity.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#2e2a58]">{it.title}</p>
                      <p className="truncate text-xs text-[#66638c]">
                        {it.code} · {it.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[#66638c]">
                      {formatThaiDateShort(it.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AppDashboardSection>
        </>
      ) : null}
    </div>
  );
}

function IconAssetBox({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconReportChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path
        d="M4 19h16M7 15l3-3 3 2 4-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const accentToken: Record<"violet" | "green" | "amber" | "indigo", string> = {
  violet: "from-violet-500/10 via-white to-violet-50 text-[#4d47b6]",
  green: "from-emerald-500/10 via-white to-emerald-50 text-emerald-700",
  amber: "from-amber-500/10 via-white to-amber-50 text-amber-700",
  indigo: "from-indigo-500/10 via-white to-indigo-50 text-indigo-700",
};

function StatCard({
  label,
  value,
  hint,
  accent,
  unit,
}: {
  label: string;
  value: number;
  hint?: string;
  accent: keyof typeof accentToken;
  unit?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/55 bg-gradient-to-br p-4 shadow-[0_18px_40px_-30px_rgba(76,70,178,0.55)]",
        accentToken[accent],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">
        {value.toLocaleString("th-TH")}
        {unit ? <span className="ml-1 text-sm font-bold opacity-80">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-[11px] font-medium opacity-75">{hint}</p> : null}
    </div>
  );
}

const alertToneClass: Record<"rose" | "amber" | "slate", string> = {
  rose: "border-rose-200 bg-rose-50/60",
  amber: "border-amber-200 bg-amber-50/60",
  slate: "border-zinc-200 bg-white/65",
};

function AlertCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{
    key: string;
    primary: string;
    secondary: string;
    tone: "rose" | "amber" | "slate";
  }>;
  emptyText: string;
}) {
  return (
    <div className={cn(appDashboardSectionSlateClass, "!py-3")}>
      <p className="text-sm font-bold text-[#2e2a58]">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-[#66638c]">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li
              key={it.key}
              className={cn("rounded-xl border px-3 py-2 text-xs", alertToneClass[it.tone])}
            >
              <p className="truncate font-semibold text-[#2e2a58]">{it.primary}</p>
              <p className="truncate text-[11px] text-[#66638c]">{it.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

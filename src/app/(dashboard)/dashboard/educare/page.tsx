import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppColumnBarSparkChart,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
  type AppColumnBarBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { EducareStatCard } from "@/systems/educare/components/EducareStatCard";
import { educareAvatarFallbackClass, educareListRowCardClass } from "@/systems/educare/educare-ui-tokens";
import { getEducareDataScope } from "@/lib/trial/module-scopes";
import { loadEducareDashboard } from "@/systems/educare/lib/educare-data";
import {
  EDUCARE_FEATURES,
  EDUCARE_STATUS_LABEL,
  EDUCARE_STATUS_TONE,
  featureMeta,
  type EducareFeatureKey,
} from "@/systems/educare/lib/educare-types";

export const dynamic = "force-dynamic";

export default async function EducareHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getEducareDataScope(session.sub);
  const data = await loadEducareDashboard({
    ownerUserId: session.sub,
    trialSessionId: scope.trialSessionId,
  });

  const totalAttended = data.assembly.present + data.assembly.late;
  const attendancePct =
    data.studentCount > 0 ? Math.round((totalAttended / data.studentCount) * 100) : 0;
  const tidinessPct =
    data.tidiness.checked > 0 ? Math.round((data.tidiness.pass / data.tidiness.checked) * 100) : 0;

  const trendMaxAttended = data.trend7d.reduce((m, d) => Math.max(m, d.present + d.late), 1);
  const trendBuckets: AppColumnBarBucket[] = data.trend7d.map((d) => {
    const attended = d.present + d.late;
    return {
      key: d.date,
      label: dayShortLabel(d.date),
      amount: attended,
      pct: trendMaxAttended > 0 ? (attended / trendMaxAttended) * 100 : 0,
    };
  });

  const hasAnyData = data.studentCount > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="สรุปวันนี้"
          description={`ภาพรวมการเช็ค ${formatThaiDateLong(data.date)} (เวลาไทย)`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            hasAnyData ? (
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                <Link
                  href="/dashboard/educare/check"
                  aria-label="เปิดเช็คประจำวัน"
                  className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
                >
                  <IconCheck className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline">เปิดเช็คประจำวัน</span>
                </Link>
                <Link
                  href="/dashboard/educare/reports"
                  aria-label="ดูรายงาน"
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
                  )}
                >
                  <IconReport className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline">ดูรายงาน</span>
                </Link>
              </div>
            ) : null
          }
        />

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <EducareStatCard
            title="นักเรียนทั้งหมด"
            value={data.studentCount.toLocaleString("th-TH")}
            subtitle={`${data.classroomCount} ห้องเรียน`}
            tone="violet"
          />
          <EducareStatCard
            title="มาเรียนวันนี้"
            value={totalAttended.toLocaleString("th-TH")}
            subtitle={`คิดเป็น ${attendancePct}% ของนักเรียน`}
            tone="emerald"
            delta={data.delta.present}
          />
          <EducareStatCard
            title="ขาด/ลา"
            value={(data.assembly.absent + data.assembly.excused).toLocaleString("th-TH")}
            subtitle={`ขาด ${data.assembly.absent} · ลา ${data.assembly.excused}`}
            tone="amber"
            delta={-data.delta.absent}
          />
          <EducareStatCard
            title="ความเรียบร้อย"
            value={tidinessPct.toLocaleString("th-TH")}
            subtitle={`เช็คแล้ว ${data.tidiness.checked} คน`}
            tone="indigo"
            unit="%"
          />
        </div>

        {hasAnyData ? null : (
          <AppEmptyState tone="violet" className="mt-5">
            ยังไม่มีข้อมูลในระบบ — เริ่มจาก{" "}
            <Link href="/dashboard/educare/classrooms" className="font-semibold text-[#5b61ff] underline">
              เพิ่มห้องเรียน
            </Link>{" "}
            แล้ว{" "}
            <Link href="/dashboard/educare/students" className="font-semibold text-[#5b61ff] underline">
              เพิ่มนักเรียน
            </Link>{" "}
            จากนั้นเปิดเมนูเช็คประจำวัน
          </AppEmptyState>
        )}
      </AppDashboardSection>

      {hasAnyData ? (
        <>
          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="ความคืบหน้าวันนี้แต่ละห้อง"
              description="เปอร์เซ็นต์การเช็คเข้าแถวเทียบจำนวนนักเรียนในห้อง"
            />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.classrooms.length === 0 ? (
                <div className="sm:col-span-2 xl:col-span-3">
                  <AppEmptyState tone="violet">ยังไม่มีห้องเรียน</AppEmptyState>
                </div>
              ) : (
                data.classrooms.map((c) => {
                  const pct = c.totalStudents > 0 ? Math.round((c.assembly.checked / c.totalStudents) * 100) : 0;
                  return (
                    <div key={c.id} className={cn(educareListRowCardClass, "space-y-2")}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-[#2e2a58]">{c.name}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            c.completed
                              ? "bg-emerald-50 text-emerald-700"
                              : pct > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {c.completed ? "เช็คครบ" : pct > 0 ? "กำลังเช็ค" : "ยังไม่เริ่ม"}
                        </span>
                      </div>
                      <p className="text-xs text-[#66638c]">
                        {c.grade ?? "—"} · {c.totalStudents} คน
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-[#ecebff]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#5b61ff] to-[#6a63ff]"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#66638c]">
                        เช็คแล้ว {c.assembly.checked}/{c.totalStudents} · มา {c.assembly.present} · ขาด {c.assembly.absent}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </AppDashboardSection>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AppDashboardSection tone="violet">
              <AppSectionHeader
                tone="violet"
                title="แนวโน้ม 7 วัน"
                description="รวมจำนวนที่มาเรียน (เข้าแถว present + late)"
              />
              <div className="mt-4">
                <AppColumnBarSparkChart
                  buckets={trendBuckets}
                  emptyText="ยังไม่มีข้อมูลใน 7 วัน"
                  variant="brand"
                />
              </div>
            </AppDashboardSection>

            <AppDashboardSection tone="violet">
              <AppSectionHeader
                tone="violet"
                title="กิจกรรมวันนี้"
                description="ดื่มนม / ทานอาหาร / แปรงฟัน — เปอร์เซ็นต์ที่ทำแล้ว"
              />
              <ActivityRows total={data.studentCount} activities={data.activities} />
            </AppDashboardSection>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AppDashboardSection tone="violet">
              <AppSectionHeader
                tone="violet"
                title="🌟 มาเรียนสม่ำเสมอ 7 วัน"
                description="นักเรียนที่มาเรียนต่อเนื่องสูงสุด"
              />
              <ul className="mt-4 space-y-2">
                {data.topPerformers.length === 0 ? (
                  <li>
                    <AppEmptyState tone="violet">ยังไม่พอข้อมูลใน 7 วันนี้</AppEmptyState>
                  </li>
                ) : (
                  data.topPerformers.map((p) => (
                    <li key={p.studentId} className={cn(educareListRowCardClass, "flex items-center gap-3")}>
                      <Avatar src={p.photoUrl} name={p.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2e2a58]">
                          {p.fullName} {p.nickname ? <span className="text-[#66638c]">({p.nickname})</span> : null}
                        </p>
                        <p className="truncate text-xs text-[#66638c]">{p.classroomName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {p.perfectDays} วัน
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </AppDashboardSection>

            <AppDashboardSection tone="violet">
              <AppSectionHeader
                tone="violet"
                title="⚠️ น่าเป็นห่วง (ขาด ≥ 2 วัน)"
                description="นักเรียนที่ขาดในรอบ 7 วันที่ผ่านมา"
              />
              <ul className="mt-4 space-y-2">
                {data.concerns.length === 0 ? (
                  <li>
                    <AppEmptyState tone="violet">ไม่มีนักเรียนที่ต้องเป็นห่วง</AppEmptyState>
                  </li>
                ) : (
                  data.concerns.map((p) => (
                    <li key={p.studentId} className={cn(educareListRowCardClass, "flex items-center gap-3")}>
                      <Avatar src={p.photoUrl} name={p.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2e2a58]">
                          {p.fullName} {p.nickname ? <span className="text-[#66638c]">({p.nickname})</span> : null}
                        </p>
                        <p className="truncate text-xs text-[#66638c]">{p.classroomName}</p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        ขาด {p.absentDays} วัน
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </AppDashboardSection>
          </div>

          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="กิจกรรมล่าสุดวันนี้"
              description="12 รายการล่าสุด — เรียงตามเวลา"
            />
            {data.recentActivity.length === 0 ? (
              <AppEmptyState tone="violet" className="mt-4">
                ยังไม่มีการเช็คในวันนี้
              </AppEmptyState>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.recentActivity.map((r, idx) => {
                  const meta = featureMeta(r.feature as EducareFeatureKey);
                  const tone = EDUCARE_STATUS_TONE[r.status];
                  return (
                    <li
                      key={`${r.recordedAt.toISOString()}-${idx}`}
                      className={cn(educareListRowCardClass, "flex items-center gap-3")}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lg ring-1 ring-[#dcd8f0]">
                        {meta.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2e2a58]">{r.studentName}</p>
                        <p className="truncate text-[11px] text-[#66638c]">
                          {meta.label} · {r.classroomName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          tone === "positive"
                            ? "bg-emerald-50 text-emerald-700"
                            : tone === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : tone === "danger"
                                ? "bg-rose-50 text-rose-700"
                                : tone === "neutral"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-slate-50 text-slate-500",
                        )}
                      >
                        {EDUCARE_STATUS_LABEL[r.status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </AppDashboardSection>
        </>
      ) : null}
    </div>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityRows({
  total,
  activities,
}: {
  total: number;
  activities: {
    milk: { done: number; partial: number; notDone: number; total: number };
    meal: { done: number; partial: number; notDone: number; total: number };
    brushing: { done: number; partial: number; notDone: number; total: number };
  };
}) {
  const rows = [
    { meta: featureMeta("MILK"), data: activities.milk },
    { meta: featureMeta("MEAL"), data: activities.meal },
    { meta: featureMeta("BRUSHING"), data: activities.brushing },
  ];
  return (
    <div className="mt-4 space-y-3">
      {rows.map(({ meta, data }) => {
        const pct = total > 0 ? Math.round((data.done / total) * 100) : 0;
        return (
          <div key={meta.key} className={cn(educareListRowCardClass, "space-y-2")}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-[#2e2a58]">
                {meta.emoji} {meta.label}
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                ทำแล้ว {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="text-[11px] text-[#66638c]">
              ทำแล้ว {data.done} · ทำบางส่วน {data.partial} · ยังไม่ได้ {data.notDone}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const fallback = name.trim().slice(0, 1).toUpperCase() || "·";
  if (src) {
    return (
      <span className={cn(educareAvatarFallbackClass, "h-10 w-10 shrink-0 overflow-hidden")}>
        <Image
          src={src}
          alt={name}
          width={40}
          height={40}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    );
  }
  return (
    <span className={cn(educareAvatarFallbackClass, "h-10 w-10 shrink-0 text-sm")}>
      {fallback}
    </span>
  );
}

function dayShortLabel(ymd: string) {
  const d = new Date(ymd + "T00:00:00Z");
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
  }).format(d);
}

function formatThaiDateLong(ymd: string) {
  const d = new Date(ymd + "T00:00:00Z");
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// keep tree-shaking happy — used in JSX
void EDUCARE_FEATURES;

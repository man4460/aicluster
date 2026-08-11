import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { PublicCheckInLinkCopy } from "@/systems/attendance/components/PublicCheckInLinkCopy";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

function publicCheckInUrl(
  basePrefix: string,
  ownerSub: string,
  locId: number | null,
  trialSessionId: string,
  isTrialSandbox: boolean,
) {
  const root = `${basePrefix.replace(/\/$/, "")}/check-in/${ownerSub}`;
  const params = new URLSearchParams();
  if (locId != null && locId > 0) params.set("loc", String(locId));
  if (isTrialSandbox) params.set("t", trialSessionId);
  const q = params.toString();
  return q ? `${root}?${q}` : root;
}

export default async function AttendanceHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  if (user?.employerUserId) {
    redirect("/dashboard/attendance/check");
  }

  const baseUrl = await getServerAppBaseUrl();
  const scope = await getAttendanceDataScope(session.sub);
  await ensureAttendanceLocationsFromLegacy(session.sub, scope.trialSessionId);
  const attendanceLocs = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const { start, end } = bangkokDayStartEnd();

  const [todayLogs, rosterTotal, rosterCheckedIn] = await Promise.all([
    prisma.attendanceLog.findMany({
      where: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
        checkInTime: { gte: start, lt: end },
      },
      select: {
        id: true,
        checkOutTime: true,
        lateCheckIn: true,
      },
    }),
    prisma.attendanceRosterEntry.count({
      where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    }),
    prisma.attendanceLog.count({
      where: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
        checkInTime: { gte: start, lt: end },
        publicVisitorKind: "ROSTER_STAFF",
      },
    }),
  ]);

  const checkedIn = todayLogs.length;
  const late = todayLogs.filter((l) => l.lateCheckIn).length;
  const checkedOut = todayLogs.filter((l) => l.checkOutTime != null).length;
  const stillWorking = checkedIn - checkedOut;
  const remaining = Math.max(rosterTotal - rosterCheckedIn, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="สรุปวันนี้"
          description="อัปเดตตามข้อมูลจริงของวันนี้ (เวลาไทย) สำหรับเจ้าของระบบ"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="เข้างานแล้ว" value={checkedIn} hint="รวมผู้ที่เช็คชื่อเข้าแล้วทั้งหมด" accent="violet" />
          <StatCard label="มาสาย" value={late} hint="เข้าเกินเวลาเริ่มกะที่ตั้งไว้" accent="amber" />
          <StatCard label="ยังเหลือ" value={remaining} hint="คงเหลือจากรายชื่อพนักงาน QR ที่ยังไม่เข้า" accent="slate" />
          <StatCard label="กำลังทำงาน" value={stillWorking} hint="เข้าแล้วและยังไม่เช็คออก" accent="green" />
          <StatCard
            label="ออกงานแล้ว"
            value={checkedOut}
            hint="เช็คออกเรียบร้อยแล้ววันนี้"
            accent="indigo"
            className="col-span-2 sm:col-span-1"
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/attendance/check"
            className="app-btn-primary inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold sm:min-h-0"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            เปิดหน้าเช็คอิน
          </Link>
          <Link
            href="/dashboard/attendance/logs"
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:min-h-0",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 19h16M7 15l3-3 3 2 4-5" />
            </svg>
            ดูรายงานย้อนหลัง
          </Link>
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ลิงก์เช็คอินสาธารณะ"
          description={
            attendanceLocs.length > 1 ? (
              <span>
                มีหลายโลเคชัน — ใช้ลิงก์ตามจุด (หรือสร้าง QR แยกใน{" "}
                <Link href="/dashboard/attendance/qr" className="font-semibold text-[#4d47b6] underline">
                  QR จุดเช็คอิน
                </Link>
                )
              </span>
            ) : (
              "แชร์ลิงก์หรือสร้างโปสเตอร์ QR จากเมนู QR จุดเช็คอิน — กดคัดลอกแล้วส่งต่อ"
            )
          }
        />
        <div className="mt-4 space-y-3 sm:space-y-4">
          {attendanceLocs.length <= 1 ? (
            <PublicCheckInLinkCopy
              url={
                baseUrl
                  ? publicCheckInUrl(
                      baseUrl,
                      session.sub,
                      attendanceLocs[0]?.id ?? null,
                      scope.trialSessionId,
                      scope.isTrialSandbox,
                    )
                  : publicCheckInUrl(
                      "",
                      session.sub,
                      attendanceLocs[0]?.id ?? null,
                      scope.trialSessionId,
                      scope.isTrialSandbox,
                    )
              }
            />
          ) : (
            attendanceLocs.map((loc) => (
              <PublicCheckInLinkCopy
                key={loc.id}
                title={`ลิงก์เช็คอิน · ${loc.name.trim() || `จุด #${loc.id}`}`}
                url={
                  baseUrl
                    ? publicCheckInUrl(baseUrl, session.sub, loc.id, scope.trialSessionId, scope.isTrialSandbox)
                    : publicCheckInUrl("", session.sub, loc.id, scope.trialSessionId, scope.isTrialSandbox)
                }
              />
            ))
          )}
        </div>
      </AppDashboardSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: number;
  hint: string;
  accent: "violet" | "amber" | "slate" | "green" | "indigo";
  className?: string;
}) {
  const toneStyles = {
    violet:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
    amber:
      "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
    slate:
      "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
    green:
      "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
    indigo:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  };

  return (
    <div className={cn("relative overflow-hidden rounded-[1.5rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5", toneStyles[accent], className)}>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{label}</p>
        <p className={cn("mt-3 bg-clip-text text-transparent text-2xl font-black tabular-nums tracking-tight sm:text-3xl", appDashboardBrandGradientBarClass)}>
          {value.toLocaleString("th-TH")}
        </p>
        {hint ? <p className="mt-1 text-[11px] font-medium opacity-80 leading-snug">{hint}</p> : null}
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}

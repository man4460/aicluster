import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="เข้างานแล้ว" value={checkedIn} hint="รวมผู้ที่เช็คชื่อเข้าแล้วทั้งหมด" accent="violet" />
          <StatCard label="มาสาย" value={late} hint="เข้าเกินเวลาเริ่มกะที่ตั้งไว้" accent="amber" />
          <StatCard label="ยังเหลือ" value={remaining} hint="คงเหลือจากรายชื่อพนักงาน QR ที่ยังไม่เข้า" accent="slate" />
          <StatCard label="กำลังทำงาน" value={stillWorking} hint="เข้าแล้วและยังไม่เช็คออก" accent="green" />
          <StatCard label="ออกงานแล้ว" value={checkedOut} hint="เช็คออกเรียบร้อยแล้ววันนี้" accent="indigo" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/attendance/check"
            className="app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold sm:min-h-0"
          >
            เปิดหน้าเช็คอิน
          </Link>
          <Link
            href="/dashboard/attendance/logs"
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[44px] items-center justify-center sm:min-h-0",
            )}
          >
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
}: {
  label: string;
  value: number;
  hint: string;
  accent: "violet" | "amber" | "slate" | "green" | "indigo";
}) {
  const valueTone =
    accent === "green"
      ? "text-emerald-700"
      : accent === "amber"
        ? "text-amber-800"
        : accent === "indigo"
          ? "text-indigo-700"
          : accent === "violet"
            ? "text-[#4d47b6]"
            : "text-[#2e2a58]";

  return (
    <div className={cn(appDashboardSectionSlateClass, "space-y-0")}>
      <p className="text-xs font-medium text-[#66638c]">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums sm:text-3xl", valueTone)}>
        {value.toLocaleString("th-TH")}
      </p>
      <p className="mt-1 text-xs leading-snug text-[#66638c]">{hint}</p>
    </div>
  );
}

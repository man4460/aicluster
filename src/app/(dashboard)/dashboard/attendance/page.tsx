import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { PublicCheckInLinkCopy } from "@/systems/attendance/components/PublicCheckInLinkCopy";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";

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
  const publicPath = `/check-in/${session.sub}`;
  await ensureAttendanceLocationsFromLegacy(session.sub);
  const attendanceLocs = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: session.sub },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const { start, end } = bangkokDayStartEnd();

  const [todayLogs, rosterTotal, rosterCheckedIn] = await Promise.all([
    prisma.attendanceLog.findMany({
      where: {
        ownerUserId: session.sub,
        checkInTime: { gte: start, lt: end },
      },
      select: {
        id: true,
        checkOutTime: true,
        lateCheckIn: true,
      },
    }),
    prisma.attendanceRosterEntry.count({
      where: { ownerUserId: session.sub, isActive: true },
    }),
    prisma.attendanceLog.count({
      where: {
        ownerUserId: session.sub,
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
    <div className="space-y-7">
      <div className="rounded-2xl border border-[#0000BF]/15 bg-gradient-to-r from-[#0000BF]/[0.04] via-white to-white p-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">สรุปเช็คชื่อวันนี้</h1>
          <p className="mt-1 text-sm text-slate-600">
            อัปเดตตามข้อมูลจริงของวันนี้ (เวลาไทย) สำหรับเจ้าของระบบ
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="เข้างานแล้ว" value={checkedIn} hint="รวมผู้ที่เช็คชื่อเข้าแล้วทั้งหมด" tone="blue" />
        <StatCard label="มาสาย" value={late} hint="เข้าเกินเวลาเริ่มกะที่ตั้งไว้" tone="amber" />
        <StatCard label="ยังเหลือ" value={remaining} hint="คงเหลือจากรายชื่อพนักงาน QR ที่ยังไม่เข้า" tone="slate" />
        <StatCard label="กำลังทำงาน" value={stillWorking} hint="เข้าแล้วและยังไม่เช็คออก" tone="green" />
        <StatCard label="ออกงานแล้ว" value={checkedOut} hint="เช็คออกเรียบร้อยแล้ววันนี้" tone="indigo" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/attendance/check"
          className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a6]"
        >
          เปิดหน้าเช็คชื่อ
        </Link>
        <Link
          href="/dashboard/attendance/logs"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ดูรายงานย้อนหลัง
        </Link>
      </div>

      <div className="space-y-4">
        {attendanceLocs.length <= 1 ? (
          <PublicCheckInLinkCopy
            url={
              baseUrl
                ? `${baseUrl.replace(/\/$/, "")}${publicPath}${attendanceLocs[0] ? `?loc=${attendanceLocs[0].id}` : ""}`
                : `${publicPath}${attendanceLocs[0] ? `?loc=${attendanceLocs[0].id}` : ""}`
            }
          />
        ) : (
          <>
            <p className="text-xs text-slate-600">
              มีหลายโลเคชัน — ใช้ลิงก์ตามจุด (หรือสร้าง QR แยกในหน้า QR จุดเช็คอิน)
            </p>
            {attendanceLocs.map((loc) => (
              <PublicCheckInLinkCopy
                key={loc.id}
                title={`ลิงก์เช็คชื่อ · ${loc.name.trim() || `จุด #${loc.id}`}`}
                url={
                  baseUrl
                    ? `${baseUrl.replace(/\/$/, "")}${publicPath}?loc=${loc.id}`
                    : `${publicPath}?loc=${loc.id}`
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "blue" | "amber" | "slate" | "green" | "indigo";
}) {
  const toneClass =
    tone === "blue"
      ? "border-[#0000BF]/20 bg-[#0000BF]/[0.03]"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/60"
        : tone === "green"
          ? "border-emerald-200 bg-emerald-50/60"
          : tone === "indigo"
            ? "border-indigo-200 bg-indigo-50/60"
            : "border-slate-200 bg-slate-50/80";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value.toLocaleString("th-TH")}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

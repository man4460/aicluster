import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceQrPosterClient } from "@/systems/attendance/components/AttendanceQrPosterClient";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";
import {
  HomeFinanceListHeading,
  HomeFinancePageSection,
  HomeFinanceSectionHeader,
} from "@/systems/home-finance/components/HomeFinanceUi";
export default async function AttendanceQrPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  if (user?.employerUserId) redirect("/dashboard/attendance/check");

  const [baseUrl, profile, scope] = await Promise.all([
    getServerAppBaseUrl(),
    getBusinessProfile(session.sub),
    getAttendanceDataScope(session.sub),
  ]);
  const orgLabel = profile?.name?.trim() || "องค์กร";

  await ensureAttendanceLocationsFromLegacy(session.sub, scope.trialSessionId);
  const locations = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <HomeFinancePageSection>
      <HomeFinanceSectionHeader
        title="QR จุดเช็คอิน"
        description="คัดลอกลิงก์หรือดาวน์โหลดโปสเตอร์ — แยกตามจุดเช็ค"
      />
      {locations.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่มีจุดเช็ค — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คอิน
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งโลเคชัน
        </p>
      ) : (
        <div className="space-y-10">
          {locations.map((loc) => (
            <section key={loc.id} className="space-y-4 border-b border-slate-100 pb-8 last:border-0 last:pb-0">
              <HomeFinanceListHeading>
                {loc.name.trim() || `จุดเช็ค #${loc.id}`}
              </HomeFinanceListHeading>
              <AttendanceQrPosterClient
                ownerId={session.sub}
                sandboxTrialSessionId={scope.isTrialSandbox ? scope.trialSessionId : null}
                orgLabel={orgLabel}
                logoUrl={profile?.logoUrl?.trim() || null}
                baseUrl={baseUrl}
                locationId={loc.id}
                locationName={loc.name}
              />
            </section>
          ))}
        </div>
      )}
    </HomeFinancePageSection>
  );
}
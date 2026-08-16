import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceQrPosterClient } from "@/systems/attendance/components/AttendanceQrPosterClient";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
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
    getBusinessProfile(session.sub, { ownerOnly: true }),
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
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="QR จุดเช็คอิน"
        description="คัดลอกลิงก์หรือดาวน์โหลดโปสเตอร์ — มีทั้ง QR แบบเดิมและ QR สแกนใบหน้าสำหรับ iPad"
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
            <section
              key={loc.id}
              className="space-y-4 rounded-[2rem] border border-[#e8e6fc]/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5"
            >
              <h3 className="text-base font-bold tracking-tight text-[#2e2a58]">{loc.name.trim() || `จุดเช็ค #${loc.id}`}</h3>
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-[#66638c]">QR แบบเดิม (เบอร์ / บุคคลภายนอก)</p>
                  <AttendanceQrPosterClient
                    ownerId={session.sub}
                    sandboxTrialSessionId={scope.isTrialSandbox ? scope.trialSessionId : null}
                    orgLabel={orgLabel}
                    logoUrl={profile?.logoUrl?.trim() || null}
                    baseUrl={baseUrl}
                    locationId={loc.id}
                    locationName={loc.name}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-emerald-800">QR สแกนใบหน้า (วาง iPad ที่จุด)</p>
                  <AttendanceQrPosterClient
                    ownerId={session.sub}
                    sandboxTrialSessionId={scope.isTrialSandbox ? scope.trialSessionId : null}
                    orgLabel={orgLabel}
                    logoUrl={profile?.logoUrl?.trim() || null}
                    baseUrl={baseUrl}
                    locationId={loc.id}
                    locationName={loc.name}
                    faceKiosk
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </AppDashboardSection>
  );
}
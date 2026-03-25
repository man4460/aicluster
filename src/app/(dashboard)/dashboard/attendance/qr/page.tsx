import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-container";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceQrPosterClient } from "@/systems/attendance/components/AttendanceQrPosterClient";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";

export default async function AttendanceQrPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  if (user?.employerUserId) redirect("/dashboard/attendance/check");

  const [baseUrl, profile] = await Promise.all([getServerAppBaseUrl(), getBusinessProfile(session.sub)]);
  const orgLabel = profile?.name?.trim() || "องค์กร";

  await ensureAttendanceLocationsFromLegacy(session.sub);
  const locations = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: session.sub },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR จุดเช็คอิน"
        description="ลิงก์และ QR อัปเดตตามโดเมน (NEXT_PUBLIC_APP_URL / VERCEL_URL) และตามจุดเช็คที่ตั้งในเมนูตั้งค่า — แยก QR ต่อโลเคชันได้"
      />
      {locations.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่มีจุดเช็ค — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คชื่อ
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งโลเคชัน
        </p>
      ) : (
        <div className="space-y-12">
          {locations.map((loc) => (
            <section key={loc.id} className="space-y-4 border-b border-slate-200 pb-10 last:border-0">
              <h2 className="text-base font-bold text-slate-900">
                {loc.name.trim() || `จุดเช็ค #${loc.id}`}
              </h2>
              <AttendanceQrPosterClient
                ownerId={session.sub}
                orgLabel={orgLabel}
                logoUrl={profile?.logoUrl ?? null}
                baseUrl={baseUrl}
                locationId={loc.id}
                locationName={loc.name}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { loadAttendancePublicLinksContext } from "@/lib/attendance/owner-public-links-context";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { AttendanceCheckClient } from "@/systems/attendance/components/AttendanceCheckClient";
import { AttendancePublicCheckInLinksSection } from "@/systems/attendance/components/AttendancePublicCheckInLinksSection";
import { attendanceSectionRadiusClass } from "@/systems/attendance/lib/ui-tokens";

export default async function AttendanceCheckPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });

  if (me?.employerUserId) {
    const ownerId = me.employerUserId;
    const profile = await getBusinessProfile(ownerId, { ownerOnly: true });
    const orgName = profile?.name?.trim() || "องค์กร";

    return (
      <AttendanceCheckClient
        mode="session"
        orgName={orgName}
        logoUrl={profile?.logoUrl ?? null}
      />
    );
  }

  const links = await loadAttendancePublicLinksContext(session.sub);

  return (
    <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title="ลิงก์เช็คอินสาธารณะ"
        description="คัดลอกลิงก์ให้พนักงานหรือเปิดบน iPad ที่จุดเช็ค"
      />
      <div className="mt-4">
        <AttendancePublicCheckInLinksSection
          ownerSub={links.ownerSub}
          baseUrl={links.baseUrl}
          trialSessionId={links.trialSessionId}
          isTrialSandbox={links.isTrialSandbox}
          locations={links.locations}
          faceLinkNotice={links.faceLinkNotice}
        />
      </div>
    </AppDashboardSection>
  );
}

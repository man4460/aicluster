import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceQrClient } from "@/systems/attendance/components/AttendanceQrClient";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

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
  const branches = await prisma.attendanceBranch.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      locations: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  const sandboxTrialSessionId =
    scope.isTrialSandbox && scope.trialSessionId !== TRIAL_PROD_SCOPE ? scope.trialSessionId : null;

  return (
    <AttendanceQrClient
      ownerId={session.sub}
      sandboxTrialSessionId={sandboxTrialSessionId}
      orgLabel={orgLabel}
      logoUrl={profile?.logoUrl?.trim() || null}
      baseUrl={baseUrl}
      branches={branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        locations: b.locations,
      }))}
    />
  );
}

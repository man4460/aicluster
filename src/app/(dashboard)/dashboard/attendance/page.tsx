import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { loadAttendanceDashboardStats } from "@/lib/attendance/dashboard-stats";
import { prisma } from "@/lib/prisma";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";
import { AttendanceDashboardLive } from "@/systems/attendance/components/AttendanceDashboardLive";

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

  const scope = await getAttendanceDataScope(session.sub);
  const initialStats = await loadAttendanceDashboardStats(session.sub, scope.trialSessionId);

  return <AttendanceDashboardLive initialStats={initialStats} />;
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AttendanceRosterClient } from "@/systems/attendance/components/AttendanceRosterClient";

export default async function AttendanceRosterPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  if (user?.employerUserId) redirect("/dashboard/attendance/check");

  return <AttendanceRosterClient />;
}

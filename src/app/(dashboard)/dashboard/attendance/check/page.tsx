import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { AttendanceCheckClient } from "@/systems/attendance/components/AttendanceCheckClient";

export default async function AttendanceCheckPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  const ownerId = me?.employerUserId ?? session.sub;

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

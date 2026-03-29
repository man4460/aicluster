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
    select: { employerUserId: true, fullName: true, username: true },
  });
  const ownerId = me?.employerUserId ?? session.sub;

  const [ownerUser, business] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { fullName: true, username: true },
    }),
    getBusinessProfile(ownerId),
  ]);

  const orgName =
    me?.employerUserId != null
      ? (ownerUser?.fullName?.trim() || ownerUser?.username || "องค์กร")
      : (me?.fullName?.trim() || me?.username || "องค์กร");

  return (
    <AttendanceCheckClient
      mode="session"
      orgName={orgName}
      logoUrl={business?.logoUrl ?? null}
    />
  );
}

import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { CarWashDashboard } from "@/systems/car-wash/CarWashDashboard";

/** หน้าเป้าหมายของ QR พนักงาน — เฉพาะลานล้างวันนี้ + บันทึกรายการ (ต้องล็อกอิน) */
export default async function CarWashStaffLanePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [profile, baseUrl, userRow, scope, dormPay] = await Promise.all([
    getBusinessProfile(session.sub),
    getRequestBaseUrl(),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { fullName: true, username: true },
    }),
    getCarWashDataScope(session.sub),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: session.sub, trialSessionId: TRIAL_PROD_SCOPE },
      },
      select: { paymentChannelsNote: true },
    }),
  ]);
  const recorderDisplayName = userRow?.fullName?.trim() || userRow?.username || session.username;
  return (
    <CarWashDashboard
      shopLabel={profile?.name?.trim() || "คาร์แคร์"}
      logoUrl={profile?.logoUrl?.trim() || null}
      baseUrl={baseUrl}
      recorderDisplayName={recorderDisplayName}
      ownerId={session.sub}
      trialSessionId={scope.trialSessionId}
      isTrialSandbox={scope.isTrialSandbox}
      paymentChannelsNote={dormPay?.paymentChannelsNote?.trim() || null}
      layoutVariant="staff_lane"
    />
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { CarWashDashboard } from "@/systems/car-wash/CarWashDashboard";

async function requestBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function CarWashDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [profile, baseUrl, userRow, scope] = await Promise.all([
    getBusinessProfile(session.sub),
    requestBaseUrl(),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { fullName: true, username: true },
    }),
    getCarWashDataScope(session.sub),
  ]);
  const recorderDisplayName = userRow?.fullName?.trim() || userRow?.username || session.username;
  return (
    <div className="space-y-6">
      <PageHeader
        title="แดชบอร์ดคาร์แคร์"
        description="จัดการแพ็กเกจ บันทึกการใช้บริการ และร้องเรียนลูกค้า"
      />
      <CarWashDashboard
        shopLabel={profile?.name?.trim() || "คาร์แคร์"}
        logoUrl={profile?.logoUrl?.trim() || null}
        baseUrl={baseUrl}
        recorderDisplayName={recorderDisplayName}
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
      />
    </div>
  );
}

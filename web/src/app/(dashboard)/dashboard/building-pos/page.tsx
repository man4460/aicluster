import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosDashboardClient } from "@/systems/building-pos/BuildingPosDashboardClient";

async function requestBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function BuildingPosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [profile, baseUrl, scope] = await Promise.all([
    getBusinessProfile(session.sub),
    requestBaseUrl(),
    getBuildingPosDataScope(session.sub),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="POS ร้านอาหารอาคาร"
        description="เพิ่มเมนู จัดกลุ่มเมนู รับออเดอร์ลูกค้า และสร้าง QR ให้ลูกค้าสั่งเอง"
      />
      <BuildingPosDashboardClient
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
        baseUrl={baseUrl}
        shopLabel={profile?.name?.trim() || "POS ร้านอาหารอาคาร"}
        logoUrl={profile?.logoUrl?.trim() || null}
      />
    </div>
  );
}

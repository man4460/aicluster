import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-container";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberQrPosterClient } from "@/systems/barber/components/BarberQrPosterClient";

async function requestBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function BarberQrPosterPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const [profile, baseUrl] = await Promise.all([
    getBusinessProfile(session.sub, { barberTrialSessionId: scope.trialSessionId }),
    requestBaseUrl(),
  ]);
  const shopLabel = profile?.name?.trim() || "ร้านตัดผม";
  const logoUrl = profile?.logoUrl?.trim() || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ดาวน์โหลด QR หน้าร้าน"
        description="ใบประกาศแนวตั้งสำหรับแปะหน้าร้าน — ลูกค้าสแกน กรอกเบอร์ แล้วยืนยันใช้บริการเพื่อหักสิทธิ์อัตโนมัติ (โลโก้/ชื่อร้านตั้งที่โปรไฟล์ส่วนกลาง)"
      />
      <BarberQrPosterClient
        ownerId={session.sub}
        shopLabel={shopLabel}
        logoUrl={logoUrl}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQrCarWashBranding } from "@/lib/profile/qr-branding";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { CarWashDashboard } from "@/systems/car-wash/CarWashDashboard";

export default async function CarWashDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getCarWashDataScope(session.sub);
  const [branding, shopBranding, baseUrl, userRow, modulePayment] = await Promise.all([
    getQrCarWashBranding(session.sub, scope.trialSessionId),
    getModuleShopBranding(session.sub, scope.trialSessionId, CAR_WASH_MODULE_SLUG),
    getRequestBaseUrl(),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { fullName: true, username: true },
    }),
    resolveModulePayment(session.sub, scope.trialSessionId, CAR_WASH_MODULE_SLUG),
  ]);
  const recorderDisplayName = userRow?.fullName?.trim() || userRow?.username || session.username;
  return (
    <div className="space-y-6">
      <CarWashDashboard
        shopLabel={branding.label}
        logoUrl={branding.logoUrl}
        baseUrl={baseUrl}
        recorderDisplayName={recorderDisplayName}
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
        paymentChannelsNote={modulePayment.paymentChannelsNote}
        shopPrintProfile={{
          displayName: shopBranding.displayName?.trim() || branding.label,
          logoUrl: shopBranding.logoUrl || branding.logoUrl,
          contactPhone: shopBranding.contactPhone,
          taxId: shopBranding.taxId || modulePayment.taxId,
          bankAccountName: shopBranding.bankAccountName,
          slipPaperSize: shopBranding.slipPaperSize,
        }}
      />
    </div>
  );
}

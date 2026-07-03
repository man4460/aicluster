import type { Metadata } from "next";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import {
  LoyaltyStampDashboardHubClient,
  LoyaltyStampOverviewSections,
} from "@/systems/loyalty-stamp/components/LoyaltyStampDashboardHubClient";
import { loadLoyaltyStampDashboard } from "@/systems/loyalty-stamp/lib/load-dashboard";
import { requireLoyaltyStampPage } from "@/systems/loyalty-stamp/lib/page-auth";
import { paymentRowToDto } from "@/lib/module-shop/payment";
import { getQrLoyaltyStampBranding } from "@/lib/profile/qr-branding";
import { lsPageStackClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

export const metadata: Metadata = {
  title: "สะสมแต้มดิจิทัล | MAWELL",
};

export default async function LoyaltyStampDashboardPage() {
  const { userId, scope, profile } = await requireLoyaltyStampPage();
  const initial = await loadLoyaltyStampDashboard(userId, scope.trialSessionId);
  if (!initial) {
    return <p className="text-sm text-rose-600">โหลดข้อมูลไม่สำเร็จ</p>;
  }

  const baseUrl = await getRequestBaseUrl();
  const branding = await getQrLoyaltyStampBranding(userId, scope.trialSessionId);
  const settingsInitial = {
    displayName: profile.displayName,
    logoUrl: profile.logoUrl,
    tagline: profile.tagline,
    contactPhone: profile.contactPhone,
    publicCardEnabled: profile.publicCardEnabled,
    stampsPerReward: profile.stampsPerReward,
    rewardTitle: profile.rewardTitle,
    rewardDescription: profile.rewardDescription,
    stampEmoji: profile.stampEmoji,
    ...paymentRowToDto(profile),
  };

  const overview = (
    <LoyaltyStampOverviewSections
      ownerId={userId}
      trialSessionId={scope.trialSessionId}
      initial={initial}
      baseUrl={baseUrl}
      trialExportBlocked={scope.isTrialSandbox}
    />
  );

  return (
    <div className={lsPageStackClass}>
      <LoyaltyStampDashboardHubClient
        ownerId={userId}
        trialSessionId={scope.trialSessionId}
        initial={initial}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
        qrLogoUrl={branding.logoUrl}
        qrShopLabel={branding.label}
        settingsInitial={settingsInitial}
      >
        {overview}
      </LoyaltyStampDashboardHubClient>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getQrVillageBranding } from "@/lib/profile/qr-branding";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { VillageSettingsClient } from "@/systems/village/components/VillageSettingsClient";
import { villageNormalizePortalGallery } from "@/systems/village/lib/portal-media";
import type { VillageProfile } from "@/systems/village/village-service";

export default async function VillageSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getVillageDataScope(session.sub);
  const [row, baseUrl, branding] = await Promise.all([
    prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: scope.trialSessionId,
        },
      },
    }),
    getRequestBaseUrl(),
    getQrVillageBranding(session.sub, scope.trialSessionId),
  ]);

  const initial: VillageProfile = {
    id: row?.id ?? 0,
    display_name: row?.displayName ?? null,
    address: row?.address ?? null,
    contact_phone: row?.contactPhone ?? null,
    prompt_pay_phone: row?.promptPayPhone ?? null,
    payment_channels_note: row?.paymentChannelsNote ?? null,
    bank_name: row?.bankName ?? null,
    bank_account_number: row?.bankAccountNumber ?? null,
    bank_account_name: row?.bankAccountName ?? null,
    tax_id: row?.taxId ?? null,
    default_paper_size: normalizeModuleSlipPaperSize(row?.defaultPaperSize),
    default_monthly_fee: row?.defaultMonthlyFee ?? 0,
    due_day_of_month: row?.dueDayOfMonth ?? 5,
    auto_generate_fees: row?.autoGenerateFees ?? true,
    tagline: row?.tagline ?? null,
    logo_url: row?.logoUrl ?? null,
    contact_line: row?.contactLine ?? null,
    facebook_url: row?.facebookUrl ?? null,
    map_url: row?.mapUrl ?? null,
    portal_banner_url: row?.portalBannerUrl ?? null,
    portal_gallery: villageNormalizePortalGallery(row?.portalGalleryJson),
  };

  return (
    <VillageSettingsClient
      initial={initial}
      ownerId={session.sub}
      trialSessionId={scope.trialSessionId}
      baseUrl={baseUrl}
      villageLabel={branding.label}
      logoUrl={branding.logoUrl}
      trialExportBlocked={scope.isTrialSandbox}
    />
  );
}

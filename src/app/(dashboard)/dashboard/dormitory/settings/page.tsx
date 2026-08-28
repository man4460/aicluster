import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { loadDormitoryStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getQrDormitoryBranding } from "@/lib/profile/qr-branding";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { dormitoryNormalizePortalGallery } from "@/systems/dormitory/lib/portal-media";
import {
  DormSettingsClient,
  type DormProfileDto,
} from "@/systems/dormitory/components/DormSettingsClient";
import { DormPageStack } from "@/systems/dormitory/components/DormPageChrome";

export default async function DormitorySettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getDormitoryDataScope(session.sub);
  const [row, pinHash, baseUrl, branding] = await Promise.all([
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: scope.trialSessionId,
        },
      },
    }),
    loadDormitoryStaffDailyPinHash(session.sub),
    getRequestBaseUrl(),
    getQrDormitoryBranding(session.sub, scope.trialSessionId),
  ]);

  const initial: DormProfileDto = {
    displayName: row?.displayName ?? null,
    managerName: row?.managerName ?? null,
    tagline: row?.tagline ?? null,
    logoUrl: row?.logoUrl ?? null,
    taxId: row?.taxId ?? null,
    address: row?.address ?? null,
    caretakerPhone: row?.caretakerPhone ?? null,
    contactLine: row?.contactLine ?? null,
    facebookUrl: row?.facebookUrl ?? null,
    mapUrl: row?.mapUrl ?? null,
    defaultPaperSize: normalizeModuleSlipPaperSize(row?.defaultPaperSize),
    promptPayPhone: row?.promptPayPhone ?? null,
    paymentChannelsNote: row?.paymentChannelsNote ?? null,
    bankName: row?.bankName ?? null,
    bankAccountNumber: row?.bankAccountNumber ?? null,
    bankAccountName: row?.bankAccountName ?? null,
    portalBannerUrl: row?.portalBannerUrl ?? null,
    portalGallery: dormitoryNormalizePortalGallery(row?.portalGalleryJson),
    staffDailyPinSet: Boolean(pinHash?.trim()),
  };

  return (
    <DormPageStack>
      <DormSettingsClient
        initial={initial}
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        baseUrl={baseUrl}
        dormLabel={branding.label}
        logoUrl={branding.logoUrl}
        trialExportBlocked={scope.isTrialSandbox}
      />
    </DormPageStack>
  );
}

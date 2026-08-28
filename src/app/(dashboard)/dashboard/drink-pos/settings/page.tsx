import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getQrDrinkPosBranding } from "@/lib/profile/qr-branding";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { loadDrinkPosStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import { DrinkPosSettingsClient } from "@/systems/drink-pos/components/DrinkPosSettingsClient";
import { ensureDrinkPosLoyaltySettings } from "@/systems/drink-pos/lib/loyalty";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

export default async function DrinkPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const [baseUrl, branding, loyalty, row] = await Promise.all([
    getRequestBaseUrl(),
    getQrDrinkPosBranding(ctx.billingUserId, scope.trialSessionId),
    ensureDrinkPosLoyaltySettings(ctx.billingUserId, scope.trialSessionId),
    ensureDrinkPosShopProfile(prisma, ctx.billingUserId, scope.trialSessionId),
  ]);
  const [full, pinHash] = await Promise.all([
    prisma.drinkPosShopProfile.findUnique({
      where: { id: row.id },
      select: {
        displayName: true,
        logoUrl: true,
        tagline: true,
        address: true,
        contactPhone: true,
        slipPaperSize: true,
        orderTicketSlipPaperSize: true,
        ...MODULE_SHOP_PAYMENT_SELECT,
      },
    }),
    loadDrinkPosStaffDailyPinHash(ctx.billingUserId),
  ]);
  const p = full ?? row;

  return (
    <DrinkPosSettingsClient
      ownerId={ctx.billingUserId}
      trialSessionId={scope.trialSessionId}
      linkHub={{
        baseUrl,
        shopLabel: branding.label,
        logoUrl: branding.logoUrl,
        trialExportBlocked: scope.isTrialSandbox,
        loyaltyEnabled: loyalty.enabled,
        bahtPerPoint: loyalty.baht_per_point,
        pointsPerUnit: loyalty.points_per_unit,
      }}
      shopInitial={{
        displayName: p.displayName,
        logoUrl: p.logoUrl,
        tagline: p.tagline,
        address: p.address ?? null,
        contactPhone: p.contactPhone,
        slipPaperSize: normalizeModuleSlipPaperSize(
          "slipPaperSize" in p ? p.slipPaperSize : "SLIP_58",
        ),
        orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(
          "orderTicketSlipPaperSize" in p ? p.orderTicketSlipPaperSize : "SLIP_58",
        ),
        staffDailyPinSet: Boolean(pinHash),
        ...paymentRowToDto(p),
      }}
    />
  );
}

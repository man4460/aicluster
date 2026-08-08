import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { loadDrinkPosStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { DrinkPosShopSettingsClient } from "@/systems/drink-pos/components/DrinkPosShopSettingsClient";
import { DrinkPosLoyaltySettingsClient } from "@/systems/drink-pos/components/DrinkPosLoyaltySettingsClient";

export default async function DrinkPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const row = await ensureDrinkPosShopProfile(prisma, ctx.billingUserId, scope.trialSessionId);
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
    <div className="space-y-4 sm:space-y-6">
      <DrinkPosShopSettingsClient
        initial={{
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
      <DrinkPosLoyaltySettingsClient />
    </div>
  );
}

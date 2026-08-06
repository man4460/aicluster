import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { DrinkPosShopSettingsClient } from "@/systems/drink-pos/components/DrinkPosShopSettingsClient";

export default async function DrinkPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const row = await ensureDrinkPosShopProfile(prisma, ctx.billingUserId, scope.trialSessionId);
  const full = await prisma.drinkPosShopProfile.findUnique({
    where: { id: row.id },
    select: {
      displayName: true,
      logoUrl: true,
      tagline: true,
      contactPhone: true,
      stampsPerReward: true,
      rewardTitle: true,
      ...MODULE_SHOP_PAYMENT_SELECT,
    },
  });
  const p = full ?? row;

  return (
    <div className="space-y-4 sm:space-y-6">
      <DrinkPosShopSettingsClient
        initial={{
          displayName: p.displayName,
          logoUrl: p.logoUrl,
          tagline: p.tagline,
          contactPhone: p.contactPhone,
          stampsPerReward: p.stampsPerReward,
          rewardTitle: p.rewardTitle,
          ...paymentRowToDto(p),
        }}
      />
    </div>
  );
}

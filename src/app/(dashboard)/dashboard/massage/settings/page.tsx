import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { BarberShopSettingsClient } from "@/systems/barber/components/BarberShopSettingsClient";

export default async function MassageSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getMassageDataScope(session.sub);
  const row = await prisma.massageShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    },
    select: {
      displayName: true,
      logoUrl: true,
      contactPhone: true,
      address: true,
      ...MODULE_SHOP_PAYMENT_SELECT,
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <BarberShopSettingsClient
        apiBase="/api/massage/shop-profile"
        initial={{
          displayName: row?.displayName ?? null,
          logoUrl: row?.logoUrl ?? null,
          contactPhone: row?.contactPhone ?? null,
          address: row?.address ?? null,
          ...paymentRowToDto(row),
        }}
      />
    </div>
  );
}

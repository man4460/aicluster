import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { HotelResortSettingsClient } from "@/systems/hotel-resort/components/HotelResortSettingsClient";

export default async function HotelResortSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/hotel-resort");

  const scope = await getHotelResortDataScope(ctx.billingUserId);
  const row = await ensureHotelResortProfile(prisma, ctx.billingUserId, scope.trialSessionId);
  const full = await prisma.hotelResortProfile.findUnique({
    where: { id: row.id },
    select: {
      propertyName: true,
      logoUrl: true,
      tagline: true,
      contactPhone: true,
      checkInTime: true,
      checkOutTime: true,
      ...MODULE_SHOP_PAYMENT_SELECT,
    },
  });
  const p = full ?? row;

  return (
    <div className="space-y-4 sm:space-y-6">
      <HotelResortSettingsClient
        initial={{
          propertyName: p.propertyName,
          logoUrl: p.logoUrl,
          tagline: p.tagline,
          contactPhone: p.contactPhone,
          checkInTime: p.checkInTime,
          checkOutTime: p.checkOutTime,
          ...paymentRowToDto(p),
        }}
      />
    </div>
  );
}

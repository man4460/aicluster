import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { loadHotelResortStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { hotelResortNormalizePortalPaymentMode } from "@/systems/hotel-resort/lib/portal-booking";
import { HotelResortSettingsClient } from "@/systems/hotel-resort/components/HotelResortSettingsClient";

export default async function HotelResortSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/hotel-resort");

  const scope = await getHotelResortDataScope(ctx.billingUserId);
  const row = await ensureHotelResortProfile(prisma, ctx.billingUserId, scope.trialSessionId);
  const [full, pinHash] = await Promise.all([
    prisma.hotelResortProfile.findUnique({
      where: { id: row.id },
      select: {
        propertyName: true,
        managerName: true,
        logoUrl: true,
        tagline: true,
        contactPhone: true,
        address: true,
        lineId: true,
        facebookUrl: true,
        mapUrl: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
        checkInTime: true,
        checkOutTime: true,
        slipPaperSize: true,
        ...MODULE_SHOP_PAYMENT_SELECT,
      },
    }),
    loadHotelResortStaffDailyPinHash(ctx.billingUserId),
  ]);
  const p = full ?? row;

  return (
    <div className="space-y-4 sm:space-y-6">
      <HotelResortSettingsClient
        initial={{
          propertyName: p.propertyName,
          managerName: "managerName" in p ? (p.managerName ?? null) : null,
          logoUrl: p.logoUrl,
          tagline: p.tagline,
          contactPhone: p.contactPhone,
          address: "address" in p ? (p.address ?? null) : null,
          lineId: "lineId" in p ? (p.lineId ?? null) : null,
          facebookUrl: "facebookUrl" in p ? (p.facebookUrl ?? null) : null,
          mapUrl: "mapUrl" in p ? (p.mapUrl ?? null) : null,
          portalBookingPaymentMode: hotelResortNormalizePortalPaymentMode(
            "portalBookingPaymentMode" in p ? p.portalBookingPaymentMode : "NONE",
          ),
          depositAmountBaht: "depositAmountBaht" in p ? (p.depositAmountBaht ?? null) : null,
          checkInTime: p.checkInTime,
          checkOutTime: p.checkOutTime,
          slipPaperSize: normalizeModuleSlipPaperSize(
            "slipPaperSize" in p ? p.slipPaperSize : "SLIP_58",
          ),
          staffDailyPinSet: Boolean(pinHash),
          ...paymentRowToDto(p),
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { BarberCustomerPortalClient } from "@/systems/barber/components/BarberCustomerPortalClient";
import { BarberPortalMaintenance } from "@/systems/barber/components/BarberPortalMaintenance";

type Props = { params: Promise<{ ownerId: string }> };

export const metadata: Metadata = {
  title: "สมาชิกร้าน",
  robots: { index: false, follow: false },
};

export default async function BarberCustomerPortalPage({ params }: Props) {
  const { ownerId } = await params;
  if (!ownerId || ownerId.length < 10) {
    return <BarberPortalMaintenance />;
  }

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) {
    return <BarberPortalMaintenance />;
  }

  return <BarberCustomerPortalClient ownerId={ownerId} />;
}

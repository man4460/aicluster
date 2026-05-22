import type { Metadata } from "next";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { MassageCustomerPortalClient } from "@/systems/massage/components/MassageCustomerPortalClient";
import { MassagePortalMaintenance } from "@/systems/massage/components/MassagePortalMaintenance";

type Props = { params: Promise<{ ownerId: string }> };

export const metadata: Metadata = {
  title: "จองคิวร้านนวด",
  description: "จองคิวเข้ารับบริการหรือใช้สิทธิ์แพ็กเกจผ่าน QR ลูกค้า",
  robots: { index: false, follow: false },
};

export default async function MassageCustomerPortalPage({ params }: Props) {
  const { ownerId } = await params;
  if (!ownerId || ownerId.length < 10) {
    return <MassagePortalMaintenance />;
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) {
    return <MassagePortalMaintenance />;
  }

  return <MassageCustomerPortalClient ownerId={ownerId} />;
}

import { redirect } from "next/navigation";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { drinkPosPublicPortalUrl } from "@/lib/drink-pos/public-url";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

type Props = {
  params: Promise<{ ownerId: string; reservationId: string }>;
  searchParams: Promise<{ t?: string }>;
};

/** หน้ารายละเอียดจองเก่า → เว็บสั่งเครื่องดื่ม */
export default async function DrinkPosPublicReservationPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { t } = await searchParams;

  if (!ownerId || ownerId.length < 10) {
    redirect("/");
  }

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) {
    redirect("/");
  }

  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = t?.trim() || scope.trialSessionId;
  redirect(drinkPosPublicPortalUrl("", ownerId, trialSessionId));
}

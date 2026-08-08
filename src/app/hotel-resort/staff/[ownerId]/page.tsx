import { notFound } from "next/navigation";
import { HotelResortStaffClient } from "@/systems/hotel-resort/HotelResortStaffClient";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";

export default async function HotelResortStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; k?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  const staffKey = sp.k?.trim() ?? "";
  if (!ownerId || ownerId.length < 10 || !staffKey) notFound();
  const scope = await getHotelResortDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <HotelResortStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />;
}

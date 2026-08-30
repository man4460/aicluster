import { notFound } from "next/navigation";
import { getParkingDataScope } from "@/lib/trial/module-scopes";
import { ParkingStaffClient } from "@/systems/parking/ParkingStaffClient";

export default async function ParkingStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; k?: string }>;
}) {
  const route = await params;
  const query = await searchParams;
  const ownerId = route.ownerId?.trim() ?? "";
  const staffKey = query.k?.trim() ?? "";
  if (!ownerId || ownerId.length < 10 || !staffKey) notFound();
  const scope = await getParkingDataScope(ownerId);
  return (
    <ParkingStaffClient
      ownerId={ownerId}
      trialSessionId={query.t?.trim() || scope.trialSessionId}
      staffKey={staffKey}
    />
  );
}

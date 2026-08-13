import { notFound } from "next/navigation";
import { CarWashStaffClient } from "@/systems/car-wash/CarWashStaffClient";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

export default async function CarWashStaffPage({
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
  const scope = await getCarWashDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <CarWashStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />;
}

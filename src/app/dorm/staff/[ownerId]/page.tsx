import { notFound } from "next/navigation";
import { DormStaffClient } from "@/systems/dormitory/DormStaffClient";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export default async function DormStaffPage({
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
  const scope = await getDormitoryDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <DormStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />;
}

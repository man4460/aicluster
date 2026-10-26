import { SmartPoliceSuspectDetail } from "@/systems/smart-police/components/SmartPoliceSuspectDetail";

export default async function SmartPoliceSuspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SmartPoliceSuspectDetail suspectId={id} />;
}

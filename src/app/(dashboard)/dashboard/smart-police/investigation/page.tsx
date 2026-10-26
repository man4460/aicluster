import { SmartPoliceInvestigationHub } from "@/systems/smart-police/components/SmartPoliceInvestigationHub";

export default async function SmartPoliceInvestigationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SmartPoliceInvestigationHub initialTab={tab} />;
}

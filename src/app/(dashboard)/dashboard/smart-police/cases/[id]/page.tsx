import { SmartPoliceCaseDetailClient } from "@/systems/smart-police/components/SmartPoliceCaseDetailClient";

export default async function SmartPoliceCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SmartPoliceCaseDetailClient caseId={id} />;
}

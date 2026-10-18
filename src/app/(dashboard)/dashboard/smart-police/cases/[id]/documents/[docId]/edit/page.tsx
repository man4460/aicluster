import { SmartPoliceStatementEditorClient } from "@/systems/smart-police/components/SmartPoliceStatementEditorClient";

export default async function SmartPoliceStatementEditPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id: caseId, docId } = await params;
  return <SmartPoliceStatementEditorClient caseId={caseId} documentId={docId} />;
}

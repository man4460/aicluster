import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSmartPoliceOwnerFromAuth } from "@/lib/smart-police/api-owner";
import { getSmartPoliceDocumentPreview } from "@/lib/smart-police/get-document-preview";
import { SmartPoliceA4PreviewClient } from "@/systems/smart-police/components/SmartPoliceA4PreviewClient";

export default async function SmartPoliceDocumentPreviewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const owner = await getSmartPoliceOwnerFromAuth(session.sub);
  if (!owner) redirect("/dashboard");

  const { id: caseId, docId } = await params;
  const preview = await getSmartPoliceDocumentPreview(owner.ownerUserId, caseId, docId);
  if (!preview) redirect(`/dashboard/smart-police/cases/${caseId}`);

  return (
    <SmartPoliceA4PreviewClient
      caseId={caseId}
      documentId={docId}
      initialModel={preview.model}
      initialPrintHtml={preview.printHtml}
    />
  );
}

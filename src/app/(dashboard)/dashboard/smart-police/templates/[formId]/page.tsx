import { SmartPoliceFormTemplateViewerClient } from "@/systems/smart-police/components/SmartPoliceFormTemplateViewerClient";

export default async function SmartPoliceFormTemplatePage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <SmartPoliceFormTemplateViewerClient formId={formId} />;
}

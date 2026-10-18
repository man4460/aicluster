import { notFound } from "next/navigation";
import { SMART_POLICE_STATEMENT_TEMPLATES } from "@/lib/smart-police/form-templates";
import type { StatementTemplateSlug } from "@/lib/smart-police/form-templates";
import { SmartPoliceStatementTemplatePreviewClient } from "@/systems/smart-police/components/SmartPoliceStatementTemplatePreviewClient";

export default async function SmartPoliceStatementTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ok = SMART_POLICE_STATEMENT_TEMPLATES.some((t) => t.slug === slug);
  if (!ok) notFound();
  return <SmartPoliceStatementTemplatePreviewClient slug={slug as StatementTemplateSlug} />;
}

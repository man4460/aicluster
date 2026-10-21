import { notFound } from "next/navigation";
import {
  getOfficialFormTemplateMeta,
  isCompensationSettlementFormSlug,
  isOralPleaFormSlug,
  isPropertyListFormSlug,
  isSceneMapFormSlug,
  isStatementFormSlug,
  isVictimRightsFormSlug,
  isWithdrawComplaintFormSlug,
} from "@/lib/smart-police/form-templates";
import type { StatementTemplateSlug } from "@/lib/smart-police/form-templates";
import { SmartPoliceCompensationSettlementPreviewClient } from "@/systems/smart-police/components/SmartPoliceCompensationSettlementPreviewClient";
import { SmartPolicePropertyListPreviewClient } from "@/systems/smart-police/components/SmartPolicePropertyListPreviewClient";
import { SmartPoliceSceneMapPreviewClient } from "@/systems/smart-police/components/SmartPoliceSceneMapPreviewClient";
import { SmartPoliceStatementTemplatePreviewClient } from "@/systems/smart-police/components/SmartPoliceStatementTemplatePreviewClient";
import { SmartPoliceOralPleaPreviewClient } from "@/systems/smart-police/components/SmartPoliceOralPleaPreviewClient";
import { SmartPoliceVictimRightsPreviewClient } from "@/systems/smart-police/components/SmartPoliceVictimRightsPreviewClient";
import { SmartPoliceWithdrawComplaintPreviewClient } from "@/systems/smart-police/components/SmartPoliceWithdrawComplaintPreviewClient";

export default async function SmartPoliceOfficialFormPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getOfficialFormTemplateMeta(slug);
  if (!meta) notFound();
  if (isStatementFormSlug(slug)) {
    return <SmartPoliceStatementTemplatePreviewClient slug={slug as StatementTemplateSlug} />;
  }
  if (isPropertyListFormSlug(slug)) {
    return <SmartPolicePropertyListPreviewClient slug={slug} />;
  }
  if (isSceneMapFormSlug(slug)) {
    return <SmartPoliceSceneMapPreviewClient />;
  }
  if (isWithdrawComplaintFormSlug(slug)) {
    return <SmartPoliceWithdrawComplaintPreviewClient />;
  }
  if (isCompensationSettlementFormSlug(slug)) {
    return <SmartPoliceCompensationSettlementPreviewClient />;
  }
  if (isVictimRightsFormSlug(slug)) {
    return <SmartPoliceVictimRightsPreviewClient />;
  }
  if (isOralPleaFormSlug(slug)) {
    return <SmartPoliceOralPleaPreviewClient />;
  }
  notFound();
}

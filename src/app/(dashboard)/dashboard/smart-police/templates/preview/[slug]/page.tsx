import { notFound } from "next/navigation";
import {
  getOfficialFormTemplateMeta,
  isArrestRecordFormSlug,
  isCasePhotoFormSlug,
  isChargeNoticeFormSlug,
  isPhotoIdFormSlug,
  isLineupIdFormSlug,
  isCaseCoverFormSlug,
  isInquiryReportFormSlug,
  isCompensationSettlementFormSlug,
  isRightsNoticeFormSlug,
  isExhibitListFormSlug,
  isOralPleaFormSlug,
  isPropertyListFormSlug,
  isSceneMapFormSlug,
  isStatementFormSlug,
  isVictimRightsFormSlug,
  isWithdrawComplaintFormSlug,
} from "@/lib/smart-police/form-templates";
import type { StatementTemplateSlug } from "@/lib/smart-police/form-templates";
import { SmartPoliceCompensationSettlementPreviewClient } from "@/systems/smart-police/components/SmartPoliceCompensationSettlementPreviewClient";
import { SmartPoliceExhibitListPreviewClient } from "@/systems/smart-police/components/SmartPoliceExhibitListPreviewClient";
import { SmartPolicePropertyListPreviewClient } from "@/systems/smart-police/components/SmartPolicePropertyListPreviewClient";
import { SmartPoliceSceneMapPreviewClient } from "@/systems/smart-police/components/SmartPoliceSceneMapPreviewClient";
import { SmartPoliceStatementTemplatePreviewClient } from "@/systems/smart-police/components/SmartPoliceStatementTemplatePreviewClient";
import { SmartPoliceArrestRecordPreviewClient } from "@/systems/smart-police/components/SmartPoliceArrestRecordPreviewClient";
import { SmartPoliceChargeNoticePreviewClient } from "@/systems/smart-police/components/SmartPoliceChargeNoticePreviewClient";
import { SmartPoliceRightsNoticePreviewClient } from "@/systems/smart-police/components/SmartPoliceRightsNoticePreviewClient";
import { SmartPoliceCasePhotoPreviewClient } from "@/systems/smart-police/components/SmartPoliceCasePhotoPreviewClient";
import { SmartPolicePhotoIdPreviewClient } from "@/systems/smart-police/components/SmartPolicePhotoIdPreviewClient";
import { SmartPoliceLineupIdPreviewClient } from "@/systems/smart-police/components/SmartPoliceLineupIdPreviewClient";
import { SmartPoliceCaseCoverPreviewClient } from "@/systems/smart-police/components/SmartPoliceCaseCoverPreviewClient";
import { SmartPoliceInquiryReportPreviewClient } from "@/systems/smart-police/components/SmartPoliceInquiryReportPreviewClient";
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
  if (isExhibitListFormSlug(slug)) {
    return <SmartPoliceExhibitListPreviewClient />;
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
  if (isArrestRecordFormSlug(slug)) {
    return <SmartPoliceArrestRecordPreviewClient />;
  }
  if (isChargeNoticeFormSlug(slug)) {
    return <SmartPoliceChargeNoticePreviewClient />;
  }
  if (isRightsNoticeFormSlug(slug)) {
    return <SmartPoliceRightsNoticePreviewClient />;
  }
  if (isCasePhotoFormSlug(slug)) {
    return <SmartPoliceCasePhotoPreviewClient />;
  }
  if (isPhotoIdFormSlug(slug)) {
    return <SmartPolicePhotoIdPreviewClient />;
  }
  if (isLineupIdFormSlug(slug)) {
    return <SmartPoliceLineupIdPreviewClient />;
  }
  if (isCaseCoverFormSlug(slug)) {
    return <SmartPoliceCaseCoverPreviewClient />;
  }
  if (isInquiryReportFormSlug(slug)) {
    return <SmartPoliceInquiryReportPreviewClient />;
  }
  notFound();
}

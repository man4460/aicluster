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
  isInquiryMemoFormSlug,
  isInquiryDocketFormSlug,
  isSceneInspectFormSlug,
  isCaseProgressFormSlug,
  isInjuryReferralFormSlug,
  isForensicRequestFormSlug,
  isCustodyLogFormSlug,
  isBailBondFormSlug,
  isInvestigateNoticeFormSlug,
  isOfficialMemoFormSlug,
  isWitnessSummonsFormSlug,
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

export default async function SmartPoliceOfficialFormPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getOfficialFormTemplateMeta(slug);
  if (!meta) notFound();
  if (isStatementFormSlug(slug)) {
    const { SmartPoliceStatementTemplatePreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceStatementTemplatePreviewClient"
    );
    return <SmartPoliceStatementTemplatePreviewClient slug={slug as StatementTemplateSlug} />;
  }
  if (isPropertyListFormSlug(slug)) {
    const { SmartPolicePropertyListPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPolicePropertyListPreviewClient"
    );
    return <SmartPolicePropertyListPreviewClient slug={slug} />;
  }
  if (isExhibitListFormSlug(slug)) {
    const { SmartPoliceExhibitListPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceExhibitListPreviewClient"
    );
    return <SmartPoliceExhibitListPreviewClient />;
  }
  if (isSceneMapFormSlug(slug)) {
    const { SmartPoliceSceneMapPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceSceneMapPreviewClient"
    );
    return <SmartPoliceSceneMapPreviewClient />;
  }
  if (isWithdrawComplaintFormSlug(slug)) {
    const { SmartPoliceWithdrawComplaintPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceWithdrawComplaintPreviewClient"
    );
    return <SmartPoliceWithdrawComplaintPreviewClient />;
  }
  if (isCompensationSettlementFormSlug(slug)) {
    const { SmartPoliceCompensationSettlementPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceCompensationSettlementPreviewClient"
    );
    return <SmartPoliceCompensationSettlementPreviewClient />;
  }
  if (isVictimRightsFormSlug(slug)) {
    const { SmartPoliceVictimRightsPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceVictimRightsPreviewClient"
    );
    return <SmartPoliceVictimRightsPreviewClient />;
  }
  if (isOralPleaFormSlug(slug)) {
    const { SmartPoliceOralPleaPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceOralPleaPreviewClient"
    );
    return <SmartPoliceOralPleaPreviewClient />;
  }
  if (isArrestRecordFormSlug(slug)) {
    const { SmartPoliceArrestRecordPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceArrestRecordPreviewClient"
    );
    return <SmartPoliceArrestRecordPreviewClient />;
  }
  if (isChargeNoticeFormSlug(slug)) {
    const { SmartPoliceChargeNoticePreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceChargeNoticePreviewClient"
    );
    return <SmartPoliceChargeNoticePreviewClient />;
  }
  if (isRightsNoticeFormSlug(slug)) {
    const { SmartPoliceRightsNoticePreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceRightsNoticePreviewClient"
    );
    return <SmartPoliceRightsNoticePreviewClient />;
  }
  if (isCasePhotoFormSlug(slug)) {
    const { SmartPoliceCasePhotoPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceCasePhotoPreviewClient"
    );
    return <SmartPoliceCasePhotoPreviewClient />;
  }
  if (isPhotoIdFormSlug(slug)) {
    const { SmartPolicePhotoIdPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPolicePhotoIdPreviewClient"
    );
    return <SmartPolicePhotoIdPreviewClient />;
  }
  if (isLineupIdFormSlug(slug)) {
    const { SmartPoliceLineupIdPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceLineupIdPreviewClient"
    );
    return <SmartPoliceLineupIdPreviewClient />;
  }
  if (isCaseCoverFormSlug(slug)) {
    const { SmartPoliceCaseCoverPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceCaseCoverPreviewClient"
    );
    return <SmartPoliceCaseCoverPreviewClient />;
  }
  if (isInquiryReportFormSlug(slug)) {
    const { SmartPoliceInquiryReportPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceInquiryReportPreviewClient"
    );
    return <SmartPoliceInquiryReportPreviewClient />;
  }
  if (isInquiryMemoFormSlug(slug)) {
    const { SmartPoliceInquiryMemoPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceInquiryMemoPreviewClient"
    );
    return <SmartPoliceInquiryMemoPreviewClient />;
  }
  if (isInquiryDocketFormSlug(slug)) {
    const { SmartPoliceInquiryDocketPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceInquiryDocketPreviewClient"
    );
    return <SmartPoliceInquiryDocketPreviewClient />;
  }
  if (isSceneInspectFormSlug(slug)) {
    const { SmartPoliceSceneInspectPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceSceneInspectPreviewClient"
    );
    return <SmartPoliceSceneInspectPreviewClient />;
  }
  if (isCaseProgressFormSlug(slug)) {
    const { SmartPoliceCaseProgressPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceCaseProgressPreviewClient"
    );
    return <SmartPoliceCaseProgressPreviewClient />;
  }
  if (isInjuryReferralFormSlug(slug)) {
    const { SmartPoliceInjuryReferralPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceInjuryReferralPreviewClient"
    );
    return <SmartPoliceInjuryReferralPreviewClient />;
  }
  if (isForensicRequestFormSlug(slug)) {
    const { SmartPoliceForensicRequestPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceForensicRequestPreviewClient"
    );
    return <SmartPoliceForensicRequestPreviewClient />;
  }
  if (isCustodyLogFormSlug(slug)) {
    const { SmartPoliceCustodyLogPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceCustodyLogPreviewClient"
    );
    return <SmartPoliceCustodyLogPreviewClient />;
  }
  if (isBailBondFormSlug(slug)) {
    const { SmartPoliceBailBondPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceBailBondPreviewClient"
    );
    return <SmartPoliceBailBondPreviewClient />;
  }
  if (isInvestigateNoticeFormSlug(slug)) {
    const { SmartPoliceInvestigateNoticePreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceInvestigateNoticePreviewClient"
    );
    return <SmartPoliceInvestigateNoticePreviewClient />;
  }
  if (isOfficialMemoFormSlug(slug)) {
    const { SmartPoliceMemoPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceMemoPreviewClient"
    );
    return <SmartPoliceMemoPreviewClient />;
  }
  if (isWitnessSummonsFormSlug(slug)) {
    const { SmartPoliceWitnessSummonsPreviewClient } = await import(
      "@/systems/smart-police/components/SmartPoliceWitnessSummonsPreviewClient"
    );
    return <SmartPoliceWitnessSummonsPreviewClient />;
  }
  notFound();
}

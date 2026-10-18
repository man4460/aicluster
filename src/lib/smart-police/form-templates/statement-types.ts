import type { SmartPolicePartyRole } from "@/generated/prisma/enums";

export type StatementTemplateSlug =
  | "statement-complainant"
  | "statement-suspect"
  | "statement-witness";

export type StatementQaItem = {
  id: string;
  question: string;
  answer: string;
};

export type StatementPage = {
  id: string;
  qa: StatementQaItem[];
};

export type StatementHeaderFields = {
  stationName: string;
  stationAddress: string;
  province: string;
  commanderLine: string;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  chargeText: string;
  lawRefs: string;
  investigator: string;
  todayThai: string;
  partyName: string;
  partyRoleLabel: string;
  partyAge: string;
  partyNationality: string;
  partyIdCard: string;
  partyAddress: string;
  partyPhone: string;
  partyOccupation: string;
  partyWorkplace: string;
  partyCaseRelation: string;
  partyPleaStatus: string;
};

export type StatementDocumentContent = {
  templateSlug: StatementTemplateSlug;
  version: 1;
  header: StatementHeaderFields;
  pages: StatementPage[];
};

export type StatementTemplateMeta = {
  slug: StatementTemplateSlug;
  title: string;
  description: string;
  roles: SmartPolicePartyRole[];
};

export const STATEMENT_CONTENT_MARKER = '"templateSlug"';

export {
  SMART_POLICE_STATEMENT_TEMPLATES,
  getStatementTemplateMeta,
  statementTemplateMetaForRole,
  statementTemplateSlugForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
export {
  createEmptyPage,
  createEmptyQa,
  ensureStatementPagesDoc,
  normalizeStatementPage,
  qaListToBodyText,
  fillStatementDocumentSync,
  isStatementJsonContent,
  normalizeStatementHeader,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementContentBodyTextForWord,
  statementDocumentTitle,
  statementDocumentToPlainText,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
export {
  buildOfficialStatementFormHtml,
  wrapOfficialStatementPrintHtml,
} from "@/lib/smart-police/form-templates/official-statement-form-html";
export type {
  StatementDocumentContent,
  StatementDocumentContentV1,
  StatementDocumentContentV2,
  StatementDocumentContentV3,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";
export {
  isStatementDocumentV2,
  isStatementDocumentV3,
  statementDocumentHasPages,
} from "@/lib/smart-police/form-templates/statement-types";

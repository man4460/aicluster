export {
  SMART_POLICE_STATEMENT_TEMPLATES,
  getStatementTemplateMeta,
  statementTemplateMetaForRole,
  statementTemplateSlugForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
export {
  appendContinuationSheetPair,
  flowStatementOverflow,
  createDefaultStatementPages,
  createEmptyPage,
  createEmptyQa,
  ensureMinimumStatementPages,
  ensureStatementPagesDoc,
  normalizeStatementPage,
  qaListToBodyText,
  fillStatementDocumentSync,
  isStatementJsonContent,
  normalizeStatementHeader,
  parseStatementDocumentContent,
  removeStatementPageAt,
  serializeStatementDocument,
  statementContentBodyTextForWord,
  statementDocumentTitle,
  statementDocumentToPlainText,
  statementPageSlot,
  statementPageTabLabel,
  type FillStatementInput,
  type StatementPageSlot,
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
/** fill-statement-docx = server-only — import ตรงจาก API/server ห้าม re-export ที่นี่ */

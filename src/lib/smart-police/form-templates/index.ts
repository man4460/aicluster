export {
  SMART_POLICE_STATEMENT_TEMPLATES,
  getStatementTemplateMeta,
  statementTemplateMetaForRole,
  statementTemplateSlugForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
export {
  createEmptyPage,
  createEmptyQa,
  fillStatementDocument,
  fillStatementDocumentSync,
  isStatementJsonContent,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementDocumentTitle,
  statementDocumentToPlainText,
  statementFormDocumentCss,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
export type {
  StatementDocumentContent,
  StatementDocumentContentV1,
  StatementDocumentContentV2,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";
export { isStatementDocumentV2 } from "@/lib/smart-police/form-templates/statement-types";

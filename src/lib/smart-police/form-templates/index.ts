export {
  SMART_POLICE_STATEMENT_TEMPLATES,
  getStatementTemplateMeta,
  statementTemplateSlugForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
export {
  createEmptyPage,
  createEmptyQa,
  fillStatementDocument,
  isStatementJsonContent,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementDocumentTitle,
  statementDocumentToPlainText,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
export type {
  StatementDocumentContent,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";

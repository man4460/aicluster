import "server-only";

import { findSmartPoliceBlankForm } from "@/lib/smart-police/form-template";
import { blankFormPublicHref } from "@/lib/smart-police/form-template";
import {
  buildHeader,
  createDefaultStatementPages,
  seedQuestionsForRole,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
import { buildOfficialStatementFormHtml } from "@/lib/smart-police/form-templates/official-statement-form-html";
import { statementTemplateMetaForRole } from "@/lib/smart-police/form-templates/statement-catalog";
import type { StatementDocumentContentV3 } from "@/lib/smart-police/form-templates/statement-types";

/**
 * สร้างคำให้การแบบฟอร์มราชการ (ตามแบบ สำนักงานตำรวจแห่งชาติ)
 * + เติมช่องจากคดี + ถาม–ตอบ · ลิงก์ไฟล์ Word ต้นฉบับไว้ด้วย
 */
export async function fillStatementDocument(
  input: FillStatementInput,
): Promise<StatementDocumentContentV3> {
  const meta = statementTemplateMetaForRole(input.role);
  const blank = findSmartPoliceBlankForm(meta.blankFormId);
  if (!blank) {
    throw new Error(`ไม่พบแบบฟอร์ม ${meta.blankFormId}`);
  }

  const header = buildHeader(input);
  const hint = (input.behaviorHint ?? "").trim();
  const pages = createDefaultStatementPages(seedQuestionsForRole(input.role, hint));

  const formTitle =
    input.role === "SUSPECT"
      ? "บันทึกคำให้การของผู้ต้องหา"
      : "บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน";

  const formHtml = buildOfficialStatementFormHtml({
    header,
    pages,
    formTitle,
  });

  return {
    version: 3,
    templateSlug: meta.slug,
    blankFormId: blank.id,
    blankFormFileName: blank.fileName,
    blankFormTitle: blank.title,
    blankFormHref: blankFormPublicHref(blank.fileName),
    header,
    formHtml,
    pages,
  };
}

export type { FillStatementInput };

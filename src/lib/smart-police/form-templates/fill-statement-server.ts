import "server-only";

import { findSmartPoliceBlankForm } from "@/lib/smart-police/form-template";
import { loadBlankFormPreviewHtml, blankFormPublicHref } from "@/lib/smart-police/form-template";
import {
  buildHeader,
  createEmptyPage,
  seedQuestionsForRole,
  type FillStatementInput,
} from "@/lib/smart-police/form-templates/fill-statement";
import { statementTemplateMetaForRole } from "@/lib/smart-police/form-templates/statement-catalog";
import type {
  StatementDocumentContentV3,
  StatementHeaderFields,
} from "@/lib/smart-police/form-templates/statement-types";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function injectValuesIntoFormHtml(formHtml: string, h: StatementHeaderFields): string {
  let html = formHtml;

  const replacements: { label: string; value: string }[] = [
    { label: "หมายเลขโทรศัพท์", value: h.partyPhone },
    { label: "บัตรประจำตัวประชาชน", value: h.partyIdCard },
  ];

  for (const { label, value } of replacements) {
    if (!value.trim()) continue;
    const escaped = escapeHtml(value.trim());
    const re = new RegExp(
      `(<p><strong>${label}</strong></p></td>)([\\s\\S]{0,400}?<td[^>]*>)(</td>)`,
      "i",
    );
    if (re.test(html)) {
      html = html.replace(re, `$1$2${escaped}$3`);
    }
  }

  if (h.partyName.trim()) {
    const name = escapeHtml(h.partyName.trim());
    const reName =
      /(<p><strong>คำให้การของ<\/strong><\/p><\/td>)([\s\S]{0,200}?<td[^>]*>)(<\/td>)/i;
    if (reName.test(html)) {
      html = html.replace(reName, `$1$2${name}$3`);
    }
  }

  if (h.province.trim()) {
    html = html.replace(
      /<p>กรุงเทพมหานคร<\/p>/i,
      `<p>${escapeHtml(h.province.trim())}</p>`,
    );
  }

  return html;
}

/**
 * สร้างคำให้การจากแบบฟอร์ม Word จริง (เช่น คำให้การผู้กล่าวหา.docx)
 * + เติมช่องจากคดี + หน้าถาม–ตอบ ให้พงส. พิมพ์ในระบบ
 * ไฟล์ Word ต้นฉบับยังลิงก์ไว้ · บันทึกแล้วสร้าง .docx แนบสำนวนได้อีกไฟล์
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
  let formHtml = (await loadBlankFormPreviewHtml(blank.fileName)) ?? "<p></p>";
  formHtml = injectValuesIntoFormHtml(formHtml, header);

  const hint = (input.behaviorHint ?? "").trim();

  return {
    version: 3,
    templateSlug: meta.slug,
    blankFormId: blank.id,
    blankFormFileName: blank.fileName,
    blankFormTitle: blank.title,
    blankFormHref: blankFormPublicHref(blank.fileName),
    header,
    formHtml,
    pages: [createEmptyPage(seedQuestionsForRole(input.role, hint))],
  };
}

export type { FillStatementInput };

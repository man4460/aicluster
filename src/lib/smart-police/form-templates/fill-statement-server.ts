import "server-only";

import { findSmartPoliceBlankForm } from "@/lib/smart-police/form-template";
import { loadBlankFormPreviewHtml } from "@/lib/smart-police/form-template";
import {
  buildHeader,
  type FillStatementInput,
  statementFormDocumentCss,
} from "@/lib/smart-police/form-templates/fill-statement";
import { statementTemplateMetaForRole } from "@/lib/smart-police/form-templates/statement-catalog";
import type {
  StatementDocumentContentV2,
  StatementHeaderFields,
} from "@/lib/smart-police/form-templates/statement-types";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** แถบข้อมูลที่ดึงจากคดี — วางบนแบบฟอร์มเพื่อให้เห็นช่องที่เติมแล้ว */
function buildAutofillBannerHtml(h: StatementHeaderFields, behaviorHint: string): string {
  const row = (label: string, value: string) =>
    value.trim()
      ? `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
      : "";

  return `<div class="sp-autofill" data-sp-autofill="1" contenteditable="false">
<p class="sp-autofill-title">ข้อมูลที่ระบบเติมจากคดี (ตรวจแล้วแก้ต่อในแบบฟอร์มด้านล่างได้)</p>
<table class="sp-autofill-table">
${row("สถานี", h.stationName)}
${row("เลขที่คดี", h.caseNumber)}
${row("เรื่อง", h.caseTitle)}
${row("ข้อหา", h.chargeText)}
${row("กฎหมายที่อ้าง", h.lawRefs)}
${row("ชื่อ-สกุลผู้ให้การ", h.partyName)}
${row("บทบาท", h.partyRoleLabel)}
${row("อายุ", h.partyAge ? `${h.partyAge} ปี` : "")}
${row("สัญชาติ", h.partyNationality)}
${row("เลขบัตรประชาชน", h.partyIdCard)}
${row("ที่อยู่", h.partyAddress)}
${row("โทรศัพท์", h.partyPhone)}
${row("อาชีพ", h.partyOccupation)}
${row("พนักงานสอบสวน", h.investigator)}
${row("วันที่", h.todayThai)}
${behaviorHint.trim() ? row("พฤติการณ์ (อ้างอิง)", behaviorHint.trim()) : ""}
</table>
<p class="sp-autofill-hint">ด้านล่างคือแบบฟอร์มต้นฉบับ — พิมพ์/แก้ได้เหมือน Word จากนั้นบันทึกและพิมพ์ให้ลงลายเซ็นเก็บในสำนวน</p>
</div>
<hr class="sp-form-sep"/>
`;
}

/**
 * พยายามใส่ค่าลงช่องว่างในตารางแบบฟอร์ม (เซลล์ว่างหลังป้ายกำกับ)
 */
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

  return html;
}

/** สร้างคำให้การจากแบบฟอร์ม Word จริง + เติมข้อมูลคดี (server only) */
export async function fillStatementDocument(
  input: FillStatementInput,
): Promise<StatementDocumentContentV2> {
  const meta = statementTemplateMetaForRole(input.role);
  const blank = findSmartPoliceBlankForm(meta.blankFormId);
  if (!blank) {
    throw new Error(`ไม่พบแบบฟอร์ม ${meta.blankFormId}`);
  }

  const header = buildHeader(input);
  let formHtml = (await loadBlankFormPreviewHtml(blank.fileName)) ?? "<p></p>";
  formHtml = injectValuesIntoFormHtml(formHtml, header);

  const behaviorHint = (input.behaviorHint ?? "").trim();
  const css = statementFormDocumentCss();
  const bodyHtml = `<div class="sp-form-root">
<style>${css}</style>
${buildAutofillBannerHtml(header, behaviorHint)}
<div class="sp-form-body">${formHtml}</div>
</div>`;

  return {
    version: 2,
    templateSlug: meta.slug,
    blankFormId: blank.id,
    blankFormFileName: blank.fileName,
    blankFormTitle: blank.title,
    header,
    bodyHtml,
  };
}

import { OFFICIAL_STATEMENT_FORM_CSS } from "@/lib/smart-police/form-templates/official-statement-form-css";
import { statementPageTabLabel } from "@/lib/smart-police/form-templates/fill-statement";
import type {
  StatementHeaderFields,
  StatementPage,
} from "@/lib/smart-police/form-templates/statement-types";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dot(value: string): string {
  const v = value.trim();
  return v ? esc(v) : "………………";
}

/** HTML แบบฟอร์มราชการตามแม่แบบ คำให้การผู้กล่าวหา.docx */
export function buildOfficialStatementFormHtml(opts: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  formTitle: string;
}): string {
  const h = opts.header;
  const bodyPages = opts.pages
    .map((p, i) => {
      const raw = (p.text || "").trim();
      if (!raw && (!p.qa || p.qa.length === 0)) return "";
      let body = raw;
      if (!body && p.qa?.length) {
        body = p.qa
          .map((qa, n) => {
            const lines = [];
            if (qa.question.trim()) lines.push(`ถาม ${n + 1}. ${qa.question.trim()}`);
            lines.push(`ตอบ ${qa.answer.trim() || "…"}`);
            return lines.join("\n");
          })
          .join("\n\n");
      }
      const title =
        i === 0 ? "" : `<p style="text-align:center;font-weight:700">${statementPageTabLabel(i)}</p>`;
      return `${title}<div class="sp-off-qa-a" style="white-space:pre-wrap;min-height:8em;border:1px solid #333;padding:8px;margin:8px 0">${esc(body)}</div>`;
    })
    .join("");
  const qaHtml = bodyPages;

  return `<div class="sp-off">
<style>${OFFICIAL_STATEMENT_FORM_CSS}</style>
<div class="sp-off-grid">
<aside class="sp-off-side">
<div class="sp-off-field"><span class="sp-off-label">คำให้การของ</span><div class="sp-off-dot">${dot(h.partyName)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">เป็น</span><div class="sp-off-dot">${dot(h.partyRoleLabel)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">หมายเลขโทรศัพท์</span><div class="sp-off-dot">${dot(h.partyPhone)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">บัตรประจำตัวประชาชน</span><div class="sp-off-dot">${dot(h.partyIdCard)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">ออกเมื่อ</span><div class="sp-off-dot">${dot(h.idIssuedOn)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">หมดอายุ</span><div class="sp-off-dot">${dot(h.idExpiresOn)}</div></div>
<div class="sp-off-field"><span class="sp-off-label">ออกให้ ณ</span><div class="sp-off-dot">${dot(h.idIssuedAt)}</div></div>
<div class="sp-off-field" style="text-align:center;margin-top:2rem"><span class="sp-off-label">ลงชื่อ</span> ……… <span class="sp-off-label">บันทึก</span></div>
<p style="font-size:10px;margin-top:2rem;color:#444">(ส ๕๖ - ๔)</p>
</aside>
<div class="sp-off-main">
<div class="sp-off-head">
<img class="sp-off-garuda" src="/smart-police/garuda.png" alt="" width="56" height="64"/>
<p class="sp-off-org">สำนักงานตำรวจแห่งชาติ</p>
<p class="sp-off-title">${esc(opts.formTitle)}</p>
</div>
<div class="sp-off-row"><span class="sp-off-label">สถานีตำรวจ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.stationName)}</span>
<span class="sp-off-label">เขต/อำเภอ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.district)}</span>
<span class="sp-off-label">จังหวัด</span> <span class="sp-off-dot sp-off-flex1">${dot(h.province)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">วันที่</span> <span class="sp-off-dot">${dot(h.dayThai)}</span>
<span class="sp-off-label">เดือน</span> <span class="sp-off-dot sp-off-flex1">${dot(h.monthThai)}</span>
<span class="sp-off-label">พ.ศ.</span> <span class="sp-off-dot">${dot(h.yearThai)}</span></div>
<div class="sp-off-case">
<div class="sp-off-case-label">คดีระหว่าง</div>
<div class="sp-off-brace">{</div>
<div class="sp-off-case-lines">
<div class="sp-off-case-line"><span class="sp-off-dot sp-off-flex1">${dot(h.complainantLine)}</span><strong>ผู้กล่าวหา</strong></div>
<div class="sp-off-case-line"><span class="sp-off-dot sp-off-flex1">${dot(h.suspectLine)}</span><strong>ผู้ต้องหา</strong></div>
</div>
</div>
<div class="sp-off-row"><span class="sp-off-label">ต่อหน้า</span> <span class="sp-off-dot sp-off-flex1">${dot(h.investigator)}</span></div>
<div class="sp-off-row"><span class="sp-off-dot sp-off-flex1">${dot(h.commanderLine)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">สอบสวนที่</span> <span class="sp-off-dot sp-off-flex1">${dot(h.interviewPlace)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">ชื่อ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.partyName)}</span>
<span class="sp-off-label">อายุ</span> <span class="sp-off-dot">${dot(h.partyAge)}</span> ปี</div>
<div class="sp-off-row"><span class="sp-off-label">เชื้อชาติ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.ethnicity)}</span>
<span class="sp-off-label">สัญชาติ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.partyNationality)}</span>
<span class="sp-off-label">ศาสนา</span> <span class="sp-off-dot sp-off-flex1">${dot(h.religion)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">อาชีพ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.partyOccupation)}</span></div>
<p class="sp-off-hint">(ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด หรือบำเหน็จ บำนาญ หรือไม่ ให้ลงตามประเภทที่รับ)</p>
<div class="sp-off-row"><span class="sp-off-label">อยู่บ้านเลขที่</span> <span class="sp-off-dot">${dot(h.houseNo)}</span>
<span class="sp-off-label">หมู่ที่</span> <span class="sp-off-dot">${dot(h.moo)}</span>
<span class="sp-off-label">แขวง/ตำบล</span> <span class="sp-off-dot sp-off-flex1">${dot(h.tambon)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">เขต/อำเภอ</span> <span class="sp-off-dot sp-off-flex1">${dot(h.amphoe || h.district)}</span>
<span class="sp-off-label">จังหวัด</span> <span class="sp-off-dot sp-off-flex1">${dot(h.province)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">ชื่อผู้ใหญ่บ้าน</span> <span class="sp-off-dot sp-off-flex1">${dot(h.villageHead)}</span>
<span class="sp-off-label">ชื่อกำนัน</span> <span class="sp-off-dot sp-off-flex1">${dot(h.kamnan)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">ชื่อบิดา</span> <span class="sp-off-dot sp-off-flex1">${dot(h.fatherName)}</span>
<span class="sp-off-label">ชื่อมารดา</span> <span class="sp-off-dot sp-off-flex1">${dot(h.motherName)}</span></div>
<div class="sp-off-row"><span class="sp-off-label">เกี่ยวข้องเป็นอะไรกับคู่กรณี</span> <span class="sp-off-dot sp-off-flex1">${dot(h.relationshipNote)}</span></div>
<p><strong>ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า</strong></p>
<div class="sp-off-qa">
${qaHtml}
</div>
<div class="sp-off-sign">
<div><div>ลงชื่อผู้ให้การ</div><div class="sp-off-sign-line"></div><div>(${esc(h.partyName || "………………")})</div></div>
<div><div>ลงชื่อพนักงานสอบสวน</div><div class="sp-off-sign-line"></div><div>(${esc(h.investigator || "………………")})</div></div>
</div>
</div>
</div>
</div>`;
}

export function wrapOfficialStatementPrintHtml(opts: {
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<title>${esc(opts.title)}</title>
<style>
@page { size: A4; margin: 8mm 10mm; }
body { margin: 0; background: #fff; }
${OFFICIAL_STATEMENT_FORM_CSS}
</style>
</head>
<body>
${opts.bodyHtml}
<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body>
</html>`;
}

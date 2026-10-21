import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates/statement-types";
import { smartPoliceUploadDir, smartPoliceWordPublicUrl } from "@/lib/smart-police/word-file";

/** แม่แบบราชการติดแท็ก {{...}} — สร้างด้วย scripts/build-statement-docx-template.mjs */
export const STATEMENT_COMPLAINANT_TAGGED_TEMPLATE = path.join(
  process.cwd(),
  "public/smart-police/templates/statement-complainant.tagged.docx",
);

export type StatementDocxFillData = StatementHeaderFields & {
  statementBody: string;
  pageNo: string;
};

export function buildStatementDocxFillData(
  header: StatementHeaderFields,
  pages: StatementPage[],
): StatementDocxFillData {
  const body = pages
    .map((p, i) => {
      const t = (p.text ?? "").trim();
      if (!t) return "";
      if (pages.length <= 1) return t;
      return i === 0 ? t : `\n\n—— แผ่น ${i + 1} ——\n${t}`;
    })
    .filter(Boolean)
    .join("\n");

  return {
    ...header,
    amphoe: header.amphoe || header.district,
    relationshipNote: header.relationshipNote || "",
    statementBody: body,
    pageNo: String(Math.max(1, pages.length)),
  };
}

export async function renderOfficialStatementDocx(
  data: StatementDocxFillData,
  templatePath = STATEMENT_COMPLAINANT_TAGGED_TEMPLATE,
): Promise<Buffer> {
  const templateBuf = await readFile(templatePath);
  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.render({
    stationName: data.stationName ?? "",
    district: data.district ?? "",
    province: data.province ?? "",
    dayThai: data.dayThai ?? "",
    monthThai: data.monthThai ?? "",
    yearThai: data.yearThai ?? "",
    complainantLine: data.complainantLine ?? "",
    suspectLine: data.suspectLine ?? "",
    investigator: data.investigator ?? "",
    interviewPlace: data.interviewPlace ?? "",
    partyName: data.partyName ?? "",
    partyAge: data.partyAge ?? "",
    ethnicity: data.ethnicity ?? "",
    partyNationality: data.partyNationality ?? "",
    religion: data.religion ?? "",
    partyOccupation: data.partyOccupation ?? "",
    houseNo: data.houseNo ?? "",
    moo: data.moo ?? "",
    tambon: data.tambon ?? "",
    amphoe: data.amphoe ?? "",
    villageHead: data.villageHead ?? "",
    kamnan: data.kamnan ?? "",
    fatherName: data.fatherName ?? "",
    motherName: data.motherName ?? "",
    relationshipNote: data.relationshipNote ?? "",
    partyPhone: data.partyPhone ?? "",
    partyIdCard: data.partyIdCard ?? "",
    idIssuedOn: data.idIssuedOn ?? "",
    idExpiresOn: data.idExpiresOn ?? "",
    idIssuedAt: data.idIssuedAt ?? "",
    partyRoleLabel: data.partyRoleLabel ?? "",
    statementBody: data.statementBody ?? "",
    pageNo: data.pageNo ?? "1",
  });
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
}

/** เติมแม่แบบราชการจริง → บันทึกใต้ /uploads/smart-police/ */
export async function generateOfficialStatementDocxFile(opts: {
  ownerUserId: string;
  caseId: string;
  documentId: string;
  header: StatementHeaderFields;
  pages: StatementPage[];
}): Promise<{ wordFileUrl: string; wordFileName: string }> {
  const data = buildStatementDocxFillData(opts.header, opts.pages);
  const buf = await renderOfficialStatementDocx(data);
  const dir = smartPoliceUploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${opts.ownerUserId.slice(0, 8)}-stmt-${opts.caseId.slice(0, 8)}-${opts.documentId.slice(0, 8)}-${Date.now()}.docx`;
  await writeFile(path.join(dir, filename), buf);
  return {
    wordFileUrl: smartPoliceWordPublicUrl(filename),
    wordFileName: `คำให้การ-${opts.header.partyName || opts.documentId.slice(0, 8)}.docx`,
  };
}

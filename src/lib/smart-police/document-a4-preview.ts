import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";
import {
  isStatementDocumentV2,
  parseStatementDocumentContent,
  statementDocumentToPlainText,
  statementFormDocumentCss,
  type StatementDocumentContent,
  type StatementDocumentContentV1,
} from "@/lib/smart-police/form-templates";
import {
  applySmartPoliceTemplate,
  buildSmartPolicePrintDocumentHtml,
  buildSmartPolicePrintVars,
} from "@/lib/smart-police/print";
import {
  buildOfficialStatementFormText,
  statementTitleForRole,
  type StatementFormContext,
  type StatementFormParty,
} from "@/lib/smart-police/statement-form";
import type {
  SmartPoliceCaseDetail,
  SmartPoliceDocumentDto,
  SmartPolicePartyDto,
  SmartPoliceProfileDto,
} from "@/lib/smart-police/types";
import { SMART_POLICE_DOCUMENT_KIND_LABEL, SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";

export type SmartPoliceA4MetaRow = { label: string; value: string };

export type SmartPoliceA4StatementItem = { no: number; text: string };

export type SmartPoliceA4QaItem = { no: number; question: string; answer: string };

export type SmartPoliceA4StatementPage = {
  pageNo: number;
  pageTotal: number;
  qa: SmartPoliceA4QaItem[];
};

export type SmartPoliceA4SignatureBlock = {
  caption: string;
  nameLine: string;
};

export type SmartPoliceA4PreviewModel = {
  caseId: string;
  documentId: string;
  kind: SmartPoliceDocumentKind;
  isStatementForm: boolean;
  /** คำให้การแบบ JSON หลายหน้า + ถาม/ตอบ */
  isStatementJson: boolean;
  docRef: string;
  documentTitle: string;
  subtitle: string;
  stationName: string;
  stationAddress: string | null;
  province: string | null;
  commanderLine: string | null;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  kindLabel: string;
  metaRows: SmartPoliceA4MetaRow[];
  preamble: string[];
  statementItems: SmartPoliceA4StatementItem[];
  statementPages: SmartPoliceA4StatementPage[];
  bodyParagraphs: string[];
  signatures: SmartPoliceA4SignatureBlock[];
  dateLine: string | null;
  footer: string | null;
  wordFileUrl: string | null;
  wordFileName: string | null;
  editHref: string | null;
  /** v2 แบบฟอร์ม Word HTML */
  formBodyHtml: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dottedValue(value: string | null | undefined, fallback = "…………………………………………"): string {
  const t = (value ?? "").trim();
  if (!t || /^[.\s…]+$/.test(t)) return fallback;
  return t;
}

function formatThaiDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function docRef(caseNumber: string, documentId: string): string {
  const tail = documentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SP-${caseNumber}-${tail}`;
}

function parseStatementItems(content: string): SmartPoliceA4StatementItem[] {
  const items: SmartPoliceA4StatementItem[] = [];
  for (let n = 1; n <= 3; n++) {
    const re = new RegExp(`^ข้อ\\s*${n}\\.\\s*(.*)$`, "m");
    const m = content.match(re);
    items.push({ no: n, text: m?.[1]?.trim() || "" });
  }
  return items;
}

function parseStatementSignatures(content: string): SmartPoliceA4SignatureBlock[] {
  const blocks: SmartPoliceA4SignatureBlock[] = [];
  const signer = content.match(/ลงชื่อผู้ให้การ[\s\S]*?\n\((.+?)\)/);
  if (signer) {
    blocks.push({ caption: "ลงชื่อผู้ให้การ", nameLine: signer[1].trim() });
  }
  const officer = content.match(/ลงชื่อพนักงานสอบสวน[\s\S]*?\n\((.+?)\)/);
  if (officer) {
    blocks.push({ caption: "ลงชื่อพนักงานสอบสวน", nameLine: officer[1].trim() });
  }
  return blocks;
}

function parseDateLine(content: string): string | null {
  const m = content.match(/^วันที่\s+(.+)$/m);
  return m?.[1]?.trim() ?? null;
}

function partyToStatementParty(p: SmartPolicePartyDto): StatementFormParty {
  return {
    fullName: p.fullName,
    role: p.role,
    age: p.age,
    nationality: p.nationality,
    idCard: p.idCard,
    address: p.address,
    phone: p.phone,
  };
}

export function buildSmartPoliceA4PreviewModel(opts: {
  profile: SmartPoliceProfileDto;
  caseDetail: SmartPoliceCaseDetail;
  document: SmartPoliceDocumentDto;
  party: SmartPolicePartyDto | null;
  bodyText: string;
}): SmartPoliceA4PreviewModel {
  const { profile, caseDetail, document, party, bodyText } = opts;
  const isStatementForm = document.kind === "STATEMENT";
  const commanderLine =
    profile.commanderRank && profile.commanderName
      ? `${profile.commanderRank} ${profile.commanderName}`
      : null;

  const subtitle = `เลขที่คดี ${caseDetail.caseNumber} · ${caseDetail.caseType}`;
  const kindLabel = SMART_POLICE_DOCUMENT_KIND_LABEL[document.kind];

  if (!isStatementForm) {
    const paragraphs = bodyText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return {
      caseId: caseDetail.id,
      documentId: document.id,
      kind: document.kind,
      isStatementForm: false,
      isStatementJson: false,
      docRef: docRef(caseDetail.caseNumber, document.id),
      documentTitle: document.title,
      subtitle,
      stationName: profile.stationName,
      stationAddress: profile.stationAddress,
      province: profile.province,
      commanderLine,
      caseNumber: caseDetail.caseNumber,
      caseTitle: caseDetail.title,
      caseType: caseDetail.caseType,
      kindLabel,
      metaRows: [
        { label: "เรื่อง", value: caseDetail.title },
        { label: "ประเภทเอกสาร", value: kindLabel },
      ],
      preamble: [],
      statementItems: [],
      statementPages: [],
      bodyParagraphs: paragraphs,
      signatures: [],
      dateLine: formatThaiDate(new Date()),
      footer: profile.printFooter,
      wordFileUrl: document.wordFileUrl,
      wordFileName: document.wordFileName,
      editHref: null,
      formBodyHtml: null,
    };
  }

  const role = party?.role;
  const title =
    role != null
      ? statementTitleForRole(role)
      : document.title.split("—")[0]?.trim() || document.title;

  const vars = buildSmartPolicePrintVars(profile, caseDetail);
  const todayThai = vars.todayThai || formatThaiDate(new Date());

  const metaRows: SmartPoliceA4MetaRow[] = party
    ? [
        { label: "ชื่อ-สกุล", value: dottedValue(party.fullName, party.fullName) },
        {
          label: "บทบาท",
          value: SMART_POLICE_PARTY_ROLE_LABEL[party.role],
        },
        {
          label: "อายุ",
          value: party.age != null ? `${party.age} ปี` : dottedValue(null, "………… ปี"),
        },
        {
          label: "สัญชาติ",
          value: dottedValue(party.nationality),
        },
        {
          label: "เลขบัตรประชาชน",
          value: dottedValue(party.idCard),
        },
        {
          label: "ที่อยู่",
          value: dottedValue(party.address),
        },
        {
          label: "โทรศัพท์",
          value: dottedValue(party.phone, "—"),
        },
        { label: "พนักงานสอบสวน", value: dottedValue(profile.investigatorDefault) },
      ]
    : [
        { label: "เรื่อง", value: caseDetail.title },
        { label: "พนักงานสอบสวน", value: dottedValue(profile.investigatorDefault) },
      ];

  const preamble = [
    "ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า",
    "**********************************************************************",
    "กรุณากรอกรายละเอียดในช่องว่าง · ข้อ 1–3 เป็นความจริงตามที่ทราบ",
  ];

  let signatures = parseStatementSignatures(bodyText);
  if (signatures.length === 0 && party) {
    signatures = [
      { caption: "ลงชื่อผู้ให้การ", nameLine: party.fullName },
      {
        caption: "ลงชื่อพนักงานสอบสวน",
        nameLine: profile.investigatorDefault?.trim() || "……………………………………",
      },
    ];
  }

  return {
    caseId: caseDetail.id,
    documentId: document.id,
    kind: document.kind,
    isStatementForm: true,
    isStatementJson: false,
    docRef: docRef(caseDetail.caseNumber, document.id),
    documentTitle: title,
    subtitle,
    stationName: profile.stationName,
    stationAddress: profile.stationAddress,
    province: profile.province,
    commanderLine,
    caseNumber: caseDetail.caseNumber,
    caseTitle: caseDetail.title,
    caseType: caseDetail.caseType,
    kindLabel,
    metaRows,
    preamble,
    statementItems: parseStatementItems(bodyText),
    statementPages: [],
    bodyParagraphs: [
      "ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ",
    ],
    signatures,
    dateLine: parseDateLine(bodyText) ?? todayThai,
    footer: profile.printFooter,
    wordFileUrl: document.wordFileUrl,
    wordFileName: document.wordFileName,
    editHref: `/dashboard/smart-police/cases/${caseDetail.id}/documents/${document.id}/edit`,
    formBodyHtml: null,
  };
}

function buildModelFromStatementJson(opts: {
  profile: SmartPoliceProfileDto;
  caseDetail: SmartPoliceCaseDetail;
  document: SmartPoliceDocumentDto;
  party: SmartPolicePartyDto | null;
  json: StatementDocumentContentV1;
}): SmartPoliceA4PreviewModel {
  const { profile, caseDetail, document, party, json } = opts;
  const h = json.header;
  const commanderLine = h.commanderLine || null;
  const title =
    party != null
      ? statementTitleForRole(party.role)
      : document.title.split("—")[0]?.trim() || document.title;

  let qNo = 1;
  const statementPages: SmartPoliceA4StatementPage[] = json.pages.map((page, idx) => {
    const qa = page.qa.map((item) => {
      const row = {
        no: qNo,
        question: item.question.trim(),
        answer: item.answer.trim(),
      };
      qNo += 1;
      return row;
    });
    return {
      pageNo: idx + 1,
      pageTotal: json.pages.length,
      qa,
    };
  });

  const metaRows: SmartPoliceA4MetaRow[] = [
    { label: "ชื่อ-สกุล", value: dottedValue(h.partyName, h.partyName || "…………") },
    { label: "บทบาท", value: h.partyRoleLabel || "—" },
    { label: "อายุ", value: h.partyAge ? `${h.partyAge} ปี` : dottedValue(null, "………… ปี") },
    { label: "สัญชาติ", value: dottedValue(h.partyNationality) },
    { label: "เลขบัตรประชาชน", value: dottedValue(h.partyIdCard) },
    { label: "ที่อยู่", value: dottedValue(h.partyAddress) },
    { label: "โทรศัพท์", value: dottedValue(h.partyPhone, "—") },
    { label: "ข้อหา", value: dottedValue(h.chargeText, "—") },
    { label: "พนักงานสอบสวน", value: dottedValue(h.investigator) },
  ];

  return {
    caseId: caseDetail.id,
    documentId: document.id,
    kind: document.kind,
    isStatementForm: true,
    isStatementJson: true,
    docRef: docRef(h.caseNumber || caseDetail.caseNumber, document.id),
    documentTitle: title,
    subtitle: `เลขที่คดี ${h.caseNumber || caseDetail.caseNumber} · ${h.caseType || caseDetail.caseType}`,
    stationName: h.stationName || profile.stationName,
    stationAddress: h.stationAddress || profile.stationAddress,
    province: h.province || profile.province,
    commanderLine,
    caseNumber: h.caseNumber || caseDetail.caseNumber,
    caseTitle: h.caseTitle || caseDetail.title,
    caseType: h.caseType || caseDetail.caseType,
    kindLabel: SMART_POLICE_DOCUMENT_KIND_LABEL.STATEMENT,
    metaRows,
    preamble: ["ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า"],
    statementItems: [],
    statementPages,
    bodyParagraphs: ["ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ"],
    signatures: [
      { caption: "ลงชื่อผู้ให้การ", nameLine: h.partyName || "……………………………………" },
      {
        caption: "ลงชื่อพนักงานสอบสวน",
        nameLine: h.investigator.trim() || "……………………………………",
      },
    ],
    dateLine: h.todayThai || formatThaiDate(new Date()),
    footer: profile.printFooter,
    wordFileUrl: document.wordFileUrl,
    wordFileName: document.wordFileName,
    editHref: `/dashboard/smart-police/cases/${caseDetail.id}/documents/${document.id}/edit`,
    formBodyHtml: null,
  };
}

function buildModelFromStatementFormHtml(opts: {
  profile: SmartPoliceProfileDto;
  caseDetail: SmartPoliceCaseDetail;
  document: SmartPoliceDocumentDto;
  party: SmartPolicePartyDto | null;
  json: Extract<StatementDocumentContent, { version: 2 }>;
}): SmartPoliceA4PreviewModel {
  const { profile, caseDetail, document, party, json } = opts;
  const h = json.header;
  const title =
    party != null
      ? statementTitleForRole(party.role)
      : document.title.split("—")[0]?.trim() || document.title;

  return {
    caseId: caseDetail.id,
    documentId: document.id,
    kind: document.kind,
    isStatementForm: true,
    isStatementJson: true,
    docRef: docRef(h.caseNumber || caseDetail.caseNumber, document.id),
    documentTitle: title,
    subtitle: `เลขที่คดี ${h.caseNumber || caseDetail.caseNumber} · ${h.caseType || caseDetail.caseType}`,
    stationName: h.stationName || profile.stationName,
    stationAddress: h.stationAddress || profile.stationAddress,
    province: h.province || profile.province,
    commanderLine: h.commanderLine || null,
    caseNumber: h.caseNumber || caseDetail.caseNumber,
    caseTitle: h.caseTitle || caseDetail.title,
    caseType: h.caseType || caseDetail.caseType,
    kindLabel: SMART_POLICE_DOCUMENT_KIND_LABEL.STATEMENT,
    metaRows: [
      { label: "ชื่อ-สกุล", value: dottedValue(h.partyName) },
      { label: "บทบาท", value: h.partyRoleLabel || "—" },
      { label: "ข้อหา", value: dottedValue(h.chargeText, "—") },
      { label: "พนักงานสอบสวน", value: dottedValue(h.investigator) },
    ],
    preamble: [],
    statementItems: [],
    statementPages: [],
    bodyParagraphs: [],
    signatures: [],
    dateLine: h.todayThai || formatThaiDate(new Date()),
    footer: profile.printFooter,
    wordFileUrl: document.wordFileUrl,
    wordFileName: document.wordFileName,
    editHref: `/dashboard/smart-police/cases/${caseDetail.id}/documents/${document.id}/edit`,
    formBodyHtml: json.bodyHtml,
  };
}

export function buildSmartPoliceA4PreviewFromCase(opts: {
  profile: SmartPoliceProfileDto;
  caseDetail: SmartPoliceCaseDetail;
  document: SmartPoliceDocumentDto;
}): { model: SmartPoliceA4PreviewModel; bodyText: string; printHtml: string } {
  const party = opts.document.partyId
    ? opts.caseDetail.parties.find((p) => p.id === opts.document.partyId) ?? null
    : null;

  const vars = buildSmartPolicePrintVars(opts.profile, opts.caseDetail);
  const json = parseStatementDocumentContent(opts.document.content);

  if (opts.document.kind === "STATEMENT" && json) {
    if (isStatementDocumentV2(json)) {
      const model = buildModelFromStatementFormHtml({
        profile: opts.profile,
        caseDetail: opts.caseDetail,
        document: opts.document,
        party,
        json,
      });
      const bodyText = statementDocumentToPlainText(json);
      return {
        model,
        bodyText,
        printHtml: buildSmartPoliceFormHtmlPrintHtml(model),
      };
    }
    const model = buildModelFromStatementJson({
      profile: opts.profile,
      caseDetail: opts.caseDetail,
      document: opts.document,
      party,
      json,
    });
    const bodyText = statementDocumentToPlainText(json);
    return {
      model,
      bodyText,
      printHtml: buildSmartPoliceStatementA4PrintHtml(model, bodyText),
    };
  }

  let bodyText = applySmartPoliceTemplate(opts.document.content, vars);

  if (opts.document.kind === "STATEMENT" && party) {
    const ctx: StatementFormContext = {
      caseNumber: opts.caseDetail.caseNumber,
      caseTitle: opts.caseDetail.title,
      stationName: opts.profile.stationName,
      investigator: opts.profile.investigatorDefault ?? "",
      todayThai: vars.todayThai || formatThaiDate(new Date()),
      party: partyToStatementParty(party),
    };
    bodyText = buildOfficialStatementFormText(ctx);
  }

  const model = buildSmartPoliceA4PreviewModel({
    profile: opts.profile,
    caseDetail: opts.caseDetail,
    document: opts.document,
    party,
    bodyText,
  });

  const printHtml = model.isStatementForm
    ? buildSmartPoliceStatementA4PrintHtml(model, bodyText)
    : buildSmartPolicePrintDocumentHtml({
        profile: opts.profile,
        caseDetail: opts.caseDetail,
        documentTitle: opts.document.title,
        documentKindLabel: model.kindLabel,
        bodyText,
      });

  return { model, bodyText, printHtml };
}

export const SMART_POLICE_A4_PRINT_CSS = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "TH Sarabun New", "Sarabun", "Tahoma", sans-serif;
    font-size: 16pt;
    line-height: 1.4;
    color: #111;
    margin: 0;
    background: #fff;
  }
  .spa4 { max-width: 210mm; margin: 0 auto; }
  .spa4-head { display: grid; grid-template-columns: 72px 1fr 140px; gap: 12px; align-items: start; margin-bottom: 10px; }
  .spa4-logo {
    width: 64px; height: 64px; border-radius: 9999px;
    border: 2px dashed #94a3b8; display: flex; align-items: center; justify-content: center;
    font-size: 11pt; color: #64748b; text-align: center;
  }
  .spa4-station { text-align: center; }
  .spa4-station h1 { font-size: 18pt; font-weight: 700; margin: 0 0 4px; }
  .spa4-station p { margin: 0; font-size: 13pt; color: #334155; }
  .spa4-ref { text-align: right; font-size: 12pt; color: #475569; }
  .spa4-title { text-align: center; margin: 14px 0 6px; }
  .spa4-title h2 { font-size: 22pt; font-weight: 700; margin: 0; letter-spacing: 0.02em; }
  .spa4-title p { margin: 4px 0 0; font-size: 14pt; color: #334155; }
  .spa4-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin: 16px 0; font-size: 15pt; }
  .spa4-meta .row { display: flex; flex-direction: column; gap: 2px; }
  .spa4-meta .lbl { font-weight: 600; color: #1e293b; }
  .spa4-meta .val {
    border-bottom: 1px dotted #64748b;
    min-height: 1.35em;
    padding-bottom: 2px;
  }
  .spa4-rule { border: none; border-top: 1px solid #cbd5e1; margin: 12px 0; }
  .spa4-preamble { font-size: 13pt; color: #475569; text-align: center; margin: 8px 0 12px; }
  .spa4-items { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 15pt; }
  .spa4-items th, .spa4-items td { border: 1px solid #334155; padding: 6px 8px; vertical-align: top; }
  .spa4-items th { background: #e0f2fe; font-weight: 700; text-align: center; }
  .spa4-items .no { width: 48px; text-align: center; font-weight: 600; }
  .spa4-items .body { min-height: 2.2em; }
  .spa4-body p { margin: 0 0 8px; text-align: justify; white-space: pre-wrap; }
  .spa4-sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; font-size: 15pt; }
  .spa4-sig .line { border-bottom: 1px dotted #64748b; min-height: 1.4em; margin: 8px 0 4px; }
  .spa4-sig .name { text-align: center; }
  .spa4-date { margin-top: 20px; text-align: center; font-size: 15pt; }
  .spa4-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 12pt; color: #64748b; text-align: center; }
  .spa4-qa { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 15pt; }
  .spa4-qa th, .spa4-qa td { border: 1px solid #334155; padding: 6px 8px; vertical-align: top; }
  .spa4-qa th { background: #e0f2fe; font-weight: 700; text-align: left; }
  .spa4-qa .q { background: #f0f9ff; font-weight: 600; }
  .spa4-qa .a { min-height: 2.2em; white-space: pre-wrap; }
  .spa4-page-label { text-align: center; font-size: 12pt; color: #475569; margin: 4px 0 10px; }
  .spa4-break { page-break-before: always; break-before: page; }
`;

function metaRowsHtml(rows: SmartPoliceA4MetaRow[]): string {
  return rows
    .map(
      (r) =>
        `<div class="row"><span class="lbl">${escapeHtml(r.label)}</span><span class="val">${escapeHtml(r.value)}</span></div>`,
    )
    .join("");
}

function statementItemsHtml(items: SmartPoliceA4StatementItem[]): string {
  const rows = items
    .map((it) => {
      const text = it.text.trim();
      const display = text && !/^[.\s…]+$/.test(text) ? text : "…………………………………………………………………………………………………………";
      return `<tr><td class="no">${it.no}</td><td class="body">${escapeHtml(display)}</td></tr>`;
    })
    .join("");
  return `<table class="spa4-items"><thead><tr><th>ข้อ</th><th>รายละเอียดคำให้การ</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function statementQaPagesHtml(pages: SmartPoliceA4StatementPage[]): string {
  if (pages.length === 0) return "";
  return pages
    .map((page, idx) => {
      const rows = page.qa
        .map((qa) => {
          const q = qa.question || "…………………………………………";
          const a = qa.answer || "…………………………………………………………………………………………………………";
          return `<tr><td class="q">ถาม ${qa.no}. ${escapeHtml(q)}</td></tr>
<tr><td class="a">ตอบ ${escapeHtml(a)}</td></tr>`;
        })
        .join("");
      const pageLabel =
        page.pageTotal > 1
          ? `<div class="spa4-page-label">หน้า ${page.pageNo} / ${page.pageTotal}</div>`
          : "";
      const breakClass = idx > 0 ? " spa4-break" : "";
      return `<div class="spa4-qa-page${breakClass}">${pageLabel}<table class="spa4-qa"><tbody>${rows}</tbody></table></div>`;
    })
    .join("");
}

function statementSheetInnerHtml(model: SmartPoliceA4PreviewModel): string {
  const addr = [model.stationAddress, model.province].filter(Boolean).join(" ");
  const preamble = model.preamble.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const body = model.bodyParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const sigs = model.signatures
    .map(
      (s) =>
        `<div class="spa4-sig"><div>${escapeHtml(s.caption)}</div><div class="line"></div><div class="name">(${escapeHtml(s.nameLine)})</div></div>`,
    )
    .join("");
  const sigGrid =
    model.signatures.length > 0
      ? `<div class="spa4-sigs">${sigs}</div>`
      : `<div class="spa4-sigs">
          <div class="spa4-sig"><div>ลงชื่อผู้ให้การ</div><div class="line"></div><div class="name">(……………………………………)</div></div>
          <div class="spa4-sig"><div>ลงชื่อพนักงานสอบสวน</div><div class="line"></div><div class="name">(……………………………………)</div></div>
        </div>`;

  const qaOrItems =
    model.isStatementJson && model.statementPages.length > 0
      ? statementQaPagesHtml(model.statementPages)
      : statementItemsHtml(model.statementItems);

  return `
  <div class="spa4-head">
    <div class="spa4-logo">โลโก้</div>
    <div class="spa4-station">
      <h1>${escapeHtml(model.stationName)}</h1>
      ${addr ? `<p>${escapeHtml(addr)}</p>` : ""}
      ${model.commanderLine ? `<p>${escapeHtml(model.commanderLine)}</p>` : ""}
    </div>
    <div class="spa4-ref">เลขที่<br/><strong>${escapeHtml(model.docRef)}</strong></div>
  </div>
  <div class="spa4-title">
    <h2>${escapeHtml(model.documentTitle)}</h2>
    <p>${escapeHtml(model.subtitle)}</p>
    <p>เรื่อง ${escapeHtml(model.caseTitle)}</p>
  </div>
  <div class="spa4-meta">${metaRowsHtml(model.metaRows)}</div>
  <hr class="spa4-rule"/>
  <div class="spa4-preamble">${preamble}</div>
  ${qaOrItems}
  <div class="spa4-body">${body}</div>
  ${sigGrid}
  ${model.dateLine ? `<div class="spa4-date">วันที่ ${escapeHtml(model.dateLine)}</div>` : ""}
  ${model.footer ? `<div class="spa4-footer">${escapeHtml(model.footer)}</div>` : ""}`;
}

export function buildSmartPoliceStatementA4PrintHtml(
  model: SmartPoliceA4PreviewModel,
  _bodyText: string,
): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(model.documentTitle)} — ${escapeHtml(model.caseNumber)}</title>
<style>${SMART_POLICE_A4_PRINT_CSS}</style>
</head>
<body>
<div class="spa4">
${statementSheetInnerHtml(model)}
</div>
<script>
window.addEventListener("load", function () {
  setTimeout(function () { window.focus(); window.print(); }, 200);
});
</script>
</body>
</html>`;
}

/** พิมพ์แบบฟอร์ม Word HTML (v2) — ให้ลงลายเซ็นเก็บในสำนวน */
export function buildSmartPoliceFormHtmlPrintHtml(model: SmartPoliceA4PreviewModel): string {
  const body = model.formBodyHtml || "<p>—</p>";
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(model.documentTitle)} — ${escapeHtml(model.caseNumber)}</title>
<style>
@page { size: A4; margin: 12mm 10mm; }
${statementFormDocumentCss()}
body { margin: 0; background: #fff; }
.sheet { max-width: 210mm; margin: 0 auto; }
</style>
</head>
<body>
<div class="sheet">${body}</div>
<script>
window.addEventListener("load", function () {
  setTimeout(function () { window.focus(); window.print(); }, 200);
});
</script>
</body>
</html>`;
}

export function buildSmartPoliceGenericA4BodyHtml(model: SmartPoliceA4PreviewModel): string {
  const paras = model.bodyParagraphs.map((p) => `<p class="spa4-line">${escapeHtml(p)}</p>`).join("");
  return `<div class="spa4-body">${paras}</div>`;
}

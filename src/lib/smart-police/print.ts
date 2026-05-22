import type { SmartPoliceProfileDto, SmartPoliceCaseDetail } from "@/lib/smart-police/types";
import {
  SMART_POLICE_CASE_STATUS_LABEL,
  SMART_POLICE_DOCUMENT_KIND_LABEL,
  SMART_POLICE_PARTY_ROLE_LABEL,
} from "@/lib/smart-police/types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatThaiDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatThaiDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type SmartPolicePrintVars = Record<string, string>;

export function buildSmartPolicePrintVars(
  profile: SmartPoliceProfileDto,
  caseDetail: SmartPoliceCaseDetail,
  extra: SmartPolicePrintVars = {},
): SmartPolicePrintVars {
  const today = new Date();
  const partiesList = caseDetail.parties
    .map(
      (p, i) =>
        `${i + 1}. ${SMART_POLICE_PARTY_ROLE_LABEL[p.role]} — ${p.fullName}${p.idCard ? ` (เลขบัตร ${p.idCard})` : ""}`,
    )
    .join("\n");
  const firstParty = caseDetail.parties[0];
  return {
    caseNumber: caseDetail.caseNumber,
    caseTitle: caseDetail.title,
    caseType: caseDetail.caseType,
    caseStatus: SMART_POLICE_CASE_STATUS_LABEL[caseDetail.status],
    stationName: profile.stationName,
    stationAddress: profile.stationAddress ?? "",
    province: profile.province ?? "",
    commanderRank: profile.commanderRank ?? "",
    commanderName: profile.commanderName ?? "",
    investigator: profile.investigatorDefault ?? "",
    incidentAt: formatThaiDateTime(caseDetail.incidentAt),
    incidentPlace: caseDetail.incidentPlace ?? "—",
    summary: caseDetail.summary ?? "",
    partiesList: partiesList || "—",
    partyName: firstParty?.fullName ?? "",
    partyAge: firstParty?.age != null ? String(firstParty.age) : "",
    partyNationality: firstParty?.nationality ?? "",
    partyAddress: firstParty?.address ?? "",
    partyIdCard: firstParty?.idCard ?? "",
    documentCount: String(caseDetail.documents.length),
    partyCount: String(caseDetail.parties.length),
    todayThai: formatThaiDate(today),
    printFooter: profile.printFooter ?? "",
    ...extra,
  };
}

export function applySmartPoliceTemplate(content: string, vars: SmartPolicePrintVars): string {
  let out = content;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, "");
}

function contentToHtmlParagraphs(text: string): string {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      const t = line.trim();
      if (!t) return "<p class=\"sp-gap\">&nbsp;</p>";
      return `<p class="sp-line">${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

export function buildSmartPolicePrintDocumentHtml(opts: {
  profile: SmartPoliceProfileDto;
  caseDetail: SmartPoliceCaseDetail;
  documentTitle: string;
  documentKindLabel: string;
  bodyText: string;
}): string {
  const { profile, caseDetail, documentTitle, documentKindLabel, bodyText } = opts;
  const headerRight = [
    profile.commanderRank && profile.commanderName
      ? `${profile.commanderRank} ${profile.commanderName}`
      : null,
    profile.stationAddress,
    profile.province,
  ]
    .filter(Boolean)
    .join("<br/>");

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(documentTitle)} — ${escapeHtml(caseDetail.caseNumber)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body {
    font-family: "TH Sarabun New", "Sarabun", "Tahoma", sans-serif;
    font-size: 16pt;
    line-height: 1.45;
    color: #111;
    margin: 0;
  }
  .sp-header { text-align: center; margin-bottom: 1.2rem; }
  .sp-header h1 { font-size: 18pt; font-weight: 700; margin: 0 0 0.25rem; }
  .sp-meta { font-size: 14pt; color: #333; margin-bottom: 1rem; }
  .sp-meta-row { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .sp-body { text-align: justify; }
  .sp-line { margin: 0 0 0.15rem; white-space: pre-wrap; }
  .sp-gap { margin: 0.4rem 0; height: 0.5rem; }
  .sp-footer { margin-top: 2rem; font-size: 13pt; color: #444; text-align: center; border-top: 1px solid #ccc; padding-top: 0.75rem; }
  @media print {
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="sp-header">
    <h1>${escapeHtml(profile.stationName)}</h1>
    ${headerRight ? `<div class="sp-meta">${headerRight}</div>` : ""}
  </div>
  <div class="sp-meta">
    <div class="sp-meta-row">
      <span><strong>เลขที่คดี</strong> ${escapeHtml(caseDetail.caseNumber)}</span>
      <span><strong>ประเภทเอกสาร</strong> ${escapeHtml(documentKindLabel)}</span>
    </div>
    <div><strong>เรื่อง</strong> ${escapeHtml(caseDetail.title)} · ${escapeHtml(documentTitle)}</div>
    <div><strong>วันที่พิมพ์</strong> ${escapeHtml(formatThaiDateTime(new Date()))}</div>
  </div>
  <div class="sp-body">
    ${contentToHtmlParagraphs(bodyText)}
  </div>
  ${profile.printFooter ? `<div class="sp-footer">${escapeHtml(profile.printFooter)}</div>` : ""}
</body>
</html>`;
}

import { prisma } from "@/lib/prisma";
import { SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";

export const NARRATIVE_LINKS_SECTION_START = "【ทะเบียนเอกสารคำให้การ — เปิดด้วย Microsoft Word】";
export const NARRATIVE_LINKS_SECTION_END = "【จบทะเบียนเอกสารคำให้การ】";

function stripExistingLinksSection(content: string): string {
  const start = content.indexOf(NARRATIVE_LINKS_SECTION_START);
  if (start < 0) return content.trimEnd();
  const end = content.indexOf(NARRATIVE_LINKS_SECTION_END, start);
  if (end < 0) return content.slice(0, start).trimEnd();
  return (content.slice(0, start) + content.slice(end + NARRATIVE_LINKS_SECTION_END.length)).trimEnd();
}

function buildLinksBlock(
  statements: {
    title: string;
    wordFileUrl: string | null;
    wordFileName: string | null;
    partyName: string | null;
    partyRole: string | null;
  }[],
  appOrigin: string,
): string {
  if (statements.length === 0) return "";
  const lines = statements.map((s, i) => {
    const who = s.partyName
      ? `${s.partyName}${s.partyRole ? ` (${s.partyRole})` : ""}`
      : s.title;
    const fileLabel = s.wordFileName ?? "ไฟล์ Word";
    const url = s.wordFileUrl ? `${appOrigin}${s.wordFileUrl}` : "";
    const link = url ? `${fileLabel}: ${url}` : fileLabel;
    return `${i + 1}. ${who} — ${link}`;
  });
  return `${NARRATIVE_LINKS_SECTION_START}\n${lines.join("\n")}\n${NARRATIVE_LINKS_SECTION_END}`;
}

/** อัปเดตสำนวนคดีให้มีรายการลิงก์เชื่อมโยงไปยังไฟล์ Word คำให้การ */
export async function syncStatementLinksIntoNarrative(
  caseId: string,
  appOrigin: string,
): Promise<{ narrativeId: string | null; updated: boolean }> {
  const statements = await prisma.smartPoliceDocument.findMany({
    where: { caseId, kind: "STATEMENT" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { party: true },
  });

  let narrative = await prisma.smartPoliceDocument.findFirst({
    where: { caseId, kind: "NARRATIVE" },
    orderBy: { sortOrder: "asc" },
  });
  if (!narrative) {
    narrative = await prisma.smartPoliceDocument.findFirst({
      where: { caseId, kind: "NARRATIVE" },
      orderBy: { createdAt: "asc" },
    });
  }

  const block = buildLinksBlock(
    statements.map((s) => ({
      title: s.title,
      wordFileUrl: s.wordFileUrl,
      wordFileName: s.wordFileName,
      partyName: s.party?.fullName ?? null,
      partyRole: s.party ? SMART_POLICE_PARTY_ROLE_LABEL[s.party.role] : null,
    })),
    appOrigin.replace(/\/$/, ""),
  );

  if (!narrative) {
    if (!block) return { narrativeId: null, updated: false };
    const created = await prisma.smartPoliceDocument.create({
      data: {
        caseId,
        kind: "NARRATIVE",
        title: "สำนวนคดี",
        content: `${block}\n`,
        sortOrder: 0,
      },
    });
    return { narrativeId: created.id, updated: true };
  }

  const base = stripExistingLinksSection(narrative.content);
  const next = block ? `${base}\n\n${block}\n` : base;
  if (next === narrative.content) return { narrativeId: narrative.id, updated: false };

  await prisma.smartPoliceDocument.update({
    where: { id: narrative.id },
    data: { content: next },
  });
  return { narrativeId: narrative.id, updated: true };
}

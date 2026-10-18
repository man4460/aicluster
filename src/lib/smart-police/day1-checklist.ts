import type { SmartPoliceCaseDetail } from "@/lib/smart-police/types";
import type { SmartPoliceDocumentKind, SmartPolicePartyRole } from "@/generated/prisma/enums";

export type Day1ChecklistItem = {
  key: string;
  label: string;
  kind: SmartPoliceDocumentKind;
  /** ถ้ามี — ต้องมีเอกสารชนิดนี้ผูก party */
  partyRole?: SmartPolicePartyRole;
  partyId?: string;
  done: boolean;
  documentId: string | null;
  generateKind?: "MEMO" | "STATEMENT_ALL" | "PROPERTY_LIST" | "INVESTIGATION_REPORT";
};

/** ชุดเอกสารที่ควรมีในวันรับคดีแรก (แนวสอบสวน.com — แบบ MAWELL) */
export function buildSmartPoliceDay1Checklist(c: SmartPoliceCaseDetail): Day1ChecklistItem[] {
  const items: Day1ChecklistItem[] = [];

  const memo = c.documents.find((d) => d.kind === "MEMO" && !d.partyId);
  items.push({
    key: "memo",
    label: "บันทึกพนักงานสอบสวน",
    kind: "MEMO",
    done: Boolean(memo),
    documentId: memo?.id ?? null,
    generateKind: "MEMO",
  });

  const complainants = c.parties.filter((p) => p.role === "COMPLAINANT");
  const suspects = c.parties.filter((p) => p.role === "SUSPECT");

  for (const p of complainants) {
    const doc = c.documents.find((d) => d.kind === "STATEMENT" && d.partyId === p.id);
    items.push({
      key: `statement-complainant-${p.id}`,
      label: `คำให้การผู้กล่าวหา — ${p.fullName}`,
      kind: "STATEMENT",
      partyRole: "COMPLAINANT",
      partyId: p.id,
      done: Boolean(doc),
      documentId: doc?.id ?? null,
      generateKind: "STATEMENT_ALL",
    });
  }

  for (const p of suspects) {
    const doc = c.documents.find((d) => d.kind === "STATEMENT" && d.partyId === p.id);
    items.push({
      key: `statement-suspect-${p.id}`,
      label: `คำให้การผู้ต้องหา — ${p.fullName}`,
      kind: "STATEMENT",
      partyRole: "SUSPECT",
      partyId: p.id,
      done: Boolean(doc),
      documentId: doc?.id ?? null,
      generateKind: "STATEMENT_ALL",
    });
  }

  if (!complainants.length && !suspects.length) {
    items.push({
      key: "statement-all",
      label: "คำให้การบุคคลในคดี",
      kind: "STATEMENT",
      done: c.documents.some((d) => d.kind === "STATEMENT"),
      documentId: c.documents.find((d) => d.kind === "STATEMENT")?.id ?? null,
      generateKind: "STATEMENT_ALL",
    });
  }

  const property = c.documents.find((d) => d.kind === "PROPERTY_LIST" && !d.partyId);
  items.push({
    key: "property",
    label: "บัญชีของกลาง",
    kind: "PROPERTY_LIST",
    done: Boolean(property),
    documentId: property?.id ?? null,
    generateKind: "PROPERTY_LIST",
  });

  return items;
}

export function day1ChecklistSummary(items: Day1ChecklistItem[]): {
  total: number;
  done: number;
  pending: number;
} {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { total, done, pending: total - done };
}

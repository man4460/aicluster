import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import {
  SMART_POLICE_BLANK_FORMS,
  smartPoliceBlankFormHref,
  type SmartPoliceBlankFormItem,
} from "@/lib/smart-police/blank-forms-catalog";

export type SmartPoliceFormFileKind = "pdf" | "docx" | "other";

export function findSmartPoliceBlankForm(formId: string): SmartPoliceBlankFormItem | null {
  return SMART_POLICE_BLANK_FORMS.find((f) => f.id === formId) ?? null;
}

export function smartPoliceFormFileKind(fileName: string): SmartPoliceFormFileKind {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  return "other";
}

/** path บนดิสก์ของไฟล์แบบฟอร์มใน public — กัน path traversal */
export function smartPoliceBlankFormDiskPath(fileName: string): string {
  const base = path.resolve(process.cwd(), "public", "smart-police", "forms");
  const resolved = path.resolve(base, path.basename(fileName));
  const rel = path.relative(base, resolved);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("ไฟล์แบบฟอร์มไม่ถูกต้อง");
  }
  return resolved;
}

export async function loadBlankFormPreviewHtml(fileName: string): Promise<string | null> {
  const kind = smartPoliceFormFileKind(fileName);
  if (kind !== "docx") return null;
  const disk = smartPoliceBlankFormDiskPath(fileName);
  const buf = await fs.readFile(disk);
  const result = await mammoth.convertToHtml({ buffer: buf });
  return result.value || "<p></p>";
}

export function blankFormPublicHref(fileName: string): string {
  return smartPoliceBlankFormHref(fileName);
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";

/** เก็บเลย์เอาต์ที่ผู้ใช้จัดเอง (ลาก/ยืดเส้น/แก้ข้อความ) เป็นไฟล์ JSON ต่อ owner+form */
function layoutDir(): string {
  return path.join(process.cwd(), "public", "uploads", "smart-police", "layouts");
}

function fileFor(ownerUserId: string, slug: string): string {
  const safeOwner = ownerUserId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "owner";
  const safeSlug = slug.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "form";
  return path.join(layoutDir(), `${safeOwner}--${safeSlug}.json`);
}

export async function readSheetLayoutFile(ownerUserId: string, slug: string): Promise<SheetLayout> {
  try {
    const raw = await readFile(fileFor(ownerUserId, slug), "utf8");
    const parsed = JSON.parse(raw) as Partial<SheetLayout>;
    return {
      offsets: parsed.offsets ?? {},
      texts: parsed.texts ?? {},
      lines: parsed.lines ?? [],
      hidden: parsed.hidden ?? [],
    };
  } catch {
    return emptySheetLayout();
  }
}

export async function writeSheetLayoutFile(
  ownerUserId: string,
  slug: string,
  layout: SheetLayout,
): Promise<void> {
  const dir = layoutDir();
  await mkdir(dir, { recursive: true });
  await writeFile(fileFor(ownerUserId, slug), JSON.stringify(layout, null, 2), "utf8");
}

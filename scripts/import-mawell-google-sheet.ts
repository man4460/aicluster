/**
 * นำเข้ารายรับ–รายจ่ายของ user `mawell` จาก Google Sheet "My_Expense_Tracker"
 *
 * แหล่งข้อมูล: https://docs.google.com/spreadsheets/d/<SHEET_ID>
 *   - ใช้ gviz CSV endpoint (Sheet ตั้งค่า share "Anyone with link" อยู่แล้ว)
 *   - คอลัมน์: วันที่ (MDY) | ประเภท (รายจ่าย/รายรับ) | หมวดหมู่ | รายการ | จำนวนเงิน | Link รูป (Google Drive)
 *
 * พฤติกรรม:
 *   1. ดึง CSV ทั้งหมดจาก Sheet
 *   2. แต่ละแถว — ดาวน์โหลดรูปจาก Google Drive (ถ้ามี) เก็บลง public/uploads/home-finance/
 *   3. UPSERT (ค้นด้วย externalSource='google-sheet' + externalId='mawell-sheet-rN')
 *      → รันซ้ำได้โดยไม่ทำซ้ำ row หรือดาวน์โหลดรูปซ้ำ
 *   4. ลงในบัญชี mawell (cmp0udptg00051t5p0hyecuvv)
 *
 * รัน: npx tsx scripts/import-mawell-google-sheet.ts
 */
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";
import { resolveOwnerUploadSegment } from "@/lib/home-finance/user-upload-dir";

const SHEET_ID = "1XLoIr2pB05doYoFukx-5Bq0cEIWyeUReuljOvt0uD1U";
const OWNER_USER_ID = "cmp0udptg00051t5p0hyecuvv";
const EXTERNAL_SOURCE = "google-sheet";
const UPLOADS_REL_BASE = "public/uploads/home-finance";
const UPLOADS_PUBLIC_BASE = "/uploads/home-finance";

type CatMap = { key: string; label: string };

const CATEGORY_MAP: Record<string, CatMap> = {
  ร้านสะดวกซัก: { key: "SHEET_LAUNDROMAT", label: "ร้านสะดวกซัก" },
  ครอบครัว: { key: "SHEET_FAMILY", label: "ครอบครัว" },
  บ้าน: { key: "SHEET_HOME", label: "บ้าน" },
  ยานพาหนะ: { key: "VEHICLE_CAR", label: "ยานพาหนะ" },
  งานซ่อม: { key: "SHEET_REPAIR", label: "งานซ่อม" },
  "งานซ่อม (ส่งอะไหล่)": { key: "SHEET_REPAIR_PARTS", label: "งานซ่อม (ส่งอะไหล่)" },
  ไมเนอร์ฟาร์ม: { key: "SHEET_MINOR_FARM", label: "ไมเนอร์ฟาร์ม" },
  ดัชมิลล์: { key: "SHEET_DUTCH_MILL", label: "ดัชมิลล์" },
  ทอง: { key: "SHEET_GOLD", label: "ทอง" },
  ไมเนอร์: { key: "SHEET_MINOR", label: "ไมเนอร์" },
};

function mapCategory(raw: string): CatMap {
  const trimmed = (raw ?? "").trim();
  if (trimmed && CATEGORY_MAP[trimmed]) return CATEGORY_MAP[trimmed];
  return { key: "OTHER", label: trimmed || "อื่นๆ" };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseSheetDate(raw: string): Date | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const [datePart] = trimmed.split(/\s+/);
  const [m, d, y] = datePart.split("/").map((n) => Number(n));
  if (!m || !d || !y) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function ymd(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

function extractDriveId(url: string): string | null {
  const m = (url ?? "").match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
  return m ? m[1] : null;
}

function safeAsciiFromTitle(title: string): string {
  const cleaned = title
    .replace(/[^A-Za-z0-9\u0E00-\u0E7F\-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 40) || "entry";
}

function mimeToExt(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("pdf")) return "pdf";
  return "jpg";
}

async function fetchCsv(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch CSV ${res.status}`);
  return await res.text();
}

async function downloadDrive(fileId: string): Promise<{ buf: Buffer; mime: string }> {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`drive ${fileId} HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (contentType.startsWith("text/html")) {
    throw new Error(`drive ${fileId} returned HTML (large file / quota?)`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, mime: contentType };
}

async function ensureCategories(ownerUserId: string) {
  const labels = new Set<string>();
  for (const cat of Object.values(CATEGORY_MAP)) labels.add(cat.label);
  for (const label of labels) {
    const existing = await prisma.homeFinanceCategory.findFirst({
      where: { ownerUserId, name: label },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.homeFinanceCategory.create({
      data: { ownerUserId, name: label, isSystem: false, isActive: true },
    });
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`[import] user=${OWNER_USER_ID} sheet=${SHEET_ID}`);
  const csv = await fetchCsv();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("empty CSV");
  const dataRows = rows.slice(1);
  console.log(`[import] CSV rows: ${dataRows.length}`);

  const userSegment = await resolveOwnerUploadSegment(OWNER_USER_ID);
  const uploadsAbs = path.join(process.cwd(), UPLOADS_REL_BASE, userSegment);
  const uploadsPublicPrefix = `${UPLOADS_PUBLIC_BASE}/${userSegment}`;
  await fs.mkdir(uploadsAbs, { recursive: true });
  console.log(`[import] uploads dir: ${uploadsAbs}`);

  await ensureCategories(OWNER_USER_ID);

  const existingMap = new Map<string, { id: number; slipImageUrl: string | null }>();
  const existing = await prisma.homeFinanceEntry.findMany({
    where: { ownerUserId: OWNER_USER_ID, externalSource: EXTERNAL_SOURCE },
    select: { id: true, externalId: true, slipImageUrl: true },
  });
  for (const e of existing) {
    if (e.externalId) existingMap.set(e.externalId, { id: e.id, slipImageUrl: e.slipImageUrl });
  }
  console.log(`[import] existing google-sheet entries: ${existing.length}`);

  let ok = 0;
  let skipped = 0;
  let err = 0;
  let imgOk = 0;
  let imgSkip = 0;
  let imgErr = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const sheetRow = i + 2;
    const externalId = `mawell-sheet-r${sheetRow}`;

    try {
      const [dateStr, typeStr, catStr, titleStr, amountStr, linkStr] = row;
      const entryDate = parseSheetDate(dateStr ?? "");
      const titleClean = (titleStr ?? "").trim();
      const amountClean = (amountStr ?? "").replace(/,/g, "").trim();
      if (!entryDate || !titleClean || !amountClean) {
        skipped++;
        continue;
      }
      const amount = Number(amountClean);
      if (!Number.isFinite(amount) || amount <= 0) {
        skipped++;
        continue;
      }
      const type = (typeStr ?? "").trim() === "รายรับ" ? "INCOME" : "EXPENSE";
      const cat = mapCategory(catStr ?? "");

      let slipImageUrl: string | null = null;
      const existingRow = existingMap.get(externalId);
      const driveId = extractDriveId(linkStr ?? "");
      if (driveId) {
        const reusable =
          existingRow?.slipImageUrl &&
          existingRow.slipImageUrl.startsWith(uploadsPublicPrefix) &&
          (await fileExists(path.join(process.cwd(), "public", existingRow.slipImageUrl)));
        if (reusable) {
          slipImageUrl = existingRow!.slipImageUrl!;
          imgSkip++;
        } else {
          try {
            const dl = await downloadDrive(driveId);
            const ext = mimeToExt(dl.mime);
            const slug = safeAsciiFromTitle(titleClean);
            const rand = crypto.randomBytes(3).toString("hex");
            const fname = `sheet-r${sheetRow}-${ymd(entryDate)}_${slug}-${rand}.${ext}`;
            const abs = path.join(uploadsAbs, fname);
            await fs.writeFile(abs, dl.buf);
            slipImageUrl = `${uploadsPublicPrefix}/${fname}`;
            imgOk++;
          } catch (e: any) {
            console.warn(`  [img] r${sheetRow} drive=${driveId} err: ${e?.message || e}`);
            imgErr++;
          }
        }
      }

      const data = {
        ownerUserId: OWNER_USER_ID,
        entryDate,
        type: type as "INCOME" | "EXPENSE",
        categoryKey: cat.key,
        categoryLabel: cat.label,
        title: titleClean.slice(0, 160),
        amount,
        slipImageUrl,
        attachmentUrls: slipImageUrl ? ([slipImageUrl] as unknown as object) : undefined,
        externalSource: EXTERNAL_SOURCE,
        externalId,
        lastSyncedAt: new Date(),
      };

      if (existingRow) {
        await prisma.homeFinanceEntry.update({
          where: { id: existingRow.id },
          data,
        });
      } else {
        await prisma.homeFinanceEntry.create({ data });
      }
      ok++;

      if ((i + 1) % 25 === 0) {
        console.log(
          `  progress ${i + 1}/${dataRows.length}  ok=${ok}  img:[ok=${imgOk}/skip=${imgSkip}/err=${imgErr}]`,
        );
      }
    } catch (e: any) {
      err++;
      console.error(`  [row r${sheetRow}] err: ${e?.message || e}`);
    }
  }

  console.log(
    `\n[done] total=${dataRows.length}  upserted=${ok}  skipped=${skipped}  err=${err}` +
      `  | images: downloaded=${imgOk}  reused=${imgSkip}  failed=${imgErr}`,
  );
}

main()
  .catch((e) => {
    console.error("[FATAL]", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

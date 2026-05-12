/**
 * นำเข้ารายรับ–รายจ่ายของ user `admin` จาก Google Sheet "man walled"
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1nVrTRHmjRIY60a03vyqg23lSsGmykdM9jPlGwtfzO4I
 * ต้องตั้ง share "Anyone with link can view"
 *
 * คอลัมน์ (แถวแรก = header):
 *   วันที่ | ประเภท (รายจ่าย/รายรับ) | หมวดหมู่ | โน้ต | จำนวน | รูปภาพ (ลิงก์ Google Drive)
 *
 * วันที่รองรับรูปแบบ D/M/Y และมีเวลาต่อท้าย เช่น `27/2/2026, 7:00:00`
 *
 * UPSERT: externalSource=`google-sheet-manwalled` + externalId=`manwalled-r{sheetRow}`
 *
 * รัน: npx tsx scripts/import-admin-manwalled-google-sheet.ts
 */
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";
import { resolveOwnerUploadSegment } from "@/lib/home-finance/user-upload-dir";

const SHEET_ID = "1nVrTRHmjRIY60a03vyqg23lSsGmykdM9jPlGwtfzO4I";
/** แท็บที่มีคอลัมน์ วันที่|ประเภท|หมวดหมู่|โน้ต|จำนวน|รูปภาพ — ค่าเริ่มต้น Sheet1 */
const SHEET_TAB = process.env.MANWALLED_SHEET_TAB?.trim() || "Sheet1";
const OWNER_USERNAME = "admin";
const EXTERNAL_SOURCE = "google-sheet-manwalled";
const UPLOADS_REL_BASE = "public/uploads/home-finance";
const UPLOADS_PUBLIC_BASE = "/uploads/home-finance";

function categoryKeyFromLabel(label: string): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "OTHER";
  const h = crypto.createHash("sha256").update(trimmed, "utf8").digest("hex").slice(0, 24);
  return `GS_${h}`;
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

/** วันที่แบบ D/M/Y อาจมี `, HH:MM:SS` ต่อท้าย */
function parseSheetDateDMY(raw: string): Date | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const datePart = trimmed.split(",")[0]?.trim() ?? trimmed;
  const parts = datePart.split("/").map((n) => Number(String(n).trim()));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function ymd(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

function extractDriveId(url: string): string | null {
  const u = url ?? "";
  const m1 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m2 ? m2[1] : null;
}

function safeAsciiFromTitle(title: string): string {
  const cleaned = title
    .replace(/[^A-Za-z0-9\u0E00-\u0E7F\-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_+$/g, "");
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
  const tab = encodeURIComponent(SHEET_TAB);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tab}`;
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

async function ensureCategory(ownerUserId: string, name: string) {
  const n = name.trim().slice(0, 100);
  if (!n) return;
  const existing = await prisma.homeFinanceCategory.findFirst({
    where: { ownerUserId, name: n },
    select: { id: true },
  });
  if (existing) return;
  await prisma.homeFinanceCategory.create({
    data: { ownerUserId, name: n, isSystem: false, isActive: true },
  });
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
  const owner = await prisma.user.findUnique({
    where: { username: OWNER_USERNAME },
    select: { id: true, username: true },
  });
  if (!owner) {
    throw new Error(`user not found: username=${OWNER_USERNAME}`);
  }
  const ownerUserId = owner.id;

  console.log(`[import] user=${ownerUserId} (${owner.username}) sheet=${SHEET_ID}`);
  const csv = await fetchCsv();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("empty CSV");
  const header = rows[0].map((c) => c.trim());
  const dataRows = rows.slice(1);
  console.log(`[import] header: ${JSON.stringify(header)}`);
  if (header[0] !== "วันที่" || header.length < 6) {
    throw new Error(
      `Unexpected CSV columns — expected tab "${SHEET_TAB}" with header วันที่,ประเภท,หมวดหมู่,โน้ต,จำนวน,รูปภาพ. ` +
        `Set MANWALLED_SHEET_TAB to the correct sheet name.`,
    );
  }
  console.log(`[import] CSV data rows: ${dataRows.length}`);

  const userSegment = resolveOwnerUploadSegment(ownerUserId);
  const uploadsAbs = path.join(process.cwd(), UPLOADS_REL_BASE, userSegment);
  const uploadsPublicPrefix = `${UPLOADS_PUBLIC_BASE}/${userSegment}`;
  await fs.mkdir(uploadsAbs, { recursive: true });
  console.log(`[import] uploads dir: ${uploadsAbs}`);

  const catLabels = new Set<string>();
  for (const row of dataRows) {
    const cat = (row[2] ?? "").trim();
    if (cat) catLabels.add(cat.slice(0, 100));
  }
  for (const label of catLabels) {
    await ensureCategory(ownerUserId, label);
  }
  console.log(`[import] ensured ${catLabels.size} categories`);

  const existingMap = new Map<string, { id: number; slipImageUrl: string | null }>();
  const existing = await prisma.homeFinanceEntry.findMany({
    where: { ownerUserId, externalSource: EXTERNAL_SOURCE },
    select: { id: true, externalId: true, slipImageUrl: true },
  });
  for (const e of existing) {
    if (e.externalId) existingMap.set(e.externalId, { id: e.id, slipImageUrl: e.slipImageUrl });
  }
  console.log(`[import] existing ${EXTERNAL_SOURCE} entries: ${existing.length}`);

  let ok = 0;
  let skipped = 0;
  let err = 0;
  let imgOk = 0;
  let imgSkip = 0;
  let imgErr = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const sheetRow = i + 2;
    const externalId = `manwalled-r${sheetRow}`;

    try {
      const dateStr = row[0] ?? "";
      const typeStr = row[1] ?? "";
      const catStr = row[2] ?? "";
      const noteStr = row[3] ?? "";
      const amountStr = row[4] ?? "";
      const linkStr = row[5] ?? "";

      const entryDate = parseSheetDateDMY(dateStr);
      const titleClean = noteStr.trim();
      const amountClean = amountStr.replace(/,/g, "").trim();
      if (!entryDate || !titleClean || !amountClean) {
        skipped++;
        continue;
      }
      const amount = Number(amountClean);
      if (!Number.isFinite(amount) || amount <= 0) {
        skipped++;
        continue;
      }
      const type = typeStr.trim() === "รายรับ" ? "INCOME" : "EXPENSE";
      const catLabel = catStr.trim().slice(0, 100) || "อื่นๆ";
      const catKey = categoryKeyFromLabel(catLabel);

      let slipImageUrl: string | null = null;
      const existingRow = existingMap.get(externalId);
      const driveId = extractDriveId(linkStr);
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
            const fname = `manwalled-r${sheetRow}-${ymd(entryDate)}_${slug}-${rand}.${ext}`;
            const abs = path.join(uploadsAbs, fname);
            await fs.writeFile(abs, dl.buf);
            slipImageUrl = `${uploadsPublicPrefix}/${fname}`;
            imgOk++;
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`  [img] r${sheetRow} drive=${driveId} err: ${msg}`);
            imgErr++;
          }
        }
      }

      const data = {
        ownerUserId,
        entryDate,
        type: type as "INCOME" | "EXPENSE",
        categoryKey: catKey,
        categoryLabel: catLabel,
        title: titleClean.slice(0, 160),
        amount,
        note: titleClean.slice(0, 600),
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
    } catch (e: unknown) {
      err++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  [row r${sheetRow}] err: ${msg}`);
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

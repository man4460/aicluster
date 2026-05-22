import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

const UPLOAD_BUCKET = "smart-police";
const MAX_DOCX_BYTES = 8 * 1024 * 1024;

export function smartPoliceUploadDir() {
  return path.join(process.cwd(), "public", "uploads", UPLOAD_BUCKET);
}

export function smartPoliceWordPublicUrl(filename: string) {
  return `/uploads/${UPLOAD_BUCKET}/${filename}`;
}

function isDocxBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export async function saveSmartPoliceDocxUpload(
  ownerUserId: string,
  file: File,
): Promise<{ wordFileUrl: string; wordFileName: string; size: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) throw new Error("ไฟล์ว่าง");
  if (buf.length > MAX_DOCX_BYTES) throw new Error("ไฟล์ใหญ่เกิน 8MB");
  const name = (file.name ?? "").toLowerCase();
  if (!name.endsWith(".docx") && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    if (!isDocxBuffer(buf)) throw new Error("รองรับเฉพาะไฟล์ .docx");
  }
  if (!isDocxBuffer(buf)) throw new Error("ไฟล์ไม่ใช่รูปแบบ Word (.docx)");

  const dir = smartPoliceUploadDir();
  await mkdir(dir, { recursive: true });
  const safe = (file.name || "statement.docx")
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^a-zA-Z0-9._\u0E00-\u0E7F-]/gu, "_")
    .slice(0, 80);
  const filename = `${ownerUserId.slice(0, 8)}-${Date.now()}-${safe.endsWith(".docx") ? safe : `${safe}.docx`}`;
  await writeFile(path.join(dir, filename), buf);
  return {
    wordFileUrl: smartPoliceWordPublicUrl(filename),
    wordFileName: file.name || filename,
    size: buf.length,
  };
}

function paragraphFromLine(line: string): Paragraph {
  const trimmed = line.trimEnd();
  if (!trimmed) {
    return new Paragraph({ children: [new TextRun("")], spacing: { after: 120 } });
  }
  const isTitle = !line.startsWith(" ") && line.length < 40 && !line.startsWith("ข้อ ");
  return new Paragraph({
    alignment: isTitle ? AlignmentType.CENTER : undefined,
    children: [new TextRun({ text: line, size: 32 })],
    spacing: { after: line.startsWith("ข้อ ") ? 200 : 120 },
  });
}

function hyperlinkParagraph(label: string, url: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text: `${label} `, size: 28 }),
      new ExternalHyperlink({
        children: [new TextRun({ text: url, style: "Hyperlink", size: 28 })],
        link: url,
      }),
    ],
  });
}

/** สร้างไฟล์ .docx จากข้อความแบบฟอร์ม — พร้อมลิงก์ไปสำนวนคดี (ถ้ามี URL) */
export async function generateStatementDocxFile(opts: {
  ownerUserId: string;
  caseId: string;
  documentId: string;
  bodyText: string;
  appOrigin: string;
  narrativePageUrl?: string;
}): Promise<{ wordFileUrl: string; wordFileName: string }> {
  const lines = opts.bodyText.split(/\r?\n/);
  const narrativeUrl = opts.narrativePageUrl?.trim() || undefined;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          ...lines.map((line) => paragraphFromLine(line)),
          ...(narrativeUrl
            ? [
                new Paragraph({
                  children: [new TextRun({ text: "— ลิงก์เชื่อมโยงเอกสาร —", bold: true, size: 28 })],
                  spacing: { before: 400 },
                }),
                hyperlinkParagraph("เปิดสำนวนคดีในระบบ (MAWELL)", narrativeUrl),
              ]
            : []),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const dir = smartPoliceUploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${opts.ownerUserId.slice(0, 8)}-stmt-${opts.caseId.slice(0, 8)}-${opts.documentId.slice(0, 8)}-${Date.now()}.docx`;
  await writeFile(path.join(dir, filename), buf);
  const wordFileName = `คำให้การ-${opts.documentId.slice(0, 8)}.docx`;
  return { wordFileUrl: smartPoliceWordPublicUrl(filename), wordFileName };
}

export function appOriginFromRequest(req: Request): string {
  const env = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  try {
    const u = new URL(req.url);
    return u.origin;
  } catch {
    return "http://localhost:3000";
  }
}

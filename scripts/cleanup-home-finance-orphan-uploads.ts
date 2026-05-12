/**
 * วิเคราะห์/ลบรูปสลิป + ไฟล์แนบใน `public/uploads/home-finance/` ที่ **ไม่มี DB อ้างถึงแล้ว**
 *
 * ขั้นตอน:
 *   1. รวมทุก slip_image_url + attachment_urls จาก home_finance_entries (+ photoUrl/attachmentUrls
 *      จาก HomeUtilityProfile, HomeVehicleProfile เผื่อใช้พื้นที่เดียวกัน)
 *   2. เดิน public/uploads/home-finance/ (รวม root + subfolder) — list ไฟล์จริงทั้งหมด
 *   3. ไฟล์ที่ DB ไม่อ้างถึง = orphan
 *   4. ถ้าเรียกแบบ `--apply` จะลบจริง (default = dry-run แสดงสรุป)
 *
 * รัน:
 *   npx tsx scripts/cleanup-home-finance-orphan-uploads.ts          # dry-run
 *   npx tsx scripts/cleanup-home-finance-orphan-uploads.ts --apply  # ลบจริง
 */
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";

const BASE_PUBLIC_PREFIX = "/uploads/home-finance/";
const BASE_FS_DIR = path.join(process.cwd(), "public", "uploads", "home-finance");

const APPLY = process.argv.includes("--apply");

function publicPathFromAbs(abs: string): string {
  const rel = path.relative(BASE_FS_DIR, abs).split(path.sep).join("/");
  return `${BASE_PUBLIC_PREFIX}${rel}`;
}

function* iterPublicPaths(value: unknown): Generator<string> {
  if (typeof value === "string") {
    if (value.startsWith(BASE_PUBLIC_PREFIX)) yield value;
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) yield* iterPublicPaths(v);
  }
}

async function listAllFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(d, ent.name);
      if (ent.isDirectory()) await walk(abs);
      else if (ent.isFile()) out.push(abs);
    }
  }
  await walk(dir);
  return out;
}

async function main() {
  console.log(`[cleanup] mode=${APPLY ? "APPLY (delete)" : "dry-run"}`);

  const referenced = new Set<string>();

  const entries = await prisma.homeFinanceEntry.findMany({
    select: { slipImageUrl: true, attachmentUrls: true },
  });
  for (const e of entries) {
    if (e.slipImageUrl) for (const p of iterPublicPaths(e.slipImageUrl)) referenced.add(p);
    if (e.attachmentUrls) for (const p of iterPublicPaths(e.attachmentUrls)) referenced.add(p);
  }

  const utilities = await prisma.homeUtilityProfile.findMany({
    select: { photoUrl: true },
  });
  for (const u of utilities) {
    if (u.photoUrl) for (const p of iterPublicPaths(u.photoUrl)) referenced.add(p);
  }

  const vehicles = await prisma.homeVehicleProfile.findMany({
    select: { photoUrl: true, attachmentUrls: true },
  });
  for (const v of vehicles) {
    if (v.photoUrl) for (const p of iterPublicPaths(v.photoUrl)) referenced.add(p);
    if (v.attachmentUrls) for (const p of iterPublicPaths(v.attachmentUrls)) referenced.add(p);
  }

  console.log(`[cleanup] DB references (unique paths): ${referenced.size}`);

  const filesAbs = await listAllFiles(BASE_FS_DIR);
  const orphan: string[] = [];
  let totalBytes = 0;
  let orphanBytes = 0;

  for (const abs of filesAbs) {
    const pub = publicPathFromAbs(abs);
    const stat = await fs.stat(abs);
    totalBytes += stat.size;
    if (!referenced.has(pub)) {
      orphan.push(abs);
      orphanBytes += stat.size;
    }
  }

  console.log(`[cleanup] disk files total: ${filesAbs.length} (${humanBytes(totalBytes)})`);
  console.log(`[cleanup] orphan (DB ไม่อ้างถึง): ${orphan.length} (${humanBytes(orphanBytes)})`);

  // — สรุปกลุ่ม orphan ตาม subdir/root —
  const byBucket = new Map<string, { count: number; bytes: number }>();
  for (const abs of orphan) {
    const rel = path.relative(BASE_FS_DIR, abs).split(path.sep);
    const bucket = rel.length === 1 ? "(root)" : rel[0];
    const stat = await fs.stat(abs);
    const cur = byBucket.get(bucket) ?? { count: 0, bytes: 0 };
    cur.count += 1;
    cur.bytes += stat.size;
    byBucket.set(bucket, cur);
  }
  console.log(`\n[cleanup] orphan group:`);
  for (const [k, v] of [...byBucket.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${k.padEnd(30)} ${String(v.count).padStart(5)} files  ${humanBytes(v.bytes)}`);
  }

  if (!APPLY) {
    console.log(`\n[cleanup] dry-run — ส่ง --apply เพื่อ \"ลบจริง\"`);
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const abs of orphan) {
    try {
      await fs.unlink(abs);
      deleted++;
    } catch (e: unknown) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  [del err] ${abs}: ${msg}`);
    }
  }

  // ลบโฟลเดอร์ย่อยที่ว่างเหลืออยู่
  let prunedDirs = 0;
  for (const dirent of await fs.readdir(BASE_FS_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const abs = path.join(BASE_FS_DIR, dirent.name);
    const left = await fs.readdir(abs);
    if (left.length === 0) {
      try {
        await fs.rmdir(abs);
        prunedDirs++;
      } catch {
        // ignore
      }
    }
  }

  console.log(`\n[cleanup] deleted=${deleted}  failed=${failed}  empty-dirs-removed=${prunedDirs}`);
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

main()
  .catch((e) => {
    console.error("[FATAL]", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

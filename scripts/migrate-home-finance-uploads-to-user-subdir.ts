/**
 * Migration: ย้ายรูป/ไฟล์แนบรายรับ–รายจ่ายไปอยู่ใต้โฟลเดอร์ของเจ้าของรายการ
 *
 *   เดิม: /uploads/home-finance/<filename>
 *   ใหม่: /uploads/home-finance/<username>/<filename>
 *
 * พฤติกรรม:
 *   1. ดึงทุก HomeFinanceEntry ที่มี slip_image_url หรือ attachment_urls อยู่ใต้ /uploads/home-finance/
 *      แล้ว path ปัจจุบัน "ยังไม่อยู่ในโฟลเดอร์ย่อย"
 *   2. หา username (segment) ของ owner — ใช้ resolveOwnerUploadSegment()
 *   3. ย้ายไฟล์จริงบนดิสก์ (`rename`) ไป public/uploads/home-finance/<segment>/<filename>
 *   4. update DB ของ entry นั้น (slip_image_url + attachment_urls) ให้ชี้ path ใหม่
 *
 * Idempotent — รันซ้ำได้ entry ที่ย้ายแล้วจะถูกข้าม
 *
 * รัน: npx tsx scripts/migrate-home-finance-uploads-to-user-subdir.ts
 */
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";
import { resolveOwnerUploadSegment } from "@/lib/home-finance/user-upload-dir";

const BASE_PUBLIC_PREFIX = "/uploads/home-finance/";
const BASE_FS_DIR = path.join(process.cwd(), "public", "uploads", "home-finance");

/** คืน subdir segment ถ้า path อยู่ในโฟลเดอร์ย่อยอยู่แล้ว — null ถ้าอยู่ที่ root */
function currentSubdirOf(publicPath: string): string | null {
  if (!publicPath.startsWith(BASE_PUBLIC_PREFIX)) return null;
  const rest = publicPath.slice(BASE_PUBLIC_PREFIX.length);
  const idx = rest.indexOf("/");
  if (idx < 0) return null;
  return rest.slice(0, idx);
}

/** คืน basename ของไฟล์ (ไม่รวม subdir) จาก public path */
function basenameOfPublic(publicPath: string): string {
  const rest = publicPath.slice(BASE_PUBLIC_PREFIX.length);
  const idx = rest.lastIndexOf("/");
  return idx >= 0 ? rest.slice(idx + 1) : rest;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * ย้ายไฟล์ + คืน path public ใหม่
 * - ถ้าไฟล์ต้นทางไม่มีแต่ปลายทางมี (เคยย้ายแล้ว) — ถือว่าสำเร็จ
 * - ถ้าทั้งต้นทางและปลายทางไม่มี — คืน null (DB entry มี path ค้าง)
 */
async function migrateOneFile(
  oldPublic: string,
  userSegment: string,
  currentSeg: string | null,
): Promise<{ newPublic: string | null; moved: boolean; missing: boolean }> {
  const base = basenameOfPublic(oldPublic);
  if (!base || base.includes("/") || base.includes("..")) {
    return { newPublic: null, moved: false, missing: true };
  }
  const newPublic = `${BASE_PUBLIC_PREFIX}${userSegment}/${base}`;
  const oldAbs = currentSeg
    ? path.join(BASE_FS_DIR, currentSeg, base)
    : path.join(BASE_FS_DIR, base);
  const newDirAbs = path.join(BASE_FS_DIR, userSegment);
  const newAbs = path.join(newDirAbs, base);

  if (await fileExists(newAbs)) {
    if (await fileExists(oldAbs)) {
      await fs.unlink(oldAbs);
    }
    return { newPublic, moved: false, missing: false };
  }
  if (!(await fileExists(oldAbs))) {
    return { newPublic: null, moved: false, missing: true };
  }
  await fs.mkdir(newDirAbs, { recursive: true });
  await fs.rename(oldAbs, newAbs);
  return { newPublic, moved: true, missing: false };
}

async function main() {
  const entries = await prisma.homeFinanceEntry.findMany({
    where: {
      OR: [
        { slipImageUrl: { startsWith: BASE_PUBLIC_PREFIX } },
        { attachmentUrls: { not: undefined } },
      ],
    },
    select: {
      id: true,
      ownerUserId: true,
      slipImageUrl: true,
      attachmentUrls: true,
    },
  });
  console.log(`[migrate] candidates: ${entries.length} entries`);

  // cache: ownerUserId → segment (sync — resolveOwnerUploadSegment ใช้ userId เป็น slug ตรงๆ)
  const segCache = new Map<string, string>();
  function getSegment(uid: string): string {
    const cached = segCache.get(uid);
    if (cached) return cached;
    const seg = resolveOwnerUploadSegment(uid);
    segCache.set(uid, seg);
    return seg;
  }

  let updated = 0;
  let unchanged = 0;
  let moved = 0;
  let missing = 0;
  let err = 0;

  for (const e of entries) {
    try {
      const seg = getSegment(e.ownerUserId);

      // —— slip_image_url ——
      let nextSlip: string | null = e.slipImageUrl;
      if (e.slipImageUrl && e.slipImageUrl.startsWith(BASE_PUBLIC_PREFIX)) {
        const currentSeg = currentSubdirOf(e.slipImageUrl);
        if (currentSeg && currentSeg !== seg) {
          // อยู่ใน subdir อื่น (เช่น username เดิม) — ย้ายให้ตรงกับ seg ใหม่
          const { newPublic, moved: m, missing: mi } = await migrateOneFile(
            e.slipImageUrl,
            seg,
            currentSeg,
          );
          if (newPublic) {
            nextSlip = newPublic;
            if (m) moved++;
          } else if (mi) {
            missing++;
          }
        } else if (!currentSeg) {
          const { newPublic, moved: m, missing: mi } = await migrateOneFile(
            e.slipImageUrl,
            seg,
            null,
          );
          if (newPublic) {
            nextSlip = newPublic;
            if (m) moved++;
          } else if (mi) {
            missing++;
          }
        }
      }

      // —— attachment_urls ——
      let nextAttachments: string[] | null = null;
      const raw = e.attachmentUrls;
      if (Array.isArray(raw)) {
        const out: string[] = [];
        for (const u of raw) {
          if (typeof u !== "string") continue;
          if (u.startsWith(BASE_PUBLIC_PREFIX)) {
            const currentSeg = currentSubdirOf(u);
            if (currentSeg !== seg) {
              const { newPublic, moved: m, missing: mi } = await migrateOneFile(
                u,
                seg,
                currentSeg,
              );
              if (newPublic) {
                out.push(newPublic);
                if (m) moved++;
              } else if (mi) {
                missing++;
                out.push(u);
              } else {
                out.push(u);
              }
            } else {
              out.push(u);
            }
          } else {
            out.push(u);
          }
        }
        nextAttachments = out;
      }

      // ตัดสินใจ update เมื่อใด
      const slipChanged = nextSlip !== e.slipImageUrl;
      const attachmentsChanged =
        nextAttachments != null &&
        JSON.stringify(nextAttachments) !== JSON.stringify(raw);

      if (slipChanged || attachmentsChanged) {
        await prisma.homeFinanceEntry.update({
          where: { id: e.id },
          data: {
            ...(slipChanged ? { slipImageUrl: nextSlip } : {}),
            ...(attachmentsChanged
              ? { attachmentUrls: nextAttachments as unknown as object }
              : {}),
          },
        });
        updated++;
      } else {
        unchanged++;
      }
    } catch (ex: unknown) {
      err++;
      const msg = ex instanceof Error ? ex.message : String(ex);
      console.error(`  [entry id=${e.id}] err: ${msg}`);
    }
  }

  console.log(
    `\n[done] updated=${updated}  unchanged=${unchanged}  files-moved=${moved}` +
      `  missing=${missing}  err=${err}`,
  );

  // —— สรุป folder layout หลัง migrate ——
  const dirs = await fs.readdir(BASE_FS_DIR);
  const sub = dirs.filter((d) => !d.includes("."));
  const flat = dirs.filter((d) => d.includes("."));
  console.log(`[layout] subfolders: ${sub.length} (${sub.slice(0, 10).join(", ")}...)`);
  console.log(`[layout] flat files left at root: ${flat.length}`);
}

main()
  .catch((e) => {
    console.error("[FATAL]", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

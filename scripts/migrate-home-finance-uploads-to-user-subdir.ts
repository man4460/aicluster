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

function isAlreadyInSubdir(publicPath: string): boolean {
  if (!publicPath.startsWith(BASE_PUBLIC_PREFIX)) return true; // ข้าม path ที่ไม่ตรงรูปแบบ
  const rest = publicPath.slice(BASE_PUBLIC_PREFIX.length);
  return rest.includes("/");
}

function basenameOfPublic(publicPath: string): string {
  return publicPath.slice(BASE_PUBLIC_PREFIX.length);
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
): Promise<{ newPublic: string | null; moved: boolean; missing: boolean }> {
  const base = basenameOfPublic(oldPublic);
  if (!base || base.includes("/") || base.includes("..")) {
    return { newPublic: null, moved: false, missing: true };
  }
  const newPublic = `${BASE_PUBLIC_PREFIX}${userSegment}/${base}`;
  const oldAbs = path.join(BASE_FS_DIR, base);
  const newDirAbs = path.join(BASE_FS_DIR, userSegment);
  const newAbs = path.join(newDirAbs, base);

  if (await fileExists(newAbs)) {
    // ปลายทางมีแล้ว — ลบต้นทาง (ถ้ามี)
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
        // attachment_urls เป็น JSON; กรองที่ระดับ JS หลังโหลด
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

  // cache: ownerUserId → segment
  const segCache = new Map<string, string>();
  async function getSegment(uid: string): Promise<string> {
    const cached = segCache.get(uid);
    if (cached) return cached;
    const seg = await resolveOwnerUploadSegment(uid);
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
      const seg = await getSegment(e.ownerUserId);

      // —— slip_image_url ——
      let nextSlip: string | null = e.slipImageUrl;
      if (e.slipImageUrl && e.slipImageUrl.startsWith(BASE_PUBLIC_PREFIX)) {
        if (isAlreadyInSubdir(e.slipImageUrl)) {
          // อยู่ใน subdir แล้ว แต่อาจคนละ user — ตรวจให้แน่ใจอย่างน้อยไม่ใช่ภัยพิบัติ
          // ไม่ย้ายข้ามโฟลเดอร์ — ถือว่าถูกต้องตามที่ DB เก็บ
        } else {
          const { newPublic, moved: m, missing: mi } = await migrateOneFile(
            e.slipImageUrl,
            seg,
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
          if (u.startsWith(BASE_PUBLIC_PREFIX) && !isAlreadyInSubdir(u)) {
            const { newPublic, moved: m, missing: mi } = await migrateOneFile(u, seg);
            if (newPublic) {
              out.push(newPublic);
              if (m) moved++;
            } else if (mi) {
              missing++;
              out.push(u); // คงค่าเดิมไว้ (จะ orphan)
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
    } catch (ex: any) {
      err++;
      console.error(`  [entry id=${e.id}] err: ${ex?.message || ex}`);
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

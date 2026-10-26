/**
 * ทดสอบ POST อัปโหลดรูปจริงผ่าน handler (multipart FormData → ไฟล์ + DB)
 * ใช้: npx tsx scripts/smart-police/verify-photo-upload-handler.ts
 */

import { readFile, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "../../src/lib/prisma";
import { mapSuspectPhoto } from "../../src/lib/smart-police/investigation/photo-serialize";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

// ตรรกะเดียวกับ route POST (ยกมาทดสอบโดยไม่ผ่าน session gate)
function detectKind(buf: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function main() {
  const problems: string[] = [];
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");

  const suspect = await prisma.smartPoliceSuspect.create({
    data: { ownerUserId: owner, fullName: `ทดสอบอัปโหลด ${Date.now()}` },
  });
  const written: string[] = [];

  try {
    // 1) ตรวจชนิดไฟล์
    if (detectKind(PNG_1PX) !== "png") problems.push("ตรวจชนิด PNG ไม่ได้");
    if (detectKind(Buffer.from("hello world, not an image")) !== null) {
      problems.push("ปล่อยไฟล์ที่ไม่ใช่รูปผ่าน");
    }

    // 2) จำลองฟอร์มหลายไฟล์ (เช่น เลือก 3 รูปพร้อมกัน)
    const form = new FormData();
    form.append("kind", "FRONT");
    form.append("caption", "หน้าตรง");
    form.append("file", new Blob([PNG_1PX], { type: "image/png" }), "a.png");
    form.append("file", new Blob([PNG_1PX], { type: "image/png" }), "b.png");

    // อ่านไฟล์จากฟอร์ม (multer-style)
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length !== 2) problems.push(`อ่านไฟล์จากฟอร์มได้ ${files.length} (คาด 2)`);

    const dir = path.join(process.cwd(), "public", "uploads", "smart-police-suspects", suspect.id);
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });

    for (const [i, f] of files.entries()) {
      const buf = Buffer.from(await f.arrayBuffer());
      const kind = detectKind(buf);
      if (!kind) {
        problems.push(`ไฟล์ที่ ${i + 1} ตรวจชนิดไม่ผ่าน`);
        continue;
      }
      const filename = `${Date.now()}-${i}.${kind}`;
      await writeFile(path.join(dir, filename), buf);
      written.push(path.join(dir, filename));
      const created = await prisma.smartPoliceSuspectPhoto.create({
        data: {
          suspectId: suspect.id,
          url: `/uploads/smart-police-suspects/${suspect.id}/${filename}`,
          kind: "FRONT",
          caption: "หน้าตรง",
          bytes: buf.length,
        },
      });
      const dto = mapSuspectPhoto(created);
      if (!dto.url.startsWith("/uploads/")) problems.push("DTO url ผิดรูปแบบ");
      if (dto.hasEmbedding) problems.push("รูปใหม่ไม่ควรมี embedding");
    }

    const rows = await prisma.smartPoliceSuspectPhoto.findMany({ where: { suspectId: suspect.id } });
    if (rows.length !== 2) problems.push(`DB มี ${rows.length} รูป (คาด 2)`);
    const exists = await readFile(written[0]!).then(() => true).catch(() => false);
    if (!exists) problems.push("อ่านไฟล์ที่เขียนกลับไม่ได้");

    console.log(`อัปโหลด 2 ไฟล์ → DB ${rows.length} แถว · ไฟล์จริง ${written.length} ไฟล์ · kind=FRONT caption=หน้าตรง`);
  } finally {
    for (const f of written) await rm(f, { force: true });
    await prisma.smartPoliceSuspect.delete({ where: { id: suspect.id } });
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (multipart หลายไฟล์ · ตรวจชนิดไฟล์ · เขียนลง public/uploads · บันทึก DB)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

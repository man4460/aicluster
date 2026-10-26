/**
 * ตรวจระบบรูปภาพบุคคลต้องสงสัย: ตาราง + ความสัมพันธ์ + ฟิลด์ embedding
 * ใช้: npx tsx scripts/smart-police/verify-suspect-photos.ts
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "../../src/lib/prisma";

// PNG 1x1 โปร่งใส (ใช้ทดสอบการอัปโหลด/อ่านกลับ)
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  const problems: string[] = [];
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");

  const s = await prisma.smartPoliceSuspect.create({
    data: { ownerUserId: owner, fullName: `ทดสอบรูป ${Date.now()}`, riskLevel: "MEDIUM" },
  });

  try {
    // จำลองสิ่งที่ API ทำ: เขียนไฟล์ + สร้าง record
    const dir = path.join(process.cwd(), "public", "uploads", "smart-police-suspects", s.id);
    await mkdir(dir, { recursive: true });
    const filename = `test-${Date.now()}.png`;
    await writeFile(path.join(dir, filename), PNG_1PX);
    const url = `/uploads/smart-police-suspects/${s.id}/${filename}`;

    const photo = await prisma.smartPoliceSuspectPhoto.create({
      data: { suspectId: s.id, url, kind: "FRONT", caption: "ทดสอบ", bytes: PNG_1PX.length },
    });
    await prisma.smartPoliceSuspect.update({ where: { id: s.id }, data: { photoUrl: url } });

    // อ่านกลับแบบเดียวกับ API (include photos)
    const reloaded = await prisma.smartPoliceSuspect.findUnique({
      where: { id: s.id },
      include: { photos: { orderBy: { createdAt: "asc" } } },
    });
    const photos = reloaded?.photos ?? [];

    if (photos.length !== 1) problems.push(`photos = ${photos.length} (คาด 1)`);
    if (photos[0] && photos[0].url !== url) problems.push("url ไม่ตรง");
    if (reloaded?.photoUrl !== url) problems.push("photoUrl หลักไม่ถูกตั้ง");
    if (photos[0]?.faceEmbedding !== null) problems.push("faceEmbedding ควรว่างเริ่มต้น");

    await access(path.join(process.cwd(), "public", url.replace(/^\//, ""))).catch(() => {
      problems.push("ไฟล์รูปไม่ถูกเขียนลง public/uploads");
    });

    // เพิ่มรูปที่ 2 + ใส่ embedding จำลอง (เตรียมค้นหาจากภาพ)
    const photo2 = await prisma.smartPoliceSuspectPhoto.create({
      data: {
        suspectId: s.id,
        url: url.replace(".png", "-2.png"),
        kind: "SIDE",
        faceEmbedding: JSON.stringify([0.1, 0.2, 0.3]),
        embeddingModel: "mock",
      },
    });
    if (!photo2.faceEmbedding) problems.push("บันทึก faceEmbedding ไม่ได้");

    // ลบรูปแรก แล้วตั้งรูปถัดไปเป็นรูปหลัก
    await prisma.smartPoliceSuspectPhoto.delete({ where: { id: photo.id } });
    const next = await prisma.smartPoliceSuspectPhoto.findFirst({
      where: { suspectId: s.id },
      orderBy: { createdAt: "asc" },
    });
    await prisma.smartPoliceSuspect.update({ where: { id: s.id }, data: { photoUrl: next?.url ?? null } });
    const after = await prisma.smartPoliceSuspect.findUnique({ where: { id: s.id } });
    if (after?.photoUrl !== next?.url) problems.push("ตั้งรูปหลักหลังลบไม่ถูก");

    console.log(`บุคคล ${s.id} · รูป ${photos.length} → เพิ่มรูปที่ 2 (embedding) → ลบรูปแรก · รูปหลัก = ${after?.photoUrl}`);
    console.log(`ไฟล์อยู่ที่ public${url}`);
  } finally {
    await prisma.smartPoliceSuspect.delete({ where: { id: s.id } });
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (หลายรูปต่อคน · ช่อง faceEmbedding · รูปหลักอัตโนมัติ)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

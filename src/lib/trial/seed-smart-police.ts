import type { PrismaClient } from "@/generated/prisma/client";
import { nextSmartPoliceCaseNumber } from "@/lib/smart-police/case-number";
import { applySmartPoliceTemplate, buildSmartPolicePrintVars } from "@/lib/smart-police/print";
import {
  ensureSmartPoliceBuiltinTemplates,
  mapSmartPoliceProfile,
} from "@/lib/smart-police/api-owner";
import type { SmartPoliceCaseDetail } from "@/lib/smart-police/types";

/** ตัวอย่างคดีสำหรับบัญชีทดลอง — ข้ามถ้ามีคดีแล้ว */
export async function seedSmartPoliceProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const existing = await prisma.smartPoliceCase.count({ where: { ownerUserId } });
  if (existing > 0) return;

  await prisma.smartPoliceProfile.upsert({
    where: { ownerUserId },
    create: {
      ownerUserId,
      stationName: "สถานีตำรวจตัวอย่าง (ทดลอง)",
      stationAddress: "ถนนตัวอย่าง ตำบลตัวอย่าง อำเภอตัวอย่าง",
      province: "กรุงเทพมหานคร",
      commanderRank: "พ.ต.อ.",
      commanderName: "ผู้กำกับการ (ตัวอย่าง)",
      investigatorDefault: "ร.ต.อ. พนักงานสอบสวน (ตัวอย่าง)",
      caseNumberPrefix: "ส.",
      printFooter: "เอกสารจากระบบ Smart Police บน MAWELL — ตัวอย่างทดลอง",
    },
    update: {},
  });
  await ensureSmartPoliceBuiltinTemplates(ownerUserId);
  const profileRow = await prisma.smartPoliceProfile.findUniqueOrThrow({
    where: { ownerUserId },
  });
  const profile = mapSmartPoliceProfile(profileRow);
  const caseNumber = await nextSmartPoliceCaseNumber(prisma, ownerUserId, profile.caseNumberPrefix);

  const incidentAt = new Date();
  incidentAt.setDate(incidentAt.getDate() - 2);

  const createdCase = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId,
      caseNumber,
      title: "ทดลอง — คดีลักทรัพย์ทรัพย์สินของผู้อื่น",
      caseType: "คดีอาญา",
      status: "IN_PROGRESS",
      incidentAt,
      incidentPlace: "หน้าร้านค้าตัวอย่าง ถนนตัวอย่าง",
      summary: "ผู้กล่าวหาแจ้งว่าถูกลักทรัพย์โทรศัพท์มือถือ — ตัวอย่างสำหรับทดลองพิมพ์สำนวนและหมาย",
      parties: {
        create: [
          {
            role: "COMPLAINANT",
            fullName: "นายสมชาย ใจดี",
            age: 35,
            idCard: "1-2345-67890-12-3",
            address: "99/1 หมู่ 1 ตำบลตัวอย่าง",
            sortOrder: 0,
          },
          {
            role: "SUSPECT",
            fullName: "นายต้องหา (ไม่ทราบชื่อจริง)",
            sortOrder: 1,
          },
        ],
      },
    },
    include: { parties: true, documents: true },
  });

  const narrativeTpl = await prisma.smartPoliceTemplate.findFirst({
    where: { ownerUserId, kind: "NARRATIVE", isBuiltin: true },
    orderBy: { sortOrder: "asc" },
  });
  if (narrativeTpl) {
    const detail: SmartPoliceCaseDetail = {
      id: createdCase.id,
      caseNumber: createdCase.caseNumber,
      title: createdCase.title,
      caseType: createdCase.caseType,
      status: createdCase.status,
      incidentAt: createdCase.incidentAt?.toISOString() ?? null,
      incidentPlace: createdCase.incidentPlace,
      summary: createdCase.summary,
      documentCount: 0,
      partyCount: createdCase.parties.length,
      printCount: 0,
      updatedAt: createdCase.updatedAt.toISOString(),
      parties: createdCase.parties.map((p) => ({
        id: p.id,
        role: p.role,
        fullName: p.fullName,
        age: p.age,
        nationality: p.nationality,
        idCard: p.idCard,
        address: p.address,
        phone: p.phone,
        sortOrder: p.sortOrder,
      })),
      documents: [],
    };
    const vars = buildSmartPolicePrintVars(profile, detail);
    const content = applySmartPoliceTemplate(narrativeTpl.content, vars);
    await prisma.smartPoliceDocument.create({
      data: {
        caseId: createdCase.id,
        kind: "NARRATIVE",
        title: narrativeTpl.name,
        content,
        sortOrder: 0,
      },
    });
  }
}

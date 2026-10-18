import type { PrismaClient } from "@/generated/prisma/client";
import { nextSmartPoliceCaseNumber } from "@/lib/smart-police/case-number";
import { applySmartPoliceTemplate, buildSmartPolicePrintVars } from "@/lib/smart-police/print";
import {
  ensureSmartPoliceBuiltinTemplates,
  mapSmartPoliceProfile,
} from "@/lib/smart-police/api-owner";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";

/** ตัวอย่างคดียาบ้าจุดตรวจ (ตามคู่มือ SmartPolice) — ข้ามถ้ามีคดีแล้ว */
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
      commanderTitle: "ผู้กำกับการ",
      investigatorDefault: "ร.ต.อ. พนักงานสอบสวน (ตัวอย่าง)",
      caseNumberPrefix: "ส.",
      printFooter: "เอกสารจากระบบ Smart Police บน MAWELL — ตัวอย่างทดลอง",
    },
    update: {},
  });
  await ensureSmartPoliceBuiltinTemplates(ownerUserId);

  const officer = await prisma.smartPoliceOfficer.create({
    data: {
      ownerUserId,
      fullName: "พนักงานสอบสวน (ตัวอย่าง)",
      rankTitle: "ร.ต.อ.",
      position: "พนักงานสอบสวน",
      isDefault: true,
      sortOrder: 0,
    },
  });

  const profileRow = await prisma.smartPoliceProfile.findUniqueOrThrow({
    where: { ownerUserId },
  });
  const profile = mapSmartPoliceProfile(profileRow);
  const caseNumber = await nextSmartPoliceCaseNumber(prisma, ownerUserId, profile.caseNumberPrefix);

  const incidentAt = new Date();
  incidentAt.setDate(incidentAt.getDate() - 1);
  const receivedAt = new Date();

  const createdCase = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId,
      caseNumber,
      title: "มียาเสพติดให้โทษประเภท 1(ยาบ้า) ไว้ในครอบครองโดยฝ่าฝืนกฎหมาย",
      caseType: "คดียาเสพติด",
      status: "IN_PROGRESS",
      courtType: "จังหวัด",
      chargeText: "มียาเสพติดให้โทษประเภท 1(ยาบ้า) ไว้ในครอบครองโดยฝ่าฝืนกฎหมาย",
      lawRefs: "พ.ร.บ.ยาเสพติดให้โทษ พ.ศ. 2522",
      receivedAt,
      receivedTimeHm: "09:00",
      custodyMode: "DETAIN_REMAND",
      investigatorOfficerId: officer.id,
      investigationResult: "INVESTIGATING",
      behaviorText:
        "เจ้าหน้าที่ตั้งจุดตรวจ พบผู้ต้องหาขับขี่รถจักรยานยนต์ มียาบ้า 10 เม็ดใต้เบาะ จึงยึดยาบ้าและรถเป็นของกลาง",
      incidentAt,
      incidentPlace: "จุดตรวจตัวอย่าง ถนนตัวอย่าง",
      summary: "ตัวอย่างสำนวนตามคู่มือ SmartPolice — ยาบ้าจุดตรวจ",
      parties: {
        create: [
          {
            role: "COMPLAINANT",
            fullName: "ดาบตำรวจ สมชาย จับกุม",
            age: 40,
            occupation: "รับราชการตำรวจ",
            workplace: "สภ.ตัวอย่าง ตำแหน่ง ผบ.หมู่ ฝ่ายป้องกันปราบปราม",
            caseRelation: "ผู้จับกุมผู้ต้องหาและยึดของกลาง",
            sortOrder: 0,
          },
          {
            role: "WITNESS",
            fullName: "สิบตำรวจโท ร่วมจับกุม",
            age: 32,
            occupation: "รับราชการตำรวจ",
            caseRelation: "ผู้ร่วมจับกุมผู้ต้องหาและยึดของกลาง",
            witnessSide: "COMPLAINANT",
            sortOrder: 1,
          },
          {
            role: "SUSPECT",
            fullName: "นายต้องหา ตัวอย่าง",
            age: 28,
            idCard: "1-2345-67890-12-3",
            pleaStatus: "ปฏิเสธตลอดข้อหา",
            caseRelation: "ผู้รู้เห็นหรือเกี่ยวข้องกับคดี",
            sortOrder: 2,
          },
          {
            role: "WITNESS",
            fullName: "นายเจ้าของรถ ตัวอย่าง",
            age: 45,
            caseRelation: "ผู้ถือกรรมสิทธิ์ในทรัพย์ของกลาง",
            witnessSide: "SUSPECT",
            sortOrder: 3,
          },
        ],
      },
      evidence: {
        create: [
          {
            name: "ยาบ้า",
            quantityLabel: "10 เม็ด",
            seizedFrom: "ใต้เบาะรถจักรยานยนต์ผู้ต้องหา",
            sortOrder: 0,
          },
          {
            name: "รถจักรยานยนต์",
            quantityLabel: "1 คัน",
            seizedFrom: "ผู้ต้องหา",
            ownerName: "นายเจ้าของรถ ตัวอย่าง",
            ownerNote: "ผู้ต้องหายืมไปใช้",
            sortOrder: 1,
          },
        ],
      },
    },
    include: { parties: true, documents: true, evidence: true },
  });

  const narrativeTpl = await prisma.smartPoliceTemplate.findFirst({
    where: { ownerUserId, kind: "NARRATIVE", isBuiltin: true },
    orderBy: { sortOrder: "asc" },
  });
  if (narrativeTpl) {
    const detail = mapSmartPoliceCaseDetail(createdCase);
    const vars = buildSmartPolicePrintVars(profile, detail, {
      investigator: [officer.rankTitle, officer.fullName].filter(Boolean).join(" "),
    });
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

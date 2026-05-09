import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import {
  MEDIA_REGISTRY_BORROW_STATUS,
  MEDIA_REGISTRY_ITEM_STATUS,
} from "@/systems/media-registry/lib/constants";

type DbLike = PrismaClient;

export async function seedMediaRegistryProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  const existing = await db.mediaRegistryItem.count({ where: { ownerUserId } });
  if (existing > 0) return;

  const loc1 = await db.mediaRegistryLocation.create({
    data: {
      ownerUserId,
      building: "อาคารเรียน",
      room: "ห้องสมุด",
      cabinet: "ตู้ A",
      shelf: "ชั้น 1",
      locationDetail: "อาคารเรียน / ห้องสมุด / ตู้ A / ชั้น 1",
      sortOrder: 10,
    },
  });

  const loc2 = await db.mediaRegistryLocation.create({
    data: {
      ownerUserId,
      building: "อาคารเรียน",
      room: "ห้อง 201",
      cabinet: null,
      shelf: null,
      locationDetail: "อาคารเรียน / ห้อง 201",
      sortOrder: 20,
    },
  });

  await db.mediaRegistryMaster.createMany({
    data: [
      { ownerUserId, masterType: "ประเภทสื่อ", masterName: "สื่อสิ่งพิมพ์", sortOrder: 10 },
      { ownerUserId, masterType: "ประเภทสื่อ", masterName: "สื่ออิเล็กทรอนิกส์", sortOrder: 20 },
      { ownerUserId, masterType: "กลุ่มสาระ", masterName: "ภาษาไทย", sortOrder: 30 },
    ],
  });

  const item1 = await db.mediaRegistryItem.create({
    data: {
      ownerUserId,
      registerNo: "MR-2026-0001",
      mediaName: "ชุดหนังสือเรียนคณิต ป.4",
      category: "สื่อสิ่งพิมพ์",
      subjectGroup: "คณิตศาสตร์",
      gradeLevel: "ป.4",
      quantityTotal: 25,
      quantityAvailable: 20,
      unit: "ชุด",
      pricePerUnit: new Prisma.Decimal("120"),
      totalPrice: new Prisma.Decimal("3000"),
      mediaStatus: MEDIA_REGISTRY_ITEM_STATUS.ON_LOAN,
      budgetYear: "2568",
      locationId: loc1.id,
      responsibleTeacher: "ครูตัวอย่าง",
    },
  });

  await db.mediaRegistryItem.create({
    data: {
      ownerUserId,
      registerNo: "MR-2026-0002",
      mediaName: "แผ่นดิจิทัล วิทย์ ป.5",
      category: "สื่ออิเล็กทรอนิกส์",
      subjectGroup: "วิทยาศาสตร์",
      gradeLevel: "ป.5",
      quantityTotal: 10,
      quantityAvailable: 10,
      unit: "แผ่น",
      pricePerUnit: new Prisma.Decimal("350"),
      totalPrice: new Prisma.Decimal("3500"),
      mediaStatus: MEDIA_REGISTRY_ITEM_STATUS.AVAILABLE,
      budgetYear: "2568",
      locationId: loc2.id,
    },
  });

  await db.mediaRegistryBorrow.create({
    data: {
      ownerUserId,
      borrowNo: "BR-DEMO-001",
      mediaId: item1.id,
      mediaName: item1.mediaName,
      borrowerName: "ครูสมชาย ใจดี",
      borrowerType: "ครู",
      quantityBorrow: 5,
      quantityReturn: 0,
      borrowDate: new Date("2026-05-01T12:00:00+07:00"),
      dueDate: new Date("2026-05-15T12:00:00+07:00"),
      purpose: "สอนเชิงรุก ห้อง 4/1",
      borrowStatus: MEDIA_REGISTRY_BORROW_STATUS.ACTIVE,
    },
  });

  await db.mediaRegistryIssue.create({
    data: {
      ownerUserId,
      mediaId: item1.id,
      mediaName: item1.mediaName,
      recordType: "ชำรุด",
      quantityAffected: 1,
      cost: new Prisma.Decimal("0"),
      detail: "ปกหนังสือฉีก — บันทึกตัวอย่างจาก seed",
      recordDate: new Date("2026-05-05T12:00:00+07:00"),
    },
  });
}

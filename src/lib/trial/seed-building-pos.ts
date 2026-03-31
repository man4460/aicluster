import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** เมนูตัวอย่างสำหรับหน้าสั่งอาหาร/แดชบอร์ด POS */
export async function seedBuildingPosTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  const drinks = await tx.buildingPosCategory.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "เครื่องดื่ม (ทดลอง)",
      sortOrder: 10,
      isActive: true,
    },
  });

  const food = await tx.buildingPosCategory.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "อาหารจานหลัก (ทดลอง)",
      sortOrder: 20,
      isActive: true,
    },
  });

  await tx.buildingPosMenuItem.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        categoryId: drinks.id,
        name: "น้ำเปล่า",
        price: 15,
        description: "",
        isActive: true,
        isFeatured: false,
      },
      {
        ownerUserId,
        trialSessionId,
        categoryId: drinks.id,
        name: "ชาเย็น",
        price: 40,
        description: "",
        isActive: true,
        isFeatured: true,
      },
      {
        ownerUserId,
        trialSessionId,
        categoryId: food.id,
        name: "ข้าวผัดกุ้ง",
        price: 89,
        description: "ชุดทดลอง",
        isActive: true,
        isFeatured: true,
      },
    ],
  });
}

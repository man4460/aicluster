import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** แพ็กล้างรถตัวอย่าง */
export async function seedCarWashTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.carWashPackage.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "ล้างสี + ดูดฝุ่น (ทดลอง)",
      price: 199,
      durationMinutes: 45,
      description: "ทดลองคาร์แคร์ — แก้/ลบในแดชบอร์ดได้",
      isActive: true,
    },
  });
}

export async function seedCarWashProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const n = await db.carWashPackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (n > 0) return;
  await db.$transaction((tx) => seedCarWashTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE));
}

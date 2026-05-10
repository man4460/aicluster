import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** แพ็กซักผ้าตัวอย่าง — ใช้ทั้งชุดทดลอง (trial id) และ prod demo */
export async function seedLaundryTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.laundryPackage.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: trialSessionId === TRIAL_PROD_SCOPE ? "ซักรีดด่วน (ตัวอย่าง)" : "ซักรีดด่วน (ทดลอง)",
      pricingModel: "FLAT",
      basePrice: 120,
      durationHours: new Prisma.Decimal("48"),
      description:
        trialSessionId === TRIAL_PROD_SCOPE ?
          "ข้อมูลตัวอย่าง — แก้ไขในแดชบอร์ดได้"
        : "ข้อมูลทดลอง — แก้ไขในแดชบอร์ดได้",
      isActive: true,
    },
  });
}

/** MQTT tenant profile — โค้ดไม่ชนกันทั้งระบบ */
export async function seedMqttProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const existing = await db.mqttTenantProfile.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    select: { id: true },
  });
  if (existing) return;

  const tenantCode = `seed-${ownerUserId}`.slice(0, 64);
  await db.mqttTenantProfile.create({
    data: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      tenantCode,
      displayName: "อุปกรณ์ตัวอย่าง (MQTT)",
      isActive: true,
    },
  });
}

/** แพ็กซักผ้าตัวอย่าง */
export async function seedLaundryProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const n = await db.laundryPackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (n > 0) return;

  await db.$transaction((tx) => seedLaundryTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE));
}

import type { PrismaClient } from "@/generated/prisma/client";
import {
  APPOINTMENT_QUEUE_MODULE_SLUG,
  ASSET_MODULE_SLUG,
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  COMMUNITY_COOP_MODULE_SLUG,
  DOC_TRANSMISSION_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  ECOMMERCE_STORE_MODULE_SLUG,
  EDUCARE_MODULE_SLUG,
  FOOTBALL_TURF_MODULE_SLUG,
  GENERAL_STORE_POS_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  INVENTORY_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  MEDIA_REGISTRY_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  PRO_RESUME_MODULE_SLUG,
  PROMPT_LIBRARY_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
  VAULT_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  WAIT_QUEUE_MODULE_SLUG,
} from "@/lib/modules/config";
import { subscribeModule } from "@/lib/modules/subscriptions-store";
import { seedAppointmentQueueProdDemoForOwner } from "@/lib/trial/seed-appointment-queue";
import { seedAssetProdDemoForOwner } from "@/lib/trial/seed-asset";
import { seedAttendanceProdDemoForOwner } from "@/lib/trial/seed-attendance";
import { fillBarberPortalDemoMedia, seedBarberProdDemoForOwner } from "@/lib/trial/seed-barber";
import { seedBuildingPosProdDemoForOwner } from "@/lib/trial/seed-building-pos";
import { seedCarWashProdDemoForOwner } from "@/lib/trial/seed-car-wash";
import { seedCommunityCoopProdDemoForOwner } from "@/lib/trial/seed-community-coop";
import { seedDocTransmissionProdDemoForOwner } from "@/lib/trial/seed-doc-transmission";
import { seedDormitoryProdDemoForOwner } from "@/lib/trial/seed-dorm";
import { seedDrinkPosProdDemoForOwner } from "@/lib/trial/seed-drink-pos";
import { seedEcommerceStoreProdDemoForOwner } from "@/lib/trial/seed-ecommerce-store";
import { seedEducareProdDemoForOwner } from "@/lib/trial/seed-educare";
import { seedFootballTurfProdDemoForOwner } from "@/lib/trial/seed-football-turf";
import { seedGeneralStorePosProdDemoForOwner } from "@/lib/trial/seed-general-store-pos";
import { seedHomeFinanceProdDemoForOwner } from "@/lib/trial/seed-home-finance";
import { seedHotelResortProdDemoForOwner } from "@/lib/trial/seed-hotel-resort";
import { seedInventoryProdDemoForOwner } from "@/lib/trial/seed-inventory";
import { seedLoyaltyStampProdDemoForOwner } from "@/lib/trial/seed-loyalty-stamp";
import { seedMassageProdDemoForOwner } from "@/lib/trial/seed-massage";
import { seedMediaRegistryProdDemoForOwner } from "@/lib/trial/seed-media-registry";
import {
  seedLaundryProdDemoForOwner,
  seedMqttProdDemoForOwner,
} from "@/lib/trial/seed-mqtt-laundry";
import { seedParkingProdDemoForOwner } from "@/lib/trial/seed-parking";
import { seedPromptLibraryProdDemoForOwner } from "@/lib/trial/seed-prompt-library";
import { seedSchoolBankProdDemoForOwner } from "@/lib/trial/seed-school-bank";
import { seedSmartPoliceProdDemoForOwner } from "@/lib/trial/seed-smart-police";
import { seedVaultProdDemoForOwner } from "@/lib/trial/seed-vault";
import { seedProResumeProdDemoForOwner } from "@/lib/trial/seed-pro-resume";
import { seedVillageProdDemoForOwner } from "@/lib/trial/seed-village";
import { seedWaitQueueProdDemoForOwner } from "@/lib/trial/seed-wait-queue";

/** บัญชี demo เท่านั้น — ห้ามใส่ admin */
export const DEMO_OWNER_EMAILS = ["user@mawell.local.com", "user@mawell.local"] as const;

const SUBSCRIBE_SLUGS = [
  WAIT_QUEUE_MODULE_SLUG,
  APPOINTMENT_QUEUE_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  COMMUNITY_COOP_MODULE_SLUG,
  PROMPT_LIBRARY_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  EDUCARE_MODULE_SLUG,
  ASSET_MODULE_SLUG,
  DOC_TRANSMISSION_MODULE_SLUG,
  MEDIA_REGISTRY_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  ATTENDANCE_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  FOOTBALL_TURF_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
    LAUNDRY_MODULE_SLUG,
    PRO_RESUME_MODULE_SLUG,
    VAULT_MODULE_SLUG,
  INVENTORY_MODULE_SLUG,
  GENERAL_STORE_POS_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  ECOMMERCE_STORE_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
] as const;

export type DemoRefreshLogLine = { ok: boolean; label: string; error?: string };

export type DemoRefreshResult = {
  owners: { email: string; lines: DemoRefreshLogLine[] }[];
  barberPortalMedia: DemoRefreshLogLine;
};

async function trySeed(
  lines: DemoRefreshLogLine[],
  label: string,
  work: () => Promise<void>,
  log?: (msg: string) => void,
): Promise<void> {
  try {
    await work();
    lines.push({ ok: true, label });
    log?.(`  ✓ ${label}`);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    lines.push({ ok: false, label, error });
    log?.(`  ✗ ${label}: ${error}`);
  }
}

/**
 * รีเฟรชข้อมูลตัวอย่างทุกโมดูลให้บัญชี user ทดลอง
 * — โมดูลรายวัน (โรงแรม · คาร์แคร์ · POS ฯลฯ) เคลียร์แล้วใส่ตามวันนี้ (Asia/Bangkok)
 */
export async function runDemoRefreshForOwners(
  prisma: PrismaClient,
  opts?: { log?: (msg: string) => void },
): Promise<DemoRefreshResult> {
  const log = opts?.log;
  log?.("seed:demo-refresh — demo owners only (no admin)");

  for (const slug of SUBSCRIBE_SLUGS) {
    const mod = await prisma.appModule.findUnique({ where: { slug }, select: { id: true } });
    if (!mod) continue;
    for (const email of DEMO_OWNER_EMAILS) {
      const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (row) await subscribeModule(row.id, mod.id);
    }
  }

  const owners: DemoRefreshResult["owners"] = [];

  for (const email of DEMO_OWNER_EMAILS) {
    const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!row) {
      log?.(`skip missing user ${email}`);
      continue;
    }
    const id = row.id;
    const lines: DemoRefreshLogLine[] = [];
    log?.(`\n== ${email} ==`);

    await trySeed(lines, "building-pos", () => seedBuildingPosProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "drink-pos", () => seedDrinkPosProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "general-store-pos", () => seedGeneralStorePosProdDemoForOwner(prisma, id), log);
    await trySeed(
      lines,
      "hotel-resort (daily)",
      () => seedHotelResortProdDemoForOwner(prisma, id, { refreshDaily: true }),
      log,
    );
    await trySeed(lines, "ecommerce-store", () => seedEcommerceStoreProdDemoForOwner(prisma, id), log);

    await trySeed(lines, "car-wash (daily)", () => seedCarWashProdDemoForOwner(prisma, id, { refreshDaily: true }), log);
    await trySeed(lines, "wait-queue (daily)", () => seedWaitQueueProdDemoForOwner(prisma, id, { refreshDaily: true }), log);
    await trySeed(
      lines,
      "appointment-queue (daily)",
      () => seedAppointmentQueueProdDemoForOwner(prisma, id, { refreshDaily: true }),
      log,
    );
    await trySeed(
      lines,
      "football-turf (daily)",
      () => seedFootballTurfProdDemoForOwner(prisma, id, { refreshDaily: true }),
      log,
    );
    await trySeed(lines, "barber (daily)", () => seedBarberProdDemoForOwner(prisma, id, { refreshDaily: true }), log);
    await trySeed(lines, "massage (daily)", () => seedMassageProdDemoForOwner(prisma, id, { refreshDaily: true }), log);
    await trySeed(lines, "parking (daily)", () => seedParkingProdDemoForOwner(prisma, id, { refreshDaily: true }), log);

    await trySeed(lines, "educare", () => seedEducareProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "asset", () => seedAssetProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "doc-transmission", () => seedDocTransmissionProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "prompt-library", () => seedPromptLibraryProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "media-registry", () => seedMediaRegistryProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "loyalty-stamp", () => seedLoyaltyStampProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "school-bank", () => seedSchoolBankProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "community-coop", () => seedCommunityCoopProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "attendance", () => seedAttendanceProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "dormitory", () => seedDormitoryProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "village", () => seedVillageProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "home-finance", () => seedHomeFinanceProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "mqtt", () => seedMqttProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "laundry", () => seedLaundryProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "pro-resume", () => seedProResumeProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "vault", () => seedVaultProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "inventory", () => seedInventoryProdDemoForOwner(prisma, id), log);
    await trySeed(lines, "smart-police", () => seedSmartPoliceProdDemoForOwner(prisma, id), log);

    owners.push({ email, lines });
  }

  const barberPortalMedia: DemoRefreshLogLine = { ok: true, label: "barber portal media fill" };
  try {
    await fillBarberPortalDemoMedia(prisma);
    log?.("\n  ✓ barber portal media fill");
  } catch (e) {
    barberPortalMedia.ok = false;
    barberPortalMedia.error = e instanceof Error ? e.message : String(e);
    log?.(`\n  ✗ barber portal media fill: ${barberPortalMedia.error}`);
  }

  log?.("\nDone.");
  return { owners, barberPortalMedia };
}

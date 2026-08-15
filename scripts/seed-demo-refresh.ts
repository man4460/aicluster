/**
 * เติม/รีเฟรชข้อมูลตัวอย่างทุกโมดูลให้บัญชี user ทดลอง
 * — โมดูลแดชบอร์ดรายวัน (คาร์แคร์ · คิว · สนาม ฯลฯ) เคลียร์วันเก่าแล้วใส่ตามวันนี้ (Asia/Bangkok)
 *
 * รัน: npm run seed:demo-refresh
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
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
  PROMPT_LIBRARY_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
  VAULT_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  WAIT_QUEUE_MODULE_SLUG,
} from "../src/lib/modules/config";
import { subscribeModule } from "../src/lib/modules/subscriptions-store";
import { seedAppointmentQueueProdDemoForOwner } from "../src/lib/trial/seed-appointment-queue";
import { seedAssetProdDemoForOwner } from "../src/lib/trial/seed-asset";
import { seedAttendanceProdDemoForOwner } from "../src/lib/trial/seed-attendance";
import { fillBarberPortalDemoMedia, seedBarberProdDemoForOwner } from "../src/lib/trial/seed-barber";
import { seedBuildingPosProdDemoForOwner } from "../src/lib/trial/seed-building-pos";
import { seedCarWashProdDemoForOwner } from "../src/lib/trial/seed-car-wash";
import { seedCommunityCoopProdDemoForOwner } from "../src/lib/trial/seed-community-coop";
import { seedDocTransmissionProdDemoForOwner } from "../src/lib/trial/seed-doc-transmission";
import { seedDormitoryProdDemoForOwner } from "../src/lib/trial/seed-dorm";
import { seedDrinkPosProdDemoForOwner } from "../src/lib/trial/seed-drink-pos";
import { seedEcommerceStoreProdDemoForOwner } from "../src/lib/trial/seed-ecommerce-store";
import { seedEducareProdDemoForOwner } from "../src/lib/trial/seed-educare";
import { seedFootballTurfProdDemoForOwner } from "../src/lib/trial/seed-football-turf";
import { seedGeneralStorePosProdDemoForOwner } from "../src/lib/trial/seed-general-store-pos";
import { seedHomeFinanceProdDemoForOwner } from "../src/lib/trial/seed-home-finance";
import { seedHotelResortProdDemoForOwner } from "../src/lib/trial/seed-hotel-resort";
import { seedInventoryProdDemoForOwner } from "../src/lib/trial/seed-inventory";
import { seedLoyaltyStampProdDemoForOwner } from "../src/lib/trial/seed-loyalty-stamp";
import { seedMassageProdDemoForOwner } from "../src/lib/trial/seed-massage";
import { seedMediaRegistryProdDemoForOwner } from "../src/lib/trial/seed-media-registry";
import {
  seedLaundryProdDemoForOwner,
  seedMqttProdDemoForOwner,
} from "../src/lib/trial/seed-mqtt-laundry";
import { seedParkingProdDemoForOwner } from "../src/lib/trial/seed-parking";
import { seedPromptLibraryProdDemoForOwner } from "../src/lib/trial/seed-prompt-library";
import { seedSchoolBankProdDemoForOwner } from "../src/lib/trial/seed-school-bank";
import { seedSmartPoliceProdDemoForOwner } from "../src/lib/trial/seed-smart-police";
import { seedVaultProdDemoForOwner } from "../src/lib/trial/seed-vault";
import { seedVillageProdDemoForOwner } from "../src/lib/trial/seed-village";
import { seedWaitQueueProdDemoForOwner } from "../src/lib/trial/seed-wait-queue";

const DEMO_OWNER_EMAILS = ["user@mawell.local.com", "user@mawell.local"] as const;

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
  "football-turf",
  MASSAGE_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  VAULT_MODULE_SLUG,
  INVENTORY_MODULE_SLUG,
  GENERAL_STORE_POS_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  ECOMMERCE_STORE_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
] as const;

const prisma = new PrismaClient();

async function trySeed(label: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`  ✗ ${label}: ${msg}`);
  }
}

async function main() {
  console.log("seed:demo-refresh — demo owners only (no admin)");

  for (const slug of SUBSCRIBE_SLUGS) {
    const mod = await prisma.appModule.findUnique({ where: { slug }, select: { id: true } });
    if (!mod) continue;
    for (const email of DEMO_OWNER_EMAILS) {
      const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (row) await subscribeModule(row.id, mod.id);
    }
  }

  for (const email of DEMO_OWNER_EMAILS) {
    const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!row) {
      console.warn(`skip missing user ${email}`);
      continue;
    }
    const id = row.id;
    console.log(`\n== ${email} ==`);

    await trySeed("building-pos", () => seedBuildingPosProdDemoForOwner(prisma, id));
    await trySeed("drink-pos", () => seedDrinkPosProdDemoForOwner(prisma, id));
    await trySeed("general-store-pos", () => seedGeneralStorePosProdDemoForOwner(prisma, id));
    await trySeed("hotel-resort", () => seedHotelResortProdDemoForOwner(prisma, id));
    await trySeed("ecommerce-store", () => seedEcommerceStoreProdDemoForOwner(prisma, id));

    await trySeed("car-wash (daily)", () => seedCarWashProdDemoForOwner(prisma, id, { refreshDaily: true }));
    await trySeed("wait-queue (daily)", () => seedWaitQueueProdDemoForOwner(prisma, id, { refreshDaily: true }));
    await trySeed("appointment-queue (daily)", () =>
      seedAppointmentQueueProdDemoForOwner(prisma, id, { refreshDaily: true }),
    );
    await trySeed("football-turf (daily)", () =>
      seedFootballTurfProdDemoForOwner(prisma, id, { refreshDaily: true }),
    );
    await trySeed("barber (daily)", () => seedBarberProdDemoForOwner(prisma, id, { refreshDaily: true }));
    await trySeed("massage (daily)", () => seedMassageProdDemoForOwner(prisma, id, { refreshDaily: true }));
    await trySeed("parking (daily)", () => seedParkingProdDemoForOwner(prisma, id, { refreshDaily: true }));

    await trySeed("educare", () => seedEducareProdDemoForOwner(prisma, id));
    await trySeed("asset", () => seedAssetProdDemoForOwner(prisma, id));
    await trySeed("doc-transmission", () => seedDocTransmissionProdDemoForOwner(prisma, id));
    await trySeed("prompt-library", () => seedPromptLibraryProdDemoForOwner(prisma, id));
    await trySeed("media-registry", () => seedMediaRegistryProdDemoForOwner(prisma, id));
    await trySeed("loyalty-stamp", () => seedLoyaltyStampProdDemoForOwner(prisma, id));
    await trySeed("school-bank", () => seedSchoolBankProdDemoForOwner(prisma, id));
    await trySeed("community-coop", () => seedCommunityCoopProdDemoForOwner(prisma, id));
    await trySeed("attendance", () => seedAttendanceProdDemoForOwner(prisma, id));
    await trySeed("dormitory", () => seedDormitoryProdDemoForOwner(prisma, id));
    await trySeed("village", () => seedVillageProdDemoForOwner(prisma, id));
    await trySeed("home-finance", () => seedHomeFinanceProdDemoForOwner(prisma, id));
    await trySeed("mqtt", () => seedMqttProdDemoForOwner(prisma, id));
    await trySeed("laundry", () => seedLaundryProdDemoForOwner(prisma, id));
    await trySeed("vault", () => seedVaultProdDemoForOwner(prisma, id));
    await trySeed("inventory", () => seedInventoryProdDemoForOwner(prisma, id));
    await trySeed("smart-police", () => seedSmartPoliceProdDemoForOwner(prisma, id));
  }

  await trySeed("barber portal media fill", () => fillBarberPortalDemoMedia(prisma));
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

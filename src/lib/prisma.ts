import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { getAuditActor } from "@/lib/audit-context";

/**
 * เพิ่มทุกครั้งที่แก้ schema แล้วต้องการให้ dev โหลด PrismaClient ใหม่
 * (แก้กรณี globalThis.prisma ค้างตัวเก่าหลัง prisma generate — select ฟิลด์ใหม่แล้ว error)
 */
/** เพิ่มทุกครั้งที่ schema / prisma generate เปลี่ยน delegate หรือฟิลด์ที่มีผลต่อ query engine (เช่น barber_stylist.photo_url) */
/** bump เมื่อ schema มีฟิลด์ใหม่ (เช่น module_list.card_image_url) — กันค้าง client เก่าแล้ว ValidationError */
/** 43: home_vehicle_profiles.attachment_urls (Json) — client เก่า reject update({ data: { attachmentUrls } }) */
/** 44: ChatThread + ChatMessage.threadId — client เก่าไม่มี delegate chatThread แล้วแชท API ล้ม */
/** 45: User.passwordHash optional + googleSub (ล็อกอิน Google) */
/** 46: DormitoryCostCategory + DormitoryCostEntry — client เก่าไม่มี delegate แล้ว API ต้นทุนหอพักล้ม */
/** 47: VillageCostCategory + VillageCostEntry — ต้นทุน/รายจ่ายหมู่บ้าน */
/** 48: PersonalAiNote.hiddenFromDigest — ซ่อนโน้ตจากแถบสรุป Chat AI */
const PRISMA_SINGLETON_VERSION = 48;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSingletonVersion?: number;
};

/** ต้องสอดคล้องกับ schema ล่าสุด — delegate ไม่ครบ = ค้าง PrismaClient เก่า แล้วเกิด undefined.findFirst/findMany */
function prismaClientHasExpectedDelegates(client: PrismaClient): boolean {
  const c = client as unknown as {
    appModule?: { findMany?: unknown };
    trialSession?: { findMany?: unknown };
    barberServiceLog?: { findMany?: unknown };
    barberCostCategory?: { findMany?: unknown };
    barberCostEntry?: { findMany?: unknown };
    barberStylist?: { findMany?: unknown };
    dormitoryProfile?: { findUnique?: unknown };
    dormitoryCostCategory?: { findMany?: unknown };
    dormitoryCostEntry?: { findMany?: unknown };
    barberShopProfile?: { findUnique?: unknown };
    barberBooking?: { findMany?: unknown };
    attendanceSettings?: { findUnique?: unknown };
    attendanceLocation?: { findMany?: unknown };
    attendanceShift?: { findMany?: unknown };
    attendanceRosterEntry?: { findMany?: unknown };
    attendanceLog?: { findMany?: unknown };
    homeFinanceEntry?: { findMany?: unknown };
    homeFinanceCategory?: { findMany?: unknown };
    homeUtilityProfile?: { findMany?: unknown };
    homeVehicleProfile?: { findMany?: unknown };
    homeFinanceReminder?: { findMany?: unknown };
    barberPortalStaffPing?: { findMany?: unknown };
    systemActivityLog?: { findMany?: unknown };
    parkingSite?: { findFirst?: unknown };
    parkingSpot?: { findMany?: unknown };
    parkingSession?: { findMany?: unknown };
    buildingPosOrder?: { findMany?: unknown };
    buildingPosStaffLink?: { findUnique?: unknown };
    buildingPosCategory?: { findMany?: unknown };
    buildingPosMenuItem?: { findMany?: unknown };
    buildingPosIngredient?: { findMany?: unknown };
    buildingPosPurchaseOrder?: { findMany?: unknown };
    buildingPosPurchaseLine?: { findMany?: unknown };
    buildingPosMenuRecipeLine?: { findMany?: unknown };
    chatThread?: { findMany?: unknown };
    chatMessage?: { findMany?: unknown };
    villageCostCategory?: { findMany?: unknown };
    villageCostEntry?: { findMany?: unknown };
  };
  return (
    typeof c.appModule?.findMany === "function" &&
    typeof c.trialSession?.findMany === "function" &&
    typeof c.barberServiceLog?.findMany === "function" &&
    typeof c.barberCostCategory?.findMany === "function" &&
    typeof c.barberCostEntry?.findMany === "function" &&
    typeof c.barberStylist?.findMany === "function" &&
    typeof c.dormitoryProfile?.findUnique === "function" &&
    typeof c.dormitoryCostCategory?.findMany === "function" &&
    typeof c.dormitoryCostEntry?.findMany === "function" &&
    typeof c.barberShopProfile?.findUnique === "function" &&
    typeof c.barberBooking?.findMany === "function" &&
    typeof c.attendanceSettings?.findUnique === "function" &&
    typeof c.attendanceLocation?.findMany === "function" &&
    typeof c.attendanceShift?.findMany === "function" &&
    typeof c.attendanceRosterEntry?.findMany === "function" &&
    typeof c.attendanceLog?.findMany === "function" &&
    typeof c.homeFinanceEntry?.findMany === "function" &&
    typeof c.homeFinanceCategory?.findMany === "function" &&
    typeof c.homeUtilityProfile?.findMany === "function" &&
    typeof c.homeVehicleProfile?.findMany === "function" &&
    typeof c.homeFinanceReminder?.findMany === "function" &&
    typeof c.barberPortalStaffPing?.findMany === "function" &&
    typeof c.systemActivityLog?.findMany === "function" &&
    typeof c.parkingSite?.findFirst === "function" &&
    typeof c.parkingSpot?.findMany === "function" &&
    typeof c.parkingSession?.findMany === "function" &&
    typeof c.buildingPosOrder?.findMany === "function" &&
    typeof c.buildingPosStaffLink?.findUnique === "function" &&
    typeof c.buildingPosCategory?.findMany === "function" &&
    typeof c.buildingPosMenuItem?.findMany === "function" &&
    typeof c.buildingPosIngredient?.findMany === "function" &&
    typeof c.buildingPosPurchaseOrder?.findMany === "function" &&
    typeof c.buildingPosPurchaseLine?.findMany === "function" &&
    typeof c.buildingPosMenuRecipeLine?.findMany === "function" &&
    typeof c.chatThread?.findMany === "function" &&
    typeof c.chatMessage?.findMany === "function" &&
    typeof c.villageCostCategory?.findMany === "function" &&
    typeof c.villageCostEntry?.findMany === "function"
  );
}

function parkingDelegatesPresent(client: unknown): boolean {
  const c = client as { parkingSite?: { findFirst?: unknown } };
  return typeof c.parkingSite?.findFirst === "function";
}

function getPrisma(): PrismaClient {
  let client = globalForPrisma.prisma;
  if (
    globalForPrisma.prismaSingletonVersion === PRISMA_SINGLETON_VERSION &&
    client !== undefined &&
    prismaClientHasExpectedDelegates(client)
  ) {
    return client;
  }

  if (client) {
    client.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaSingletonVersion = undefined;
  }

  const base = new PrismaClient();
  if (!prismaClientHasExpectedDelegates(base)) {
    void base.$disconnect().catch(() => {});
    throw new Error(
      "Prisma client ไม่ครบโมเดลล่าสุด (เช่น ต้นทุนหอพัก) — รัน `npx prisma generate` ที่รากโปรเจกต์ แล้ว `npx prisma migrate deploy` (หรือ migrate dev) จากนั้นลบ `.next` และรีสตาร์ทเซิร์ฟเวอร์",
    );
  }
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          const writeOps = new Set([
            "create",
            "update",
            "upsert",
            "delete",
            "createMany",
            "updateMany",
            "deleteMany",
          ]);
          if (!writeOps.has(operation)) return result;
          if (!model || model === "SystemActivityLog") return result;

          const actorUserId = getAuditActor() ?? null;
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          const actionMap: Record<string, string> = {
            create: "CREATE",
            update: "UPDATE",
            upsert: "UPSERT",
            delete: "DELETE",
            createMany: "CREATE_MANY",
            updateMany: "UPDATE_MANY",
            deleteMany: "DELETE_MANY",
          };

          try {
            const safeArgs =
              args && typeof args === "object"
                ? JSON.parse(JSON.stringify(args))
                : null;
            const p = base as unknown as {
              systemActivityLog?: { create?: (input: unknown) => Promise<unknown> };
              $executeRawUnsafe?: (query: string, ...values: unknown[]) => Promise<unknown>;
            };
            if (typeof p.systemActivityLog?.create === "function") {
              await p.systemActivityLog.create({
                data: {
                  actorUserId,
                  action: actionMap[operation] ?? "UPDATE",
                  modelName: model,
                  payload: safeArgs,
                  expiresAt,
                },
              });
            } else if (typeof p.$executeRawUnsafe === "function") {
              await p.$executeRawUnsafe(
                "INSERT INTO `system_activity_logs` (`actor_user_id`, `action`, `model_name`, `payload`, `created_at`, `expires_at`) VALUES (?, ?, ?, ?, NOW(3), ?)",
                actorUserId,
                actionMap[operation] ?? "UPDATE",
                model,
                safeArgs ? JSON.stringify(safeArgs) : null,
                expiresAt,
              );
            }
          } catch {
            // Ignore audit write errors to avoid blocking user operations.
          }
          return result;
        },
      },
    },
  }) as PrismaClient;

  if (parkingDelegatesPresent(extended)) {
    client = extended;
  } else if (parkingDelegatesPresent(base)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[prisma] client หลัง $extends ไม่มี parkingSite — ใช้ PrismaClient ฐาน (hook audit ผ่าน query extension ไม่ทำงานบน instance นี้)",
      );
    }
    client = base as PrismaClient;
  } else {
    void base.$disconnect().catch(() => {});
    throw new Error(
      "Prisma client ไม่มีโมเดล parking — รัน `npx prisma generate` ที่รากโปรเจกต์ แล้วลบ `.next` และรีสตาร์ทเซิร์ฟเวอร์",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSingletonVersion = PRISMA_SINGLETON_VERSION;
  }
  return client;
}

export const prisma = getPrisma();

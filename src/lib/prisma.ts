import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { getAuditActor } from "@/lib/audit-context";

/**
 * เพิ่มทุกครั้งที่แก้ schema แล้วต้องการให้ dev โหลด PrismaClient ใหม่
 * (แก้กรณี globalThis.prisma ค้างตัวเก่าหลัง prisma generate — select ฟิลด์ใหม่แล้ว error)
 */
const PRISMA_SINGLETON_VERSION = 30;

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
    barberStylist?: { findMany?: unknown };
    dormitoryProfile?: { findUnique?: unknown };
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
  };
  return (
    typeof c.appModule?.findMany === "function" &&
    typeof c.trialSession?.findMany === "function" &&
    typeof c.barberServiceLog?.findMany === "function" &&
    typeof c.barberStylist?.findMany === "function" &&
    typeof c.dormitoryProfile?.findUnique === "function" &&
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
    typeof c.buildingPosOrder?.findMany === "function"
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

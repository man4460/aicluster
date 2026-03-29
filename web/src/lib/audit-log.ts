import { prisma } from "@/lib/prisma";

type Action =
  | "CREATE"
  | "UPDATE"
  | "UPSERT"
  | "DELETE"
  | "CREATE_MANY"
  | "UPDATE_MANY"
  | "DELETE_MANY";

export async function writeSystemActivityLog(input: {
  actorUserId: string | null;
  action: Action;
  modelName: string;
  payload?: unknown;
}) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);
  const p = prisma as unknown as {
    systemActivityLog?: { create?: (input: unknown) => Promise<unknown> };
    $executeRawUnsafe?: (query: string, ...values: unknown[]) => Promise<unknown>;
  };
  try {
    if (typeof p.systemActivityLog?.create === "function") {
      await p.systemActivityLog.create({
        data: {
          actorUserId: input.actorUserId,
          action: input.action,
          modelName: input.modelName,
          payload: input.payload ?? null,
          expiresAt,
        },
      });
      return;
    }
    if (typeof p.$executeRawUnsafe === "function") {
      await p.$executeRawUnsafe(
        "INSERT INTO `system_activity_logs` (`actor_user_id`, `action`, `model_name`, `payload`, `created_at`, `expires_at`) VALUES (?, ?, ?, ?, NOW(3), ?)",
        input.actorUserId,
        input.action,
        input.modelName,
        input.payload ? JSON.stringify(input.payload) : null,
        expiresAt,
      );
    }
  } catch {
    // Never block core business operation because of logging failure.
  }
}

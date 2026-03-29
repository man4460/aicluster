import { prisma } from "@/lib/prisma";
import { MODULE_RESUBSCRIBE_COOLDOWN_MS } from "@/lib/modules/module-subscription-cooldown";

export { MODULE_RESUBSCRIBE_COOLDOWN_MS } from "@/lib/modules/module-subscription-cooldown";

let ensured = false;
let cooldownEnsured = false;

async function ensureTable() {
  if (ensured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_module_subscriptions (
      id INT NOT NULL AUTO_INCREMENT,
      user_id VARCHAR(191) NOT NULL,
      module_id VARCHAR(191) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_module (user_id, module_id),
      KEY idx_user_id (user_id),
      KEY idx_module_id (module_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  ensured = true;
}

async function ensureCooldownTable() {
  if (cooldownEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_module_unsubscribe_cooldowns (
      id INT NOT NULL AUTO_INCREMENT,
      user_id VARCHAR(191) NOT NULL,
      module_id VARCHAR(191) NOT NULL,
      unsubscribed_at DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_module_cd (user_id, module_id),
      KEY idx_user_cd_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  cooldownEnsured = true;
}

export async function listSubscribedModuleIds(userId: string): Promise<string[]> {
  await ensureTable();
  const rows = (await prisma.$queryRawUnsafe(
    "SELECT module_id AS moduleId FROM user_module_subscriptions WHERE user_id = ? ORDER BY id DESC",
    userId,
  )) as Array<{ moduleId: string }>;
  return rows.map((r) => r.moduleId);
}

export async function subscribeModule(userId: string, moduleId: string): Promise<void> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    "INSERT IGNORE INTO user_module_subscriptions (user_id, module_id) VALUES (?, ?)",
    userId,
    moduleId,
  );
}

export async function unsubscribeModule(userId: string, moduleId: string): Promise<void> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    "DELETE FROM user_module_subscriptions WHERE user_id = ? AND module_id = ?",
    userId,
    moduleId,
  );
  await recordUnsubscribeCooldown(userId, moduleId);
}

/** บันทึกเวลายกเลิก Subscribe — ใช้คำนวณช่วงห้าม Subscribe/ทดลองซ้ำ */
export async function recordUnsubscribeCooldown(userId: string, moduleId: string): Promise<void> {
  await ensureCooldownTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO user_module_unsubscribe_cooldowns (user_id, module_id, unsubscribed_at)
     VALUES (?, ?, NOW(3))
     ON DUPLICATE KEY UPDATE unsubscribed_at = VALUES(unsubscribed_at)`,
    userId,
    moduleId,
  );
}

export type ModuleCooldownState = { locked: boolean; unlockAt: Date | null };

export async function getModuleResubscribeCooldown(
  userId: string,
  moduleId: string,
): Promise<ModuleCooldownState> {
  await ensureCooldownTable();
  const rows = (await prisma.$queryRawUnsafe(
    "SELECT unsubscribed_at AS unsubscribedAt FROM user_module_unsubscribe_cooldowns WHERE user_id = ? AND module_id = ?",
    userId,
    moduleId,
  )) as Array<{ unsubscribedAt: Date }>;
  if (!rows.length) return { locked: false, unlockAt: null };
  const at = new Date(rows[0].unsubscribedAt);
  const unlockAt = new Date(at.getTime() + MODULE_RESUBSCRIBE_COOLDOWN_MS);
  const now = new Date();
  if (unlockAt <= now) return { locked: false, unlockAt: null };
  return { locked: true, unlockAt };
}

/** รายการ module ที่ยังอยู่ในช่วงล็อค พร้อมเวลาปลดล็อค (ISO) */
export async function listActiveResubscribeCooldowns(
  userId: string,
): Promise<Array<{ moduleId: string; unlockAtIso: string }>> {
  await ensureCooldownTable();
  const rows = (await prisma.$queryRawUnsafe(
    "SELECT module_id AS moduleId, unsubscribed_at AS unsubscribedAt FROM user_module_unsubscribe_cooldowns WHERE user_id = ?",
    userId,
  )) as Array<{ moduleId: string; unsubscribedAt: Date }>;
  const now = Date.now();
  const out: Array<{ moduleId: string; unlockAtIso: string }> = [];
  for (const r of rows) {
    const unlockAt = new Date(new Date(r.unsubscribedAt).getTime() + MODULE_RESUBSCRIBE_COOLDOWN_MS);
    if (unlockAt.getTime() > now) {
      out.push({ moduleId: r.moduleId, unlockAtIso: unlockAt.toISOString() });
    }
  }
  return out;
}

export type AdminResubscribeCooldownEntry = {
  userId: string;
  email: string;
  username: string;
  moduleId: string;
  moduleTitle: string;
  slug: string;
  unlockAtIso: string;
  unsubscribedAtIso: string;
};

/** รายการล็อค Subscribe หลัง Unsubscribe ทั้งหมด (ยังไม่ครบ 30 วัน) — สำหรับหน้าแอดมิน */
export async function listAllActiveResubscribeCooldownsForAdmin(): Promise<AdminResubscribeCooldownEntry[]> {
  await ensureCooldownTable();
  const raw = (await prisma.$queryRawUnsafe(
    `SELECT user_id AS userId, module_id AS moduleId, unsubscribed_at AS unsubscribedAt
     FROM user_module_unsubscribe_cooldowns`,
  )) as Array<{ userId: string; moduleId: string; unsubscribedAt: Date }>;
  const now = Date.now();
  const active = raw.filter((r) => {
    const unlockAt = new Date(new Date(r.unsubscribedAt).getTime() + MODULE_RESUBSCRIBE_COOLDOWN_MS);
    return unlockAt.getTime() > now;
  });
  if (active.length === 0) return [];

  const userIds = [...new Set(active.map((r) => r.userId))];
  const moduleIds = [...new Set(active.map((r) => r.moduleId))];
  const [users, modules] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, username: true },
    }),
    prisma.appModule.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, title: true, slug: true },
    }),
  ]);
  const uMap = new Map(users.map((u) => [u.id, u]));
  const mMap = new Map(modules.map((m) => [m.id, m]));

  return active.map((r) => {
    const unlockAt = new Date(new Date(r.unsubscribedAt).getTime() + MODULE_RESUBSCRIBE_COOLDOWN_MS);
    const u = uMap.get(r.userId);
    const mod = mMap.get(r.moduleId);
    return {
      userId: r.userId,
      email: u?.email ?? r.userId,
      username: u?.username ?? "—",
      moduleId: r.moduleId,
      moduleTitle: mod?.title ?? r.moduleId,
      slug: mod?.slug ?? "",
      unlockAtIso: unlockAt.toISOString(),
      unsubscribedAtIso: new Date(r.unsubscribedAt).toISOString(),
    };
  });
}

/** แอดมินปลดล็อคหลัง Unsubscribe — ลบระเบียบรอ 1 เดือน */
export async function deleteResubscribeCooldown(userId: string, moduleId: string): Promise<void> {
  await ensureCooldownTable();
  await prisma.$executeRawUnsafe(
    "DELETE FROM user_module_unsubscribe_cooldowns WHERE user_id = ? AND module_id = ?",
    userId,
    moduleId,
  );
}

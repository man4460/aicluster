import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function dateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prisma } = await import("@/lib/prisma");
  const u = new URL(req.url);
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  const modelName = (u.searchParams.get("modelName") ?? "").trim();
  const action = (u.searchParams.get("action") ?? "").trim();
  const page = Math.max(1, Number(u.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(10, Number(u.searchParams.get("pageSize") ?? "30") || 30));

  const fromD = from ? dateOnly(from) : null;
  const toD = to ? dateOnly(to) : null;
  const toNext = toD ? new Date(toD.getTime() + 24 * 60 * 60 * 1000) : null;

  const logsDelegate = (prisma as unknown as {
    systemActivityLog: {
      findMany: (args: unknown) => Promise<unknown[]>;
      count: (args: unknown) => Promise<number>;
      deleteMany: (args: unknown) => Promise<unknown>;
    };
    $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown[]>;
    $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  });

  // Retention: prune logs older than 1 year on each read.
  const now = new Date();
  if (logsDelegate.systemActivityLog?.deleteMany) {
    await logsDelegate.systemActivityLog.deleteMany({ where: { expiresAt: { lt: now } } });
  } else {
    await logsDelegate.$executeRawUnsafe("DELETE FROM `system_activity_logs` WHERE `expires_at` < ?", now);
  }

  const where = {
    ...(fromD || toNext
      ? {
          createdAt: {
            ...(fromD ? { gte: fromD } : {}),
            ...(toNext ? { lt: toNext } : {}),
          },
        }
      : {}),
    ...(modelName ? { modelName } : {}),
    ...(action ? { action } : {}),
  };

  let rows: unknown[] = [];
  let total = 0;
  if (logsDelegate.systemActivityLog?.findMany && logsDelegate.systemActivityLog?.count) {
    [rows, total] = await Promise.all([
      logsDelegate.systemActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          actorUserId: true,
          action: true,
          modelName: true,
          payload: true,
          createdAt: true,
        },
      }),
      logsDelegate.systemActivityLog.count({ where }),
    ]);
  } else {
    const filters: string[] = [];
    const values: unknown[] = [];
    if (fromD) {
      filters.push("`created_at` >= ?");
      values.push(fromD);
    }
    if (toNext) {
      filters.push("`created_at` < ?");
      values.push(toNext);
    }
    if (modelName) {
      filters.push("`model_name` = ?");
      values.push(modelName);
    }
    if (action) {
      filters.push("`action` = ?");
      values.push(action);
    }
    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const dataRows = await logsDelegate.$queryRawUnsafe(
      `SELECT id, actor_user_id AS actorUserId, action, model_name AS modelName, payload, created_at AS createdAt
       FROM system_activity_logs ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      ...values,
      pageSize,
      offset,
    );
    const countRows = (await logsDelegate.$queryRawUnsafe(
      `SELECT COUNT(*) AS total FROM system_activity_logs ${whereSql}`,
      ...values,
    )) as Array<{ total: number | bigint }>;
    rows = dataRows;
    total = Number(countRows[0]?.total ?? 0);
  }

  const normalizedRows = (rows as Array<Record<string, unknown>>).map((r) => ({
    id: typeof r.id === "bigint" ? r.id.toString() : r.id,
    actorUserId: (r.actorUserId ?? null) as string | null,
    action: String(r.action ?? ""),
    modelName: String(r.modelName ?? ""),
    payload: (r.payload ?? null) as unknown,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : typeof r.createdAt === "string"
          ? r.createdAt
          : new Date(String(r.createdAt ?? new Date().toISOString())).toISOString(),
  }));

  return NextResponse.json({
    items: normalizedRows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

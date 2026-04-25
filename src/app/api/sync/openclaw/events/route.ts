import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { writeSystemActivityLog } from "@/lib/audit-log";

const noteItemSchema = z.object({
  type: z.literal("note"),
  externalId: z.string().min(1).max(128),
  op: z.enum(["upsert", "delete"]).default("upsert"),
  content: z.string().min(1).max(4000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  hiddenFromDigest: z.boolean().optional(),
  syncedAt: z.string().datetime().optional(),
});

const planItemSchema = z.object({
  type: z.literal("plan"),
  externalId: z.string().min(1).max(128),
  op: z.enum(["upsert", "delete"]).default("upsert"),
  title: z.string().min(1).max(200).optional(),
  steps: z.array(z.string().min(1).max(300)).max(100).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  syncedAt: z.string().datetime().optional(),
});

const financeItemSchema = z.object({
  type: z.literal("finance"),
  externalId: z.string().min(1).max(128),
  op: z.enum(["upsert", "delete"]).default("upsert"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  entryType: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive().optional(),
  title: z.string().min(1).max(160).optional(),
  categoryKey: z.string().min(1).max(64).optional(),
  categoryLabel: z.string().min(1).max(100).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  billNumber: z.string().max(100).nullable().optional(),
  vehicleType: z.string().max(40).nullable().optional(),
  serviceCenter: z.string().max(160).nullable().optional(),
  paymentMethod: z.string().max(40).nullable().optional(),
  note: z.string().max(600).nullable().optional(),
  slipImageUrl: z.string().max(512).nullable().optional(),
  attachmentUrls: z.array(z.string().max(512)).max(20).optional(),
  syncedAt: z.string().datetime().optional(),
});

const bodySchema = z.object({
  source: z.string().min(1).max(40).default("openclaw"),
  ownerUserId: z.string().min(1).max(191),
  requestId: z.string().max(128).optional(),
  events: z.array(z.union([noteItemSchema, planItemSchema, financeItemSchema])).min(1).max(500),
});

function readBearerToken(req: Request): string {
  const v = req.headers.get("authorization")?.trim() ?? "";
  if (!v.toLowerCase().startsWith("bearer ")) return "";
  return v.slice(7).trim();
}

function readSyncSecret(req: Request): string {
  return req.headers.get("x-openclaw-sync-secret")?.trim() || readBearerToken(req);
}

function parseSyncedAt(raw?: string): Date {
  const dt = raw ? new Date(raw) : new Date();
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

function toJsonArray(input: string[] | undefined, fallbackFirst: string | null | undefined): Prisma.InputJsonValue {
  if (Array.isArray(input) && input.length > 0) return input.slice(0, 20);
  if (fallbackFirst && fallbackFirst.trim()) return [fallbackFirst.trim()];
  return [];
}

type SyncResultItem = {
  type: "note" | "plan" | "finance";
  externalId: string;
  op: "upsert" | "delete";
  status: "ok" | "error";
  localId?: string | number;
  error?: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function verifySyncSecret(req: Request): NextResponse | null {
  const expected = process.env.OPENCLAW_SYNC_SECRET?.trim() || "";
  if (!expected) {
    return NextResponse.json({ error: "OPENCLAW_SYNC_SECRET is not configured" }, { status: 500 });
  }
  if (readSyncSecret(req) !== expected) {
    return NextResponse.json({ error: "invalid sync secret" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const authError = verifySyncSecret(req);
  if (authError) return authError;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `invalid payload: ${issue?.message ?? "unknown error"}` }, { status: 400 });
  }

  const { source, ownerUserId, events, requestId } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "ownerUserId not found" }, { status: 404 });
  }

  if (requestId) {
    try {
      await prisma.openClawSyncRequest.create({
        data: { ownerUserId, source, requestId },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({
          ok: true,
          deduped: true,
          source,
          ownerUserId,
          requestId,
          summary: { total: 0, ok: 0, error: 0 },
          results: [],
        });
      }
      throw error;
    }
  }

  const results: SyncResultItem[] = [];

  for (const event of events) {
    try {
      if (event.type === "note") {
        if (event.op === "delete") {
          await prisma.personalAiNote.deleteMany({
            where: { userId: ownerUserId, externalSource: source, externalId: event.externalId },
          });
          results.push({ type: "note", externalId: event.externalId, op: "delete", status: "ok" });
          continue;
        }
        if (!event.content?.trim()) throw new Error("content is required for note upsert");
        const found = await prisma.personalAiNote.findFirst({
          where: { userId: ownerUserId, externalSource: source, externalId: event.externalId },
          select: { id: true },
        });
        const syncedAt = parseSyncedAt(event.syncedAt);
        const data = {
          content: event.content.trim(),
          tags: (event.tags ?? []) as Prisma.InputJsonValue,
          hiddenFromDigest: event.hiddenFromDigest ?? false,
          lastSyncedAt: syncedAt,
        };
        const row = found
          ? await prisma.personalAiNote.update({ where: { id: found.id }, data, select: { id: true } })
          : await prisma.personalAiNote.create({
              data: { userId: ownerUserId, externalSource: source, externalId: event.externalId, ...data },
              select: { id: true },
            });
        results.push({ type: "note", externalId: event.externalId, op: "upsert", status: "ok", localId: row.id });
        continue;
      }

      if (event.type === "plan") {
        if (event.op === "delete") {
          await prisma.personalAiPlan.deleteMany({
            where: { userId: ownerUserId, externalSource: source, externalId: event.externalId },
          });
          results.push({ type: "plan", externalId: event.externalId, op: "delete", status: "ok" });
          continue;
        }
        if (!event.title?.trim()) throw new Error("title is required for plan upsert");
        const found = await prisma.personalAiPlan.findFirst({
          where: { userId: ownerUserId, externalSource: source, externalId: event.externalId },
          select: { id: true },
        });
        const syncedAt = parseSyncedAt(event.syncedAt);
        const dueDate = event.dueDate == null ? null : new Date(event.dueDate);
        if (dueDate && Number.isNaN(dueDate.getTime())) throw new Error("invalid dueDate");
        const data = {
          title: event.title.trim(),
          steps: (event.steps ?? [event.title.trim()]) as Prisma.InputJsonValue,
          status: event.status ?? "TODO",
          dueDate,
          lastSyncedAt: syncedAt,
        };
        const row = found
          ? await prisma.personalAiPlan.update({ where: { id: found.id }, data, select: { id: true } })
          : await prisma.personalAiPlan.create({
              data: { userId: ownerUserId, externalSource: source, externalId: event.externalId, ...data },
              select: { id: true },
            });
        results.push({ type: "plan", externalId: event.externalId, op: "upsert", status: "ok", localId: row.id });
        continue;
      }

      if (event.op === "delete") {
        await prisma.homeFinanceEntry.deleteMany({
          where: { ownerUserId, externalSource: source, externalId: event.externalId },
        });
        results.push({ type: "finance", externalId: event.externalId, op: "delete", status: "ok" });
        continue;
      }
      if (!event.entryDate) throw new Error("entryDate is required for finance upsert");
      if (!event.entryType) throw new Error("entryType is required for finance upsert");
      if (!event.amount) throw new Error("amount is required for finance upsert");
      if (!event.title?.trim()) throw new Error("title is required for finance upsert");
      if (!event.categoryKey?.trim()) throw new Error("categoryKey is required for finance upsert");
      if (!event.categoryLabel?.trim()) throw new Error("categoryLabel is required for finance upsert");
      const entryDate = parseYmdToDbDate(event.entryDate);
      if (!entryDate) throw new Error("invalid entryDate");
      const dueDate = event.dueDate == null ? null : parseYmdToDbDate(event.dueDate);
      if (event.dueDate && !dueDate) throw new Error("invalid dueDate");
      const found = await prisma.homeFinanceEntry.findFirst({
        where: { ownerUserId, externalSource: source, externalId: event.externalId },
        select: { id: true },
      });
      const syncedAt = parseSyncedAt(event.syncedAt);
      const data = {
        entryDate,
        type: event.entryType,
        amount: event.amount,
        title: event.title.trim(),
        categoryKey: event.categoryKey.trim(),
        categoryLabel: event.categoryLabel.trim(),
        dueDate,
        billNumber: event.billNumber?.trim() || null,
        vehicleType: event.vehicleType?.trim() || null,
        serviceCenter: event.serviceCenter?.trim() || null,
        paymentMethod: event.paymentMethod?.trim() || null,
        note: event.note?.trim() || null,
        slipImageUrl: event.slipImageUrl?.trim() || null,
        attachmentUrls: toJsonArray(event.attachmentUrls, event.slipImageUrl ?? null),
        linkedUtilityId: null,
        linkedVehicleId: null,
        lastSyncedAt: syncedAt,
      };
      const row = found
        ? await prisma.homeFinanceEntry.update({ where: { id: found.id }, data, select: { id: true } })
        : await prisma.homeFinanceEntry.create({
            data: { ownerUserId, externalSource: source, externalId: event.externalId, ...data },
            select: { id: true },
          });
      results.push({ type: "finance", externalId: event.externalId, op: "upsert", status: "ok", localId: row.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      results.push({
        type: event.type,
        externalId: event.externalId,
        op: event.op,
        status: "error",
        error: message,
      });
    }
  }

  await writeSystemActivityLog({
    actorUserId: ownerUserId,
    action: "UPSERT",
    modelName: "OpenClawSyncEvent",
    payload: { source, ownerUserId, requestId: requestId ?? null, total: events.length, results },
  });

  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.length - okCount;

  return NextResponse.json({
    ok: errorCount === 0,
    source,
    ownerUserId,
    requestId: requestId ?? null,
    summary: { total: results.length, ok: okCount, error: errorCount },
    results,
  });
}

export async function GET(req: Request) {
  const authError = verifySyncSecret(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const ownerUserId = (searchParams.get("ownerUserId") ?? "").trim();
  const source = (searchParams.get("source") ?? "openclaw").trim();
  const externalId = (searchParams.get("externalId") ?? "").trim();
  const type = (searchParams.get("type") ?? "").trim().toLowerCase();
  const requestId = (searchParams.get("requestId") ?? "").trim();
  const rawLimit = Number(searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.floor(rawLimit))) : 30;

  if (!ownerUserId) {
    return NextResponse.json({ error: "ownerUserId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "ownerUserId not found" }, { status: 404 });
  }

  const noteWhere = {
    userId: ownerUserId,
    externalSource: source,
    ...(externalId ? { externalId } : {}),
  };
  const planWhere = {
    userId: ownerUserId,
    externalSource: source,
    ...(externalId ? { externalId } : {}),
  };
  const financeWhere = {
    ownerUserId,
    externalSource: source,
    ...(externalId ? { externalId } : {}),
  };

  const [notes, plans, finances, requestsRaw] = await Promise.all([
    type && type !== "note"
      ? Promise.resolve([])
      : prisma.personalAiNote.findMany({
          where: noteWhere,
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            externalSource: true,
            externalId: true,
            content: true,
            hiddenFromDigest: true,
            lastSyncedAt: true,
            updatedAt: true,
          },
        }),
    type && type !== "plan"
      ? Promise.resolve([])
      : prisma.personalAiPlan.findMany({
          where: planWhere,
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            externalSource: true,
            externalId: true,
            title: true,
            status: true,
            dueDate: true,
            lastSyncedAt: true,
            updatedAt: true,
          },
        }),
    type && type !== "finance"
      ? Promise.resolve([])
      : prisma.homeFinanceEntry.findMany({
          where: financeWhere,
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            externalSource: true,
            externalId: true,
            entryDate: true,
            type: true,
            amount: true,
            title: true,
            categoryKey: true,
            categoryLabel: true,
            lastSyncedAt: true,
            updatedAt: true,
          },
        }),
    prisma.openClawSyncRequest.findMany({
      where: {
        ownerUserId,
        source,
        ...(requestId ? { requestId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        requestId: true,
        source: true,
        createdAt: true,
      },
    }),
  ]);

  const requests = requestsRaw.map((r) => ({
    ...r,
    id: r.id.toString(),
  }));

  return NextResponse.json({
    ok: true,
    source,
    ownerUserId,
    filters: { type: type || null, externalId: externalId || null, requestId: requestId || null, limit },
    counts: {
      notes: notes.length,
      plans: plans.length,
      finances: finances.length,
      requests: requests.length,
    },
    notes,
    plans,
    finances,
    requests,
  });
}

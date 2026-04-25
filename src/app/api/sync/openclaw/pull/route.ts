import { NextResponse } from "next/server";
import { z } from "zod";
import { POST as applySyncEventsPost } from "@/app/api/sync/openclaw/events/route";

const pullBodySchema = z.object({
  ownerUserId: z.string().min(1).max(191),
  source: z.string().min(1).max(40).default("openclaw"),
  sinceIso: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

const pulledEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    externalId: z.string().min(1).max(128),
    op: z.enum(["upsert", "delete"]).default("upsert"),
    content: z.string().min(1).max(4000).optional(),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    hiddenFromDigest: z.boolean().optional(),
    syncedAt: z.string().datetime().optional(),
  }),
  z.object({
    type: z.literal("plan"),
    externalId: z.string().min(1).max(128),
    op: z.enum(["upsert", "delete"]).default("upsert"),
    title: z.string().min(1).max(200).optional(),
    steps: z.array(z.string().min(1).max(300)).max(100).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    syncedAt: z.string().datetime().optional(),
  }),
  z.object({
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
  }),
]);

const pulledPayloadSchema = z.object({
  source: z.string().min(1).max(40).optional(),
  requestId: z.string().max(128).optional(),
  events: z.array(pulledEventSchema).min(1).max(1000),
});

function readBearerToken(req: Request): string {
  const v = req.headers.get("authorization")?.trim() ?? "";
  if (!v.toLowerCase().startsWith("bearer ")) return "";
  return v.slice(7).trim();
}

function readSyncSecret(req: Request): string {
  return req.headers.get("x-openclaw-sync-secret")?.trim() || readBearerToken(req);
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

  const parsedBody = pullBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "invalid pull body" }, { status: 400 });
  }

  const pullUrl = process.env.OPENCLAW_SYNC_PULL_URL?.trim() || "";
  if (!pullUrl) {
    return NextResponse.json({ error: "OPENCLAW_SYNC_PULL_URL is not configured" }, { status: 500 });
  }

  const remoteSecret =
    process.env.OPENCLAW_REMOTE_SYNC_SECRET?.trim() || process.env.OPENCLAW_SYNC_SECRET?.trim() || "";
  const remoteBearer = process.env.OPENCLAW_SYNC_PULL_BEARER?.trim() || "";
  const queryUrl = new URL(pullUrl);
  queryUrl.searchParams.set("ownerUserId", parsedBody.data.ownerUserId);
  if (parsedBody.data.sinceIso) queryUrl.searchParams.set("sinceIso", parsedBody.data.sinceIso);
  if (parsedBody.data.limit != null) queryUrl.searchParams.set("limit", String(parsedBody.data.limit));

  let remoteJson: unknown;
  try {
    const remoteRes = await fetch(queryUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(remoteSecret ? { "x-openclaw-sync-secret": remoteSecret } : {}),
        ...(remoteBearer ? { Authorization: `Bearer ${remoteBearer}` } : {}),
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!remoteRes.ok) {
      const text = await remoteRes.text();
      return NextResponse.json(
        { error: `remote pull failed (${remoteRes.status})`, detail: text.slice(0, 500) },
        { status: 502 },
      );
    }
    remoteJson = await remoteRes.json();
  } catch (error) {
    return NextResponse.json(
      { error: "remote pull failed", detail: error instanceof Error ? error.message : "unknown error" },
      { status: 502 },
    );
  }

  const parsedRemote = pulledPayloadSchema.safeParse(remoteJson);
  if (!parsedRemote.success) {
    const issue = parsedRemote.error.issues[0];
    return NextResponse.json(
      { error: `remote payload invalid: ${issue?.message ?? "unknown error"}` },
      { status: 502 },
    );
  }

  const requestId =
    parsedRemote.data.requestId ??
    `pull-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payloadForLocalSync = {
    source: parsedRemote.data.source ?? parsedBody.data.source,
    ownerUserId: parsedBody.data.ownerUserId,
    requestId,
    events: parsedRemote.data.events,
  };

  const localReq = new Request("http://127.0.0.1/api/sync/openclaw/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.OPENCLAW_SYNC_SECRET?.trim()
        ? { "x-openclaw-sync-secret": process.env.OPENCLAW_SYNC_SECRET.trim() }
        : {}),
    },
    body: JSON.stringify(payloadForLocalSync),
  });
  const localRes = await applySyncEventsPost(localReq);
  const localJson = await localRes.json();

  return NextResponse.json({
    ok: localRes.ok,
    pulledFrom: queryUrl.toString(),
    pulledCount: parsedRemote.data.events.length,
    localSync: localJson,
  });
}

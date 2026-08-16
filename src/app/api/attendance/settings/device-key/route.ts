import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { generateAttendanceDeviceApiKey } from "@/lib/attendance/device-auth";
import { prisma } from "@/lib/prisma";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  /** true = สร้าง/หมุนคีย์ใหม่ (แสดง plain ครั้งเดียว) */
  rotate: z.boolean().optional(),
  /** เปิด/ปิด Device API */
  enabled: z.boolean().optional(),
});

async function ensureSettings(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.attendanceSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;
  return prisma.attendanceSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      allowedLocationLat: 13.7563309,
      allowedLocationLng: 100.5017651,
      radiusMeters: 150,
    },
  });
}

/** เจ้าของ: สร้าง/หมุน Device API Key + เปิด/ปิด API อุปกรณ์ */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.rotate !== true && parsed.data.enabled === undefined) {
    return NextResponse.json({ error: "ส่ง rotate หรือ enabled" }, { status: 400 });
  }

  await ensureSettings(ctx.billingUserId, scope.trialSessionId);

  let plainKey: string | null = null;
  const data: {
    deviceApiEnabled?: boolean;
    deviceApiKeyHash?: string;
    deviceApiKeyHint?: string;
  } = {};

  if (parsed.data.enabled !== undefined) {
    data.deviceApiEnabled = parsed.data.enabled;
  }

  if (parsed.data.rotate === true) {
    const gen = await generateAttendanceDeviceApiKey();
    plainKey = gen.plainKey;
    data.deviceApiKeyHash = gen.hash;
    data.deviceApiKeyHint = gen.keyId;
    if (parsed.data.enabled === undefined) data.deviceApiEnabled = true;
  }

  const row = await prisma.attendanceSettings.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
      },
    },
    data,
    select: {
      deviceApiEnabled: true,
      deviceApiKeyHint: true,
      deviceApiKeyHash: true,
    },
  });

  return NextResponse.json({
    ok: true,
    deviceApiEnabled: row.deviceApiEnabled,
    hasDeviceApiKey: Boolean(row.deviceApiKeyHash),
    deviceApiKeyHint: row.deviceApiKeyHint,
    deviceApiKey: plainKey,
    endpoints: {
      punch: "/api/attendance/device/punch",
      roster: "/api/attendance/device/roster",
      fingerprint: "/api/attendance/device/fingerprint",
    },
  });
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);
  const row = await prisma.attendanceSettings.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
      },
    },
    select: {
      deviceApiEnabled: true,
      deviceApiKeyHint: true,
      deviceApiKeyHash: true,
    },
  });

  return NextResponse.json({
    deviceApiEnabled: Boolean(row?.deviceApiEnabled),
    hasDeviceApiKey: Boolean(row?.deviceApiKeyHash),
    deviceApiKeyHint: row?.deviceApiKeyHint ?? null,
    endpoints: {
      punch: "/api/attendance/device/punch",
      roster: "/api/attendance/device/roster",
      fingerprint: "/api/attendance/device/fingerprint",
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const SettingsSchema = z.object({
  orgName: z.string().trim().max(200).nullable().optional(),
  orgAddress: z.string().trim().max(2000).nullable().optional(),
  orgPhone: z.string().trim().max(40).nullable().optional(),
  defaultYear: z
    .string()
    .trim()
    .max(8)
    .regex(/^\d{4}$/u, "ปีต้องเป็นเลข 4 หลัก")
    .nullable()
    .optional(),
  ordersPrefix: z.string().trim().min(1).max(10).optional(),
  memosPrefix: z.string().trim().min(1).max(10).optional(),
  incomingPrefix: z.string().trim().min(1).max(10).optional(),
  outgoingPrefix: z.string().trim().min(1).max(10).optional(),
  circularsPrefix: z.string().trim().min(1).max(10).optional(),
  trackPrefix: z.string().trim().min(1).max(10).optional(),
  publicShareEnabled: z.boolean().optional(),
});

export async function GET() {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const setting = await prisma.docTransmissionSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
  return NextResponse.json({ setting });
}

export async function PUT(req: Request) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const setting = await prisma.docTransmissionSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: parsed.data,
    create: { ownerUserId, trialSessionId, ...parsed.data },
  });
  return NextResponse.json({ setting });
}

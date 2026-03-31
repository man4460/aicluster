import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

const putSchema = z.object({
  display_name: z.string().max(200).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  contact_phone: z.string().max(32).optional().nullable(),
  prompt_pay_phone: z.string().max(20).optional().nullable(),
  payment_channels_note: z.string().max(2000).optional().nullable(),
  default_monthly_fee: z.number().int().min(0).max(9_999_999).optional(),
  due_day_of_month: z.number().int().min(1).max(28).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  let row = await prisma.villageProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
  });
  if (!row) {
    row = await prisma.villageProfile.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        displayName: null,
        defaultMonthlyFee: 0,
        dueDayOfMonth: 5,
      },
    });
  }

  return NextResponse.json({
    profile: {
      id: row.id,
      display_name: row.displayName,
      address: row.address,
      contact_phone: row.contactPhone,
      prompt_pay_phone: row.promptPayPhone,
      payment_channels_note: row.paymentChannelsNote,
      default_monthly_fee: row.defaultMonthlyFee,
      due_day_of_month: row.dueDayOfMonth,
    },
  });
}

export async function PUT(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.villageProfile.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
    create: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      displayName: parsed.data.display_name?.trim() || null,
      address: parsed.data.address?.trim() || null,
      contactPhone: parsed.data.contact_phone?.trim() || null,
      promptPayPhone: parsed.data.prompt_pay_phone?.replace(/\D/g, "").slice(0, 20) || null,
      paymentChannelsNote: parsed.data.payment_channels_note?.trim() || null,
      defaultMonthlyFee: parsed.data.default_monthly_fee ?? 0,
      dueDayOfMonth: parsed.data.due_day_of_month ?? 5,
    },
    update: {
      ...(parsed.data.display_name !== undefined ? { displayName: parsed.data.display_name?.trim() || null } : {}),
      ...(parsed.data.address !== undefined ? { address: parsed.data.address?.trim() || null } : {}),
      ...(parsed.data.contact_phone !== undefined ? { contactPhone: parsed.data.contact_phone?.trim() || null } : {}),
      ...(parsed.data.prompt_pay_phone !== undefined
        ? { promptPayPhone: parsed.data.prompt_pay_phone?.replace(/\D/g, "").slice(0, 20) || null }
        : {}),
      ...(parsed.data.payment_channels_note !== undefined
        ? { paymentChannelsNote: parsed.data.payment_channels_note?.trim() || null }
        : {}),
      ...(parsed.data.default_monthly_fee !== undefined ? { defaultMonthlyFee: parsed.data.default_monthly_fee } : {}),
      ...(parsed.data.due_day_of_month !== undefined ? { dueDayOfMonth: parsed.data.due_day_of_month } : {}),
    },
  });

  return NextResponse.json({
    profile: {
      id: row.id,
      display_name: row.displayName,
      address: row.address,
      contact_phone: row.contactPhone,
      prompt_pay_phone: row.promptPayPhone,
      payment_channels_note: row.paymentChannelsNote,
      default_monthly_fee: row.defaultMonthlyFee,
      due_day_of_month: row.dueDayOfMonth,
    },
  });
}

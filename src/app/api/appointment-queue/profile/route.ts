import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const patchSchema = z.object({
  displayName: z.string().max(200).optional().nullable(),
  tagline: z.string().max(300).optional().nullable(),
  contactPhone: z.string().max(32).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  publicBookingEnabled: z.boolean().optional(),
  depositRequired: z.boolean().optional(),
  depositAmountBaht: z.number().min(0).max(999999).optional().nullable(),
  promptPayId: z.string().max(32).optional().nullable(),
  promptPayName: z.string().max(120).optional().nullable(),
  bankAccountNote: z.string().max(500).optional().nullable(),
  defaultSlotMinutes: z.number().int().min(15).max(240).optional(),
});

export async function GET() {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = owner.profile;
  return NextResponse.json({
    profile: {
      displayName: p.displayName,
      tagline: p.tagline,
      contactPhone: p.contactPhone,
      address: p.address,
      publicBookingEnabled: p.publicBookingEnabled,
      depositRequired: p.depositRequired,
      depositAmountBaht: p.depositAmountBaht != null ? Number(p.depositAmountBaht) : null,
      promptPayId: p.promptPayId,
      promptPayName: p.promptPayName,
      bankAccountNote: p.bankAccountNote,
      defaultSlotMinutes: p.defaultSlotMinutes,
    },
  });
}

export async function PATCH(req: Request) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.appointmentQueueShopProfile.update({
    where: { id: owner.profile.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.address !== undefined ? { address: d.address } : {}),
      ...(d.publicBookingEnabled !== undefined
        ? { publicBookingEnabled: d.publicBookingEnabled }
        : {}),
      ...(d.depositRequired !== undefined ? { depositRequired: d.depositRequired } : {}),
      ...(d.depositAmountBaht !== undefined
        ? { depositAmountBaht: d.depositAmountBaht }
        : {}),
      ...(d.promptPayId !== undefined ? { promptPayId: d.promptPayId } : {}),
      ...(d.promptPayName !== undefined ? { promptPayName: d.promptPayName } : {}),
      ...(d.bankAccountNote !== undefined ? { bankAccountNote: d.bankAccountNote } : {}),
      ...(d.defaultSlotMinutes !== undefined ? { defaultSlotMinutes: d.defaultSlotMinutes } : {}),
    },
  });

  return NextResponse.json({
    profile: {
      displayName: updated.displayName,
      publicBookingEnabled: updated.publicBookingEnabled,
      depositRequired: updated.depositRequired,
      depositAmountBaht:
        updated.depositAmountBaht != null ? Number(updated.depositAmountBaht) : null,
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  appointmentQueuePaymentFromRow,
  appointmentQueuePaymentWriteData,
} from "@/lib/module-shop/appointment-queue-payment";
import { formatModuleBankTransferNote, moduleShopPaymentPatchSchema } from "@/lib/module-shop/payment";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    publicBookingEnabled: z.boolean().optional(),
    depositRequired: z.boolean().optional(),
    depositAmountBaht: z.number().min(0).max(999999).optional().nullable(),
    defaultSlotMinutes: z.number().int().min(15).max(240).optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

function profileDto(row: {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  address: string | null;
  publicBookingEnabled: boolean;
  depositRequired: boolean;
  depositAmountBaht: unknown;
  defaultSlotMinutes: number;
  promptPayPhone?: string | null;
  promptPayId?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  promptPayName?: string | null;
  taxId?: string | null;
}) {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
    address: row.address,
    publicBookingEnabled: row.publicBookingEnabled,
    depositRequired: row.depositRequired,
    depositAmountBaht: row.depositAmountBaht != null ? Number(row.depositAmountBaht) : null,
    defaultSlotMinutes: row.defaultSlotMinutes,
    ...appointmentQueuePaymentFromRow(row),
  };
}

export async function GET() {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ profile: profileDto(owner.profile) });
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
  const currentPayment = appointmentQueuePaymentFromRow(owner.profile);
  const mergedPayment = {
    promptPayPhone: d.promptPayPhone !== undefined ? d.promptPayPhone : currentPayment.promptPayPhone,
    bankName: d.bankName !== undefined ? d.bankName : currentPayment.bankName,
    bankAccountNumber:
      d.bankAccountNumber !== undefined ? d.bankAccountNumber : currentPayment.bankAccountNumber,
    bankAccountName: d.bankAccountName !== undefined ? d.bankAccountName : currentPayment.bankAccountName,
    taxId: d.taxId !== undefined ? d.taxId : currentPayment.taxId,
  };

  const updated = await prisma.appointmentQueueShopProfile.update({
    where: { id: owner.profile.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.address !== undefined ? { address: d.address } : {}),
      ...(d.publicBookingEnabled !== undefined ? { publicBookingEnabled: d.publicBookingEnabled } : {}),
      ...(d.depositRequired !== undefined ? { depositRequired: d.depositRequired } : {}),
      ...(d.depositAmountBaht !== undefined ? { depositAmountBaht: d.depositAmountBaht } : {}),
      ...(d.defaultSlotMinutes !== undefined ? { defaultSlotMinutes: d.defaultSlotMinutes } : {}),
      ...appointmentQueuePaymentWriteData(d),
      ...(d.promptPayPhone !== undefined ||
      d.bankName !== undefined ||
      d.bankAccountNumber !== undefined ||
      d.bankAccountName !== undefined ?
        { bankAccountNote: formatModuleBankTransferNote(mergedPayment) }
      : {}),
    },
  });

  return NextResponse.json({ profile: profileDto(updated) });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";

const paperSizes = ["SLIP_58", "SLIP_80", "A4"] as const;

const putSchema = z.object({
  display_name: z.string().max(200).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  contact_phone: z.string().max(32).optional().nullable(),
  prompt_pay_phone: z.string().max(20).optional().nullable(),
  payment_channels_note: z.string().max(2000).optional().nullable(),
  bank_name: z.string().max(120).optional().nullable(),
  bank_account_number: z.string().max(32).optional().nullable(),
  bank_account_name: z.string().max(200).optional().nullable(),
  tax_id: z.string().max(30).optional().nullable(),
  default_paper_size: z.enum(paperSizes).optional(),
  default_monthly_fee: z.number().int().min(0).max(9_999_999).optional(),
  due_day_of_month: z.number().int().min(1).max(28).optional(),
  auto_generate_fees: z.boolean().optional(),
});

function mapProfile(row: {
  id: number;
  displayName: string | null;
  address: string | null;
  contactPhone: string | null;
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  defaultPaperSize: string;
  defaultMonthlyFee: number;
  dueDayOfMonth: number;
  autoGenerateFees: boolean;
}) {
  return {
    id: row.id,
    display_name: row.displayName,
    address: row.address,
    contact_phone: row.contactPhone,
    prompt_pay_phone: row.promptPayPhone,
    payment_channels_note: row.paymentChannelsNote,
    bank_name: row.bankName,
    bank_account_number: row.bankAccountNumber,
    bank_account_name: row.bankAccountName,
    tax_id: row.taxId,
    default_paper_size: normalizeModuleSlipPaperSize(row.defaultPaperSize),
    default_monthly_fee: row.defaultMonthlyFee,
    due_day_of_month: row.dueDayOfMonth,
    auto_generate_fees: row.autoGenerateFees,
  };
}

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
        defaultPaperSize: "SLIP_58",
        autoGenerateFees: true,
      },
    });
  }

  return NextResponse.json({ profile: mapProfile(row) });
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

  const bankAccountNumber =
    parsed.data.bank_account_number !== undefined
      ? parsed.data.bank_account_number?.replace(/\s/g, "").slice(0, 32) || null
      : undefined;

  const defaultPaperSize =
    parsed.data.default_paper_size !== undefined
      ? normalizeModuleSlipPaperSize(parsed.data.default_paper_size)
      : undefined;

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
      bankName: parsed.data.bank_name?.trim() || null,
      bankAccountNumber: bankAccountNumber ?? null,
      bankAccountName: parsed.data.bank_account_name?.trim() || null,
      taxId: parsed.data.tax_id?.replace(/\s/g, "").slice(0, 30) || null,
      defaultPaperSize: defaultPaperSize ?? "SLIP_58",
      defaultMonthlyFee: parsed.data.default_monthly_fee ?? 0,
      dueDayOfMonth: parsed.data.due_day_of_month ?? 5,
      autoGenerateFees: parsed.data.auto_generate_fees ?? true,
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
      ...(parsed.data.bank_name !== undefined ? { bankName: parsed.data.bank_name?.trim() || null } : {}),
      ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
      ...(parsed.data.bank_account_name !== undefined
        ? { bankAccountName: parsed.data.bank_account_name?.trim() || null }
        : {}),
      ...(parsed.data.tax_id !== undefined
        ? { taxId: parsed.data.tax_id?.replace(/\s/g, "").slice(0, 30) || null }
        : {}),
      ...(defaultPaperSize !== undefined ? { defaultPaperSize } : {}),
      ...(parsed.data.default_monthly_fee !== undefined ? { defaultMonthlyFee: parsed.data.default_monthly_fee } : {}),
      ...(parsed.data.due_day_of_month !== undefined ? { dueDayOfMonth: parsed.data.due_day_of_month } : {}),
      ...(parsed.data.auto_generate_fees !== undefined ? { autoGenerateFees: parsed.data.auto_generate_fees } : {}),
    },
  });

  return NextResponse.json({ profile: mapProfile(row) });
}

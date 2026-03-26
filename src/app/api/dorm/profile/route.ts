import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

const paperSizes = ["SLIP_58", "SLIP_80", "A4"] as const;

const patchSchema = z.object({
  defaultPaperSize: z.enum(paperSizes).optional(),
  promptPayPhone: z.string().trim().max(20).optional().nullable(),
  paymentChannelsNote: z.string().trim().max(8000).optional().nullable(),
});

function toDto(p: {
  displayName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  defaultPaperSize: string;
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
}) {
  return {
    displayName: p.displayName,
    logoUrl: p.logoUrl,
    taxId: p.taxId,
    address: p.address,
    caretakerPhone: p.caretakerPhone,
    defaultPaperSize: p.defaultPaperSize,
    promptPayPhone: p.promptPayPhone,
    paymentChannelsNote: p.paymentChannelsNote,
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const row = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
  });
  const business = await getBusinessProfile(auth.session.sub);
  if (!row) {
    return NextResponse.json({
      profile: toDto({
        displayName: business?.name ?? null,
        logoUrl: business?.logoUrl ?? null,
        taxId: business?.taxId ?? null,
        address: business?.address ?? null,
        caretakerPhone: business?.contactPhone ?? null,
        defaultPaperSize: "SLIP_58",
        promptPayPhone: null,
        paymentChannelsNote: null,
      }),
    });
  }
  return NextResponse.json({
    profile: toDto({
      ...row,
      displayName: business?.name ?? null,
      logoUrl: business?.logoUrl ?? null,
      taxId: business?.taxId ?? null,
      address: business?.address ?? null,
      caretakerPhone: business?.contactPhone ?? null,
    }),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const data = parsed.data;
  const emptyToNull = (s: string | null | undefined) => {
    if (s === undefined) return undefined;
    if (s === null) return null;
    const t = s.trim();
    return t.length === 0 ? null : t;
  };

  const update: Record<string, unknown> = {};
  if (data.defaultPaperSize !== undefined) update.defaultPaperSize = data.defaultPaperSize;
  if (data.promptPayPhone !== undefined) {
    if (data.promptPayPhone === null || data.promptPayPhone.trim() === "") {
      update.promptPayPhone = null;
    } else {
      const d = data.promptPayPhone.replace(/\D/g, "").slice(0, 15);
      update.promptPayPhone = d.length > 0 ? d : null;
    }
  }
  if (data.paymentChannelsNote !== undefined) {
    update.paymentChannelsNote = emptyToNull(data.paymentChannelsNote);
  }

  const scope = await getDormitoryDataScope(auth.session.sub);
  const existing = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
  });

  const merged = {
    displayName: existing?.displayName ?? null,
    logoUrl: existing?.logoUrl ?? null,
    taxId: existing?.taxId ?? null,
    address: existing?.address ?? null,
    caretakerPhone: existing?.caretakerPhone ?? null,
    defaultPaperSize: existing?.defaultPaperSize ?? "SLIP_58",
    promptPayPhone: existing?.promptPayPhone ?? null,
    paymentChannelsNote: existing?.paymentChannelsNote ?? null,
  };
  for (const [k, v] of Object.entries(update)) {
    if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
  }

  const row = await prisma.dormitoryProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: auth.session.sub,
      trialSessionId: scope.trialSessionId,
      displayName: null,
      logoUrl: null,
      taxId: null,
      address: null,
      caretakerPhone: null,
      defaultPaperSize: merged.defaultPaperSize,
      promptPayPhone: merged.promptPayPhone,
      paymentChannelsNote: merged.paymentChannelsNote,
    },
    update,
  });

  const business = await getBusinessProfile(auth.session.sub);
  return NextResponse.json({
    profile: toDto({
      ...row,
      displayName: business?.name ?? null,
      logoUrl: business?.logoUrl ?? null,
      taxId: business?.taxId ?? null,
      address: business?.address ?? null,
      caretakerPhone: business?.contactPhone ?? null,
    }),
  });
}

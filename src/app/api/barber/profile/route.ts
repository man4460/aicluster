import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  displayName: z.string().trim().max(200).optional().nullable(),
  taxId: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(4000).optional().nullable(),
  contactPhone: z.string().trim().max(32).optional().nullable(),
  logoUrl: z.union([z.string().max(512), z.null()]).optional(),
});

function toDto(p: {
  displayName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  contactPhone: string | null;
}) {
  return {
    displayName: p.displayName,
    logoUrl: p.logoUrl,
    taxId: p.taxId,
    address: p.address,
    contactPhone: p.contactPhone,
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  const row = await getBusinessProfile(own.ownerId, { barberTrialSessionId: scope.trialSessionId });
  return NextResponse.json({
    profile: toDto({
      displayName: row?.name ?? null,
      logoUrl: row?.logoUrl ?? null,
      taxId: row?.taxId ?? null,
      address: row?.address ?? null,
      contactPhone: row?.contactPhone ?? null,
    }),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  if (own.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getBarberDataScope(own.ownerId);

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

  await prisma.$transaction(async (tx) => {
    const userUpdate: Record<string, unknown> = {};
    if (data.displayName !== undefined) userUpdate.fullName = emptyToNull(data.displayName);
    if (data.address !== undefined) userUpdate.address = emptyToNull(data.address);
    if (data.contactPhone !== undefined) userUpdate.phone = emptyToNull(data.contactPhone);
    if (data.logoUrl !== undefined) {
      userUpdate.avatarUrl =
        data.logoUrl === null || data.logoUrl.trim() === "" ? null : data.logoUrl.trim().slice(0, 512);
    }
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({ where: { id: own.ownerId }, data: userUpdate });
    }
    if (data.taxId !== undefined) {
      await tx.barberShopProfile.upsert({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
          },
        },
        create: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          taxId: emptyToNull(data.taxId),
        },
        update: { taxId: emptyToNull(data.taxId) },
      });
    }
  });

  const row = await getBusinessProfile(own.ownerId, { barberTrialSessionId: scope.trialSessionId });
  return NextResponse.json({
    profile: toDto({
      displayName: row?.name ?? null,
      logoUrl: row?.logoUrl ?? null,
      taxId: row?.taxId ?? null,
      address: row?.address ?? null,
      contactPhone: row?.contactPhone ?? null,
    }),
  });
}

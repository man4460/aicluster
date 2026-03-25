import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const patchSchema = z.object({
  fullName: z.string().max(255).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  address: z.string().max(5000).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
  promptPayPhone: z.string().max(20).optional().nullable(),
  paymentChannelsNote: z.string().max(8000).optional().nullable(),
  defaultPaperSize: z.enum(["SLIP_58", "SLIP_80", "A4"]).optional(),
  latitude: z.number().finite().optional().nullable(),
  longitude: z.number().finite().optional().nullable(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      email: true,
      username: true,
      fullName: true,
      phone: true,
      address: true,
      latitude: true,
      longitude: true,
      avatarUrl: true,
      tokens: true,
      subscriptionTier: true,
      barberShopProfile: { select: { taxId: true } },
      dormitoryProfile: {
        select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json({
    profile: {
      ...user,
      taxId: user.barberShopProfile?.taxId ?? null,
      promptPayPhone: user.dormitoryProfile?.promptPayPhone ?? null,
      paymentChannelsNote: user.dormitoryProfile?.paymentChannelsNote ?? null,
      defaultPaperSize: user.dormitoryProfile?.defaultPaperSize ?? "SLIP_58",
    },
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
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: auth.session.sub },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
      },
      select: {
        email: true,
        username: true,
        fullName: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        avatarUrl: true,
        tokens: true,
        subscriptionTier: true,
      },
    });

    if (data.taxId !== undefined) {
      await tx.barberShopProfile.upsert({
        where: { ownerUserId: auth.session.sub },
        create: { ownerUserId: auth.session.sub, taxId: data.taxId },
        update: { taxId: data.taxId },
      });
    }
    if (
      data.promptPayPhone !== undefined ||
      data.paymentChannelsNote !== undefined ||
      data.defaultPaperSize !== undefined
    ) {
      const normalizePromptPay = (raw: string | null | undefined) => {
        if (raw == null) return null;
        const d = raw.replace(/\D/g, "").slice(0, 15);
        return d.length > 0 ? d : null;
      };
      await tx.dormitoryProfile.upsert({
        where: { ownerUserId: auth.session.sub },
        create: {
          ownerUserId: auth.session.sub,
          defaultPaperSize: data.defaultPaperSize ?? "SLIP_58",
          promptPayPhone: normalizePromptPay(data.promptPayPhone),
          paymentChannelsNote: data.paymentChannelsNote ?? null,
        },
        update: {
          ...(data.defaultPaperSize !== undefined
            ? { defaultPaperSize: data.defaultPaperSize }
            : {}),
          ...(data.promptPayPhone !== undefined
            ? { promptPayPhone: normalizePromptPay(data.promptPayPhone) }
            : {}),
          ...(data.paymentChannelsNote !== undefined
            ? { paymentChannelsNote: data.paymentChannelsNote }
            : {}),
        },
      });
    }

    const [tax, dorm] = await Promise.all([
      tx.barberShopProfile.findUnique({
        where: { ownerUserId: auth.session.sub },
        select: { taxId: true },
      }),
      tx.dormitoryProfile.findUnique({
        where: { ownerUserId: auth.session.sub },
        select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
      }),
    ]);
    return {
      ...updated,
      taxId: tax?.taxId ?? null,
      promptPayPhone: dorm?.promptPayPhone ?? null,
      paymentChannelsNote: dorm?.paymentChannelsNote ?? null,
      defaultPaperSize: dorm?.defaultPaperSize ?? "SLIP_58",
    };
  });

  return NextResponse.json({ profile: user });
}

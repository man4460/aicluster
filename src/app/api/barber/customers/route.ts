import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  phone: z.string().min(9).max(20),
  name: z.string().max(100).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  const name = parsed.data.name?.trim() || null;

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: {
      ownerUserId: own.ownerId,
      phone,
      trialSessionId: scope.trialSessionId,
    },
  } as const;
  let customer = await prisma.barberCustomer.findUnique({ where: whereCustomer });
  if (!customer) {
    customer = await prisma.barberCustomer.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phone,
        name,
      },
    });
  } else if (name !== null && name.length > 0) {
    customer = await prisma.barberCustomer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  price: z.number().int().min(0).max(9_999_999),
  stay_mode: z.enum(["HOURLY", "DAILY", "MONTHLY"]).optional(),
  stay_units: z.number().int().min(1).max(366).optional(),
  total_uses: z.number().int().min(1).max(500).optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean(),
});

function mapPackage(r: {
  id: number;
  name: string;
  price: number;
  stayMode: "HOURLY" | "DAILY" | "MONTHLY";
  stayUnits: number;
  totalUses: number;
  description: string;
  isActive: boolean;
}) {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    stay_mode: r.stayMode,
    stay_units: r.stayUnits,
    total_uses: Math.max(1, r.totalUses || 1),
    description: r.description,
    is_active: r.isActive,
  };
}

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  const rows = await prisma.parkingPackage.findMany({
    where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ packages: rows.map(mapPackage) });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.parkingPackage.create({
    data: {
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      stayMode: parsed.data.stay_mode ?? "DAILY",
      stayUnits: parsed.data.stay_units ?? 1,
      totalUses: parsed.data.total_uses ?? 1,
      description: parsed.data.description?.trim() ?? "",
      isActive: parsed.data.is_active,
    },
  });
  return NextResponse.json({ package: mapPackage(row) }, { status: 201 });
}

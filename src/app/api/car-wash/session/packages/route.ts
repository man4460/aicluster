import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { normalizeCarWashPackageImageUrl } from "@/lib/car-wash/package-image";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  price: z.number().int().min(0).max(9_999_999),
  duration_minutes: z.number().int().min(1).max(1440),
  total_uses: z.number().int().min(1).max(500).optional(),
  description: z.string().max(800).optional().nullable(),
  image_url: z.union([z.string().max(512), z.null()]).optional(),
  is_active: z.boolean(),
});

function mapPackage(r: {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  totalUses: number;
  imageUrl: string | null;
  description: string;
  isActive: boolean;
}) {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    duration_minutes: r.durationMinutes,
    total_uses: Math.max(1, r.totalUses || 1),
    image_url: r.imageUrl ?? null,
    description: r.description,
    is_active: r.isActive,
  };
}

export async function GET(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;
  const scope = { trialSessionId: own.trialSessionId };

  let rows = await prisma.carWashPackage.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { id: "asc" },
  });
  /** ถ้า scope ชี้ sandbox แต่ไม่มีแพ็ก — ดึงชุด prod อีกครั้ง (ข้อมูล seed / ข้อมูลจริงมักอยู่ที่ prod) */
  if (rows.length === 0 && scope.trialSessionId !== TRIAL_PROD_SCOPE) {
    rows = await prisma.carWashPackage.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: TRIAL_PROD_SCOPE },
      orderBy: { id: "asc" },
    });
  }
  return NextResponse.json({
    packages: rows.map(mapPackage),
  });
}

export async function POST(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;
  const scope = { trialSessionId: own.trialSessionId };

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  let imageUrl: string | null = null;
  if (parsed.data.image_url !== undefined) {
    if (parsed.data.image_url === null || parsed.data.image_url.trim() === "") {
      imageUrl = null;
    } else {
      const norm = normalizeCarWashPackageImageUrl(parsed.data.image_url);
      if (!norm) return NextResponse.json({ error: "URL รูปไม่ถูกต้อง" }, { status: 400 });
      imageUrl = norm;
    }
  }

  const row = await prisma.carWashPackage.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      durationMinutes: parsed.data.duration_minutes,
      totalUses: parsed.data.total_uses ?? 1,
      imageUrl,
      description: parsed.data.description?.trim() ?? "",
      isActive: parsed.data.is_active,
    },
  });
  return NextResponse.json({
    package: mapPackage(row),
  });
}

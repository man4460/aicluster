import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeForModule } from "@/lib/trial/scope";

const basketTierZod = z.object({
  label: z.string().min(1).max(80).trim(),
  price: z.number().int().min(0).max(9_999_999),
});

function normalizeBasketTiers(raw: unknown): { label: string; price: number }[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const parsed = z.array(basketTierZod).safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const dynamic = "force-dynamic";

/** แพ็กเกจที่เปิดใช้ — สำหรับหน้าลูกค้า (ไม่ต้องล็อกอิน) เมื่อพอร์ทัลเปิด */
export async function GET(req: Request) {
  try {
    const ownerId = new URL(req.url).searchParams.get("owner_id")?.trim() ?? "";
    if (ownerId.length < 10) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) return NextResponse.json({ error: "ไม่พบหรือปิดการใช้งาน" }, { status: 403 });

    const mod = await prisma.appModule.findFirst({
      where: { slug: LAUNDRY_MODULE_SLUG, isActive: true },
      select: { id: true },
    });
    if (!mod) return NextResponse.json({ error: "ระบบซักผ้ายังไม่พร้อม" }, { status: 503 });

    const scope = await resolveDataScopeForModule(ownerId, mod.id);

    const rows = await prisma.laundryPackage.findMany({
      where: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId, isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        basePrice: true,
        description: true,
        imageUrl: true,
        basketTiers: true,
      },
    });

    return NextResponse.json({
      packages: rows.map((r) => ({
        id: r.id,
        name: r.name,
        base_price: r.basePrice,
        description: r.description,
        image_url: r.imageUrl ?? null,
        basket_tiers: normalizeBasketTiers(r.basketTiers),
      })),
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/packages GET");
  }
}

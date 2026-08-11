import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";

  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const rl = rateLimit(`car-wash-portal-packages:${ip}:${ownerId}`, 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "โหลดถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const portalOk = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }

  const scope = await getCarWashDataScope(ownerId);
  let rows = await prisma.carWashPackage.findMany({
    where: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: { id: "asc" },
  });
  if (rows.length === 0 && scope.trialSessionId !== TRIAL_PROD_SCOPE) {
    rows = await prisma.carWashPackage.findMany({
      where: { ownerUserId: ownerId, trialSessionId: TRIAL_PROD_SCOPE, isActive: true },
      orderBy: { id: "asc" },
    });
  }

  return NextResponse.json({
    packages: rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      duration_minutes: r.durationMinutes,
      total_uses: Math.max(1, r.totalUses || 1),
      image_url: r.imageUrl ?? null,
      description: r.description,
    })),
  });
}

import { NextResponse } from "next/server";
import type { EcommerceOrderStatus } from "@/generated/prisma/enums";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";

const STATUSES: EcommerceOrderStatus[] = ["PENDING_SLIP", "VERIFYING", "PREPARING", "SHIPPED"];

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const store = await getOrCreateEcommerceStore(owner.ownerUserId);

  const orders = await prisma.ecommerceOrder.findMany({
    where: {
      storeId: store.id,
      ...(status && STATUSES.includes(status as EcommerceOrderStatus)
        ? { status: status as EcommerceOrderStatus }
        : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !STATUSES.includes(status as EcommerceOrderStatus)) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const order = await prisma.ecommerceOrder.findFirst({
    where: { id, storeId: store.id },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.ecommerceOrder.update({
    where: { id },
    data: { status: status as EcommerceOrderStatus },
    include: { items: true },
  });
  return NextResponse.json({ order: updated });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "ระบุออเดอร์" }, { status: 400 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const order = await prisma.ecommerceOrder.findFirst({
    where: { id, storeId: store.id },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  await prisma.ecommerceOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const categories = await prisma.ecommerceCategory.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      productCount: c._count.products,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const existing = await prisma.ecommerceCategory.findUnique({
    where: { storeId_name: { storeId: store.id, name } },
  });
  if (existing) return NextResponse.json({ error: "มีหมวดหมู่ชื่อนี้แล้ว" }, { status: 409 });

  const maxSort = await prisma.ecommerceCategory.aggregate({
    where: { storeId: store.id },
    _max: { sortOrder: true },
  });

  const category = await prisma.ecommerceCategory.create({
    data: {
      storeId: store.id,
      ownerUserId: owner.ownerUserId,
      name,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ category });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const existing = await prisma.ecommerceCategory.findFirst({
    where: { id, storeId: store.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { name?: string; isActive?: boolean; sortOrder?: number } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "ชื่อหมวดหมู่ว่าง" }, { status: 400 });
    const dup = await prisma.ecommerceCategory.findFirst({
      where: { storeId: store.id, name, NOT: { id } },
    });
    if (dup) return NextResponse.json({ error: "มีหมวดหมู่ชื่อนี้แล้ว" }, { status: 409 });
    data.name = name;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }

  const category = await prisma.ecommerceCategory.update({ where: { id }, data });
  return NextResponse.json({ category });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const existing = await prisma.ecommerceCategory.findFirst({
    where: { id, storeId: store.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.ecommerceCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

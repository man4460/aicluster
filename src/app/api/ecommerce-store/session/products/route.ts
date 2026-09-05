import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
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
  const products = await prisma.ecommerceProduct.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ products, lowStockThreshold: store.lowStockThreshold });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อสินค้า" }, { status: 400 });

  const price = Number(body.priceBaht);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "ราคาไม่ถูกต้อง" }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  let categoryId: string | null = null;
  if (typeof body.categoryId === "string" && body.categoryId.trim()) {
    const cat = await prisma.ecommerceCategory.findFirst({
      where: { id: body.categoryId.trim(), storeId: store.id },
    });
    if (!cat) return NextResponse.json({ error: "หมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    categoryId = cat.id;
  }

  const product = await prisma.ecommerceProduct.create({
    data: {
      storeId: store.id,
      ownerUserId: owner.ownerUserId,
      name,
      priceBaht: new Prisma.Decimal(price),
      sku: typeof body.sku === "string" ? body.sku.trim() || null : null,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      stockBalance: typeof body.stockBalance === "number" ? Math.max(0, Math.floor(body.stockBalance)) : 0,
      isActive: body.isActive !== false,
      isRecommended: body.isRecommended === true,
      isBestseller: body.isBestseller === true,
      categoryId,
    },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ product });
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
  const existing = await prisma.ecommerceProduct.findFirst({
    where: { id, storeId: store.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Prisma.EcommerceProductUpdateInput = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (body.priceBaht !== undefined) {
    const price = Number(body.priceBaht);
    if (Number.isFinite(price) && price >= 0) data.priceBaht = new Prisma.Decimal(price);
  }
  if (typeof body.sku === "string") data.sku = body.sku.trim() || null;
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (typeof body.stockBalance === "number" && Number.isFinite(body.stockBalance)) {
    data.stockBalance = Math.max(0, Math.floor(body.stockBalance));
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.isRecommended === "boolean") data.isRecommended = body.isRecommended;
  if (typeof body.isBestseller === "boolean") data.isBestseller = body.isBestseller;
  if (typeof body.stockDelta === "number" && Number.isFinite(body.stockDelta)) {
    const delta = Math.trunc(body.stockDelta);
    data.stockBalance = Math.max(0, existing.stockBalance + delta);
  }
  if (body.categoryId === null || body.categoryId === "") {
    data.category = { disconnect: true };
  } else if (typeof body.categoryId === "string" && body.categoryId.trim()) {
    const cat = await prisma.ecommerceCategory.findFirst({
      where: { id: body.categoryId.trim(), storeId: store.id },
    });
    if (!cat) return NextResponse.json({ error: "หมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    data.category = { connect: { id: cat.id } };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
  }

  const product = await prisma.ecommerceProduct.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ product });
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
  const existing = await prisma.ecommerceProduct.findFirst({
    where: { id, storeId: store.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (store.featuredProductId === id) {
    await prisma.ecommerceStore.update({
      where: { id: store.id },
      data: { featuredProductId: null },
    });
  }

  await prisma.ecommerceProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

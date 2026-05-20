import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  generateEcommerceReferenceCode,
  generateEcommerceTrackingCode,
} from "@/lib/ecommerce/order-codes";

function productPhotoUrl(index: number): string {
  return `https://picsum.photos/id/${100 + (index % 70)}/800/800`;
}

const CATEGORY_DEFS = ["สกินแคร์", "ของใช้", "Gadget"] as const;

const PRODUCT_DEFS: ReadonlyArray<{
  name: string;
  price: number;
  stock: number;
  sku: string;
  category: (typeof CATEGORY_DEFS)[number];
}> = [
  { name: "เซรั่มวิตามินซี", price: 299, stock: 24, sku: "SERUM-01", category: "สกินแคร์" },
  { name: "ครีมกันแดด SPF50", price: 189, stock: 40, sku: "SUN-02", category: "สกินแคร์" },
  { name: "ลิปสติกโทนนู้ด", price: 159, stock: 18, sku: "LIP-03", category: "สกินแคร์" },
  { name: "มาส์กหน้าคอลลาเจน (แพ็ก 5)", price: 249, stock: 3, sku: "MASK-04", category: "สกินแคร์" },
  { name: "ถุงผ้าลดโลกร้อน", price: 79, stock: 50, sku: "BAG-05", category: "ของใช้" },
  { name: "น้ำมันหอมระเหย", price: 349, stock: 12, sku: "OIL-06", category: "ของใช้" },
  { name: "หูฟังบลูทูธ (ขาว)", price: 890, stock: 8, sku: "BT-07", category: "Gadget" },
  { name: "สายชาร์จ PD 1.5m", price: 129, stock: 30, sku: "CABLE-08", category: "Gadget" },
];

/**
 * ข้อมูลตัวอย่าง E-Commerce Store — เฉพาะบัญชี demo (prod)
 */
export async function seedEcommerceStoreProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
) {
  const trialSessionId = "prod";

  const store = await prisma.ecommerceStore.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (store) {
    await prisma.ecommerceOrderItem.deleteMany({
      where: { order: { storeId: store.id } },
    });
    await prisma.ecommerceOrder.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceBuyerCustomer.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceProduct.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceCategory.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceStore.delete({ where: { id: store.id } });
  }

  const createdStore = await prisma.ecommerceStore.create({
    data: {
      ownerUserId,
      trialSessionId,
      storeName: "ร้านเดโม่ MAWELL Shop",
      description: "ร้านตัวอย่าง — สกินแคร์ ของใช้ และ Gadget",
      promptPayPhone: "0812345678",
      bankName: "กสิกรไทย",
      bankAccountName: "ร้านเดโม่ MAWELL",
      bankAccountNumber: "1234567890",
      paymentNote: "โอนแล้วแนบสลิปในหน้าชำระเงิน",
      lowStockThreshold: 5,
      salePageEnabled: true,
    },
  });

  const categoryIds = new Map<string, string>();
  for (let i = 0; i < CATEGORY_DEFS.length; i++) {
    const catName = CATEGORY_DEFS[i]!;
    const cat = await prisma.ecommerceCategory.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        name: catName,
        sortOrder: i,
      },
    });
    categoryIds.set(catName, cat.id);
  }

  const productIds: string[] = [];
  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const p = PRODUCT_DEFS[i]!;
    const row = await prisma.ecommerceProduct.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        name: p.name,
        sku: p.sku,
        priceBaht: new Prisma.Decimal(p.price),
        stockBalance: p.stock,
        imageUrl: productPhotoUrl(i),
        isActive: true,
        isRecommended: i < 2,
        isBestseller: i === 2 || i === 6,
        sortOrder: i,
        categoryId: categoryIds.get(p.category) ?? null,
      },
    });
    productIds.push(row.id);
  }

  const featuredId = productIds[0]!;
  await prisma.ecommerceStore.update({
    where: { id: createdStore.id },
    data: { featuredProductId: featuredId },
  });

  const buyer = await prisma.ecommerceBuyerCustomer.create({
    data: {
      storeId: createdStore.id,
      ownerUserId,
      name: "คุณสมชาย",
      phone: "0899998888",
      totalSpendBaht: new Prisma.Decimal(0),
      orderCount: 0,
    },
  });

  const sampleProduct = await prisma.ecommerceProduct.findUnique({
    where: { id: productIds[2]! },
  });
  if (sampleProduct) {
    const qty = 2;
    const lineTotal = sampleProduct.priceBaht.mul(qty);
    await prisma.ecommerceOrder.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        referenceCode: generateEcommerceReferenceCode(),
        trackingCode: generateEcommerceTrackingCode(),
        customerName: "คุณสมชาย",
        customerPhone: "0899998888",
        customerAddress: "กรุงเทพฯ",
        totalAmount: lineTotal,
        paymentSlipUrl: productPhotoUrl(9),
        status: "VERIFYING",
        buyerCustomerId: buyer.id,
        items: {
          create: [
            {
              productId: sampleProduct.id,
              productName: sampleProduct.name,
              quantity: qty,
              unitPriceBaht: sampleProduct.priceBaht,
              lineTotalBaht: lineTotal,
            },
          ],
        },
      },
    });
    await prisma.ecommerceBuyerCustomer.update({
      where: { id: buyer.id },
      data: {
        totalSpendBaht: { increment: lineTotal },
        orderCount: { increment: 1 },
        lastOrderAt: new Date(),
      },
    });
  }
}

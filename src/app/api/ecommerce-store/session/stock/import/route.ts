import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";
import { parseEcommerceStockImportFile } from "@/systems/ecommerce-store/lib/stock-excel";

/** นำเข้าสต๊อกจากแบบฟอร์ม Excel / CSV */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
    const owner = await getEcommerceOwnerFromAuth(session.sub);
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await getOrCreateEcommerceStore(owner.ownerUserId);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = parseEcommerceStockImportFile(buf, file.name || "stock.xls");
    if (parsed.errors.length && parsed.rows.length === 0) {
      return NextResponse.json({ error: parsed.errors[0], errors: parsed.errors }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const rowErrors = [...parsed.errors];

    const categoryCache = new Map<string, string>();
    async function resolveCategoryId(name: string): Promise<string | null> {
      const key = name.trim();
      if (!key) return null;
      const cached = categoryCache.get(key.toLowerCase());
      if (cached) return cached;
      const existing = await prisma.ecommerceCategory.findFirst({
        where: { storeId: store.id, name: key },
      });
      if (existing) {
        categoryCache.set(key.toLowerCase(), existing.id);
        return existing.id;
      }
      const maxSort = await prisma.ecommerceCategory.aggregate({
        where: { storeId: store.id },
        _max: { sortOrder: true },
      });
      const createdCat = await prisma.ecommerceCategory.create({
        data: {
          storeId: store.id,
          ownerUserId: owner.ownerUserId,
          name: key.slice(0, 120),
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
          isActive: true,
        },
      });
      categoryCache.set(key.toLowerCase(), createdCat.id);
      return createdCat.id;
    }

    for (const row of parsed.rows) {
      try {
        const categoryId = await resolveCategoryId(row.categoryName);
        let existing = null as Awaited<ReturnType<typeof prisma.ecommerceProduct.findFirst>>;
        if (row.sku) {
          existing = await prisma.ecommerceProduct.findFirst({
            where: { storeId: store.id, sku: row.sku },
          });
        }
        if (!existing) {
          existing = await prisma.ecommerceProduct.findFirst({
            where: { storeId: store.id, name: row.name },
          });
        }

        const priceBaht =
          row.priceBaht != null
            ? new Prisma.Decimal(row.priceBaht)
            : existing
              ? existing.priceBaht
              : new Prisma.Decimal(0);

        if (existing) {
          await prisma.ecommerceProduct.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              sku: row.sku || existing.sku,
              stockBalance: row.stockBalance,
              isActive: row.isActive,
              priceBaht,
              ...(categoryId
                ? { category: { connect: { id: categoryId } } }
                : row.categoryName === ""
                  ? {}
                  : {}),
            },
          });
          updated += 1;
        } else {
          await prisma.ecommerceProduct.create({
            data: {
              storeId: store.id,
              ownerUserId: owner.ownerUserId,
              name: row.name,
              sku: row.sku || null,
              stockBalance: row.stockBalance,
              isActive: row.isActive,
              priceBaht,
              categoryId,
            },
          });
          created += 1;
        }
      } catch (e) {
        rowErrors.push(
          `แถว «${row.name}»: ${e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"}`,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      errors: rowErrors,
    });
  } catch (e) {
    console.error("[ecommerce-store/session/stock/import POST]", e);
    return NextResponse.json({ error: "นำเข้าไม่สำเร็จ" }, { status: 500 });
  }
}

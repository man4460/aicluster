import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";
import {
  buildEcommerceStockExportXls,
  buildEcommerceStockImportTemplateXls,
} from "@/systems/ecommerce-store/lib/stock-excel";

/** ดาวน์โหลดแบบฟอร์มว่าง หรือส่งออกสต๊อกปัจจุบัน (?mode=export) */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
    const owner = await getEcommerceOwnerFromAuth(session.sub);
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await getOrCreateEcommerceStore(owner.ownerUserId);
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    if (mode === "export") {
      const products = await prisma.ecommerceProduct.findMany({
        where: { storeId: store.id },
        orderBy: [{ name: "asc" }],
        include: { category: { select: { name: true } } },
      });
      const body = buildEcommerceStockExportXls(
        products.map((p) => ({
          sku: p.sku,
          name: p.name,
          categoryName: p.category?.name ?? null,
          priceBaht: p.priceBaht.toString(),
          stockBalance: p.stockBalance,
          isActive: p.isActive,
        })),
      );
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": 'attachment; filename="ecommerce-stock-export.xls"',
        },
      });
    }

    const body = buildEcommerceStockImportTemplateXls();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ecommerce-stock-template.xls"',
      },
    });
  } catch (e) {
    console.error("[ecommerce-store/session/stock/excel GET]", e);
    return NextResponse.json({ error: "ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

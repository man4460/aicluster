/**
 * ตรวจรูปสินค้าแบบเข้ม — GET เต็ม (ไม่ใช่แค่ HEAD) + รวมสินค้าที่ปิดใช้งาน
 * npx tsx scripts/check-ecommerce-image-urls-strict.ts [storeId]
 */
import { prisma } from "../src/lib/prisma";
import { parseEcommerceProductImageUrls } from "../src/lib/ecommerce/product-images";

const args = process.argv.slice(2);
const includeInactive = args.includes("--all");
const STORE_ID = args.find((a) => !a.startsWith("--"))?.trim() || "cmto584800051jm1krbsypn2k";

async function getOk(url: string): Promise<{ ok: boolean; status: number; bytes: number }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; MawellImageCheck/1.0)",
      },
    });
    if (!res.ok) return { ok: false, status: res.status, bytes: 0 };
    const buf = Buffer.from(await res.arrayBuffer());
    // รูปจริงควรมีขนาดพอสมควร — กันหน้า HTML error สั้น ๆ
    const ok = buf.length > 800;
    return { ok, status: res.status, bytes: buf.length };
  } catch {
    return { ok: false, status: 0, bytes: 0 };
  }
}

async function main() {
  const rows = await prisma.ecommerceProduct.findMany({
    where: {
      storeId: STORE_ID,
      ...(includeInactive ? {} : { isActive: true }),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      isActive: true,
      imageUrl: true,
      galleryImagesJson: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const broken: Array<{
    name: string;
    sku: string | null;
    isActive: boolean;
    url: string;
    status: number;
    bytes: number;
    role: "cover" | "gallery";
  }> = [];
  let checked = 0;

  for (const row of rows) {
    const urls = parseEcommerceProductImageUrls(row.imageUrl, row.galleryImagesJson);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]!;
      checked += 1;
      const { ok, status, bytes } = await getOk(url);
      if (!ok) {
        broken.push({
          name: row.name,
          sku: row.sku,
          isActive: row.isActive,
          url,
          status,
          bytes,
          role: i === 0 ? "cover" : "gallery",
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        storeId: STORE_ID,
        includeInactive,
        products: rows.length,
        urlsChecked: checked,
        brokenCount: broken.length,
        broken,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

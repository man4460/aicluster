/**
 * ลบ URL รูปที่โหลดไม่ได้จากสินค้าในร้าน (ปก + แกลเลอรี)
 * npx tsx scripts/scrub-ecommerce-broken-images.ts [storeId]
 */
import { prisma } from "../src/lib/prisma";
import {
  parseEcommerceProductImageUrls,
  serializeEcommerceGalleryImages,
} from "../src/lib/ecommerce/product-images";

const STORE_ID = process.argv[2]?.trim() || "cmto584800051jm1krbsypn2k";

async function urlWorks(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; MawellImageCheck/1.0)",
      },
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 800;
  } catch {
    return false;
  }
}

async function main() {
  const rows = await prisma.ecommerceProduct.findMany({
    where: { storeId: STORE_ID },
    select: {
      id: true,
      name: true,
      sku: true,
      isActive: true,
      imageUrl: true,
      galleryImagesJson: true,
    },
  });

  let updated = 0;
  let removedUrls = 0;

  for (const row of rows) {
    const all = parseEcommerceProductImageUrls(row.imageUrl, row.galleryImagesJson);
    if (all.length === 0) continue;

    const good: string[] = [];
    for (const url of all) {
      if (await urlWorks(url)) good.push(url);
      else removedUrls += 1;
    }

    const nextCover = good[0] ?? null;
    const nextGallery = serializeEcommerceGalleryImages(good.slice(1));
    const sameCover = (row.imageUrl?.trim() || null) === nextCover;
    const sameGallery = (row.galleryImagesJson?.trim() || "[]") === nextGallery;
    if (sameCover && sameGallery) continue;

    await prisma.ecommerceProduct.update({
      where: { id: row.id },
      data: {
        imageUrl: nextCover,
        galleryImagesJson: nextGallery,
      },
    });
    updated += 1;
    console.log(
      JSON.stringify({
        name: row.name,
        sku: row.sku,
        isActive: row.isActive,
        kept: good.length,
      }),
    );
  }

  console.log(JSON.stringify({ storeId: STORE_ID, updated, removedUrls }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

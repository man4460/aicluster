import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { fillBarberPortalDemoMedia } from "../src/lib/trial/seed-barber";
import {
  BARBER_PACKAGE_SAMPLE_IMAGES,
  BARBER_PORTAL_SAMPLE_BANNER,
  BARBER_PORTAL_SAMPLE_CONTACT,
  BARBER_PORTAL_SAMPLE_GALLERY,
  BARBER_PORTAL_SAMPLE_LOGO,
  BARBER_STYLIST_SAMPLE_PHOTOS,
  barberNormalizePortalGallery,
} from "../src/systems/barber/lib/portal-media";
import { existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function checkUrl(url: string): Promise<{ url: string; ok: boolean; status: number | string }> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) return { url, ok: true, status: res.status };
    // some CDNs reject HEAD — try GET range
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    return { url, ok: get.ok || get.status === 206, status: get.status };
  } catch (e) {
    return { url, ok: false, status: e instanceof Error ? e.message : "error" };
  }
}

function localUploadPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

async function main() {
  const filled = await fillBarberPortalDemoMedia(prisma);
  console.log("filled", filled);

  const remoteSamples = [
    BARBER_PORTAL_SAMPLE_BANNER,
    BARBER_PORTAL_SAMPLE_LOGO,
    ...BARBER_PORTAL_SAMPLE_GALLERY,
    ...BARBER_PACKAGE_SAMPLE_IMAGES,
    ...BARBER_STYLIST_SAMPLE_PHOTOS,
    BARBER_PORTAL_SAMPLE_CONTACT.facebookUrl,
    BARBER_PORTAL_SAMPLE_CONTACT.mapUrl,
    `https://line.me/ti/p/~${BARBER_PORTAL_SAMPLE_CONTACT.contactLine}`,
  ];

  console.log("\n=== sample CDN / contact links ===");
  for (const url of [...new Set(remoteSamples)]) {
    const r = await checkUrl(url);
    console.log(r.ok ? "OK" : "FAIL", r.status, url.slice(0, 100));
  }

  const profiles = await prisma.barberShopProfile.findMany();
  const pkgs = await prisma.barberPackage.findMany({ select: { imageUrl: true, name: true } });
  const stylists = await prisma.barberStylist.findMany({ select: { photoUrl: true, name: true } });

  const dbUrls = new Set<string>();
  for (const p of profiles) {
    for (const u of [p.logoUrl, p.portalBannerUrl, p.facebookUrl, p.mapUrl]) {
      if (u?.trim()) dbUrls.add(u.trim());
    }
    for (const g of barberNormalizePortalGallery(p.portalGalleryJson)) dbUrls.add(g);
    if (p.contactLine?.trim()) {
      dbUrls.add(`https://line.me/ti/p/~${p.contactLine.replace(/^@/, "")}`);
    }
  }
  for (const p of pkgs) if (p.imageUrl?.trim()) dbUrls.add(p.imageUrl.trim());
  for (const s of stylists) if (s.photoUrl?.trim()) dbUrls.add(s.photoUrl.trim());

  console.log("\n=== DB media / contact URLs ===");
  let fail = 0;
  for (const url of dbUrls) {
    if (url.startsWith("/uploads/")) {
      const file = localUploadPath(url);
      const ok = !!(file && existsSync(file));
      if (!ok) fail += 1;
      console.log(ok ? "OK" : "FAIL", "local", url);
      continue;
    }
    if (!/^https?:\/\//i.test(url)) {
      fail += 1;
      console.log("FAIL", "not-url", url);
      continue;
    }
    const r = await checkUrl(url);
    if (!r.ok) fail += 1;
    console.log(r.ok ? "OK" : "FAIL", r.status, url.slice(0, 120));
  }

  console.log(`\nchecked=${dbUrls.size} failed=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

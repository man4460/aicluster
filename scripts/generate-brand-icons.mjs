/**
 * สร้างไอคอน PWA / favicon / OG จากโลโก้ MAWELL
 * ใช้: node scripts/generate-brand-icons.mjs [path-to-source-png]
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const defaultSrc = path.join(
  process.env.USERPROFILE ?? "",
  "OneDrive - Mawell",
  "Pictures",
  "Asset 555.png",
);
const src = process.argv[2] ? path.resolve(process.argv[2]) : defaultSrc;
const root = path.resolve(import.meta.dirname, "..");
const brandDir = path.join(root, "public", "brand");
const iconsDir = path.join(root, "public", "icons");

if (!fs.existsSync(src)) {
  console.error(`Source not found: ${src}`);
  process.exit(1);
}

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });
fs.copyFileSync(src, path.join(brandDir, "mawell.png"));

const sizes = [
  ["mawell-32.png", 32],
  ["mawell-180.png", 180],
  ["mawell-192.png", 192],
  ["mawell-512.png", 512],
];

for (const [name, size] of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, name));
}

const maskSize = 512;
const inner = Math.round(maskSize * 0.72);
const logoBuf = await sharp(src)
  .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({
  create: {
    width: maskSize,
    height: maskSize,
    channels: 4,
    background: { r: 247, g: 246, b: 255, alpha: 1 },
  },
})
  .composite([{ input: logoBuf, gravity: "centre" }])
  .png()
  .toFile(path.join(iconsDir, "mawell-512-maskable.png"));

const ogW = 1200;
const ogH = 630;
const ogLogoW = 320;
const ogLogo = await sharp(src)
  .resize(ogLogoW, ogLogoW, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({
  create: { width: ogW, height: ogH, channels: 3, background: { r: 247, g: 246, b: 255 } },
})
  .composite([{ input: ogLogo, gravity: "centre" }])
  .png()
  .toFile(path.join(brandDir, "mawell-og.png"));

console.log("Brand icons generated from:", src);

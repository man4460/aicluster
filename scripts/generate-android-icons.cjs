/**
 * Generate Android mipmap launcher icons from MAWELL brand PNG.
 * Usage: node scripts/generate-android-icons.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const src = path.join(root, "public", "icons", "mawell-512.png");
const res = path.join(root, "android", "app", "src", "main", "res");

/** density → px for legacy launcher */
const LAUNCHER = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

/** adaptive foreground (108dp canvas) */
const FOREGROUND = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

async function writePng(file, size, opts = {}) {
  const { padRatio = 0.12, background = { r: 255, g: 255, b: 255, alpha: 1 } } = opts;
  const pad = Math.round(size * padRatio);
  const inner = Math.max(1, size - pad * 2);
  const buf = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background,
    })
    .png()
    .toBuffer();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

async function main() {
  if (!fs.existsSync(src)) {
    console.error("Missing", src);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(LAUNCHER)) {
    const dir = path.join(res, folder);
    await writePng(path.join(dir, "ic_launcher.png"), size, {
      padRatio: 0.08,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
    await writePng(path.join(dir, "ic_launcher_round.png"), size, {
      padRatio: 0.08,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
  }

  for (const [folder, size] of Object.entries(FOREGROUND)) {
    const dir = path.join(res, folder);
    // Transparent pad for adaptive safe zone; logo centered
    await writePng(path.join(dir, "ic_launcher_foreground.png"), size, {
      padRatio: 0.18,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  // Adaptive background solid brand-ish white
  fs.writeFileSync(
    path.join(res, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
`,
  );

  console.log("Android launcher icons updated from", src);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

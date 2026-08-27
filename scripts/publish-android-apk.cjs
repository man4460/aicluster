/**
 * Build release APK (ถ้ายังไม่มี) แล้วคัดลอกไป public/downloads/mawell-android.apk
 * Usage: npm run android:publish-apk
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const apkSrc = path.join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
const destDir = path.join(root, "public", "downloads");
const dest = path.join(destDir, "mawell-android.apk");

function runGradle() {
  const isWin = process.platform === "win32";
  const cmd = isWin ? "gradlew.bat" : "./gradlew";
  const r = spawnSync(cmd, ["assembleRelease"], {
    cwd: path.join(root, "android"),
    stdio: "inherit",
    shell: isWin,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

if (!fs.existsSync(apkSrc)) {
  console.log("APK not found — building assembleRelease…");
  runGradle();
}

if (!fs.existsSync(apkSrc)) {
  console.error("Missing:", apkSrc);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(apkSrc, dest);
const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
console.log(`Copied → ${dest} (${mb} MB)`);

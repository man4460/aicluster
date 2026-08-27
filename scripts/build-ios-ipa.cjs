/**
 * Build + export IPA ของแอป iOS (Capacitor) แล้ววางไฟล์ให้เว็บเสิร์ฟติดตั้งเอง (OTA)
 *
 * Usage:
 *   npm run ios:publish-ipa                     # ad-hoc (ติดตั้งเองผ่านเว็บ)
 *   npm run ios:publish-ipa -- --team ABCDE12345
 *   npm run ios:publish-ipa -- --method app-store
 *   npm run ios:build-check                     # ทดสอบ compile บน simulator (ไม่ต้องมี certificate)
 *
 * ตัวเลือก:
 *   --team <TEAMID>     Apple Developer Team ID (หรือ env IOS_DEVELOPMENT_TEAM)
 *   --method <m>        ad-hoc (ค่าเริ่ม) | development | enterprise | app-store
 *   --base-url <url>    โดเมนเว็บที่เสิร์ฟไฟล์ (ค่าเริ่มอ่านจาก APP_URL)
 *   --simulator         build ตรวจ compile อย่างเดียว ไม่ต้อง signing
 *   --skip-sync         ไม่ต้องรัน `cap sync ios` ก่อน
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const iosProjectDir = path.join(root, "ios", "App");
const xcodeproj = path.join(iosProjectDir, "App.xcodeproj");
const buildDir = path.join(root, "build", "ios");
const archivePath = path.join(buildDir, "MAWELL.xcarchive");
const exportDir = path.join(buildDir, "export");
const publishDir = path.join(root, "public", "downloads", "ios");
const IPA_FILE_NAME = "MAWELL.ipa";
const MANIFEST_FILE_NAME = "manifest.plist";

/** Xcode 16+ เปลี่ยนชื่อ method ของ -exportArchive */
const EXPORT_METHODS = {
  "ad-hoc": "release-testing",
  "release-testing": "release-testing",
  development: "debugging",
  debugging: "debugging",
  enterprise: "enterprise",
  "app-store": "app-store-connect",
  "app-store-connect": "app-store-connect",
};

function parseArgs(argv) {
  const out = { method: "ad-hoc", simulator: false, skipSync: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--team") out.team = argv[++i];
    else if (a === "--method") out.method = argv[++i];
    else if (a === "--base-url") out.baseUrl = argv[++i];
    else if (a === "--simulator") out.simulator = true;
    else if (a === "--skip-sync") out.skipSync = true;
  }
  return out;
}

function readEnvValue(key) {
  if (process.env[key]?.trim()) return process.env[key].trim();
  const envFile = path.join(root, ".env");
  if (!fs.existsSync(envFile)) return null;
  const line = fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") || null;
}

function readAppVersion() {
  const file = path.join(root, "src", "lib", "mobile", "ios-app.ts");
  const m = fs.readFileSync(file, "utf8").match(/MAWELL_IOS_APP_VERSION\s*=\s*"([^"]+)"/);
  return m?.[1] ?? "1.0.0";
}

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
  if (r.status !== 0) {
    console.error(`\nคำสั่งล้มเหลว (exit ${r.status}): ${cmd}`);
    process.exit(r.status ?? 1);
  }
}

function codesigningIdentities() {
  const r = spawnSync("security", ["find-identity", "-v", "-p", "codesigning"], {
    encoding: "utf8",
  });
  return (r.stdout ?? "").trim();
}

function detectTeamIds() {
  const out = codesigningIdentities();
  return [...new Set([...out.matchAll(/\(([A-Z0-9]{10})\)/g)].map((m) => m[1]))];
}

function failNoSigning() {
  console.error(`
──────────────────────────────────────────────────────────────
ยังไม่มีใบรับรอง (code signing certificate) ในเครื่องนี้

iOS บังคับว่าแอปต้องเซ็นด้วยบัญชี Apple Developer เท่านั้น
จึงจะ "ดาวน์โหลดแล้วติดตั้งเอง" ได้ — ไม่มีทางข้าม

ทำอย่างใดอย่างหนึ่งก่อน:
 1) สมัคร Apple Developer Program (99 USD/ปี) แล้วเปิด Xcode
    → Settings → Accounts → เพิ่ม Apple ID → Manage Certificates → +
 2) รันทดสอบ compile อย่างเดียว: npm run ios:build-check
──────────────────────────────────────────────────────────────`);
  process.exit(2);
}

function writeExportOptions(method, team) {
  fs.mkdirSync(buildDir, { recursive: true });
  const file = path.join(buildDir, "ExportOptions.plist");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${method}</string>
  <key>teamID</key>
  <string>${team}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>compileBitcode</key>
  <false/>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>thinning</key>
  <string>&lt;none&gt;</string>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
`;
  fs.writeFileSync(file, plist, "utf8");
  return file;
}

function writeManifest({ baseUrl, version, bundleId }) {
  fs.mkdirSync(publishDir, { recursive: true });
  const origin = baseUrl.replace(/\/+$/, "");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- สร้างอัตโนมัติโดย scripts/build-ios-ipa.cjs — อย่าแก้มือ -->
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${origin}/downloads/ios/${IPA_FILE_NAME}</string>
        </dict>
        <dict>
          <key>kind</key>
          <string>display-image</string>
          <key>url</key>
          <string>${origin}/icons/mawell-192.png</string>
        </dict>
        <dict>
          <key>kind</key>
          <string>full-size-image</string>
          <key>url</key>
          <string>${origin}/icons/mawell-512.png</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>${bundleId}</string>
        <key>bundle-version</key>
        <string>${version}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>MAWELL</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>
`;
  const file = path.join(publishDir, MANIFEST_FILE_NAME);
  fs.writeFileSync(file, plist, "utf8");
  return file;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = readAppVersion();
  const buildNumber = String(Math.floor(Date.now() / 1000));
  const bundleId = "com.mawell.app";

  if (!fs.existsSync(xcodeproj)) {
    console.error("ไม่พบโปรเจกต์ Xcode:", xcodeproj);
    process.exit(1);
  }

  if (!args.skipSync) {
    run("npx", ["cap", "sync", "ios"]);
  }

  const sharedSettings = [
    `MARKETING_VERSION=${version}`,
    `CURRENT_PROJECT_VERSION=${buildNumber}`,
  ];

  if (args.simulator) {
    run(
      "xcodebuild",
      [
        "-project", xcodeproj,
        "-scheme", "App",
        "-configuration", "Release",
        "-sdk", "iphonesimulator",
        "-destination", "generic/platform=iOS Simulator",
        "CODE_SIGNING_ALLOWED=NO",
        ...sharedSettings,
        "build",
      ],
    );
    console.log(`\n✅ compile ผ่าน (simulator) — เวอร์ชัน ${version} build ${buildNumber}`);
    return;
  }

  const team = args.team?.trim() || readEnvValue("IOS_DEVELOPMENT_TEAM");
  const identities = codesigningIdentities();
  if (identities.includes("0 valid identities found")) {
    failNoSigning();
  }

  const resolvedTeam = team || detectTeamIds()[0];
  if (!resolvedTeam) {
    console.error(
      "ไม่พบ Team ID — ส่ง --team <TEAMID> หรือตั้ง IOS_DEVELOPMENT_TEAM ใน .env",
    );
    process.exit(2);
  }

  const method = EXPORT_METHODS[args.method];
  if (!method) {
    console.error(
      `--method ไม่ถูกต้อง: ${args.method} (ใช้ได้: ${Object.keys(EXPORT_METHODS).join(", ")})`,
    );
    process.exit(2);
  }

  fs.rmSync(archivePath, { recursive: true, force: true });
  fs.rmSync(exportDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });

  run("xcodebuild", [
    "-project", xcodeproj,
    "-scheme", "App",
    "-configuration", "Release",
    "-destination", "generic/platform=iOS",
    "-archivePath", archivePath,
    "-allowProvisioningUpdates",
    `DEVELOPMENT_TEAM=${resolvedTeam}`,
    "CODE_SIGN_STYLE=Automatic",
    ...sharedSettings,
    "archive",
  ]);

  const exportOptions = writeExportOptions(method, resolvedTeam);
  run("xcodebuild", [
    "-exportArchive",
    "-archivePath", archivePath,
    "-exportOptionsPlist", exportOptions,
    "-exportPath", exportDir,
    "-allowProvisioningUpdates",
  ]);

  const ipa = fs
    .readdirSync(exportDir)
    .find((f) => f.toLowerCase().endsWith(".ipa"));
  if (!ipa) {
    console.error("export สำเร็จแต่ไม่พบไฟล์ .ipa ใน", exportDir);
    process.exit(1);
  }

  if (method === "app-store-connect") {
    console.log(`\n✅ ได้ IPA สำหรับ App Store Connect: ${path.join(exportDir, ipa)}`);
    console.log("อัปโหลดด้วย Xcode Organizer หรือ `xcrun altool` แล้วใช้ลิงก์ TestFlight");
    return;
  }

  fs.mkdirSync(publishDir, { recursive: true });
  const dest = path.join(publishDir, IPA_FILE_NAME);
  fs.copyFileSync(path.join(exportDir, ipa), dest);
  const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);

  const baseUrl =
    args.baseUrl?.trim() ||
    readEnvValue("APP_URL") ||
    readEnvValue("NEXT_PUBLIC_APP_URL") ||
    "https://app.ma-well.com";
  const manifest = writeManifest({ baseUrl, version, bundleId });

  console.log(`
✅ พร้อมให้ดาวน์โหลดติดตั้งเองแล้ว

  IPA       ${dest} (${mb} MB)
  manifest  ${manifest}
  เวอร์ชัน   ${version} (build ${buildNumber}) · method ${method} · team ${resolvedTeam}

ขั้นต่อไป: npm run build && pm2 restart mawell-serve
แล้วเปิดบน iPhone ด้วย Safari: ${baseUrl.replace(/\/+$/, "")}/download-app#ios
`);
}

main();

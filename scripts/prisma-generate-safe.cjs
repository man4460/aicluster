/* eslint-disable @typescript-eslint/no-require-imports -- สคริปต์ bootstrap แบบ CommonJS */
/**
 * ก่อน prisma generate: เคลียร์โฟลเดอร์ client เดิม
 * Windows มักล็อก query_engine-*.node — ลบไม่ได้ แต่ rename ทั้งโฟลเดอร์มักสำเร็จ แล้ว generate ลงโฟลเดอร์ใหม่
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const parent = path.join(root, "src", "generated");
const genDir = path.join(parent, "prisma");

function ensureParent() {
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
}

function tryRemoveDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

if (fs.existsSync(genDir)) {
  if (!tryRemoveDir(genDir)) {
    const stale = path.join(parent, `.prisma_stale_${Date.now()}`);
    try {
      fs.renameSync(genDir, stale);
      setImmediate(() => {
        try {
          fs.rmSync(stale, { recursive: true, force: true });
        } catch {
          /* ลบทีหลังด้วยมือก็ได้ — อยู่ใน .gitignore */
        }
      });
    } catch {
      console.error(
        "[prisma-generate-safe] ไม่สามารถเคลียร์ src/generated/prisma — ปิด Cursor/แอปที่ล็อกไฟล์ หรือรีสตาร์ทเครื่องแล้วลองใหม่",
      );
      process.exit(1);
    }
  }
}

ensureParent();
if (!fs.existsSync(genDir)) {
  fs.mkdirSync(genDir, { recursive: true });
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mysql://root:local@127.0.0.1:3306/mawell_buffet";
}

const r = spawnSync("npx", ["prisma", "generate"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(r.status ?? 1);

/**
 * PM2 — รีสตาร์ทอัตโนมัติเมื่อแก้ไฟล์ (โหมด mawell-dev)
 * รัน: npm run pm2:dev
 *
 * โปรดักชัน: รัน npm run build ก่อน แล้ว npm run pm2:prod
 */
const path = require("path");

const cwd = __dirname;
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

/** ไม่ให้ watch โฟลเดอร์ที่ไม่เกี่ยวกับโค้ดแอป (ลดการรีสตาร์ทเกินจำเป็น) */
const ignoreWatch = [
  "node_modules",
  ".next",
  ".git",
  "prisma/migrations",
  "*.log",
  ".env",
  ".env.*",
];

module.exports = {
  apps: [
    {
      name: "mawell-dev",
      cwd,
      interpreter: "node",
      script: nextBin,
      args: "dev",
      watch: true,
      ignore_watch: ignoreWatch,
      watch_delay: 800,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "mawell-serve",
      cwd,
      interpreter: "node",
      script: nextBin,
      args: "start",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

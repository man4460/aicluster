/**
 * PM2
 * - mawell-dev: `next dev` — ปิด watch ของ PM2 เพราะ Next มี HMR อยู่แล้ว
 *   ถ้าเปิด PM2 watch จะรีสตาร์ท process ทั้งตัวบ่อย/วนลูปเมื่อไฟล์ในโปรเจกต์เปลี่ยน
 * - mawell-serve: production `next start` — watch ปิดอยู่แล้ว
 *
 * รัน dev: npm run pm2:dev
 * โปรดักชัน: npm run build แล้ว npm run pm2:prod
 */
const path = require("path");

const cwd = __dirname;
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

module.exports = {
  apps: [
    {
      name: "mawell-dev",
      cwd,
      interpreter: "node",
      script: nextBin,
      args: "dev",
      watch: false,
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

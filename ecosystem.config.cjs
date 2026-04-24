/**
 * PM2
 * - mawell-dev: `next dev` — ปิด watch ของ PM2 เพราะ Next มี HMR อยู่แล้ว
 *   ถ้าเปิด PM2 watch จะรีสตาร์ท process ทั้งตัวบ่อย/วนลูปเมื่อไฟล์ในโปรเจกต์เปลี่ยน
 * - mawell-serve: production `next start` — watch ปิดอยู่แล้ว
 *
 * รัน dev: npm run pm2:dev (พอร์ต 3000) หรือ npm run pm2:dev:3001 (พอร์ต 3001 — แยกจากโปรดักชันที่ 3000)
 * โปรดักชัน: npm run build แล้ว npm run pm2:prod
 *
 * บิลด์อัตโนมัติเมื่อแก้โค้ด (โหมด production + PM2):
 *   คำสั่งเดียว: npm run build  (ครั้งแรก) แล้ว npm run pm2:prod:watch
 *   หรือแยกเทอร์มินัล: npm run pm2:prod แล้ว npm run watch:pm2:prod
 *   (debounce ~12s — หลังหยุดแก้ไฟล์ชั่วคราวจึงค่อย build + restart)
 * พัฒนาปกติไม่ต้องบิลด์ซ้ำ: ใช้ next dev (pm2:dev หรือ npm run dev)
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
      args: "dev -p 3000 -H 0.0.0.0",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "mawell-dev-3001",
      cwd,
      interpreter: "node",
      script: nextBin,
      args: "dev -p 3001 -H 0.0.0.0",
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
      args: "start -p 3000 -H 0.0.0.0",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

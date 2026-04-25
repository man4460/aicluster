import fs from "node:fs";

const path =
  process.argv[2] ||
  "C:/Users/LENOVO/.cursor/projects/d-Ai-Cluster/assets/c__Users_LENOVO_AppData_Roaming_Cursor_User_workspaceStorage_6b04ba64aa24f37614b2ef9598585199_images_image-c7be8acd-3fd1-412d-b656-bc23b0e3152c.png";
const baseUrl = process.env.OPENCLAW_OCR_TEST_URL || "http://192.168.1.191:3000/api/openclaw/ocr";
const b64 = fs.readFileSync(path).toString("base64");
const message =
  "อ่านข้อความสลิปและสรุปข้อมูลสำคัญเป็นโครงสร้าง เช่น วันที่ เวลา จำนวนเงิน ผู้โอน ผู้รับ ธนาคาร และรหัสอ้างอิง";
const t0 = Date.now();
const res = await fetch(baseUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, image: b64 }),
  signal: AbortSignal.timeout(120_000),
});
const text = await res.text();
console.log("HTTP", res.status, "ms", Date.now() - t0);
try {
  const j = JSON.parse(text);
  console.log(JSON.stringify(j, null, 2).slice(0, 8000));
} catch {
  console.log(text.slice(0, 2000));
}

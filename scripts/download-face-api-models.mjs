/**
 * ดาวน์โหลดโมเดล face-api ไปที่ public/models/face-api
 * รัน: node scripts/download-face-api-models.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "models", "face-api");
const BASE = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
const FILES = [
  // ตรวจจับเร็ว (สำรอง / อุปกรณ์ช้า)
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  // ตรวจจับแม่นกว่า — ใช้เป็นหลัก
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model.bin",
  // แลนด์มาร์กเต็ม 68 จุด — จัดแนวใบหน้าแม่นกว่ารุ่น tiny
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model.bin",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model.bin",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model.bin",
];

await mkdir(OUT, { recursive: true });
for (const f of FILES) {
  const url = `${BASE}/${f}`;
  console.log("GET", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${f}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT, f), buf);
  console.log("OK", f, buf.length);
}
console.log("Done →", OUT);

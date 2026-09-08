import { copyFile, mkdir, access } from "fs/promises";
import path from "path";
import {
  DEMO_PAYMENT_SLIP_FILENAME,
} from "@/lib/trial/demo-module-settings";

/**
 * คัดลอกไฟล์สลิปตัวอย่างไปบัคเก็ตที่โมดูลอนุญาตจริง — **server / seed เท่านั้น**
 * ห้าม import จาก client components
 */

type RelParts = readonly [string, ...string[]];

const DEMO_SLIP_COPIES: RelParts[] = [
  ["mock", DEMO_PAYMENT_SLIP_FILENAME],
  ["home-finance", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["village-slips", DEMO_PAYMENT_SLIP_FILENAME],
  ["barber-cash-receipts", DEMO_PAYMENT_SLIP_FILENAME],
  ["massage-cash-receipts", DEMO_PAYMENT_SLIP_FILENAME],
  ["ecommerce-slips", DEMO_PAYMENT_SLIP_FILENAME],
  ["laundry", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["football-turf", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["hotel-resort", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["drink-pos", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["building-pos", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["car-wash", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["club-event", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["parking-portal", "_demo", DEMO_PAYMENT_SLIP_FILENAME],
  ["appointment-queue-slips", DEMO_PAYMENT_SLIP_FILENAME],
];

async function fileExists(fp: string): Promise<boolean> {
  try {
    await access(fp);
    return true;
  } catch {
    return false;
  }
}

/** คัดลอกไฟล์สลิปตัวอย่างไปทุกบัคเก็ตที่ใช้ seed — เรียกก่อน seed/patch */
export async function ensureDemoPaymentSlipFiles(): Promise<string> {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  let source: string | null = null;
  for (const parts of DEMO_SLIP_COPIES) {
    const fp = path.join(uploadsRoot, ...parts);
    if (await fileExists(fp)) {
      source = fp;
      break;
    }
  }
  if (!source) {
    throw new Error(
      `ไม่พบไฟล์สลิปตัวอย่าง — วางที่ public/uploads/mock/${DEMO_PAYMENT_SLIP_FILENAME}`,
    );
  }

  for (const parts of DEMO_SLIP_COPIES) {
    const dest = path.join(uploadsRoot, ...parts);
    if (dest === source) continue;
    await mkdir(path.dirname(dest), { recursive: true });
    if (!(await fileExists(dest))) {
      await copyFile(source, dest);
    }
  }
  return source;
}

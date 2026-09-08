import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";

/** ช่องทางชำระตัวอย่าง — ใช้ร่วมทุกโมดูลทดลอง */
export const DEMO_MODULE_PAYMENT: ModuleShopPaymentDto = {
  promptPayPhone: "0812345678",
  promptPayQrImageUrl: null,
  bankName: "กสิกรไทย",
  bankAccountNumber: "1234567890",
  bankAccountName: "ร้านตัวอย่าง MAWELL",
  taxId: "0123456789012",
};

export const DEMO_PAYMENT_SLIP_FILENAME = "demo-payment-slip.jpg" as const;

/** พาธกลาง — โมดูลที่รับ `/uploads/…` ทั่วไป */
export const DEMO_PAYMENT_SLIP_URL =
  `/uploads/mock/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

/** รายรับ–รายจ่าย — ต้องอยู่ใต้ `/uploads/home-finance/` */
export const DEMO_HOME_FINANCE_SLIP_URL =
  `/uploads/home-finance/_demo/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

export const DEMO_VILLAGE_SLIP_URL =
  `/uploads/village-slips/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

export const DEMO_BARBER_SLIP_URL =
  `/uploads/barber-cash-receipts/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

export const DEMO_MASSAGE_SLIP_URL =
  `/uploads/massage-cash-receipts/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

export const DEMO_ECOMMERCE_SLIP_URL =
  `/uploads/ecommerce-slips/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

export const DEMO_LAUNDRY_SLIP_URL =
  `/uploads/laundry/_demo/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

/** ชมรม — ค่าบำรุง / คำตอบลิงก์กิจกรรม / การเงิน */
export const DEMO_CLUB_EVENT_SLIP_URL =
  `/uploads/club-event/_demo/${DEMO_PAYMENT_SLIP_FILENAME}` as const;

const DEMO_MOCK_UPLOAD_PREFIX = "/uploads/mock/";

/**
 * พาธสลิปตัวอย่างใต้ `public/uploads/mock/` — สำรองตอนอ่าน
 * (seed ควรใช้พาธบัคเก็ตของโมดูล — ดู DEMO_HOME_FINANCE_SLIP_URL ฯลฯ)
 */
export function isTrustedDemoMockUploadPath(url: string): boolean {
  const s = url.trim();
  if (!s.startsWith(DEMO_MOCK_UPLOAD_PREFIX) || s.includes("..") || s.length > 512) return false;
  const rest = s.slice(DEMO_MOCK_UPLOAD_PREFIX.length);
  return /^[a-zA-Z0-9_.-]+$/.test(rest) && rest.length > 0 && rest.length <= 200;
}

export const DEMO_MODULE_CONTACT = {
  contactPhone: "021234567",
  address: "88/1 ถ.ตัวอย่าง แขวงสาธิต เขตสาธิต กรุงเทพฯ 10110",
  lineId: "@mawell-demo",
  facebookUrl: "https://www.facebook.com/",
  mapUrl: "https://maps.google.com/?q=Bangkok",
} as const;

export const DEMO_MODULE_LOGO_URL =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=240&h=240&q=80";

/** ชื่อแสดงโมดูลทดลอง — ต่อท้าย (ทดลอง) ถ้ายังไม่มี */
export function trialDemoDisplayName(base: string): string {
  const trimmed = base.trim();
  if (!trimmed) return "ร้านตัวอย่าง (ทดลอง)";
  if (trimmed.includes("ทดลอง")) return trimmed;
  return `${trimmed} (ทดลอง)`;
}

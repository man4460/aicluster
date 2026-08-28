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

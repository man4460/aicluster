import { createRequire } from "node:module";
import QRCode from "qrcode";

const require = createRequire(import.meta.url);
const generatePayload = require("promptpay-qr") as (
  target: string,
  options?: { amount?: number },
) => string;

/** Data URL ของ QR พร้อมเพย์ (มีจำนวนเงิน) — คืน null ถ้าสร้างไม่ได้ */
export async function buildPromptPayQrDataUrl(
  phoneRaw: string,
  amountBaht: number,
): Promise<string | null> {
  const digits = phoneRaw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  try {
    const payload = generatePayload(digits, { amount: amountBaht });
    return await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}

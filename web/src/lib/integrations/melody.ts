import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/**
 * MelodyWebapp-style payment callback (ปรับฟิลด์ให้ตรงกับระบบจริงเมื่อเชื่อม API)
 * ตัวอย่าง payload หลังชำระเงินสำเร็จ
 */
export const melodyPaidPayloadSchema = z
  .object({
    reference: z.string().min(1),
    orderId: z.string().min(1),
    status: z.string(),
    /** ต้องตรงกับ TopUpOrder.planPriceKey (199–599) — ชื่อฟิลด์คงไว้เพื่อ callback เดิม */
    amountBaht: z.number().int().positive(),
  })
  .refine((d) => ["paid", "success", "completed"].includes(d.status.toLowerCase()), {
    message: "status",
  });

export type MelodyPaidPayload = z.infer<typeof melodyPaidPayloadSchema>;

export function verifyMelodySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.MELODY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[melody] MELODY_WEBHOOK_SECRET ไม่ได้ตั้ง — ข้ามการตรวจลายเซ็น (เฉพาะ dev)");
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) return false;
  const hmac = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hmac, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

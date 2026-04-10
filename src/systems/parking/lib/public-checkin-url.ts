import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

/** URL เต็มสำหรับ QR เช็คอิน (ต้องตั้ง NEXT_PUBLIC_APP_URL ใน production) */
export function publicParkingCheckInUrl(token: string): string {
  const base = normalizeAppPublicBase(process.env.NEXT_PUBLIC_APP_URL ?? "");
  const path = `/parking/checkin/${token}`;
  return base ? `${base}${path}` : path;
}

/** URL เต็มสำหรับ QR เช็คอิน (ต้องตั้ง NEXT_PUBLIC_APP_URL ใน production) */
export function publicParkingCheckInUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const path = `/parking/checkin/${token}`;
  return base ? `${base}${path}` : path;
}

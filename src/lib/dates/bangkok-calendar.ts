/**
 * วันที่ตามปฏิทินใน timezone Asia/Bangkok
 * ใช้จาก Server Component แล้วส่งเป็น props ลง Client Component เพื่อให้ SSR กับ hydration ตรงกัน
 */
export function bangkokTodayYmd(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function bangkokMonthStartYmd(now: Date = new Date()): string {
  const y = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4);
  const m = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(5, 7);
  return `${y}-${m}-01`;
}

export function bangkokYearCalendar(now: Date = new Date()): number {
  return Number.parseInt(now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric" }), 10);
}

/** รูปแบบ YYYY-MM ตามเวลากรุงเทพ */
export function bangkokYearMonthYm(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

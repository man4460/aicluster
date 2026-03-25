/** วันที่ปฏิทินในเขต Asia/Bangkok รูปแบบ YYYY-MM-DD */
export function bangkokDateKey(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** เดือนปฏิทิน Bangkok รูปแบบ YYYY-MM (หักค่าแพ็กรายเดือน) */
export function bangkokMonthKey(d = new Date()): string {
  const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  return key.slice(0, 7);
}

/** เทียบว่า key a มาก่อน b หรือไม่ (ลำดับสตริง YYYY-MM-DD) */
export function isBangkokDateBefore(aKey: string, bKey: string): boolean {
  return aKey < bKey;
}

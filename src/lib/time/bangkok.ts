/** วันเวลาแสดงผลภาษาไทยในเขต Asia/Bangkok — ใช้ใน Client ที่ SSR เพื่อกัน hydration mismatch */
export function formatBangkokDateTimeLong(iso: string): string {
  try {
    return new Date(iso).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** เวลา HH:mm ในเขต Asia/Bangkok */
export function formatBangkokTimeHm(d = new Date()): string {
  return d.toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** นาทีจากเที่ยงคืนในเขต Asia/Bangkok */
export function bangkokNowMinutes(d = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // en-GB บาง engine ให้ 24:xx ตอนเที่ยงคืน
  return ((h % 24) * 60) + m;
}

/** วันที่ปฏิทินในเขต Asia/Bangkok รูปแบบ YYYY-MM-DD */
export function bangkokDateKey(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** วันในสัปดาห์ 0=อา … 6=ส ตามปฏิทิน Asia/Bangkok */
export function bangkokWeekday(d: Date | string): number {
  const date =
    typeof d === "string"
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00+07:00` : d)
      : d;
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? date.getUTCDay();
}

export function isBangkokWeekend(d: Date | string): boolean {
  const day = bangkokWeekday(d);
  return day === 0 || day === 6;
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

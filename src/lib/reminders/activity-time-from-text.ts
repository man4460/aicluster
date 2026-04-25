/**
 * ดึงเวลา "กิจกรรม" จากข้อความที่ผู้ใช้พิมพ์/ให้จด (ไม่ใช่เวลาที่บันทึกลงระบบ)
 * รองรับรูปแบบไทย/ตัวเลขที่ใช้บ่อยในแชท
 */

export type ActivityHm = { h: number; m: number };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** คืน HH:mm ถ้าอ่านได้ ไม่งั้น null */
export function extractActivityTimeFromText(raw: string): ActivityHm | null {
  const text = raw.replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!text.trim()) return null;

  const clock = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (clock) {
    const h = Number.parseInt(clock[1], 10);
    const m = Number.parseInt(clock[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { h, m };
  }

  const baai = text.match(/บ่าย\s*(\d{1,2})(?:\s*โมง)?/u);
  if (baai) {
    const n = Number.parseInt(baai[1], 10);
    if (n >= 1 && n <= 6) return { h: 12 + n, m: 0 };
  }

  const mongMin = text.match(/(\d{1,2})\s*โมง(?:\s*)(\d{1,2})\s*นาที/u);
  if (mongMin) {
    let h = Number.parseInt(mongMin[1], 10);
    const m = Number.parseInt(mongMin[2], 10);
    if (m < 0 || m > 59) return null;
    if (h >= 6 && h <= 11) {
      /* เช้า — ชั่วโมงตามตัวเลข */
    } else if (h >= 1 && h <= 5) {
      h = 12 + h;
    } else if (h === 12) {
      /* เที่ยง */
    } else if (h < 0 || h > 23) return null;
    return { h, m };
  }

  const morning = text.match(/(\d{1,2})\s*โมงเช้า/u);
  if (morning) {
    const n = Number.parseInt(morning[1], 10);
    if (n >= 5 && n <= 11) return { h: n, m: 0 };
  }

  const thum = text.match(/(\d{1,2})\s*ทุ่ม/u);
  if (thum) {
    const n = Number.parseInt(thum[1], 10);
    if (n >= 1 && n <= 5) return { h: 18 + n, m: 0 };
    if (n === 6) return { h: 0, m: 0 };
  }

  const mong = text.match(/(?:^|[^\d])(\d{1,2})\s*โมง(?:\s*(?:ตรง|เป๊ะ|ครับ|ค่ะ|นะ|น้า))?/u);
  if (mong) {
    const n = Number.parseInt(mong[1], 10);
    if (n >= 6 && n <= 11) return { h: n, m: 0 };
    if (n >= 1 && n <= 5) return { h: 12 + n, m: 0 };
    if (n === 12) return { h: 12, m: 0 };
  }

  return null;
}

/** ป้ายแสดง เช่น "10:00 น." — ไม่มีข้อมูลคืน null */
export function formatActivityTimeThLabel(raw: string): string | null {
  const t = extractActivityTimeFromText(raw);
  if (!t) return null;
  return `${pad2(t.h)}:${pad2(t.m)} น.`;
}

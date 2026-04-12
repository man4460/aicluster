/**
 * แมตช์เบอร์ไทยแบบยืดหยุ่น (0 นำหน้า / +66 / 66)
 */
export function thaiPhoneCoreDigits(input: string): string | null {
  const raw = input.replace(/\D/g, "");
  if (raw.length < 9 || raw.length > 15) return null;
  if (raw.startsWith("66") && raw.length >= 11) {
    return raw.slice(2).replace(/^0+/, "") || null;
  }
  if (raw.startsWith("0")) return raw.slice(1).replace(/^0+/, "") || null;
  return raw.replace(/^0+/, "") || null;
}

/** ค่าที่อาจตรงกับฟิลด์ phone ในฐานข้อมูล */
export function thaiPhoneSearchVariants(core: string): string[] {
  const c = core.replace(/\D/g, "");
  if (c.length < 9) return [];
  return [...new Set([c, `0${c}`, `66${c}`, `+66${c}`])];
}

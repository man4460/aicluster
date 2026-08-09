/** ตรวจเลขบัตรประชาชน / เลขผู้เสียภาษี 13 หลัก + checksum */
export function isValidThaiId13(raw: string): boolean {
  const id = raw.replace(/\D/g, "");
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(id[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(id[12]);
}

export function digitsOnlyTaxId(raw: string, max = 13): string {
  return raw.replace(/\D/g, "").slice(0, max);
}

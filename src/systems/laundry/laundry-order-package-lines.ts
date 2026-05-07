/**
 * ข้อความแพ็กเกจบนการ์ด — หลีกเลี่ยงซ้ำ เช่น บรรทัดแรกเป็นชื่อแพ็กเกจ
 * บรรทัดสองเป็น `ชื่อเดียวกัน (ตะกร้า S)` จาก service_type
 */

export function laundryOrderCardPackageLines(
  packageName: string,
  serviceType: string,
): { main: string; sub?: string } {
  const pn = packageName.trim();
  const st = serviceType.trim();
  if (!pn && !st) return { main: "—" };
  if (!st) return { main: pn };
  if (!pn) return { main: st };
  if (st === pn) return { main: pn };
  if (st.startsWith(pn)) return { main: st };
  const stCompact = st.replace(/\s+/g, "");
  const pnCompact = pn.replace(/\s+/g, "");
  if (stCompact.startsWith(pnCompact) && st.length >= pn.length) return { main: st };
  return { main: st, sub: pn };
}

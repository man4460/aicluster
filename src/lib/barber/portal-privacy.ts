/** เบอร์ไทย 10 หลัก: 089-xxx-1234 */
export function maskThaiPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 4) return "***";
  const last4 = d.slice(-4);
  if (d.length >= 10) {
    const p = d.slice(0, 3);
    return `${p}-xxx-${last4}`;
  }
  if (d.length >= 6) {
    return `${d.slice(0, 2)}-xxx-${last4}`;
  }
  return `xxx-${last4}`;
}

export function maskPersonName(name: string | null | undefined): string {
  if (!name?.trim()) return "สมาชิก";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return "*";
      if (part.length === 2) return `${part[0]}*`;
      return `${part[0]}${"*".repeat(Math.min(part.length - 2, 4))}${part.slice(-1)}`;
    })
    .join(" ");
}

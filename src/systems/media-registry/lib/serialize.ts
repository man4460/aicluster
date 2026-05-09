/** สำหรับ JSON response — Prisma Decimal มี toString() */
export function decString(v: { toString(): string } | null | undefined): string | null {
  if (v == null) return null;
  return v.toString();
}

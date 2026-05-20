/** เบอร์โทรมาตรฐานสำหรับค้นหา/บันทึก CRM (ตัวเลขล้วน) */
export function normalizeEcommercePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("66") && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

/** คำนำหน้าชื่อไฟล์ลายเซ็นพอร์ทัล — ใช้คู่กับ upload + check-in เพื่อกันยัด URL ปลอม */
export function carWashPortalSignatureOwnerTag(ownerId: string): string {
  return ownerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "owner";
}

export function carWashPortalSignaturePathPrefix(): string {
  return "/uploads/car-wash-portal-signatures/";
}

export function isValidCarWashPortalSignatureUrl(
  ownerId: string,
  url: string | null | undefined,
): boolean {
  if (url == null || url.trim() === "") return true;
  const u = url.trim();
  const prefix = carWashPortalSignaturePathPrefix();
  if (!u.startsWith(prefix)) return false;
  const base = u.slice(prefix.length);
  const tag = carWashPortalSignatureOwnerTag(ownerId);
  return base.startsWith(`s-${tag}-`) && !base.includes("..") && base.length < 200;
}

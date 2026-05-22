/** คำนำหน้าชื่อไฟล์สลิปพอร์ทัล — ใช้คู่กับ upload + check-in เพื่อกันยัด URL ปลอม */
export function massagePortalSlipOwnerTag(ownerId: string): string {
  return ownerId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "owner";
}

export function massagePortalSlipPathPrefix(): string {
  return "/uploads/massage-portal-slips/";
}

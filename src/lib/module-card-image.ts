/** อนุญาตเฉพาะ path ใต้ public ที่ไม่มี .. — ป้องกัน open redirect / path traversal */
export function isSafeModuleCardImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/")) return false;
  if (url.includes("..")) return false;
  if (url.length > 512) return false;
  return (
    url.startsWith("/uploads/module-cards/") ||
    url.startsWith("/images/module-cards/")
  );
}

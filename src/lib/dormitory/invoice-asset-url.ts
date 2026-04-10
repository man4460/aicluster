/** แปลง path สาธารณะ (เช่น /uploads/...) เป็น URL เต็ม — ช่วยให้โหลดโลโก้ในโมดัล/พิมพ์เสถียรขึ้น */
export function toAbsolutePublicUrl(
  href: string | null | undefined,
  siteOrigin: string,
): string | null {
  if (href == null) return null;
  const u = href.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) {
    const proto = siteOrigin.startsWith("https") ? "https:" : "http:";
    return `${proto}${u}`;
  }
  if (u.startsWith("/")) {
    const origin = siteOrigin.replace(/\/$/, "");
    return origin ? `${origin}${u}` : u;
  }
  return u;
}

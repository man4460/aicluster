import { headers } from "next/headers";

/**
 * โดเมนฐานของแอปสำหรับลิงก์สาธารณะ / QR
 * ลำดับ: NEXT_PUBLIC_APP_URL → VERCEL_URL (https) → Host จาก request
 */
export async function getServerAppBaseUrl(): Promise<string> {
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (pub?.startsWith("http://") || pub?.startsWith("https://")) {
    return pub;
  }

  const appOnly = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (appOnly?.startsWith("http://") || appOnly?.startsWith("https://")) {
    return appOnly;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

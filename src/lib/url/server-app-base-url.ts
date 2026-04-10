import { headers } from "next/headers";
import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

/**
 * โดเมนฐานของแอปสำหรับลิงก์สาธารณะ / QR (origin เท่านั้น — path ใน env จะถูกตัด)
 * ลำดับ: NEXT_PUBLIC_APP_URL → VERCEL_URL (https) → Host จาก request
 */
export async function getServerAppBaseUrl(): Promise<string> {
  const pubRaw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (pubRaw?.startsWith("http://") || pubRaw?.startsWith("https://")) {
    return normalizeAppPublicBase(pubRaw);
  }

  const appRaw = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (appRaw?.startsWith("http://") || appRaw?.startsWith("https://")) {
    return normalizeAppPublicBase(appRaw);
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

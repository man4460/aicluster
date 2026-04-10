import { headers } from "next/headers";
import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

/** URL ฐานของแอป — ใช้แก้ path รูปอัปโหลดให้เป็น URL เต็ม (origin เท่านั้นถ้าเป็น http(s)) */
export async function getRequestBaseUrl(): Promise<string> {
  const envRaw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envRaw && (envRaw.startsWith("http://") || envRaw.startsWith("https://"))) {
    return normalizeAppPublicBase(envRaw);
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

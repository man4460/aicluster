import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

function replaceZeroHost(hostport: string): string {
  if (hostport === "0.0.0.0" || hostport.startsWith("0.0.0.0:")) {
    return hostport.replace(/^0\.0\.0\.0/, "127.0.0.1");
  }
  return hostport;
}

function redirectOriginFromAppEnv(): string {
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub && /^https?:\/\//i.test(pub)) {
    return normalizeAppPublicBase(pub);
  }
  const app = process.env.APP_URL?.trim();
  if (app && /^https?:\/\//i.test(app)) {
    return normalizeAppPublicBase(app);
  }
  return "";
}

/**
 * Origin สำหรับ Location หลัง redirect จาก Route Handler
 * - ลำดับ: NEXT_PUBLIC_APP_URL → APP_URL (ตัด path ทิ้ง เหลือ origin — รองรับเช่น .../dashboard ใน .env)
 * - ถ้า Host / URL เป็น 0.0.0.0 แปลงเป็น 127.0.0.1 — เบราว์เซอร์หลายตัวเปิด http://0.0.0.0 ไม่ได้
 */
export function publicRedirectOriginFromRequest(req: Request): string {
  const fromEnv = redirectOriginFromAppEnv();
  if (fromEnv) return fromEnv;

  const uBase = new URL(req.url);
  const defaultProto = uBase.protocol === "https:" ? "https" : "http";

  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) {
    const fp = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    const proto = fp === "http" || fp === "https" ? fp : defaultProto;
    return `${proto}://${replaceZeroHost(forwarded)}`;
  }

  const hostHeader = req.headers.get("host");
  if (hostHeader) {
    return `${defaultProto}://${replaceZeroHost(hostHeader.trim())}`;
  }

  let host = uBase.hostname;
  if (host === "0.0.0.0") {
    host = "127.0.0.1";
  }
  const port = uBase.port ? `:${uBase.port}` : "";
  return `${uBase.protocol}//${host}${port}`;
}

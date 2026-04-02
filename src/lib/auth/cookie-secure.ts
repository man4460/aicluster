/**
 * คุกกี้ `Secure` ส่งได้เฉพาะ HTTPS — ถ้าเข้าแอปใน LAN ด้วย `http://192.168.x.x`
 * ขณะที่ NODE_ENV=production คุกกี้จะไม่ถูกส่ง → ล็อกอินไม่ติด (ดูเหมือน "ใช้ DB ไม่ได้")
 *
 * - ค่าเริ่มต้น: production = secure, development = ไม่ secure
 * - ตั้ง COOKIE_SECURE=false เมื่อรัน production บน HTTP ในเครือข่ายภายใน
 * - บน HTTPS จริง (โดเมน / reverse proxy) ใช้ COOKIE_SECURE=true หรือไม่ตั้ง (default production)
 */
export function sessionCookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  if (v === "true" || v === "1" || v === "yes") return true;
  return process.env.NODE_ENV === "production";
}

/** hostname จาก Host (ตัดพอร์ต; รองรับ [::1]:3000) */
function hostHeaderHostname(host: string | null): string | null {
  if (!host) return null;
  const t = host.trim();
  if (t.startsWith("[")) {
    const end = t.indexOf("]");
    if (end !== -1) return t.slice(1, end).toLowerCase();
  }
  const first = t.split(":")[0]?.toLowerCase();
  return first || null;
}

/**
 * เข้าทาง http://192.168.x / 10.x / 172.16–31.x / localhost โดยไม่มี reverse-proxy บอก HTTPS
 * → ไม่ใช้ Secure (เบราว์เซอร์จะเก็บคุกกี้บน HTTP)
 */
function hostLooksLikeLanOrLocalHttp(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".local")) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const m = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (hostname === "::1") return true;
  return false;
}

/**
 * ใช้กับ Route Handler ที่มี `Request` — ให้ `Secure` ตรงกับการเชื่อมต่อจริงของผู้ใช้
 * (แก้กรณี PM2/production แต่เปิดด้วย http://IP:port ใน LAN — คุกกี้ Secure แล้วเบราว์เซอร์ไม่เก็บ → วนกลับ /login)
 *
 * ลำดับ: COOKIE_SECURE (บังคับ) → x-forwarded-proto → URL ของ req → Host เป็น private/local → fallback NODE_ENV
 */
export function sessionCookieSecureForIncomingRequest(req: Request): boolean {
  const v = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  if (v === "true" || v === "1" || v === "yes") return true;

  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim().toLowerCase();
    if (first === "https") return true;
    if (first === "http") return false;
  }

  try {
    const url = new URL(req.url);
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:") return false;
  } catch {
    /* ignore */
  }

  const host = hostHeaderHostname(req.headers.get("host"));
  if (host && hostLooksLikeLanOrLocalHttp(host)) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

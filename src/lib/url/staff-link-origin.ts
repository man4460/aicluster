import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";
import { STAFF_LINK_PERMANENT_SESSION_ID } from "@/lib/modules/permanent-staff-link";

/** Origin สำหรับประกอบ URL ลิงก์พนักงานแบบเต็ม */
export function staffLinkAbsoluteOrigin(req: Request): string {
  const envRaw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envRaw && (envRaw.startsWith("http://") || envRaw.startsWith("https://"))) {
    return normalizeAppPublicBase(envRaw);
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export function buildStaffPortalUrl(opts: {
  req: Request;
  pathPrefix: string;
  ownerId: string;
  /** ถูกละเว้น — URL ใช้ session ถาวรเสมอ (`prod`) */
  trialSessionId?: string;
  plainToken: string;
}): string {
  const origin = staffLinkAbsoluteOrigin(opts.req);
  const qs = new URLSearchParams({ t: STAFF_LINK_PERMANENT_SESSION_ID, k: opts.plainToken });
  const path = `${opts.pathPrefix}/${encodeURIComponent(opts.ownerId)}?${qs.toString()}`;
  return origin ? `${origin}${path}` : path;
}

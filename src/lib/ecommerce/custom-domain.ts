/** โฮสต์หลักของแพลตฟอร์ม — ไม่ rewrite เป็นร้านค้า */
export function normalizeEcommerceHostname(raw: string | null | undefined): string {
  if (!raw) return "";
  let h = raw.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "");
  h = h.split("/")[0] ?? "";
  h = h.split(":")[0] ?? "";
  if (h.startsWith("www.")) h = h.slice(4);
  return h;
}

export function normalizeEcommerceCustomDomainInput(raw: string): string {
  return normalizeEcommerceHostname(raw);
}

/** โดเมนที่ merchant ใส่ไม่ได้ใช้เป็น custom domain ของร้าน */
/** โฮสต์ที่ merchant ชี้ CNAME มา (ค่าเริ่มต้น production: app.ma-well.com) */
export function getEcommerceCnameTargetHost(): string {
  const explicit = process.env.ECOMMERCE_CNAME_TARGET?.trim();
  if (explicit) return normalizeEcommerceHostname(explicit);

  for (const url of [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    if (!url?.trim()) continue;
    try {
      const h = normalizeEcommerceHostname(new URL(url.trim()).host);
      if (h) return h;
    } catch {
      const h = normalizeEcommerceHostname(url);
      if (h) return h;
    }
  }

  return "app.ma-well.com";
}

export function validateEcommerceCustomDomainInput(raw: string): string | null {
  const h = normalizeEcommerceCustomDomainInput(raw);
  if (!h) return "กรุณาระบุโดเมน (เช่น shop.mybrand.com)";
  if (h.includes("localhost") || h === "127.0.0.1") {
    return "โดเมนทดสอบบนเครื่องใช้ไม่ได้ — ใช้โดเมนจริงที่ชี้ CNAME มา MAWELL";
  }
  if (h === "ma-well.com" || h.endsWith(".ma-well.com")) {
    return "ไม่ใช้โดเมน *.ma-well.com เป็น Custom Domain — เป็นโดเมนหลักของแพลตฟอร์มอยู่แล้ว ให้ใช้โดเมนของแบรนด์คุณเอง (เช่น shop.mybrand.com) และชี้ CNAME มา MAWELL";
  }
  if (isEcommercePlatformHost(h)) {
    return "โดเมนนี้เป็นหลักของระบบ MAWELL — ใช้โดเมนที่คุณเป็นเจ้าของ DNS เอง";
  }
  return null;
}

function platformHostsFromEnv(): Set<string> {
  const defaults = ["localhost", "127.0.0.1"];
  const fromApp = process.env.APP_URL?.trim();
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const extra = process.env.ECOMMERCE_PLATFORM_HOSTS?.trim();

  const hosts = new Set<string>(defaults);
  for (const url of [fromApp, fromPublic]) {
    if (!url) continue;
    try {
      const h = normalizeEcommerceHostname(new URL(url).host);
      if (h) hosts.add(h);
    } catch {
      const h = normalizeEcommerceHostname(url);
      if (h) hosts.add(h);
    }
  }
  if (extra) {
    for (const part of extra.split(/[,;\s]+/)) {
      const h = normalizeEcommerceHostname(part);
      if (h) hosts.add(h);
    }
  }
  return hosts;
}

let cachedPlatformHosts: Set<string> | null = null;

export function isEcommercePlatformHost(hostname: string): boolean {
  const h = normalizeEcommerceHostname(hostname);
  if (!h) return true;
  if (!cachedPlatformHosts) cachedPlatformHosts = platformHostsFromEnv();
  if (cachedPlatformHosts.has(h)) return true;
  if (h.endsWith(".ma-well.com")) return true;
  return false;
}

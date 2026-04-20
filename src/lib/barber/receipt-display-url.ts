/**
 * แปลง URL สลิปที่บันทึกในฐานข้อมูลให้โหลดในแดชบอร์ดได้เสถียร
 * - ใช้พาธ `/uploads/barber-cash-receipts|barber-portal-slips/...` (เสิร์ฟที่ app/uploads/[bucket]/[filename])
 * - ถ้าเป็น absolute URL แต่ path อยู่ใต้ /uploads/ สองบัคเก็ตนี้ → ตัดเหลือพาธบน origin ของคำขอ (กันโดเมน/proxy คนละค่า)
 * - รองรับของเก่า `/api/barber/cash-receipt/file?name=...`
 */

const BARBER_SLIP_BUCKETS = ["barber-cash-receipts", "barber-portal-slips"] as const;

function safeUploadBasename(basename: string): boolean {
  return (
    !!basename &&
    !basename.includes("..") &&
    !basename.includes("/") &&
    !basename.includes("\\") &&
    /^[a-zA-Z0-9_.-]+$/.test(basename) &&
    basename.length <= 220
  );
}

/** ดึงชื่อไฟล์จากค่าที่บันทึกในฐานข้อมูล (path หรือ absolute URL) — ใช้เสิร์ฟสลิปผ่าน API */
export function parseBarberCashReceiptBasenameFromStored(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const u = stored.trim();
  const patterns = [
    /\/uploads\/barber-cash-receipts\/([^/?#]+)/i,
    /^uploads\/barber-cash-receipts\/([^/?#]+)/i,
    /(?:^|[/"'])barber-cash-receipts\/([^/?#'"]+)/i,
  ];
  for (const re of patterns) {
    const m = u.match(re);
    if (!m?.[1]) continue;
    try {
      const basename = decodeURIComponent(m[1]).trim();
      if (safeUploadBasename(basename)) return basename;
    } catch {
      /* ลองแพทเทิร์นถัดไป */
    }
  }
  return null;
}

export function normalizeBarberSlipUrlForDashboard(
  stored: string | null | undefined,
  requestOrigin: string,
): string | null {
  if (!stored?.trim()) return null;
  const u = stored.trim();

  /** พาธเสิร์ฟสลิปขายแพ็ก (authenticated) — ห้ามส่งผ่าน logic อื่นที่อาจทำ URL เพี้ยน */
  const pathForSaleReceiptTest = (() => {
    try {
      if (u.startsWith("http://") || u.startsWith("https://")) {
        const p = new URL(u);
        return `${p.pathname}${p.search}`.split("#")[0] ?? "";
      }
    } catch {
      /* ignore */
    }
    return u.split("#")[0] ?? u;
  })();
  if (/\/api\/barber\/subscriptions\/\d+\/sale-receipt(?:\?.*)?$/i.test(pathForSaleReceiptTest)) {
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    try {
      return requestOrigin ? new URL(u, requestOrigin).href : u;
    } catch {
      return u;
    }
  }

  for (const bucket of BARBER_SLIP_BUCKETS) {
    const re = new RegExp(`/uploads/${bucket}/([^/?#]+)`, "i");
    const m = u.match(re);
    if (m) {
      const basename = decodeURIComponent(m[1]);
      if (safeUploadBasename(basename)) {
        return `/uploads/${bucket}/${basename}`;
      }
    }
  }

  try {
    const abs = u.startsWith("http://") || u.startsWith("https://") ? new URL(u) : null;
    if (abs) {
      for (const bucket of BARBER_SLIP_BUCKETS) {
        const prefix = `/uploads/${bucket}/`;
        if (abs.pathname.startsWith(prefix)) {
          const basename = abs.pathname.slice(prefix.length);
          if (safeUploadBasename(basename)) {
            return `/uploads/${bucket}/${basename}`;
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const parsed =
      u.startsWith("http://") || u.startsWith("https://") ? new URL(u) : new URL(u, "http://local.invalid");
    if (parsed.pathname.includes("/api/barber/cash-receipt/file")) {
      const name = parsed.searchParams.get("name")?.trim() ?? "";
      if (name && safeUploadBasename(name)) {
        return `/uploads/barber-cash-receipts/${name}`;
      }
    }
  } catch {
    /* ignore */
  }

  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const pathPart = u.startsWith("/") ? u : `/${u}`;
  try {
    return new URL(pathPart, requestOrigin).href;
  } catch {
    return pathPart;
  }
}

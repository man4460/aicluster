/** แยกพิกัดจากข้อความที่อยู่ที่ฝังบรรทัด «พิกัด GPS: lat, lng» */

const GPS_LINE_RE = /พิกัด\s*GPS\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i;

export function laundryParseGpsCoordsFromText(raw: string | null | undefined): {
  lat: number;
  lng: number;
} | null {
  if (!raw?.trim()) return null;
  const m = raw.match(GPS_LINE_RE);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** ตัดบรรทัดพิกัด GPS ออกจากที่อยู่ที่แสดงบนการ์ด */
export function laundryStripGpsLineFromAddress(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !GPS_LINE_RE.test(line))
    .join(" ")
    .trim();
}

export function laundryGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function laundryResolveOrderPickupCoords(order: {
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  pickup_address?: string | null;
}): { lat: number; lng: number } | null {
  const lat = order.pickup_lat;
  const lng = order.pickup_lng;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }
  return laundryParseGpsCoordsFromText(order.pickup_address);
}

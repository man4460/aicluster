/** ลิงก์สาธารณะสนามฟุตบอล — ใส่ `?t=` เฉพาะเมื่อ trial ≠ prod */

export function footballTurfPublicBookUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/football-turf/book/${ownerId}${q}`;
}

export function footballTurfPublicBookingUrl(
  baseUrl: string,
  ownerId: string,
  bookingId: number | string,
  phone: string,
  trialSessionId: string,
  extraBookingIds?: Array<number | string>,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const ids = [bookingId, ...(extraBookingIds ?? [])]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const unique = [...new Set(ids)];
  if (unique.length > 1) q.set("ids", unique.join(","));
  const path = `/football-turf/book/${ownerId}/booking/${unique[0] ?? bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

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

export function footballTurfPublicCheckInUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/football-turf/check-in/${ownerId}${q}`;
}

export function footballTurfPublicBookingUrl(
  baseUrl: string,
  ownerId: string,
  bookingId: number | string,
  phone: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const path = `/football-turf/book/${ownerId}/booking/${bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

/** ลิงก์สาธารณะคาร์แคร์ — ใส่ `?t=` เฉพาะเมื่อ trial ≠ prod */

export function carWashPublicPortalUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/car-wash/${ownerId}${q}`;
}

export function carWashPublicCheckInUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/car-wash/check-in/${ownerId}${q}`;
}

export function carWashPublicBookingUrl(
  baseUrl: string,
  ownerId: string,
  bookingId: number | string,
  phone: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const id = Number(bookingId);
  const path = `/car-wash/${ownerId}/booking/${Number.isFinite(id) && id > 0 ? id : bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

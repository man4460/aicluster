/** ลิงก์สาธารณะร้านตัดผม — ใส่ `?t=` เฉพาะเมื่อ trial ≠ prod */

export function barberPublicPortalUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/barber/${ownerId}${q}`;
}

export function barberPublicBookingUrl(
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
  const path = `/barber/${ownerId}/booking/${Number.isFinite(id) && id > 0 ? id : bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

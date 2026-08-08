export function hotelResortPublicPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/hotel-resort/${ownerId}${q}`;
}

export function hotelResortPublicBookingUrl(
  baseUrl: string,
  ownerId: string,
  bookingId: string,
  phone: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const path = `/hotel-resort/${ownerId}/booking/${bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

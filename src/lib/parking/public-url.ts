export function parkingPublicPortalUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/parking/${ownerId}${q}`;
}

export function parkingPublicBookingUrl(
  baseUrl: string,
  ownerId: string,
  bookingId: string | number,
  phone: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const path = `/parking/${ownerId}/booking/${bookingId}?${q}`;
  return base ? `${base}${path}` : path;
}

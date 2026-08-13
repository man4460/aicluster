/** ลิงก์สาธารณะเว็บจอง POS ร้านอาหาร */

export function buildingPosPublicPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/building-pos/${ownerId}${q}`;
}

export function buildingPosPublicReservationUrl(
  baseUrl: string,
  ownerId: string,
  reservationId: string,
  phone: string,
  trialSessionId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ phone: phone.replace(/\D/g, "") });
  if (trialSessionId !== "prod") q.set("t", trialSessionId);
  const path = `/building-pos/${ownerId}/reservation/${reservationId}?${q}`;
  return base ? `${base}${path}` : path;
}

export function buildingPosOrderPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/building-pos/order/${ownerId}${q}`;
}

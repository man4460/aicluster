export function hotelResortPublicPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/hotel-resort/${ownerId}${q}`;
}

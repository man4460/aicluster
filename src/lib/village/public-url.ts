export function villagePublicPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/village/${ownerId}${q}`;
}

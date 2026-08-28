export function dormitoryPublicPortalUrl(baseUrl: string, ownerId: string, trialSessionId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const q = trialSessionId !== "prod" ? `?t=${encodeURIComponent(trialSessionId)}` : "";
  return `${base}/dorm/${ownerId}${q}`;
}

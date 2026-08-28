export function publicCheckInUrl(
  basePrefix: string,
  ownerSub: string,
  locId: number | null,
  trialSessionId: string,
  isTrialSandbox: boolean,
  opts?: { faceKiosk?: boolean },
) {
  const facePath = opts?.faceKiosk ? "/face" : "";
  const root = `${basePrefix.replace(/\/$/, "")}/check-in/${ownerSub}${facePath}`;
  const params = new URLSearchParams();
  if (locId != null && locId > 0) params.set("loc", String(locId));
  if (isTrialSandbox) params.set("t", trialSessionId);
  const q = params.toString();
  return q ? `${root}?${q}` : root;
}

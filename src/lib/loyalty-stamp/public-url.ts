export function loyaltyStampPublicCardPath(ownerId: string, trialSessionId?: string): string {
  const base = `/loyalty-stamp/${ownerId}`;
  if (trialSessionId && trialSessionId !== "prod") {
    return `${base}?t=${encodeURIComponent(trialSessionId)}`;
  }
  return base;
}

export function loyaltyStampPublicCardUrl(
  origin: string,
  ownerId: string,
  trialSessionId?: string,
): string {
  return `${origin.replace(/\/$/, "")}${loyaltyStampPublicCardPath(ownerId, trialSessionId)}`;
}

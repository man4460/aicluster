/** ลิงก์จองสาธารณะ — แปะ Facebook / TikTok ได้ */
export function appointmentQueuePublicBookingPath(ownerId: string, trialSessionId?: string): string {
  const base = `/appointment-queue/${ownerId}`;
  if (trialSessionId && trialSessionId !== "prod") {
    return `${base}?t=${encodeURIComponent(trialSessionId)}`;
  }
  return base;
}

export function appointmentQueuePublicBookingUrl(
  origin: string,
  ownerId: string,
  trialSessionId?: string,
): string {
  return `${origin.replace(/\/$/, "")}${appointmentQueuePublicBookingPath(ownerId, trialSessionId)}`;
}

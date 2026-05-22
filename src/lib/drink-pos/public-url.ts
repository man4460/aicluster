/** ลิงก์สาธารณะให้ลูกค้าดูแต้มสะสม — POS ร้านเครื่องดื่ม */
export function drinkPosPublicPortalUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId?: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = `/drink-pos/${encodeURIComponent(ownerId)}`;
  if (trialSessionId && trialSessionId !== "prod") {
    return `${base}${path}?t=${encodeURIComponent(trialSessionId)}`;
  }
  return `${base}${path}`;
}

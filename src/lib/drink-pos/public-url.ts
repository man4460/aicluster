/** ลิงก์สาธารณะให้ลูกค้าสั่งเครื่องดื่ม + สะสม/แลกคะแนน */
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

/** alias — ลิงก์สั่งออเดอร์ลูกค้า */
export const drinkPosPublicOrderUrl = drinkPosPublicPortalUrl;

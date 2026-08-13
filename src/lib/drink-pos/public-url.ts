/** ลิงก์สาธารณะเว็บลูกค้า (สั่งเครื่องดื่ม) */

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

/** @deprecated ร้านเครื่องดื่มไม่มีจองที่นั่งแล้ว — ชี้ไปหน้าสั่ง */
export function drinkPosPublicReservationUrl(
  baseUrl: string,
  ownerId: string,
  _reservationId: string,
  _phone: string,
  trialSessionId: string,
): string {
  return drinkPosPublicPortalUrl(baseUrl, ownerId, trialSessionId);
}

/** ลิงก์สั่งออเดอร์ลูกค้า — หน้าเว็บเดียวกับพอร์ทัล */
export function drinkPosPublicOrderUrl(
  baseUrl: string,
  ownerId: string,
  trialSessionId?: string,
): string {
  return drinkPosPublicPortalUrl(baseUrl, ownerId, trialSessionId);
}

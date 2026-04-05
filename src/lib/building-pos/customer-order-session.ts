/** segment สำหรับ localStorage — แยกโต๊ะ (ว่าง = _) */
export function stableTableKeySegment(tableNo: string): string {
  const t = tableNo.trim();
  return t === "" ? "_" : encodeURIComponent(t);
}

export function buildingPosCustomerSessionStorageKey(
  ownerId: string,
  trialSessionId: string,
  tableNo: string,
): string {
  return `bpos.custSess.v1:${ownerId}:${trialSessionId}:${stableTableKeySegment(tableNo)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCustomerOrderSessionUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

import { verifyStaffToken } from "@/lib/building-pos/staff-token";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

/** ลิงก์พนักงานเก็บ/สร้างที่ session นี้เสมอ — ไม่ผูกอายุ trial */
export const STAFF_LINK_PERMANENT_SESSION_ID = TRIAL_PROD_SCOPE;

export type PermanentStaffLinkContext = {
  ownerId: string;
  /** สโคปข้อมูลปัจจุบันของร้าน (trial หรือ prod) — ไม่ใช่ session ของแถวลิงก์ */
  trialSessionId: string;
};

type StaffLinkHashRow = { tokenHash: string };

/**
 * ยืนยันโทเค็นพนักงานแบบไม่มีวันหมดอายุ
 * - ตรวจแถว `prod` ก่อน · รองรับลิงก์เก่าที่ผูก trial session
 * - คืนสโคปข้อมูลปัจจุบันของเจ้าของร้าน (พนักงานเห็นข้อมูลเดียวกับแดชบอร์ด)
 */
export async function resolvePermanentStaffLink(opts: {
  ownerId: string;
  plainToken: string;
  urlTrialParam?: string | null;
  findProdRow: () => Promise<StaffLinkHashRow | null>;
  findRowBySession: (sessionId: string) => Promise<StaffLinkHashRow | null>;
  findAnyRows: () => Promise<StaffLinkHashRow[]>;
  liveDataScope: () => Promise<{ trialSessionId: string }>;
}): Promise<PermanentStaffLinkContext | null> {
  const ownerId = opts.ownerId.trim();
  const k = opts.plainToken.trim();
  if (!ownerId || !k) return null;

  const live = async () => {
    const scope = await opts.liveDataScope();
    return { ownerId, trialSessionId: scope.trialSessionId };
  };

  const prod = await opts.findProdRow();
  if (prod?.tokenHash && verifyStaffToken(k, prod.tokenHash)) return live();

  const t = (opts.urlTrialParam ?? "").trim();
  if (t && t !== STAFF_LINK_PERMANENT_SESSION_ID) {
    const legacy = await opts.findRowBySession(t);
    if (legacy?.tokenHash && verifyStaffToken(k, legacy.tokenHash)) return live();
  }

  const rows = await opts.findAnyRows();
  for (const row of rows) {
    if (row.tokenHash && verifyStaffToken(k, row.tokenHash)) return live();
  }
  return null;
}

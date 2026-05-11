import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export type VaultAuthOk = { ok: true; userId: string };
export type VaultAuthFail = { ok: false; res: NextResponse };

/**
 * คลังรหัสผ่านเป็นข้อมูลส่วนตัวต่อบัญชี — ใช้ session userId โดยตรง
 * (พนักงานเข้าได้ในฐานะบัญชีของตัวเอง — vault ของเขาเอง ไม่ใช่ของนายจ้าง)
 */
export async function withVaultAuth(): Promise<VaultAuthOk | VaultAuthFail> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 }) };
  }
  return { ok: true, userId: session.sub };
}

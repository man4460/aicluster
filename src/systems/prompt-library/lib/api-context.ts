import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export type PromptLibraryAuthOk = { ok: true; userId: string };
export type PromptLibraryAuthFail = { ok: false; res: NextResponse };

export async function withPromptLibraryAuth(): Promise<PromptLibraryAuthOk | PromptLibraryAuthFail> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 }) };
  }
  return { ok: true, userId: session.sub };
}

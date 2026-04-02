import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  await clearSessionCookie(req);
  return NextResponse.json({ ok: true });
}

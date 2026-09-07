import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth/password";
import {
  getAdminTokenTopUpPinHash,
  isAdminTokenTopUpPinConfigured,
  setAdminTokenTopUpPin,
  validateAdminTopUpPinPlain,
} from "@/lib/tokens/admin-topup-pin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }
  const configured = await isAdminTokenTopUpPinConfigured();
  return NextResponse.json({ configured });
}

const putSchema = z.object({
  newPin: z.string().min(1).max(64),
  /** จำเป็นเมื่อมีรหัสอยู่แล้ว */
  currentPin: z.string().min(1).max(64).optional(),
});

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const newPin = parsed.data.newPin.trim();
  const pinErr = validateAdminTopUpPinPlain(newPin);
  if (pinErr) {
    return NextResponse.json({ error: pinErr }, { status: 400 });
  }

  const existingHash = await getAdminTokenTopUpPinHash();
  if (existingHash) {
    const current = parsed.data.currentPin?.trim() ?? "";
    if (!current) {
      return NextResponse.json(
        { error: "กรุณาใส่รหัสเดิมก่อนเปลี่ยนรหัสใหม่" },
        { status: 400 },
      );
    }
    const ok = await verifyPassword(current, existingHash);
    if (!ok) {
      return NextResponse.json({ error: "รหัสเดิมไม่ถูกต้อง" }, { status: 403 });
    }
  }

  await setAdminTokenTopUpPin(newPin);
  return NextResponse.json({ ok: true, configured: true });
}

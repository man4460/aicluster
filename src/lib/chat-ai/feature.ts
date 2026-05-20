import { NextResponse } from "next/server";

/** ข้อความเมื่อปิดใช้งาน */
export const CHAT_AI_DISABLED_MESSAGE_TH =
  "เลขาส่วนตัวอยู่ระหว่างพัฒนา — ขออภัยในความไม่สะดวก จะเปิดให้ใช้งานเร็ว ๆ นี้";

/**
 * เปิดเลขาส่วนตัว (น้องมาเวล) — ตั้ง `CHAT_AI_ENABLED=1` ใน `.env` เมื่อพร้อม
 * ค่าเริ่มต้น: ปิด (อยู่ระหว่างพัฒนา)
 */
export function isChatAiEnabled(): boolean {
  const v = process.env.CHAT_AI_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isChatAiDisabled(): boolean {
  return !isChatAiEnabled();
}

export function chatAiDisabledResponse(): NextResponse {
  return NextResponse.json({ error: CHAT_AI_DISABLED_MESSAGE_TH }, { status: 503 });
}

import { NextResponse } from "next/server";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";

/** บล็อก API ฝั่งผู้ใช้ `/api/mqtt/session/*` เมื่อปิดโมดูล — broker webhook ไม่ผ่านทางนี้ */
export function mqttSessionApiDisabled(): NextResponse | null {
  if (isMqttServiceModuleEnabled()) return null;
  return NextResponse.json({ error: "ระบบบริการ MQTT ปิดใช้งานชั่วคราว" }, { status: 403 });
}

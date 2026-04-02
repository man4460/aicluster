/**
 * เปิดใช้โมดูล «ระบบบริการ MQTT» ในแดชบอร์ด — ค่าเริ่มต้นปิด (ซ่อนเมนู / หน้า / API session)
 * ตั้ง MQTT_SERVICE_ENABLED=true เมื่อพร้อมให้ลูกค้าใช้
 */
export function isMqttServiceModuleEnabled(): boolean {
  const v = process.env.MQTT_SERVICE_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

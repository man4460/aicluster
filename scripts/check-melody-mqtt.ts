/**
 * ตรวจว่า Melody MQTT bridge อ่านค่า .env แล้วพยายามต่อ broker ได้หรือไม่
 * รัน: npx tsx scripts/check-melody-mqtt.ts (จากโฟลเดอร์โปรเจกต์)
 */
import "dotenv/config";
import { getMelodyMqttBridge } from "../src/lib/integrations/melody-mqtt";

function main() {
  const mqtt = getMelodyMqttBridge();
  console.log("MQTT_BROKER_URL ตั้งแล้ว (enabled):", mqtt.enabled);
  if (!mqtt.enabled) {
    console.log("— ไม่มี broker URL ใน env หลังโหลด .env");
    process.exit(0);
  }

  mqtt.ensureStarted();

  const t0 = Date.now();
  const iv = setInterval(() => {
    const h = mqtt.getHealth();
    if (h.connected) {
      clearInterval(iv);
      console.log("เชื่อมต่อ broker สำเร็จ (connected: true)");
      console.log(JSON.stringify(h, null, 2));
      process.exit(0);
      return;
    }
    if (Date.now() - t0 > 8000) {
      clearInterval(iv);
      console.log("หมดเวลารอ ~8s — ยังไม่ connected (อาจพอร์ต/ไฟร์วอลล์/broker ปิด)");
      console.log(JSON.stringify(mqtt.getHealth(), null, 2));
      process.exit(0);
    }
  }, 200);
}

main();
